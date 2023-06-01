/*
aggregator.js is the code that summarizes the information gleaned from analyzing the javascript file over multiple
modes.
If only one mode (for example default mode) was run, then aggregator just exits and does nothing since there is no need
to summarize information when there is only one folder.
Otherwise, if there are multiple folders, then for each folder, summarize looks at the information extracted, and logs
the unique data gained across all modes. It writes this data to a folder called summary and gives the location of in
which mode the data was found in.
* */
let fs = require("fs");
let uniq_snippets = {};
let uniq_resources = {};
let uniq_iocs = [];
let uniq_urls = [];
let uniq_active_urls = [];
let uniq_cookies = [];
let uniq_localStorage = {};
let uniq_sessionStorage = {};

function summarize(results_dir, file_copying = true) {

    let default_exists = fs.existsSync(results_dir + "/default");
    let symex_exists = fs.existsSync(results_dir + "/sym-exec");
    let multi_exists = fs.existsSync(results_dir + "/multi-exec");

    //if only one folder exists
    if (default_exists + symex_exists + multi_exists <= 1 && !symex_exists) return;

    console.log("(AGGREGATOR) Summarizing extracted information across ran modes for " + results_dir);

    fs.mkdirSync(results_dir + "/summary");

    if (default_exists) {
        extract_from_exec(results_dir + "/default");
    }

    if (multi_exists) {
        extract_from_exec(results_dir + "/multi-exec");
    }

    if (symex_exists) {
        //copy the found contexts
        try {
            let number_of_contexts = fs.readdirSync(results_dir + "/sym-exec/executions/").length;

            //for each context exec
            for (let i = 0; i < number_of_contexts; i++) {
                extract_from_exec(results_dir + "/sym-exec/executions/" + i);
            }

            if (number_of_contexts !== 1)
                fs.copyFileSync(results_dir + "/sym-exec/contexts.json", results_dir + "/summary/sym_ex_contexts.json");
        } catch (e) {
            console.log("(AGGREGATOR) Error: sym exec mode did not produce any information to aggregate")
        }
    }

    function write_if_not_empty(obj, file_name) {
        if ((Array.isArray(obj) && obj.length !== 0) || (!Array.isArray(obj) && !is_empty_obj(obj)))
            fs.writeFileSync(results_dir + `/summary/${file_name}`, JSON.stringify(obj, null, "\t"));
    }

    //write the json files
    write_if_not_empty(uniq_snippets, "unique_snippets.json");
    write_if_not_empty(uniq_resources, "unique_resources.json");
    write_if_not_empty(uniq_iocs, "unique_activex_IOCs.json");
    write_if_not_empty(uniq_urls, "unique_urls.json");
    write_if_not_empty(uniq_active_urls, "unique_active_urls.json");
    write_if_not_empty(uniq_cookies, "unique_cookies.json");
    write_if_not_empty(uniq_localStorage, "unique_localStorage.json");
    write_if_not_empty(uniq_sessionStorage, "unique_sessionStorage.json");


    function copy_files_to_folder(obj, folder_name) {
        if (file_copying && !is_empty_obj(obj)) {
            fs.mkdirSync(`${results_dir}/summary/${folder_name}`);

            for (let thing in obj)
                if (obj.hasOwnProperty(thing))
                    fs.copyFileSync(obj[thing].location[0], `${results_dir}/summary/${folder_name}/${thing}`);
        }
    }

    copy_files_to_folder(uniq_snippets, "unique_snippets");
    copy_files_to_folder(uniq_resources, "unique_resources");
}

