try {
  eval("1+2;\n                  nonexisting(1);\n2+3;");
} catch (e) {
  console.log("STARTING");
  console.log(e);
  console.log(e.message);
  console.log(e.stack);
  console.log(e.lineNumber);
  console.log("FINISH");
}

