var xa = new ActiveXObject('wscript.shell');
if ((xa.environment("system"))("appdata") === "C:\\Users\\User\\AppData\\Roaming") {
  console.log("first branch");
} else {
  console.log("second branch");
}
