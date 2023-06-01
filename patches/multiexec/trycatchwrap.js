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
        "trycatchtraversed": true,
        "handler": {
            "type": "CatchClause",
            "param": {
                "type": "Identifier",
                "name": "e"
            },
            "trycatchtraversed": true,
            "body": {
                "type": "BlockStatement",
                "trycatchtraversed": true,
                "body": [
                    {
                        "type": "ExpressionStatement",
                        "trycatchtraversed": true,
                        "expression": {
                            "type": "CallExpression",
                            "trycatchtraversed": true,
                            "callee": {
                                "type": "Identifier",
                                "name": "logMultiexec"
                            },
                            "arguments": [
                                {
                                    "type": "ConditionalExpression",
                                    "test": {
                                        "type": "BinaryExpression",
                                        "left": {
                                            "type": "Literal",
                                            "value": "SKIPPED ERROR: ",
                                        },
                                        "operator": "+",
                                        "right": {
                                            "type": "MemberExpression",
                                            "object": {
                                                "type": "Identifier",
                                                "name": "e"
                                            },
                                            "property": {
                                                "type": "Identifier",
                                                "name": "stack"
                                            },
                                            "computed": false,
                                            "optional": false
                                        }
                                    },
                                    "consequent": {
                                        "type": "CallExpression",
                                        "callee": {
                                            "type": "MemberExpression",
                                            "object": {
                                                "type": "MemberExpression",
                                                "object": {
                                                    "type": "Identifier",
                                                    "name": "e"
                                                },
                                                "property": {
                                                    "type": "Identifier",
                                                    "name": "stack"
                                                },
                                                "computed": false,
                                                "optional": false
                                            },
                                            "property": {
                                                "type": "Identifier",
                                                "name": "substring"
                                            },
                                            "computed": false,
                                            "optional": false
                                        },
                                        "arguments": [
                                            {
                                                "type": "Literal",
                                                "value": 0,
                                            },
                                            {
                                                "type": "Literal",
                                                "value": 120,
                                            }
                                        ],
                                        "optional": false
                                    },
                                    "alternate": {
                                        "type": "Literal",
                                        "value": "unknown error",
                                    }
                                },
                                {
                                    "type": "Literal",
                                    "value": 1,
                                }
                            ],
                            "optional": false
                        }
                    }
                ]
            }
        },
        "finalizer": null
    }
};
