if (WScript.fullname == "name") {
  if (WScript.version == 4) {
    var xa = new ActiveXObject('wscript.shell');
    if ((xa.environment("system"))("appdata") === "C:\\Users\\User\\AppData\\Roaming") {
    }
  }
}
