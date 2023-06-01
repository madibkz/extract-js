function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => target.toString();
                default:
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
            if (name === "__safe_item_to_string") { //this is needed for jalangi/expose
                target[name] = value;
                return true;
            }
            return false;
        }
    };
}

function getDefaultFields() {
    return {
        cookie: "",
    };
}

function getInnerProxies() {
    return {
    };
}

function getObject() {
    return {
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
