if (document.title === "thisthing") {
  console.log("document.title branch reached");
} else if (document.hidden) {
  console.log("document.hidden branch reached");
} else if (document.hasFocus()) {
  console.log("document.hasFocus branch reached");
} else {
  console.log("default branch reached");
}
