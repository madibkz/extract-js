function bruh() {
  console.log("BEFORE THIS[EVAL]");
  this["e" + "v" + "al"]("logMultiexec('does it work');");
  console.log("AFTER THIS[EVAL]");
}

bruh();
