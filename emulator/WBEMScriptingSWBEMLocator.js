const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function VirtualSWBEMServices() {
	this.get = function(...args) {
		console.log(args);
	};
}

function VirtualWBEMLocator() {
	this.connectserver = function(server, namespace) {
		lib.info(`WBEMLocator: emulating a connection to server ${server} with namespace ${namespace}`);
		return lib.proxify(VirtualSWBEMServices, "WBEMScripting.SWBEMServices");
	};
}

module.exports = lib.proxify(VirtualWBEMLocator, "WBEMScripting.SWBEMServices");