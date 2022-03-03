const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function ScriptControl() {
	this.addobject = () => {},
	this.addcode = (code) => lib.logSnippet(lib.getUUID(), {
		as: "Code snippet in ScriptControl",
	}, code);
}

module.exports = lib.proxify(ScriptControl, "ScriptControl");
