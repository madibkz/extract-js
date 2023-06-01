const lib = process.argv[1].endsWith("extract-js/analyze") ? require("../lib") : require("../symbol-lib");
const fs = require("fs");
const path = require("path");

let sym_vals = {};

const diskSize = Math.floor(Math.random() * 1E11);
const freeSpace = Math.floor(Math.random() * diskSize);

// Note: all fields MUST be in lowercase!
const processes = JSON.parse(fs.readFileSync(path.join(__dirname, "processes.json"), "utf8"));
let tables = buildTables();

function buildTables() {
    return {
        antivirusproduct: [],
        win32_computersystemproduct: [],
        win32_logicaldisk: [{ // dirty patch by @ALange
            deviceid: "C:",
            drivetype: 3,
            freespace: freeSpace,
            size: diskSize,
            volumeserialnumber: "B55B4A40",
        }],
        win32_computersystem : [{
            "pscomputername" : get_sym_val("tables.win32_computersystem.pscomputername","USER-PC"), //symex
            "adminpasswordstatus" : get_sym_val("tables.win32_computersystem.adminpasswordstatus", 3), //symex?
            "bootupstate" : "Normal boot",
            "chassisbootupstate" : 3,
            "keyboardpasswordstatus" : 3,
            "poweronpasswordstatus" : 3,
            "powersupplystate" : 3,
            "powerstate" : 0,
            "frontpanelresetstatus" : 3,
            "thermalstate" : 3,
            "status" : get_sym_val("tables.win32_computersystem.status","OK"),
            "name" : get_sym_val("tables.win32_computersystem.name","USER_PC"),
            "automaticmanagedpagefile" : "True",
            "automaticresetbootoption" : "True",
            "automaticresetcapability" : "True",
            "bootromsupported" : "True",
            "bootstatus" : "{0, 0, 0, 0...}",
            "caption" : "USER-PC",
            "chassisskunumber" : "Notebook",
            "creationclassname" : "Win32_ComputerSystem",
            "currenttimezone" : get_sym_val("tables.win32_computersystem.currenttimezone",-300), //symex
            "daylightineffect" : "True",
            "description" : "AT/AT COMPATIBLE",
            "dnshostname" : "USER-PC",
            "domain" : get_sym_val("tables.win32_computersystem.domain","support.kingservers.com"), //symex?
            "domainrole" : 1,
            "enabledaylightsavingstime" : "True",
            "hypervisorpresent" : get_sym_val("tables.win32_computersystem.hypervisorpresent","False"), //symex
            "infraredsupported" : "False",
            "manufacturer" : get_sym_val("tables.win32_computersystem.manufacturer","Dell Inc."), //symex?
            "model" : get_sym_val("tables.win32_computersystem.model","XPS 15"), //symex?
            "networkservermodeenabled" : get_sym_val("tables.win32_computersystem.networkservermodeenabled","True"), //symex?
            "numberoflogicalprocessors" : 8,
            "numberofprocessors" : 2,
            "oemstringarray" : "{Dell System, 1[07BF], 3[1.0], 12[www.dell.com]...}",
            "partofdomain" : "True",
            "pauseafterreset" : -1,
            "pcsystemtype" : 2,
            "pcsystemtypeex" : 2,
            "primaryownername" : get_sym_val("tables.win32_computersystem.primaryownername","Sysop12"), //symex
            "resetcapability" : 1,
            "resetcount" : -1,
            "resetlimit" : -1,
            "roles" : "{LM_Workstation, LM_Server, NT}",
            "systemfamily" : "Precision",
            "systemskunumber" : "07BF",
            "systemtype" : "x64-based PC", //symex?
            "totalphysicalmemory" : "17021726720",
            "username" : get_sym_val("tables.win32_computersystem.username","SUPPORT\Sysop12"), //symex
            "wakeuptype" : 6,
            "scope" : "System.Management.ManagementScope",
            "path" : "\\USER-PC\root\cimv2:Win32_ComputerSystem.Name=\"USER-PC\"",
            "options" : "System.Management.ObjectGetOptions",
            "classpath" : "\\USER-PC\root\cimv2:Win32_ComputerSystem",
            "properties" : "{AdminPasswordStatus, AutomaticManagedPagefile, AutomaticResetBootOption, AutomaticResetCapability...}",
            "systemproperties" : "{__GENUS, __CLASS, __SUPERCLASS, __DYNASTY...}",
            "qualifiers" : "{dynamic, Locale, provider, UUID}",
        }],
        win32_networkadapterconfiguration: [{
            "pscomputername": get_sym_val("tables.win32_networkadapterconfiguration.pscomputername","USER-PC"), //symex
            "dhcpleaseexpires": "19330110154953.000000-360",
            "index": "7",
            "description": "Huawei Ethernet",
            "dhcpenabled": get_sym_val("tables.win32_networkadapterconfiguration.dhcpenabled","True"), //symex
            "dhcpleaseobtained": "19330109154953.000000-360",
            "dhcpserver": get_sym_val("tables.win32_networkadapterconfiguration.dhcpserver","121.173.9.22"), //symex?
            "dnsdomain": get_sym_val("tables.win32_networkadapterconfiguration.dnsdomain","kingservers.com"), //symex?
            "dnsenabledforwinsresolution": "False",
            "dnshostname": get_sym_val("tables.win32_networkadapterconfiguration.dnshostname","USER-PC"), //symex
            "dnsserversearchorder": ["8.8.8.8"],
            "domaindnsregistrationenabled": get_sym_val("tables.win32_networkadapterconfiguration.domaindnsregistrationenabled","False"), //symex?
            "fulldnsregistrationenabled": get_sym_val("tables.win32_networkadapterconfiguration.fulldnsregistrationenabled","True"), //symex?
            "ipaddress": [
                get_sym_val("tables.win32_networkadapterconfiguration.ipaddress.ip","185.180.196.9"),
                get_sym_val("tables.win32_networkadapterconfiguration.ipaddress.mac","2002:b9b4:c409:0:0:0:0:0"),
            ], //symex?
            "ipconnectionmetric": "25",
            "ipenabled": get_sym_val("tables.win32_networkadapterconfiguration.ipenabled","True"), //symex?
            "ipfiltersecurityenabled": get_sym_val("tables.win32_networkadapterconfiguration.ipfiltersecurityenabled","False"), //symex?
            "winsenablelmhostslookup": "True",
            "winsprimaryserver": "185.180.192.1",
            "winssecondaryserver": "185.180.192.17",
            "__genus": "2",
            "__class": "Win32_NetworkAdapterConfiguration",
            "__superclass": "CIM_Setting",
            "__dynasty": "CIM_Setting",
            "__relpath": "Win32_NetworkAdapterConfiguration.Index=7",
            "__property": "61",
            "__derivation": ["CIM_Setting"],
            "__server": "USER-PC",
            "__namespace": "root\cimv2",
            "__path": "\\USER-PC\root\cimv2:Win32_NetworkAdapterConfiguration.Index=7",
            "caption": "Main Network Adapter",
            "databasepath": "%SystemRoot%\System32\drivers\etc",
            "defaultipgateway": ["185.182.2.2"],
            "gatewaycostmetric": ["0"],
            "interfaceindex": "22",
            "ipsubnet": ["255.255.255.0", "64"],
            "macaddress": get_sym_val("tables.win32_networkadapterconfiguration.macaddress","F9:22:77:A3:9C:12"), //symex?
            "servicename": get_sym_val("tables.win32_networkadapterconfiguration.servicename","fhggtlqq"), //symex
            "settingid": ["F8528A8E-51DC-4D29-B02D-518E944A970B"],
            "tcpipnetbiosoptions": "0",
            "tcpwindowsize": "512",
            "scope": "System.Management.ManagementScope",
            "path": "\\USER-PC\root\cimv2:Win32_NetworkAdapterConfiguration.Index=2",
            "options": "System.Management.ObjectGetOptions",
            "classpath": "\\USER-PC\root\cimv2:Win32_NetworkAdapterConfiguration",
            "qualifiers": ["dynamic", "Locale", "provider", "UUID"],
        }
        ],
        win32_operatingsystem: [{
            "pscomputername": get_sym_val("tables.win32_operatingsystem.pscomputername","LPTOP-127A"), //symex?
            "status": get_sym_val("tables.win32_operatingsystem.status","OK"), //symex?
            "name": get_sym_val("tables.win32_operatingsystem.name","Microsoft Windows 10 Enterprise|C:\WINDOWS|\Device\Harddisk0\Partition4"), //symex?
            "freephysicalmemory": 8313236,
            "freespaceinpagingfiles": 9541376,
            "freevirtualmemory": 15864120,
            "__genus": 2,
            "__class": "Win32_OperatingSystem",
            "__superclass": "CIM_OperatingSystem",
            "__dynasty": "CIM_ManagedSystemElement",
            "__relpath": "Win32_OperatingSystem=@",
            "__property_count": 64,
            "__derivation": ["CIM_OperatingSystem", "CIM_LogicalElement", "CIM_ManagedSystemElement"],
            "__server": "LPTOP-127A",
            "__namespace": "root\cimv2",
            "__path": "\\LPTOP-127A\root\cimv2:Win32_OperatingSystem=@",
            "bootdevice": get_sym_val("tables.win32_operatingsystem.bootdevice","\Device\HarddiskVolume2"), //symex?
            "buildnumber": get_sym_val("tables.win32_operatingsystem.buildnumber","17134"), //symex?
            "buildtype": "Multiprocessor Free",
            "caption": get_sym_val("tables.win32_operatingsystem.caption","Microsoft Windows 10 Enterprise"), //symex?
            "codeset": 1252,
            "countrycode": get_sym_val("tables.win32_operatingsystem.countrycode",1), //symex?
            "creationclassname": "Win32_OperatingSystem",
            "cscreationclassname": "Win32_ComputerSystem",
            "csname": get_sym_val("tables.win32_operatingsystem.csname","LPTOP-127A"), //symex
            "currenttimezone": get_sym_val("tables.win32_operatingsystem.currenttimezone",-100), //symex?
            "dataexecutionprevention_32bitapplications": "True",
            "dataexecutionprevention_available": "True",
            "dataexecutionprevention_drivers": "True",
            "dataexecutionprevention_supportpolicy": 2,
            "debug": "False",
            "distributed": get_sym_val("tables.win32_operatingsystem.distributed","False"), //symex
            "encryptionlevel": get_sym_val("tables.win32_operatingsystem.encryptionlevel",256), //symex?
            "foregroundapplicationboost": 2,
            "installdate": "20180917214145.000000-300",
            "lastbootuptime": "20190724150844.500000-300",
            "localdatetime": get_sym_val("tables.win32_operatingsystem.localdatetime","20190806095747.977000-300"), //symex?
            "locale": get_sym_val("tables.win32_operatingsystem.locale","0409"), //symex
            "manufacturer": "Microsoft Corporation",
            "maxnumberofprocesses": 4294967295,
            "maxprocessmemorysize": 137438953344,
            "muilanguages": ["en-US"],
            "numberofprocesses": 258,
            "numberofusers": get_sym_val("tables.win32_operatingsystem.numberofusers",8), //symex
            "operatingsystemsku": 4,
            "organization": get_sym_val("tables.win32_operatingsystem.organization","King Servers"), //symex
            "osarchitecture": get_sym_val("tables.win32_operatingsystem.osarchitecture","64-bit"), //symex?
            "oslanguage": get_sym_val("tables.win32_operatingsystem.oslanguage",1033), //symex?
            "osproductsuite": get_sym_val("tables.win32_operatingsystem.osproductsuite",256), //symex
            "ostype": get_sym_val("tables.win32_operatingsystem.ostype",18), //symex?
            "portableoperatingsystem": "False",
            "primary": "True",
            "producttype": 1,
            "registereduser": get_sym_val("tables.win32_operatingsystem.registereduser","Sysop12"), //symex?
            "serialnumber": get_sym_val("tables.win32_operatingsystem.serialnumber","50014-13304-92463-12771"), //symex?
            "servicepackmajorversion": 0,
            "servicepackminorversion": 0,
            "sizestoredinpagingfiles": 9713940,
            "suitemask": 272,
            "systemdevice": get_sym_val("tables.win32_operatingsystem.systemdevice","\Device\HarddiskVolume4"), //symex?
            "systemdirectory": get_sym_val("tables.win32_operatingsystem.systemdirectory","C:\WINDOWS\system32"), //symex?
            "systemdrive": get_sym_val("tables.win32_operatingsystem.systemdrive","C:"), //symex
            "totalvirtualmemorysize": 26336720,
            "totalvisiblememorysize": 16622780,
            "version": get_sym_val("tables.win32_operatingsystem.version","10.0.17134"), //symex?
            "windowsdirectory": "C:\WINDOWS",
            "scope": "System.Management.ManagementScope",
            "path": "\\LPTOP-127A\root\cimv2:Win32_OperatingSystem=@",
            "options": "System.Management.ObjectGetOptions",
            "classpath": "\\LPTOP-127A\root\cimv2:Win32_OperatingSystem",
            "properties": ["BootDevice", "BuildNumber", "BuildType", "Caption"],
            "systemproperties": ["__GENUS", "__CLASS", "__SUPERCLASS", "__DYNASTY"],
            "qualifiers": ["dynamic", "Locale", "provider", "Singleton"],
        }],
        win32_process: processes,
        win32_processstoptrace: [{"processname": get_sym_val("tables.win32_processstoptrace.process","chrome.exe")}], //symex?
    };

}

