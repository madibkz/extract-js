if (navigator.plugins.length > 0) {
  if (navigator.plugins.namedItem("Flash")) {
    if (navigator.plugins.item(0).item(0).suffixes === ".flash") {
      console.log("FOUND FLASH");
    }
  }
}

//console.log(navigator.plugins[0].description);
