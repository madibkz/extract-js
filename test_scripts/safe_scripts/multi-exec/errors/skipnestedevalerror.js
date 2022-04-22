eval(
`1;
2;
undefinedFunction();
console.log(1);
eval("console.log(2);anotherUndefined();console.log(3);");
console.log(4);`
);
console.log("end of script reached (test pass)");
