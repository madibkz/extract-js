/*
this is all because you can't have the location object in symex mode be treated like a string but still have the location.href, .search, etc members
this way, location.href can still redirect to the actual symbol rather than throwing an error

foo.bar
=>
((fst, snd) =>
    (fst === global.location && global.__loc_syms.hasOwnProperty(snd)) ? global.__loc_syms[snd] : fst[snd]
)(foo, "bar");

foo["bar"]
=>
((fst, snd) =>
    (fst === global.location && global.__loc_syms.hasOwnProperty(snd)) ? global.__loc_syms[snd] : fst[snd]
)(foo, "bar");
 */

module.exports = (member_exp) => {
    return {
        "type": "CallExpression",
        "callee": {
            "type": "ArrowFunctionExpression",
            "id": null,
            "expression": true,
            "generator": false,
            "async": false,
            "params": [
                {
                    "type": "Identifier",
                    "name": "fst"
                },
                {
                    "type": "Identifier",
                    "name": "snd"
                }
            ],
            "body": {
                "type": "ConditionalExpression",
                "test": {
                "type": "LogicalExpression",
                    "left": {
                    "type": "BinaryExpression",
                        "left": {
                        "type": "Identifier",
                            "name": "fst"
                    },
                    "operator": "===",
                    "right": {
                        "type": "MemberExpression",
                        "object": {
                            "type": "Identifier",
                            "name": "global"
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "location"
                        },
                        "computed": false,
                        "optional": false,
                        symexeclocfield: true
                    }
                },
                "operator": "&&",
                "right": {
                    "type": "CallExpression",
                    "callee": {
                        "type": "MemberExpression",
                        symexeclocfield: true,
                        "object": {
                            "type": "MemberExpression",
                            symexeclocfield: true,
                            "object": {
                                "type": "Identifier",
                                "name": "global"
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "__loc_syms"
                            },
                            "computed": false,
                            "optional": false
                        },
                        "property": {
                            "type": "Identifier",
                            "name": "hasOwnProperty"
                        },
                        "computed": false,
                        "optional": false
                    },
                    "arguments": [
                        {
                            "type": "Identifier",
                            "name": "snd"
                        }
                    ],
                    "optional": false
                }
            },
            "consequent": {
                "type": "MemberExpression",
                symexeclocfield: true,
                "object": {
                    symexeclocfield: true,
                    "type": "MemberExpression",
                    "object": {
                        "type": "Identifier",
                        "name": "global"
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "__loc_syms"
                    },
                    "computed": false,
                    "optional": false
                },
                "property": {
                    "type": "Identifier",
                    "name": "snd"
                },
                "computed": true,
                    "optional": false
            },
            "alternate": {
                "type": "MemberExpression",
                symexeclocfield: true,
                "object": {
                    "type": "Identifier",
                        "name": "fst"
                },
                "property": {
                    "type": "Identifier",
                        "name": "snd"
                },
                "computed": true,
                    "optional": false
            }
        }
    },
        "arguments": [
            member_exp.object,
            member_exp.computed ? member_exp.property : {
                "type": "Literal",
                value: member_exp.property.name,
            }
        ],
        "optional": false
    }
};