const classes = {
    win32_process: new Proxy(processes, {
	    get(target, _prop) {
            if (_prop === "__safe_item_to_string") return false;
            const prop = _prop.toLowerCase();
	        if (prop in target) return target[prop];
	        if (prop === "create")
	    	return command => {
	    	    lib.logIOC("CommandExec", command, "The script executed a command.");
	    	    lib.logSnippet(lib.getUUID(), {as: "command"}, command);
	    	}
	        lib.kill(`Win32_Process.${prop} not implemented!`);
	    },
        set: function(a, b, c) {
            if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                a[b] = c;
                return true;
            }
            return false;
        },
    }),
    win32_processstartup: new Proxy({
	    spawninstance_: () => {}
        }, {
	        get(target, _prop) {
                if (_prop === "__safe_item_to_string") return false;
	            const prop = _prop.toLowerCase();
	            if (prop in target) return target[prop];
	            lib.kill(`Win32_Process.${prop} not implemented!`);
	        },
            set: function(a, b, c) {
                if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                    a[b] = c;
                    return true;
                }
                return false;
            },
        })
}

Object.keys(tables).forEach(name => {
    if (/[A-Z]/.test(name))
	    lib.kill("Internal error: non-lowercase table name");
    tables[name].forEach(row => Object.keys(row).forEach(label => {
	    if (/[A-Z]/.test(label))
	        lib.kill("Internal error: non-lowercase property: '" + label + "'");
    }));
});

