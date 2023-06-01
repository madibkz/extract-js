//transform
//e1
//to =>
//(() => { try { return e1 } catch (e) { return null } })()

module.exports = (args) => {
    if (args.symexectrytraversed === true) return;
    args.symexectrytraversed = true;
    return {
        "type": "CallExpression",
        symexectrytraversed: true,
        "callee": {
            "type": "ArrowFunctionExpression",
            symexectrytraversed: true,
            "id": null,
            "expression": false,
            "generator": false,
            "async": false,
            "params": [],
            "body": {
                "type": "BlockStatement",
                symexectrytraversed: true,
                "body": [
                    {
                        "type": "TryStatement",
                        "block": {
                            "type": "BlockStatement",
                            symexectrytraversed: true,
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
                                symexectrytraversed: true,
                                "body": [
                                    {
                                        "type": "ReturnStatement",
                                        symexectrytraversed: true,
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
