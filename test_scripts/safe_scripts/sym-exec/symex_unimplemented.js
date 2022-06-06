if (origin === "testval") {
  console.log("got here");
}

undefinedfunction();

//should not reach here if --no-sym-exec-rewrite
if (navigator.userAgent === "testval2") {
  console.log("got here2");
}
