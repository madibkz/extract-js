function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object HTMLDocument]";
                default:
                    if (name === "toString") {
                        return () => "document";
                    }
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") { //this is needed for jalangi/expose
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy Document is not implemented!`
            }
        },
        set: function (target, name, value) {
            target[name] = value;
            return true;
        }
    };
}

function getDefaultFields() {
    return {
        cookie: "",
        documentURI: "",
        hidden: false,
        visibilityState: "visible",
        designMode: "off",
        domain: "",
        readyState: "",
        referrer: "",
        title: "",
        URL: "",
        hasFocusValue: false,
    };
}

function getInnerProxies() {
    return {
    };
}

function getObject() {
    return {
        hasFocus() {
            return this.hasFocusValue;
        },
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
