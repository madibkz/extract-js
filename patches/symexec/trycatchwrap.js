//wraps around a statement with a try/catch

module.exports = (args) => {
    if (args.trycatchtraversed === true) return;
    args.trycatchtraversed = true;
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
};
