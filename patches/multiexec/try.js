/*
turns
    try {
        statements1
    } catch (e) {
        statements2
    } finally {
        statements3
    }
=>
    try {
        logMultiexec("Entered try statement");
        statements1
        throw "Throwing error on purpose to trigger catch block"
    } catch (e) {
        logMultiexec("Entered catch clause");
        statements2
    } finally {
        logMultiexec("Entered finally clause");
        statements3
    }
 */

module.exports = (args) => {
    if (args.tryMultiExecTraversed === true) {
        return;
    }
    args.block.body.unshift({
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "logMultiexec"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": `try {`,
                },
                {
                    "type": "Literal",
                    "value": 2,
                }
            ]
        }
    })
    args.block.body.push({ //change indent level (dont log any text)
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "logMultiexec"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": ``,
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
    })
    args.block.body.push({
        "type": "ThrowStatement",
        "argument": {
            "type": "Literal",
                "value": "(Throwing error on purpose to trigger catch block)",
        }
    })
    args.handler.body.body.unshift({
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "logMultiexec"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": `} catch {`,
                },
                {
                    "type": "Literal",
                    "value": 2,
                }
            ]
        }
    })
    args.handler.body.body.push({
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "logMultiexec"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": `} (EXITED CATCH CLAUSE)`,
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
    })
    args.finalizer ? args.finalizer.body.unshift({
                "type": "ExpressionStatement",
                "expression": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "Identifier",
                        "name": "logMultiexec"
                    },
                    "arguments": [
                        {
                            "type": "Literal",
                            "value": `} finally {`,
                        },
                        {
                            "type": "Literal",
                            "value": 2,
                        }
                    ]
                }
    }) : "";
    args.finalizer ? args.finalizer.body.push({
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": "logMultiexec"
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": `} (EXITED FINALLY CLAUSE)`,
                },
                {
                    "type": "Literal",
                    "value": 0,
                }
            ]
        }
    }) : "";
    return {
        type: args.type,
        block: args.block,
        handler: args.handler,
        finalizer: args.finalizer,
        tryMultiExecTraversed: true
    }
};
