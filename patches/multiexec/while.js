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
                                "value": `} (end of forced execution of while (${escodegen.generate(args.test)}))`,
                            }
                        ]
                    }
                },
                args,
            ],
        };
    }
}