function getTable(_tableName) {

    // Tell about interesting actions.
    const tableName = _tableName.toLowerCase();
    if (tableName === "win32_process")
	    lib.info("Script tried to read the list of processes");
    if (tableName === "win32_processstoptrace")
	    lib.info("Script tried to get information about stopped processes");
    if (tableName === "win32_computersystem")
	    lib.info("Script tried to read information about machine");
    if (tableName === "win32_networkadapterconfiguration")
	    lib.info("Script tried to read information about network adapter");
    if (tableName === "win32_operatingsystem")
	    lib.info("Script tried to read information about operating system");
    lib.verbose(`Script tried to read table ${tableName}`);
    if (!(tableName in tables))
	    lib.kill(`Table ${tableName} not implemented!`);
    
    // Proxify everything for the normal case.
    return tables[tableName].map(row => new Proxy(row, {
	    get(target, _prop) {
            if (_prop === "__safe_item_to_string") return false;
	        const prop = _prop.toLowerCase();
	        if (prop in target) return target[prop];
	        lib.kill(`${tableName}.${prop} not implemented!`);
	    },
        set: function(a, b, c) {
            if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                a[b] = c;
                return true;
            }
            return false;
        },
    }));
}

function EventTable(baseTableName) {

    // Known table?
    if (!(baseTableName in tables))
	    lib.kill(`Table ${baseTableName} not implemented!`);

    // Save the table data to serve out.
    this.tableData = tables[baseTableName].map(row => new Proxy(row, {
	    get(target, _prop) {
            if (_prop === "__safe_item_to_string") return false;
	        const prop = _prop.toLowerCase();
	        if (prop in target) return target[prop];
	        lib.kill(`${tableName}.${prop} not implemented!`);
	    },
        set: function(a, b, c) {
            if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                a[b] = c;
                return true;
            }
            return false;
        },
    }));
    
    // Cycle through the table data.
    this.tablePos = 0;

    // Read next table item.
    this.NextEvent = function () {
        if (this.tablePos < this.tableData.length) {            
            this.tablePos++;
            return this.tableData[this.tablePos - 1];
        }
        else {
            return "";
        }
    };
}

