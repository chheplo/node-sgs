
var util = require("util");
var jsonlint = require("jsonlint");


function SemanticAnnotation(msg) {
    this.msg = msg;
}

SemanticAnnotation.prototype.jsonld = function (){
    try {
        var obj = jsonlint.parse(this.msg);
        if (obj.Platform) {

            console.log(obj.Platform);
            var semMsg = "Testing";
            return this.msg;
        } else {
            return "Not valid json format."
        }
    } catch(e){
        return "Not valid json file.";
    }


}
module.exports = SemanticAnnotation;
