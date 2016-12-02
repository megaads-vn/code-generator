module.exports = new StringUtil();
var crypto = require("crypto");

function StringUtil() {
    var self = this;
    this.hash = function(data, length) {
        return self.pad(self.trim(data.hashHex(), length), length).toUpperCase();
    };
    this.trim = function(str, length) {
        return str.substr(0, length)
    };
    this.pad = function(str, length) {
        var retval = str;
        if (str.length < length) {
            retval = this.pad("0" + str, length);
        }
        return retval;
    };

}
