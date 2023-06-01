function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object MimeType]";
                default:
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") {
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy mimetype is not implemented!`
            }
        },
        set: function (target, name, value) { //object is read only in spec
            if (name === "__safe_item_to_string") {
                target[name] = value;
                return true;
            }
            return false;
        }
    };
}

function getDefaultFields() {
    return {
//https://developer.mozilla.org/en-US/docs/Web/API/Plugin
//PROPERTIES:
        type: "application/pdf",
        description: "Portable Document Format",
        suffixes: "pdf",
    };
}

function getInnerProxies() {
    return {
    };
}

function getObject() {
    return {
        //enabledPlugin: "1", *//TODO circular reference*
//METHODS:
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
