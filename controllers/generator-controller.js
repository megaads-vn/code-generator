module.exports = GeneratorController;
var stringUtil = require(__dir + "/utils/string-util");

function GeneratorController($logger, $event, $config, $redis) {
    this.generateCode = function(io) {
        var data = io.inputs["data"];
        var length = io.inputs["code-length"] == null ? 8 : io.inputs["length"];
        var dataHash = data.hashHex();
        var result = "";
        $redis.get("data:" + dataHash, function(err, codeStorage) {
            if (codeStorage != null) {
                result = codeStorage;
                io.json({
                    "status": "successful",
                    "result": result
                });
            } else {
                var generatedCode = stringUtil.hash(data, length);
                $redis.get("code:" + generatedCode, function(err, dataHashStorage) {
                    if (dataHashStorage != null && dataHash != dataHashStorage) {
                        result = stringUtil.hash(data + data, length);
                        $logger.warning("Generate duplicated code:", data);
                    } else {
                        result = generatedCode;
                    }
                    $redis.set("data:" + dataHash, result);
                    $redis.set("code:" + result, dataHash);
                    io.json({
                        "status": "successful",
                        "result": result
                    });
                });
            }
        });
    };
}

function generatorString(length) {
    var retval = "";
    if (length == null) {
        length = 8;
    }
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < length; i++) {
        retval += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return retval;
}

function hash() {

}
