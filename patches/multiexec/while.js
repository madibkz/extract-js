/*
make sure that while's body is executed at least once
turns:
    while (test) {
        body
    }
=>
    body
    while (test) {
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
                                "value": `while (${escodegen.generate(args.test)}) { (forced execution of while body)`,
                            },
                            {
                                "type": "Literal",
                                "value": 2,
                            }
                        ]
                    }
                },
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
                                "value": `} (end of forced execution of body of while (${escodegen.generate(args.test)}))`,
                            },
                            {
                                "type": "Literal",
                                "value": 0,
                            }
                        ]
                    }
                },
                args,
            ],
        };
    }
}
