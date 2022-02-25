function return_symbol() {
  return S$.symbol("dyn_symbol", 1);
}

if (return_symbol()) {
  console.log("A");
  if (return_symbol() == 2) {
    console.log("B");
  } else if (return_symbol() == 3) {
    console.log("C");
  }
} else {
  console.log("D");
}
