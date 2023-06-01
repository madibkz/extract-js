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
                                "value": `for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};) { (forced execution of for body)`,
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
                                "value": `} (end of forced execution of body of for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};))`,
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
                                "value": `Entering for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};)`,
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
                                "value": `Exited for (${args.init ? escodegen.generate(args.init) : ""}; ${args.test ? escodegen.generate(args.test) : ""}; ${args.update ? escodegen.generate(args.update) : ""};)`,
                            }
                        ]
                    }
                },
            ],
        };
    }
}
