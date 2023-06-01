# extract-js

extract-js is a command line program that analyzes and extracts information from an input JavaScript file (or HTML file). 

It does this by running the code in an instrumented environment with emulated DOM and ActiveX API's. There are three different modes of analysis: default (`--default`), symbolic execution (`--sym-exec`), and multi-execution (`--multi-exec`) - each of these modes can be run concurrently either on a standalone JavaScript file or a HTML file with the `--html` flag on. Once analysis is finished, the resulting information is saved in a results folder which has a folder for each analysis mode and a summary folder that summarizes the total unique information. The information extracted includes a semantic log of the code's behaviour in the emulated environment, URL's/IP's, snippets of code, downloaded resources (files), and environmental variable contexts that produce different behaviour.

## Warning
You should run this tool in a virtual machine (e.g. some sort of linux vm on virtualbox) for proper sandboxing.

It is possible for code to break out of the emulated environment and attack the analyst's machine if it is designed to do so.

Another thing to be warned about, is that the information produced by `--multi-exec` mode has a chance of being incorrect. The emulation is not the same as a complete browser of course so there can be some inaccuracies in the logged results.

## Install
You need to ensure that `ExpoSE` is installed properly in the `ExpoSE` folder first.

Then run `npm install` to install all the packages

You can run this tool from it's directory with `node run.js`.

If you want to install it globally then run this command from this directory:

`npm install ./ --global`

Now you should be able to run `extract-js` in the command line anywhere.

## Usage
For normal, default analysis:
```shell
extract-js ./your_script.js
```
For multi-execution analysis:
```shell
extract-js --multi-exec ./your_script.js
```
For symbolic execution analysis:
```shell
extract-js --sym-exec --timeout 1000 ./your_script.js
```
For all modes analysis:
```shell
extract-js --all ./your_script.js
```
Put the `--html` flag for inputting HTML (works with default, sym-exec, multi-exec):
```shell
extract-js --html --multi-exec ./your_html.html
```
Look at `--help` for more flags.

## Features

### Code Snippet Logging
```json
//snippets.json example
{
    "HTML_1_initial_c89d6c67-91bf-4d07-b453-c517ce167d42.txt": {
      "as": "the initial HTML inputted for analysis"
    },
    "1_input_script.js": {
      "as": "FOUND IN INPUT HTML IN SCRIPT TAG AT CHAR 32"
    },
    "1_input_script_INSTRUMENTED.js": {
      "as": "FOUND IN INPUT HTML IN SCRIPT TAG AT CHAR 32"
    },
    "2_input_script.js": {
      "as": "FOUND IN INPUT HTML IN SCRIPT TAG AT CHAR 103"
    },
    "2_input_script_INSTRUMENTED.js": {
      "as": "FOUND IN INPUT HTML IN SCRIPT TAG AT CHAR 103"
    },
    "HTML_2_5391e2bc-4d3a-4d61-90ee-36368c4bbd17.txt": {
      "as": "the initial HTML instrumented for the jsdom emulation"
    }
}
```
Inside the snippets log folder, there are logged code snippets that are found during analysis. For each snippet, the original code is logged, as well as a deobfuscated version obtained from IlluminateJS and an instrumented version if it has been rewritten before execution. JavaScript snippets originate from:
- The original input code and HTML
- The end HTML if it has been modified
- Calls to eval("(code)") or (new Function("(code)"))()
- Valid JavaScript found in any string variables at the end of emulation
- Functions that are passed to DOM event registers or setTimeout/Interval
- Valid JavaScript found in the arguments of DOM API function calls or value writes


There is a corresponding `snippets.json` file that gives information for each snippet on where it originated from. Different categories of snippets are also numbered chronologically for more organization.

### Resource Logging
```json
//resources.json example
{
  "cfe50d26-05e6-4c02-9706-30e57036c5b0": {
    "path": "https://snipstock.com/assets/cdn/png/b867b18ad35e2c000a81a89b192f85f1.png",
    "type": "PNG image data, 894 x 894, 8-bit gray+alpha, non-interlaced",
    "latestUrl": "https://snipstock.com/assets/cdn/png/b867b18ad35e2c000a81a89b192f85f1.png",
    "md5": "fef14d55480f183dffd598433c9807ad",
    "sha1": "226a1ae1e990e345b381d9415f972abee99bb4ba",
    "sha256": "d735da48f62424f3fd7bf1f8ca32855b728689e5b7727b29f4e2878d863d5741"
  }
}
```
Files that are created or downloaded by the code using ActiveX, and files that are downloaded from the DOM are logged in the resources folder. Resource downloading in the DOM requires the `--dom-resource-loading` flag and in ActiveX requires the `--download` flag. `resources.json` contains an entry for each resource, detailing the URL it came from, the hash of it's data, and the suspected filetype. If the detected filetype is an executable, then the url is logged in `active_urls.json`.
### URL/IP Logging
```json
//urls.json example
[
  {
  "url": "https://google.com",
  "info": [
    "METHOD: UNKNOWN. INFO: FOUND IN STRING LITERAL WHILE TRAVERSING THE TREE PRE-EMULATION (START CHAR: 14     END CHAR: 34)",
    "METHOD: UNKNOWNMETHOD. INFO: DOM: Resource at https://google.com [UNKNOWNMETHOD] was found in DOM     emulation from element window.name. Options: {\"element\":{\"localName\":\"window.name\"}}",
    "METHOD: UNKNOWNMETHOD. INFO: FOUND IN URL SEARCH AT THE END IN A VARIABLE CALLED: name",
    "METHOD: UNKNOWNMETHOD. INFO: FOUND IN URL SEARCH AT THE END IN A VARIABLE CALLED: __name"
  ]
  }
]
```
URLs and IPs can show up in various places in analysis which are important to cover to avoid potential URLs going undetected. They are logged in urls.json with information about where they were found. In extract-js, they are obtained from:
- The AST of the inputted code (in string literals)
- ActiveX HTTP requests
- Externally linked resources in HTML (e.g. \<img src="https://alink.com/thing.jpg">)
- DOM network API requests
- Arguments to DOM API functions and writes to DOM API values
- The global string variables at the end of emulation


