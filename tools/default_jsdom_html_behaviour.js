const jsdom = require("jsdom");
const JSDOM = jsdom.JSDOM;
const fs = require("fs");

var arguments = process.argv;
let code = fs.readFileSync(arguments[2]);

let dom_str = code;

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console, { omitJSDOMErrors: true });

class LoggingResourceLoader extends jsdom.ResourceLoader {
    fetch(url, options) {
        console.log("FETCHING "  + url +  options);
        let res = super.fetch(url, options);
        console.log("RESULT:  " + res);
        return res;
    }
}

const resourceLoader = new LoggingResourceLoader({
});

//Keep in mind this runs asynchronous
let dom = new JSDOM(dom_str, {
    url: "https://example.com/",
    contentType: "text/html",
    includeNodeLocations: true,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    resources: resourceLoader,

    beforeParse(window) {
        window.console = console;
    }
});

console.log(dom.serialize());
