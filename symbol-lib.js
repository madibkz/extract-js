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
};
