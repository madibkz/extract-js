if (1) {
  if (3) {
  }
} else if (2) {
  if (4) {
    console.log("this");
  } else if (5) {
    eval(`console.log("a"); if (6) console.log(undefinedthing); eval("console.log(lol);");`);
  }
} else {

}
console.log("FINISH");
