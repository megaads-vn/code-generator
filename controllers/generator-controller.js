module.exports = GeneratorController;

var stringUtil = require(__dir + "/utils/string-util");

function GeneratorController($logger, $event, $config, $redis) {
    this.generateCode = function(io) {
        var data = io.inputs["data"];
        if (data == null || data == "") {
            io.json({
                "status": "fail"
            });
        } else {
            var length = io.inputs["code-length"] == null ? 8 : parseInt(io.inputs["code-length"]);
            var dataHash = data.hashHex();
            var result = "";
            $redis.get("data:" + length + ":" + dataHash, function(err, codeStorage) {
                if (codeStorage != null) {
                    result = codeStorage;
                    io.json({
                        "status": "successful",
                        "result": result
                    });
                } else {
                    var generatedCode = stringUtil.hash(data, length);
                    $redis.get("code:" + length + ":" + generatedCode, function(err, dataHashStorage) {
                        if (dataHashStorage != null && dataHash != dataHashStorage) {
                            result = stringUtil.hash(data + data, length);
                            $logger.warning("Generate duplicated code:", data);
                        } else {
                            result = generatedCode;
                        }
                        $redis.set("data:" + length + ":" + dataHash, result);
                        $redis.set("code:" + length + ":" + result, dataHash);
                        io.json({
                            "status": "successful",
                            "result": result
                        });
                    });
                }
            });
        }
    };
}
