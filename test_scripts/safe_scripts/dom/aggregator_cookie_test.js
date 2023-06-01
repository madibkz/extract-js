if (1 !== 3) {
  document.cookie = "test=value;";
} else {
  document.cookie = "test2=value3;";
}

document.cookie = "test3=value; extend=val";
