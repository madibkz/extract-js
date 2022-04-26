var obj = GetObject();
var instances = obj.InstancesOf("win32_computersystem");
if (instances[0]["pscomputername"] === "TESTNAME") {
    console.log("computersystem branch");
}

obj = GetObject();
instances = obj.InstancesOf("win32_networkadapterconfiguration");
if (instances[0]["ipaddress"][0] === "TESTNAME") {
    console.log("networkadapterconfiguration branch");
}

obj = GetObject();
instances = obj.InstancesOf("win32_operatingsystem");
if (instances[0]["name"] === "Windows 11") {
    console.log("operatingsystem branch");
}

obj = GetObject();
instances = obj.InstancesOf("win32_processstoptrace");
if (instances[0]["processname"] === "firefox.exe") {
    console.log("processstoptrace branch");
}