//TODO: REFACTOR the duplication out here (it will be complicated as there are lots of edge cases)
//extract the unique information from an execution folder
function extract_from_exec(path) {
    //urls - []
    if (fs.existsSync(path + "/urls.json")) {
        let urls = JSON.parse(fs.readFileSync(path + "/urls.json", "utf8"));
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let matched_index = -1;
            for (let j = 0; j < uniq_urls.length; j++) {
                if (uniq_urls[j].url === url.url) {
                    matched_index = j;
                }
            }
            if (matched_index === -1) {
                uniq_urls.push({url: url.url, location: [path]});
            } else {
                uniq_urls[matched_index].location.push(path);
            }
        }
    }

    //active urls - []
    if (fs.existsSync(path + "/active_urls.json")) {
        let urls = JSON.parse(fs.readFileSync(path + "/active_urls.json", "utf8"));
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let matched_index = -1;
            for (let j = 0; j < uniq_active_urls.length; j++) {
                if (uniq_active_urls[j][0] === url) {
                    matched_index = j;
                }
            }
            if (matched_index === -1) {
                uniq_active_urls.push([url, [path]]);
            } else {
                uniq_active_urls[matched_index][1].push(path);
            }
        }
    }

    //snippets - {}
    if (fs.existsSync(path + "/snippets.json")) {
        let snips = JSON.parse(fs.readFileSync(path + "/snippets.json", "utf8"));
        for (let snip_name in snips) {
            if (snips.hasOwnProperty(snip_name)) {
                if (snip_name.includes("input_script")) continue; //skip input script snippets
                if (snip_name.includes("HTML_1_initial")) continue; //skip initial HTML snippets

                let path_to_snip = path + "/snippets/" + snip_name;
                let snip_contents = fs.readFileSync(path_to_snip, "utf8");
                if (snip_contents.trim() === "") continue; //skip empty snippets

                //compare snip to current uniq_snippets to see if it is unique
                let matched_snip = "";
                for (let uniq_snip_name in uniq_snippets) {
                    if (uniq_snippets.hasOwnProperty(uniq_snip_name)) {
                        let uniq_snip = uniq_snippets[uniq_snip_name];
                        let uniq_snip_contents = fs.readFileSync(uniq_snip.location[0], "utf8");
                        if (uniq_snip_contents.trim() === snip_contents.trim()) {
                            matched_snip = uniq_snip_name;
                        }
                    }
                }

                if (matched_snip === "") {
                    uniq_snippets[snip_name] = {as: snips[snip_name].as, location: [path_to_snip]};
                } else {
                    uniq_snippets[matched_snip].location.push(path_to_snip);
                }
            }
        }
    }

    //iocs - []
    if (fs.existsSync(path + "/activex_IOC.json")) {
        let iocs = JSON.parse(fs.readFileSync(path + "/activex_IOC.json", "utf8"));
        for (let i = 0; i < iocs.length; i++) {
            //for each ioc:
            //for all unique iocs:
            //check if this ioc is equal to one of the current uniq_iocs
            //if there is one it is equal to, then stop searching, add it to the location field of the ioc
            //otherwise, add this ioc as a unique ioc

            let matched_index = -1;
            for (let j = 0; j < uniq_iocs.length; j++) {
                if (iocs[i].type === uniq_iocs[j].type && is_equal(iocs[i].value, uniq_iocs[j].value)) {
                    matched_index = j;
                    break;
                }
            }

            if (matched_index === -1) {
                iocs[i].location = [path];
                uniq_iocs.push(iocs[i])
            } else {
                uniq_iocs[matched_index].location.push(path);
            }
        }
    }

    //resources - {}
    if (fs.existsSync(path + "/resources.json")) {
        let resources = JSON.parse(fs.readFileSync(path + "/resources.json", "utf8"));
        for (let r_name in resources) {
            if (resources.hasOwnProperty(r_name)) {
                let path_to_resource = path + "/resources/" + r_name;
                let r = resources[r_name];

                //compare resource to current uniq_resources to see if it is unique
                let matched_r = "";
                for (let uniq_r_name in uniq_resources) {
                    if (uniq_resources.hasOwnProperty(uniq_r_name)) {
                        let uniq_r = uniq_resources[uniq_r_name];
                        //check if equal
                        if (uniq_r.path === r.path && uniq_r.latestUrl === r.latestUrl && uniq_r.md5 === r.md5) {
                            matched_r = uniq_r_name;
                        }
                    }
                }

                if (matched_r === "") {
                    r.location = [path_to_resource];
                    uniq_resources[r_name] = r;
                } else {
                    uniq_resources[matched_r].location.push(path_to_resource);
                }
            }
        }
    }

    let path_to_cookies = path + "/cookies.json"; //[]
    if (fs.existsSync(path_to_cookies)) {
        let cookies = JSON.parse(fs.readFileSync(path_to_cookies, "utf8")).cookies;
        for (let i = 0; i < cookies.length; i++) {
            //for each cookie:
            //for all unique cookies:
            //check if this cookie is equal to one of the current uniq_cookies
            //if there is one it is equal to, then stop searching, add it to the location field of the ioc
            //otherwise, add this ioc as a unique ioc

            let matched_index = -1;
            for (let j = 0; j < uniq_cookies.length; j++) {
                if (cookies[i].key === uniq_cookies[j].key && cookies[i].value === uniq_cookies[j].value && is_equal(cookies[i].extensions, uniq_cookies[j].extensions)) {
                    matched_index = j;
                    break;
                }
            }

            if (matched_index === -1) {
                cookies[i].location = [path_to_cookies];
                uniq_cookies.push(cookies[i])
            } else {
                uniq_cookies[matched_index].location.push(path_to_cookies);
            }
        }
    }

    //use a function to reduce duplication between localStorage and sessionStorage
    function extract_from_storage(path_to_storage, unique_storage_obj) {
        if (fs.existsSync(path_to_storage)) {
            let storage = JSON.parse(fs.readFileSync(path_to_storage, "utf8"));
            for (let storage_key in storage) {
                if (storage.hasOwnProperty(storage_key)) {
                    //For each session storage key
                        //for each unique session storage key:
                            //check if they are the same
                            //if they are, then add it to location
                            //otherwise add unique key
                    let s = storage[storage_key];

                    let matched_s = "";
                    for (let uniq_s_name in unique_storage_obj) {
                        if (unique_storage_obj.hasOwnProperty(uniq_s_name)) {
                            if (is_equal(unique_storage_obj[uniq_s_name].value, s)) {
                                matched_s = uniq_s_name;
                            }
                        }
                    }

                    if (matched_s === "") {
                        s = {value: s};
                        s.location = [path_to_storage];
                        unique_storage_obj[storage_key] = s;
                    } else {
                        unique_storage_obj[matched_s].location.push(path_to_storage);
                    }
                }
            }
        }
    }

    extract_from_storage(path + "/sessionStorage.json", uniq_sessionStorage); //{}
    extract_from_storage(path + "/localStorage.json", uniq_localStorage); //{}

}

//used to compare whether two ioc value objects are equal
function is_equal(val1, val2) {
    if (Array.isArray(val1)) {
        if (val1.length === val2.length) {
            for (let i = 0; i < val1.length; i++) {
                try {
                    if (!is_equal(val1[i], val2[i])) {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    switch (typeof val1) {
        case "object":
            for (let i in val1) {
                try { //try statement is used in case val2 doesn't have field i
                    if (val1.hasOwnProperty(i) && !is_equal(val1[i], val2[i]))
                        return false;
                } catch (e) {
                    return false;
                }
            }
            return true;
        case "number":
        case "bigint":
        case "string":
        case "boolean":
            return val1 === val2;
        case "undefined":
            return typeof val2 === "undefined";
        default:
            return false;
    }
}

//taken from https://www.w3docs.com/snippets/javascript/how-to-check-if-javascript-object-is-empty.html
function is_empty_obj(obj) {
    return JSON.stringify(obj) === "{}";
}

module.exports = {
    summarize,
}