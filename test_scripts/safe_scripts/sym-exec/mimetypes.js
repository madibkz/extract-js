if (navigator.mimeTypes[0].type === "testtype") {
  console.log("Found testtype branch");
} else if (navigator.mimeTypes[0].description === "fakedescription") {
  console.log("Found fakedescription branch");
} else {
  console.log("Found default branch");
}
