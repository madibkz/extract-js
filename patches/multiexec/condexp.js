/*
turns:
boolexp ? something : otherthing;
=>
{
    const x = boolexp;
    x ? something : otherthing;
    !x ? something : otherthing;
}
*/

const escodegen = require("escodegen");

module.exports = (args) => {
    if (args.condexptraversed === true) return args;
    args.condexptraversed = true;
    return {
        type: "BlockStatement",
        body: [
            {
                "type": "VariableDeclaration",
                "declarations": [
                    {
                        init: args.expression.test,
                        something: 'lol',
                        "type": "VariableDeclarator",
                        "id": {
                            "type": "Identifier",
                            "name": "x"
                        },
                    }
                ],
                "kind": "const"
            },
            {
                "type": "ExpressionStatement",
                condexptraversed: true,
                "expression": {
                    "type": "ConditionalExpression",
                    "test": {
                        "type": "Identifier",
                        "name": "x"
                    },
                    "consequent": args.expression.alternate,
                    "alternate": args.expression.consequent,
                }
            },
            {
                "type": "ExpressionStatement",
                condexptraversed: true,
                "expression": {
                    "type": "ConditionalExpression",
                    "test": {
                        "type": "UnaryExpression",
                        "operator": "!",
                        "prefix": true,
                        "argument": {
                            "type": "Identifier",
                            "name": "x"
                        }
                    },
                    "consequent": args.expression.alternate,
                    "alternate": args.expression.consequent,
                }
            }
        ]
    }};
