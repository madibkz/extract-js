// foo(bar, baz) becomes (x => eval == x ? arg => eval(rewrite(arg, true)) : x)(foo)(bar, baz)
module.exports = (foo) => ({
	"autogenerated": true,
	"type": "CallExpression",
	"callee": {
		"type": "ArrowFunctionExpression",
		"id": null,
		"params": [
			{
				"type": "Identifier",
				"name": "x",
			},
		],
		"defaults": [],
		"body": {
			"type": "ConditionalExpression",
			"test": {
				"type": "BinaryExpression",
				"operator": "==",
				"left": {
					"type": "Identifier",
					"name": "eval",
				},
				"right": {
					"type": "Identifier",
					"name": "x",
				},
			},
			"consequent": {
				"type": "ArrowFunctionExpression",
				"id": null,
				"params": [
					{
						"type": "Identifier",
						"name": "arg",
					},
				],
				"defaults": [],
				"body": {
					"type": "CallExpression",
					"callee": {
						"type": "MemberExpression",
						"computed": false,
						"object": {
							"type": "Identifier",
							"name": "eval",
						},
						"property": {
							"type": "Identifier",
							"name": "call",
						},
					},
					"arguments": [
						{
							"type": "ThisExpression",
						},
						{
							"type": "CallExpression",
							"callee": {
								"type": "Identifier",
								"name": "rewrite",
							},
							"arguments": [
								{
									"type": "Identifier",
									"name": "arg",
								},
								{
									"type": "Literal",
									"value": true,
								},
							],
						},
					],
				},
				"generator": false,
				"expression": true,
			},
			"alternate": {
				"type": "Identifier",
				"name": "x",
			},
		},
		"generator": false,
		"expression": true,
	},
	"arguments": [
		foo,
	],
});