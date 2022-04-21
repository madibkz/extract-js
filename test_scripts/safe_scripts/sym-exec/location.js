if (location.hostname === "test2") {
  console.log("location.hostname branch");
} else if (location.hash === "test3") {
  console.log("location.hash branch");
} else {
  console.log("default branch");
}
