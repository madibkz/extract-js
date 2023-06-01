const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function WScriptNetwork() {
	this.computername = "COMPUTER_NAME";
	this.enumprinterconnections = () => [{
		foo: "bar",
	}];
	this.userdomain = "";
}

module.exports = lib.proxify(WScriptNetwork, "WScriptNetwork");