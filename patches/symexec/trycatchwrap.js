//wraps around a statement with a try/catch

module.exports = (args) => {
    if (args.symexecthistraversed === true) return;
    args.symexecthistraversed = true;
    return {
        "type": "TryStatement",
        "block": {
            "type": "BlockStatement",
            "body": [args]
        },
        "handler": {
            "type": "CatchClause",
            "param": {
                "type": "Identifier",
                "name": "e"
            },
            "body": {
                "type": "BlockStatement",
                "body": []
            }
        },
        "finalizer": null
    }
    // return {
    //     "type": "ConditionalExpression",
    //     "test": {
    //         "type": "BinaryExpression",
    //         "left": {
    //             "type": "ThisExpression",
    //             "symexecthistraversed": true,
    //         },
    //         "operator": "===",
    //         "right": {
    //             "type": "Identifier",
    //             "name": "undefined"
    //         }
    //     },
    //     "consequent": {
    //         "type": "Identifier",
    //         "name": "global"
    //     },
    //     "alternate": {
    //         "type": "ThisExpression",
    //         "symexecthistraversed": true,
    //     }
    // }
};
