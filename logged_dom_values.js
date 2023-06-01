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
        // ["history", true],
        ["innerHeight", true],
        ["innerWidth", true],
        // ["length", true],
        // ["location", false],
        // ["localStorage", true],
        ["name", false],
        // ["navigator", true],
        ["opener", false],
        ["outerHeight", true],
        ["outerWidth", true],
        ["pageXOffset", true],
        ["pageYOffset", true],
        ["parent", true],
        // ["screen", true],
        ["screenX", true],
        ["screenY", true],
        ["screenLeft", true],
        ["screenTop", true],
        ["scrollbars", true],
        // ["scrollMaxX", true],
        // ["scrollMaxY", true],
        ["scrollX", true],
        ["scrollY", true],
        // ["sessionStorage", false],
        ["speechSynthesis", true],
        ["status", false],
        ["toolbar", true],
        ["top", true],

        ["origin", true],

        ["onafterprint", false],
        ["onbeforeprint", false],
        ["onbeforeunload", false],
        ["onhashchange", false],
        ["onlanguagechange", false],
        ["onmessage", false],
        ["onmessageerror", false],
        ["onoffline", false],
        ["ononline", false],
        ["onpagehide", false],
        ["onpageshow", false],
        ["onpopstate", false],
        ["onrejectionhandled", false],
        ["onstorage", false],
        ["onunhandledrejection", false],
        ["onunload", false],
        ["onblur", false],
        ["onerror", false],
        ["onfocus", false],
        ["onload", false],
        ["onresize", false],
        ["onscroll", false],
        ["onabort", false],
        ["onautocomplete", false],
        ["onautocompleteerror", false],
        ["oncancel", false],
        ["oncanplay", false],
        ["oncanplaythrough", false],
        ["onchange", false],
        ["onclick", false],
        ["onclose", false],
        ["oncontextmenu", false],
        ["oncuechange", false],
        ["ondblclick", false],
        ["ondrag", false],
        ["ondragend", false],
        ["ondragenter", false],
        ["ondragleave", false],
        ["ondragover", false],
        ["ondragstart", false],
        ["ondrop", false],
        ["ondurationchange", false],
        ["onemptied", false],
        ["onended", false],
        ["oninput", false],
        ["oninvalid", false],
        ["onkeydown", false],
        ["onkeypress", false],
        ["onkeyup", false],
        ["onloadeddata", false],
        ["onloadedmetadata", false],
        ["onloadstart", false],
        ["onmousedown", false],
        ["onmouseenter", false],
        ["onmouseleave", false],
        ["onmousemove", false],
        ["onmouseout", false],
        ["onmouseover", false],
        ["onmouseup", false],
        ["onwheel", false],
        ["onpause", false],
        ["onplay", false],
        ["onplaying", false],
        ["onprogress", false],
        ["onratechange", false],
        ["onreset", false],
        ["onsecuritypolicyviolation", false],
        ["onseeked", false],
        ["onseeking", false],
        ["onselect", false],
        ["onsort", false],
        ["onstalled", false],
        ["onsubmit", false],
        ["onsuspend", false],
        ["ontimeupdate", false],
        ["ontoggle", false],
        ["onvolumechange", false],
        ["onwaiting", false],
    ],
    methods: [
        //method name, function implemented in jsdom?
        ["alert", false],
        ["blur", false],
        ["clearImmediate", true],
        ["clearInterval", true],
        ["clearTimeout", true],
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
        ["stop", true],
        ["atob", true],
        ["btoa", true],
        // ["fetch", true],
        ["setImmediate", true],
        ["setInterval", true],
        ["setTimeout", true],
        ["reportError", true],

        ["addEventListener", true],
        ["removeEventListener", true],
    ]
}

module.exports = {
    window
}