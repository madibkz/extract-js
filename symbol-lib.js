module.exports = {
    debug: console.log,
    verbose: console.log,
    info: console.log,
    warning: console.log,
    error: (str) => {throw new Error(str)},
    logSnippet: (x, y, z) => {
        console.log(`lib.logSnippet was called: ${x} + ${y} + ${z}`);
    },
    logIOC: (x, y, z) => {
        console.log(`lib.logIOC was called: ${x} + ${y} + ${z}`);
    },
    writeFile: (fn, buffer) => {
        console.log(`lib.writeFile was called: filename: ${fn} content: ${buffer}`);
    },
    logResource: (uuid, fn, buffer) => {
        console.log(`lib.logResource was called: uuid: ${uuid} filename: ${fn} content: ${buffer}`);
    },
    proxify: (actualObject, objectName = "<unnamed>") => {
        //duplicate
        return new Proxy(new actualObject, {
            get: function(target, prop) {
                switch (prop) {
                    case Symbol.toPrimitive:
                        return () => "thing";
                    default:
                        const lProp = prop.toLowerCase();
                        if (lProp in target) return target[lProp];
                        if (prop === "__safe_item_to_string") { //this is needed for jalangi/expose
                            return false;
                        }
                        throw new Error(`${objectName}.${prop} not implemented!`);
                }
            },
            set: function(a, b, c) {
                if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                    a[b] = c;
                    return true;
                }
                b = b.toLowerCase();
                a[b] = c;
                return true;
            },
        });
    },
    getUUID: () => 1,
    runShellCommand: (comm) => console.log("Command " + comm + " was run in ShellApplication"),
};