function getNextEventTable(_tableName) {

    // Tell about interesting actions.
    const tableName = _tableName.toLowerCase();
    if (tableName === "win32_process")
	    lib.info("Script tried to read the list of processes");
    if (tableName === "win32_processstoptrace")
	    lib.info("Script tried to get information about stopped processes");
    if (tableName === "win32_computersystem")
	    lib.info("Script tried to read information about machine");
    if (tableName === "win32_networkadapterconfiguration")
	    lib.info("Script tried to read information about network adapter");
    if (tableName === "win32_operatingsystem")
	    lib.info("Script tried to read information about operating system");
    lib.verbose(`Script tried to read table ${tableName}`);
    if (!(tableName in tables))
	    lib.kill(`Table ${tableName} not implemented!`);

    // Return an object with a NextEvent() method that returns the items
    // from the table.
    return new EventTable(tableName);
}

function get_sym_val(sym_val_name, default_val) { //TODO put in its own symbol-utils file or something like that
    sym_val_name = "wmi.getobject." + sym_val_name;
    return sym_vals.hasOwnProperty(sym_val_name) ? sym_vals[sym_val_name] : default_val;
}

function setSymexInput(symex_input) {
    if (symex_input) {
        sym_vals = symex_input;
        tables = buildTables();//need to build tables again to have the new sym_vals
    }
}

