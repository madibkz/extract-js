if (WScript.fullname == "name") {
  if (WScript.version == 4) {
    var xa = new ActiveXObject('wscript.shell');
    if ((xa.environment("system"))("appdata") === "C:\\Users\\User\\AppData\\Roaming") {
      let obj = GetObject();
      let instances = obj.InstancesOf("win32_computersystem");
      if (instances[0]["pscomputername"] === "TESTNAME") {
      }
    }
  }
}
