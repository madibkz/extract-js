/*
make sure that for's body is executed at least once
turns:
    for (init; test; update) {
        body
    }
=>
    init
    body
    for (init; test; update) {
        body
    }
 */

const escodegen = require("escodegen");

module.exports = (args) => {
    if (!args.haveAlreadyForcedBody) {
        args.haveAlreadyForcedBody = true;
        return {
            "type": "BlockStatement",
            "body": [
                {
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
                                "value": `for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};) { (FORCED EXECUTION OF FOR BODY)`,
                            },
                            {
                                "type": "Literal",
                                "value": 2,
                            }
                        ]
                    }
                },
                args.init ?
                    {
                        "type": "BlockStatement",
                        "body": [args.init, args.body],
                    } :
                    args.body,
                {
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
                                "value": `} (EXITED FORCED EXECUTION OF BODY OF for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};))`,
                            },
                            {
                                "type": "Literal",
                                "value": 0,
                            }
                        ]
                    }
                },
                {
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
                                "value": `for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};)`,
                            },
                            {
                                "type": "Literal",
                                "value": 2
                            }
                        ]
                    }
                },
                args,
                {
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
                                "value": `} (EXITED for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};))`,
                            },
                            {
                                "type": "Literal",
                                "value": 0
                            }
                        ]
                    }
                },
            ],
        };
    }
}
