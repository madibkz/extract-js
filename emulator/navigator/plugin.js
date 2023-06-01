function getProxyHandler() {
    return {
        get: function (target, name) {
            switch (name) {
                case Symbol.toPrimitive:
                    return () => "[object Plugin]";
                default:
                    if (name in target) {
                        return target[name];
                    }
                    if (name === "__safe_item_to_string") {
                        return false;
                    }
                    throw `extract-js error: ${name} in proxy plugin is not implemented!`
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
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "PDF Viewer",
        version: "1",
    };
}

function getInnerProxies() {
    return {
        mimetype: {
            file_path: "./emulator/navigator/mimetype.js",
            symex_prefix: "navigator.plugins.plugin.mimetype."
        },
    };
}

function getObject() {
    return {
//METHODS:
        item(i) {
            if (i === 0) {
                return this.mimetype;
            }
            return undefined;
        },
        namedItem(nameQuery) {
            if (nameQuery === this.mimetype.name) {
                return this.mimetype;
            }
            return undefined;
        },
    };
}

module.exports = {
    getProxyHandler,
    getDefaultFields,
    getInnerProxies,
    getObject,
}
