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
    logMultiexec("try {");
    statements1;
    logMultiexec("} catch {");
    try {
        throw new Error("multi-exec error to make catch clause run");
    } catch (e) {
        statements2;
    }
    logMultiexec("} (EXITED CATCH CLAUSE)");
    logMultiexec("} finally {");
    statements3;
    logMultiexec("} (EXITED FINALLY CLAUSE)");
 */

module.exports = (args) => {
    if (args.tryMultiExecTraversed === true) {
        return;
    }
    let result = {
        type: "BlockStatement",
        body: []
    };

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
    });
    result.body = result.body.concat(args.block.body);

    if (args.handler !== null) {
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
                        "value": ``,
                    },
                    {
                        "type": "Literal",
                        "value": 2,
                    }
                ]
            }
        });
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
                        "value": 0,
                    }
                ]
            }
        });
        args.finalizer === null ? args.handler.body.body.push({
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
        }) : "";
        let handler_try_wrap = {
            type: "TryStatement",
            block: {
                type: "BlockStatement",
                body: [{
                    "type": "ThrowStatement",
                    "argument": {
                        "type": "Literal",
                        "value": "(Throwing error on purpose to trigger catch block)",
                    }
                }],
            },
            handler: args.handler,
            finalizer: null,
            tryMultiExecTraversed: true
        };
        result.body.push(handler_try_wrap);
    }

    if (args.finalizer) {
        args.finalizer.body.unshift({
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
                        "value": 2,
                    }
                ]
            }
        });
        args.finalizer.body.unshift({
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
                        "value": 0,
                    }
                ]
            }
        });
        args.finalizer.body.push({
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
        });
        result.body = result.body.concat(args.finalizer.body);
    }

    return result;
}