### DOM Emulation & Logging
Code that is being analyzed can use DOM API's provided by JSDOM - the most useful component being the document object that allows modification and creation of DOM elements. The DOM emulation is instrumented before execution to log property read/writes of DOM objects, and DOM API function calls. Currently, the list of instrumented objects consists of `window`, `document`, `navigator`, `screen`, `history`, `location`, `document.cookie`,  `local/sessionStorage` and `XHR`. A chronological list of DOM logs is found in the `dom_logs.json` file, allowing the analyst to see what the code does.

In addition, any values saved in the DOM's cookies, localStorage and sessionStorage are saved in .json files. The user can supply their own cookie/localStorage/sessionStorage values to populate the DOM by using the respective command line flag (e.g. `--local-storage-file <user's-json-file>`).

The user can enable the XHR network API with the flag `--dom-network-apis`. The other more recent network API's (`fetch` and `navigator.beacon`) are logged but not implemented in `jsdom` however.

### ActiveX Emulation & Logging
extract-js has inherited ActiveX emulation and logging from box-js - it is a lightweight implementation and, although not fully complete, is extensible. No changes have been made to this part of the codebase apart from symbolic tracking (explained later). There is a lot of JavaScript malware that use ActiveX for drive-by download attacks so this feature is quite useful.

### Symbolic Execution
```json
//contexts.json example
{
  "0": {
    "unique_context": {},
    "execution folder": "./executions/0"
  },
  "1": {
    "unique_context": {
      "navigator.webdriver": true
    },
    "execution folder": "./executions/1"
  },
  "2": {
    "unique_context": {
      "navigator.language": "something"
    },
    "execution folder": "./executions/2"
  }
}
```

Symbolic execution analysis is turned on with the `--sym-exec` flag. This runs the input code in an instrumented environment in ExpoSE to get the different combinations of emulation environment variables (called a context) that leads to different control paths. The contexts are logged in `contexts.json`. Then, for each of these contexts, an execution is run that has the corresponding environment variables. This provides the analyst with an understanding of what the code does in different contexts.

The following DOM components are symbolically tracked:
- `window`
- `document`
- `navigator`
- `location`
- `screen`

The following ActiveX components are symbolically tracked:
- `wscript.shell`
- `xmlhttp`
- `adodb.stream`
- `scripting.filesystemobject`
- `wscript.proxy`
- `wmi.getobject.tables`


In order to speed up symbolic execution mode, there are command line flags `--no-sym-exec-dom` and `--no-sym-exec-activex` which can be used to turn off the symbolic tracking for DOM or ActiveX. If the user is not interested in one of these, they can turn it off.

### Multi-execution (Forced Execution)

Multi-execution analysis is turned on with the `--multi-exec` flag. This rewrites the input code in a way that attempts to force all possible code statements to execute in order to find potential useful information. Note that the rewritten code is logged in the snippets folder. Newly registered DOM events are forced to execute when multi-exec is on which can be turned off with the `--no-multi-exec-events` flag.

### Extracted Information Aggregation

For the ease of the user, unique extracted information is summarized in a folder called summary. Along with each piece of information is it's original locations in the analysis results folder. This is done so the user can quickly get a glimpse of any useful information and go to where it is located so it can be looked at in more depth.

### HTML Mode
With the `--html` flag enabled, HTML files can be inputted for analysis where the scripts inside the HTML are parsed and run. In default mode, the HTML file is simply run in the emulation environment, and external linked scripts are downloaded and run if the `--dom-resource-loading` flag is on. This is the same case for multi-execution mode, however the scripts are rewritten before they are run. For symbolic execution mode, the scripts in the HTML file are concatenated into one big script and run in the symbolic execution engine. This enables extract-js to still find environment dependence, and then run separate executions for each context. External scripts can be downloaded and put into the symbolic execution script with the `--sym-exec-external-scripts` flag enabled.


## Attributions

This tool is based off the code of [box-js](https://github.com/CapacitorSet/box-js).

[IlluminateJS](https://github.com/geeksonsecurity/illuminatejs) is a static analysis tool used here for deobfuscating code snippets.

[ExpoSE](https://github.com/ExpoSEJS/ExpoSE) is the symbolic execution engine that is used in symbolic execution mode.

## License

Copyright © 2022 madibkz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.