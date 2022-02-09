/*
transforms function so that it executes all the code in it,
but returns the first return value it reached at the end

    function example(x) {
        if (x == 1) {
            return 0;
        } else {
            return;
        }
        return 1;
    }
=>
    function example(x) {
        functionCounter++;
        if (x == 1) {
            functionCounter == functionReturnStack.length ?
                console.log("skipped return 0 with value ", 0) :
                functionReturnStack.push(0);
        } else {
            functionCounter == functionReturnStack.length ?
                console.log("skipped return") :
                functionReturnStack.push("NO RETURN VALUE");
        }
        functionCounter == functionReturnStack.length ?
            console.log("Skipped return 1 with value ", 1) :
            functionReturnStack.push(1);
        functionCounter--;
        if (functionReturnStack.length == functionCounter || functionReturnStack[functionReturnStack.length - 1] == "NO RETURN VALUE") {
            return;
        }
        return functionReturnStack.pop();
    }
 */

const escodegen = require("escodegen");

//TODO: copy/clone the return value?
//TODO: refactor duplication of traverse function
module.exports = (args) => {
    args.body.body.unshift({
        "type": "ExpressionStatement",
        "expression": {
            "type": "UpdateExpression",
            "operator": "++",
            "prefix": false,
            "argument": {
                "type": "Identifier",
                "name": "functionCounter"
            }
        }
    });
    args.body.body.unshift({
        "type": "ExpressionStatement",
        "expression": {
        "type": "CallExpression",
            "callee": {
            "type": "MemberExpression",
                "object": {
                "type": "Identifier",
                    "name": "console"
            },
            "property": {
                "type": "Identifier",
                    "name": "log"
            },
            "computed": false
        },
        "arguments": [
            {
                "type": "Literal",
                "value": `Entered function ${args.id.name}`,
            }
        ]
        },
    });
    traverse(args.body.body, function(key, val) {
        if (!val) return;
        if (val.type == "ReturnStatement") {
            return {
                    "type": "ExpressionStatement",
                    "expression": {
                        "type": "ConditionalExpression",
                        "test": {
                            "type": "BinaryExpression",
                            "left": {
                                "type": "Identifier",
                                "name": "functionCounter"
                            },
                            "operator": "==",
                            "right": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "functionReturnStack"
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "length"
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
                                    "type": "Identifier",
                                    "name": "console"
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "log"
                                },
                                "computed": false,
                                "optional": false
                            },
                            "arguments": val.argument ? [
                                    {
                                            "type": "BinaryExpression",
                                            "left": {
                                                "type": "Literal",
                                                "value": `Skipped return ${escodegen.generate(val.argument)} with value: `,
                                            },
                                            "operator": "+",
                                            "right": val.argument
                                    }
                            ] :
                            [
                                {
                                    "type": "Literal",
                                    "value": `Skipped return`,
                                },
                            ],
                            "optional": false
                        },
                        "alternate": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "functionReturnStack"
                                },
                                "property": {
                                    "type": "Identifier",
                                    "name": "push"
                                },
                                "computed": false,
                                "optional": false
                            },
                            "arguments": val.argument ? [
                                val.argument
                            ] : [
                                {
                                    "type": "Literal",
                                    "value": `NO RETURN VALUE`,
                                },
                            ],
                            "optional": false
                        }
                    }
                }
            }
    });
    args.body.body.push({
        "type": "ExpressionStatement",
        "expression": {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "object": {
                    "type": "Identifier",
                    "name": "console"
                },
                "property": {
                    "type": "Identifier",
                    "name": "log"
                },
                "computed": false
            },
            "arguments": [
                {
                    "type": "Literal",
                    "value": `Exiting function ${args.id.name}`,
                }
            ]
        },
    });
    args.body.body.push({
        "type": "ExpressionStatement",
        "expression": {
            "type": "UpdateExpression",
            "operator": "--",
            "prefix": false,
            "argument": {
                "type": "Identifier",
                "name": "functionCounter"
            }
        }
    });
    args.body.body = args.body.body.concat(
        [
            {
                "type": "IfStatement",
                "test": {
                    "type": "LogicalExpression",
                    "left": {
                        "type": "BinaryExpression",
                        "left": {
                            "type": "MemberExpression",
                            "object": {
                                "type": "Identifier",
                                "name": "functionReturnStack"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "length"
                            },
                            "computed": false,
                            "optional": false
                        },
                        "operator": "==",
                        "right": {
                            "type": "Identifier",
                            "name": "functionCounter"
                        }
                    },
                    "operator": "||",
                    "right": {
                        "type": "BinaryExpression",
                        "left": {
                            "type": "MemberExpression",
                            "object": {
                                "type": "Identifier",
                                "name": "functionReturnStack"
                            },
                            "property": {
                                "type": "BinaryExpression",
                                "left": {
                                    "type": "MemberExpression",
                                    "object": {
                                        "type": "Identifier",
                                        "name": "functionReturnStack"
                                    },
                                    "property": {
                                        "type": "Identifier",
                                        "name": "length"
                                    },
                                    "computed": false,
                                    "optional": false
                                },
                                "operator": "-",
                                "right": {
                                    "type": "Literal",
                                    "value": 1,
                                }
                            },
                            "computed": true,
                            "optional": false
                        },
                        "operator": "==",
                        "right": {
                            "type": "Literal",
                            "value": "NO RETURN VALUE",
                        }
                    }
                },
                "consequent": {
                    "type": "BlockStatement",
                    "body": [
                        {
                            "type": "ReturnStatement",
                            "argument": null
                        }
                    ]
                },
                "alternate": null
            },
            {
                "type": "ReturnStatement",
                "argument": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        "object": {
                            "type": "Identifier",
                            "name": "functionReturnStack"
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "pop"
                        },
                        "computed": false,
                        "optional": false
                    },
                    "arguments": [],
                    "optional": false
                }
            }
        ]
    );
};

function traverse(obj, func) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const replacement = func.apply(this, [key, obj[key]]);
        if (replacement) obj[key] = replacement;
        if (obj.autogenerated) continue;
        if (obj[key] !== null && typeof obj[key] === "object")
            traverse(obj[key], func);
    }
}
