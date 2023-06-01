/*
replaces
    this
with
    (this === undefined ? global : this)
so that the symbolic execution script can have this reference the global object properly
 */

module.exports = (args) => {
    if (args.symexecthistraversed === true) return;
    return {
        "type": "ConditionalExpression",
        "test": {
            "type": "BinaryExpression",
            "left": {
                "type": "ThisExpression",
                "symexecthistraversed": true,
            },
            "operator": "===",
            "right": {
                "type": "Identifier",
                "name": "undefined"
            }
        },
        "consequent": {
            "type": "Identifier",
            "name": "global"
        },
        "alternate": {
            "type": "ThisExpression",
            "symexecthistraversed": true,
        }
    }
};