module.exports = {
    GetObject: function(name) {
        /*
          name = name.toLowerCase();
          name = name.replace(/{impersonationlevel=impersonate}/g, "");
          switch (name) {
          case "winmgmts:":
          // ...
          case "winmgmts:\\\\localhost\\root\\securitycenter":
          case "winmgmts:\\\\localhost\\root\\securitycenter2":
          // ...
          default:
          lib.kill(`GetObject(${name}) not implemented!`);
          }
        */
        return new Proxy({
            InstancesOf: getTable,
            ExecQuery: query => {
                // TODO: implement actual SQL
                const parts = query.match(/^select +(\*|(?:\w+, *)*(?:\w+)) +from +(\w+)/i);
                if (!parts)
                    lib.kill(`Not implemented: query "${query}"`);
                // For now, fields are ignored.
                // const fields = parts[1];
                const tableName = parts[2].toLowerCase();
                return getTable(tableName);
            },
            ExecNotificationQuery: query => {
                // TODO: implement actual SQL
                const parts = query.match(/^select +(\*|(?:\w+, *)*(?:\w+)) +from +(\w+)/i);
                if (!parts)
                    lib.kill(`Not implemented: query "${query}"`);
                // For now, fields are ignored.
                // const fields = parts[1];
                const tableName = parts[2].toLowerCase();
                return getNextEventTable(tableName);
            },
            Get: className => {
                const _class = classes[className.toLowerCase()];
                if (!_class)
                    lib.kill(`Not implemented: WMI.Get(${className})`);
                return _class;
            },
        }, {
            get(target, name) {
                if (name === "__safe_item_to_string") return false;
                console.log("^^^^^^^^^^^");
                console.log(target);
                console.log(name);
                if (name in target) return target[name];
                lib.kill(`WMI.GetObject.${name} not implemented!`);
            },
            set: function(a, b, c) {
                if (b === "__safe_item_to_string") { //this is needed for jalangi/expose
                    a[b] = c;
                    return true;
                }
                return false;
            },
        });
    },
    setSymexInput
};
