function return_symbol() {
  return S$.symbol("dyn_symbol", true);
}

if (return_symbol()) {
  throw "this error";
} else {
  throw "second error";
}
