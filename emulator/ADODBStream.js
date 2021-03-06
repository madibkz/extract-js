const run_by_extract_js = process.argv[1].endsWith("extract-js/analyze");
const lib = run_by_extract_js ? require("../lib") : require("../symbol-lib");
const iconv = require("iconv-lite");

/* Includes code (ADODBStream.writetext, .loadfromfile) from
 * https://github.com/HynekPetrak/malware-jail. The license follows.

 The MIT License (MIT)

 Copyright (c) 2016 Hynek Petrak

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
*/

let sym_vals = {};

function ADODBStream() {
    this.virtual_filename = "(undefined)";
    this.charset = sym_vals.hasOwnProperty("adodb.stream.charset") ? sym_vals["adodb.stream.charset"] : ""; //symex?
    this.position = sym_vals.hasOwnProperty("adodb.stream.position") ? sym_vals["adodb.stream.position"] : 0; //symex
    this.open = function () {};
    this.savetofile = function(filename) {
        this.virtual_filename = filename;
        lib.writeFile(filename, this.buffer);
        lib.logResource(lib.getUUID(), this.virtual_filename, this.buffer, true);
    };
    this.close = () => {};
    this.read = function() {
        return this.buffer;
    };
    this.readtext = function() {
        return this.buffer;
    };
    this.write = function(text) {
        if (!run_by_extract_js)  {
            this.buffer = text;
            return;
        }
        if (this.charset)
            this.buffer = iconv.encode(text, this.charset);
        else
            this.buffer = text;
    };
    this.writetext = function(text) {
        if (!run_by_extract_js)  {
            this.buffer = text;
            return;
        }

        if (this.charset)
            this.buffer = iconv.encode(text, this.charset);
        else
            this.buffer = text;
    };
    this.loadfromfile = function(filename) {
        if (sym_vals.hasOwnProperty("adodb.stream.buffer")) {
            this.buffer = sym_vals["adodb.stream.buffer"];
        } else {
            if (this.charset)
                this.buffer = iconv.decode(lib.readFile(filename), this.charset); //symex?
            else
                this.buffer = lib.readFile(filename);
        }
    };
    this.tojson = function(data) {
        console.log(data);
        return "[1]";
    };
    this.copyto = (target) => target.write(this.buffer);
    this.tostring = () => "ADODBStream object";
}

function setSymexInput(symex_input) {
    if (symex_input)
        sym_vals = symex_input;
}

module.exports = {
    create : function() {
        return new Proxy(new ADODBStream(), {
            get: function(target, name) {
                name = name.toLowerCase();
                switch (name) {
                    case "size":
                    case "length":
                        return target.buffer.length;
                    default:
                        if (name === "__safe_item_to_string") { //this is needed for jalangi/expose
                            return false;
                        }
                        if (name in target) {
                            return target[name];
                        }
                        lib.kill(`ADODBStream.${name} not implemented!`);
                }
            },
            set: function(a, b, c) {
                if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                    a[b] = c;
                    return true;
                }
                b = b.toLowerCase();
                /*      if (c.length < 1024)
                        console.log(`ADODBStream[${b}] = ${c};`);
                */
                a[b] = c;
                return true;
            },
        });
    },
    setSymexInput
};
