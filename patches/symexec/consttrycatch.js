//transform
//e1
//to =>
//(() => { try { return e1 } catch (e) { return null } })()

module.exports = (args) => {
    if (args.trycatchtraversed === true) return;
    args.trycatchtraversed = true;
    return {
        "type": "CallExpression",
        trycatchtraversed: true,
        "callee": {
            "type": "ArrowFunctionExpression",
            trycatchtraversed: true,
            "id": null,
            "expression": false,
            "generator": false,
            "async": false,
            "params": [],
            "body": {
                "type": "BlockStatement",
                trycatchtraversed: true,
                "body": [
                    {
                        "type": "TryStatement",
                        "block": {
                            "type": "BlockStatement",
                            trycatchtraversed: true,
                            "body": [
                                {
                                    "type": "ReturnStatement",
                                    "argument": args
                                }
                            ]
                        },
                        "handler": {
                            "type": "CatchClause",
                            "param": {
                                "type": "Identifier",
                                "name": "e"
                            },
                            "body": {
                                "type": "BlockStatement",
                                trycatchtraversed: true,
                                "body": [
                                    {
                                        "type": "ReturnStatement",
                                        trycatchtraversed: true,
                                        "argument": {
                                            "type": "Literal",
                                            "value": null,
                                        }
                                    }
                                ]
                            }
                        },
                        "finalizer": null
                    }
                ]
            }
        },
        "arguments": [],
        "optional": false
    }
};
