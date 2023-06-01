eval(
`1;
2;
undefinedFunction();
console.log(1);
anotherUndefined();
console.log(2);`
);
console.log("end of script reached (test pass)");
