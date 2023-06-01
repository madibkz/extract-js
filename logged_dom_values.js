const window = {
    //https://developer.mozilla.org/en-US/docs/Web/API/Window
    properties: [
        //[propertyName, readOnly]
        ["clientInformation", true],
        ["closed", true],
        // ["console", true],
        ["crypto", true],
        ["devicePixelRatio", true],
        // ["document", true],
        ["fullScreen", true],
        ["history", true],
        ["innerHeight", true],
        ["innerWidth", true],
        // ["length", true],
        ["location", false],
        ["localStorage", true],
        ["name", false],
        // ["navigator", true],
        ["opener", false],
        ["outerHeight", true],
        ["outerWidth", true],
        ["pageXOffset", true],
        ["pageYOffset", true],
        ["parent", true],
        ["screen", true],
        ["screenX", true],
        ["screenY", true],
        ["screenLeft", true],
        ["screenTop", true],
        ["scrollbars", true],
        // ["scrollMaxX", true],
        // ["scrollMaxY", true],
        ["scrollX", true],
        ["scrollY", true],
        ["sessionStorage", false],
        ["speechSynthesis", true],
        ["status", false],
        ["toolbar", true],
        ["top", true],

        ["origin", true],
    ],
    methods: [
        //method name, function implemented in jsdom?
        ["alert", false],
        ["blur", false],
        ["clearImmediate", true],
        ["close", true],
        ["confirm", false],
        ["dump", true],
        ["focus", false],
        ["getSelection", true],
        ["moveBy", false],
        ["moveTo", false],
        ["open", false],
        ["postMessage", true],
        ["prompt", false],
        ["resizeBy", false],
        ["resizeTo", false],
        ["scroll", false],
        ["scrollBy", false],
        ["scrollTo", false],
        ["setImmediate", true],
        ["stop", true],
        ["atob", true],
        ["btoa", true],
        ["clearInterval", true],
        ["clearTimeout", true],
        ["fetch", true],
        ["setInterval", true],
        ["setTimeout", true],
        ["reportError", true],
    ]
}

module.exports = {
    window
}