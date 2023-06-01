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
                ]
            }
        },
        "arguments": [],
        "optional": false
    }
};
