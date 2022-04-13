const jsdom = require("jsdom");
const JSDOM = jsdom.JSDOM;
const fs = require("fs");

var arguments = process.argv;
let code = fs.readFileSync(arguments[2]);

let dom_str = `<html><head></head><body></body><script>${code}</script></html>`;

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console, { omitJSDOMErrors: true });

//Keep in mind this runs asynchronous
let dom = new JSDOM(dom_str, {
    contentType: "text/html",
    includeNodeLocations: true,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,

    beforeParse(window) {
        window.console = console;
    }
});

console.log(dom.serialize());