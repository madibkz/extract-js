const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function ScriptControl() {

    this.language = "";
    this.timeout = 10;

    this.addcode = code => {
        lib.info(`Script added dynamic code '''${code}'''`);
        lib.logIOC("DynamicCode", {code}, "The script wrote dynamic code with MSScriptControl.ScriptControl ActiveX object.");
	    return 0;
    };
}

module.exports = lib.proxify(ScriptControl, "MSScriptControl.ScriptControl");
