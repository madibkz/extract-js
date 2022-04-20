if (navigator.plugins[0].description === "Java plugin") {
  console.log("Found plugin description branch");
} else if (navigator.plugins[0].name === "Java") {
  console.log("Found plugin name branch");
} else {
  console.log("Found default branch");
}
