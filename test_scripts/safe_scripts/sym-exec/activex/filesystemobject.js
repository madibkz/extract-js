var xa = new ActiveXObject('scripting.filesystemobject');
if (xa.fileexists("fakepath")) {
    console.log("FILE EXISTS BRANCH");
} else {
    console.log("NO FILE EXISTS BRANCH");
}
if (xa.folderexists("fakepath")) {
    console.log("folder EXISTS BRANCH");
} else {
    console.log("NO folder EXISTS BRANCH");
}
var f = xa.opentextfile("faketextfile");
if (f.readall() === "BUFFER SYMBOLIZATION WORKS") {
    console.log("BUFFER BRANCH");
} else {
    console.log("NO BUFFER BRANCH");
}
