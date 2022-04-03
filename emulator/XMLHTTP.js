const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");
const argv = run_by_extract_js ? require("../argv.js").run : {download: false};

let sym_vals = {};

function XMLHTTP() {
    this.headers = {};
    this.onreadystatechange = () => {};
    this.readystate = 0;
    this.statustext = "UNSENT";
    this.status = undefined;
	this.tostring = () => `${this.url} ${this.method} ${this.headers} ${this.readystate}`;
    
    this.open = function(method, url) {
		this.url = url;
		this.method = method;
		this.readystate = 1;
		this.statustext = "OPENED";
    };
    this.setrequestheader = function(key, val) {
		key = key.replace(/:$/, ""); // Replace a trailing ":" if present
		this.headers[key] = val;
		lib.info(`Header set for ${this.url}:`, key, val);
    };
    this.settimeouts = function() {
        // Stubbed out.
    };
    this.send = function(data) {
		if (data)
		    lib.info(`Data sent to ${this.url}:`, data);
		this.readystate = 4;
		let response;
		this.status = 404;
		this.statustext = "Not found";
		try {
			response = lib.fetchUrl(this.method, this.url, this.headers, data);

			if (argv.download || sym_vals["xmlhttp.status200"]) {
				this.status = 200;
				this.statustext = "OK";
			}
		} catch (e) {
		    // If there was an error fetching the URL, pretend that the distribution site is down
			if (sym_vals.hasOwnProperty("xmlhttp.status200") && sym_vals["xmlhttp.status200"]) {
				this.status = 200;
				this.statustext = "OK";
			}
		    response = {
				body: Buffer.from(""),
				headers: {},
		    };
		}

		this.responsebody = sym_vals.hasOwnProperty("xmlhttp.responsebody") ? sym_vals["xmlhttp.responsebody"] : response.body;
		this.responsetext = this.responsebody.toString("utf8");
		this.responseheaders = sym_vals.hasOwnProperty("xmlhttp.responsebody") ? {} : response.headers;
		this.onreadystatechange();
    };
    this.setoption = () => {};
    this.getresponseheader = (key) => this.responseheaders[key];
}

function setSymexInput(symex_input) {
	if (symex_input)
		sym_vals = symex_input;
}

module.exports = {
	create: () => lib.proxify(XMLHTTP, "XMLHTTP"),
	setSymexInput
};
