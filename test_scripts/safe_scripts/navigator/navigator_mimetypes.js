if (navigator.mimeTypes.length > 0) {
  if (navigator.mimeTypes.namedItem("application/x-java-applet")) {
    if (navigator.mimeTypes[0].suffixes === ".java") {
      console.log("FOUND JAVA");
    }
  }
}

//console.log(navigator.plugins[0].description);
