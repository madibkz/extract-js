const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function VirtualDOMTag(name) {
    this.name = name;
}

// Catches requests to <tag>.nodeTypedValue in order to emulate them correctly
module.exports = function(name) {
    return new Proxy(new VirtualDOMTag(name), {
	get: function(target, name) {
	    name = name.toLowerCase();
	    switch (name) {
	    	case "nodetypedvalue":
				if (target.dataType !== "bin.base64") return target.text;
				return Buffer.from(target.text, "base64").toString("utf8");
	    	default:
				if (name === "__safe_item_to_string") { //this is needed for jalangi/expose
					return false;
				}
				if (name in target) return target[name];
				lib.kill(`VirtualDOMTag.${name} not implemented!`);
		}
	},
		set: function(a, b, c) {
			if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
				a[b] = c;
				return true;
			}
			return false;
		},
	});
};
