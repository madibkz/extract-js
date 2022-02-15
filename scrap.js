//This is just legacy code to be saved in the git history
function evalUntilPasses(evalCode, evalFunc) {
    let codeHadAnError = true;
    do {
        try {
            evalFunc(evalCode);
            codeHadAnError = false;
        } catch (e) {
            let lineRegexp = new RegExp(/<anonymous>:(\d+):(\d+)/gm);
            let lineOfError = lineRegexp.exec(e.stack)[1];
            let newCode = evalCode.split("\n");
            newCode[lineOfError - 1] = `logMultiexec("SKIPPING ERROR THROWN IN EVAL AT LINE ${lineOfError}: ${newCode[lineOfError-1].trim()}", 1);`
            evalCode = newCode.join("\n");
        }
    } while (codeHadAnError)
}
