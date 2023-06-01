const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");

function Dictionary() {
	this.dictionary = {};
	/* eslint no-return-assign: 0 */
	// See https://github.com/eslint/eslint/issues/7285
	this.add = (key, value) => (this.dictionary[key] = value);
	this.item = (key) => this.dictionary[key];
	this.exists = () => true;
}

module.exports = lib.proxify(Dictionary, "Scripting.Dictionary");
