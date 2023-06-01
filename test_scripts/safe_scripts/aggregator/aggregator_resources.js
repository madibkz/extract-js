if (1 !== 2) {
    var xa = new ActiveXObject('scripting.filesystemobject');
    var f = xa.createtextfile("path1");
    f.write("something");
} else {
    var xa = new ActiveXObject('scripting.filesystemobject');
    var f = xa.createtextfile("path2");
    f.write("something else");
}