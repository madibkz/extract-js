if (navigator.language === "something") {
  console.log("Found the navigator.language branch");
} else if (navigator.webdriver) {
  console.log("Found navigator.webdriver branch");
} else {
  console.log("Default branch");
}
