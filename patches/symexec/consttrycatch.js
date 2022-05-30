//transform
//e1
//to =>
//(() => { try { return e1 } catch (e) { return null } })()

module.exports = (args) => {
    if (args.symexecthistraversed === true) return;
    args.symexecthistraversed = true;
    return {
        "type": "CallExpression",
        symexecthistraversed: true,
        "callee": {
            "type": "ArrowFunctionExpression",
            symexecthistraversed: true,
            "id": null,
            "expression": false,
            "generator": false,
            "async": false,
            "params": [],
            "body": {
                "type": "BlockStatement",
                symexecthistraversed: true,
                "body": [
                    {
                        "type": "TryStatement",
                        "block": {
                            "type": "BlockStatement",
                            symexecthistraversed: true,
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
                                symexecthistraversed: true,
                                "body": [
                                    {
                                        "type": "ReturnStatement",
                                        symexecthistraversed: true,
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
