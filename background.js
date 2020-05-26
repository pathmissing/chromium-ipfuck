var filter = [ "<all_urls>" ];
var possibleHeaders = ["X-Forwarded-For", "Client-Ip", "Via", "X-Real-IP"];

var enabled = false;
var headers = [];
var behaviour = "range"; // range|list
var sync = false;
var range_from = [0,0,0,0];
var range_to = [255,255,255,255];
var list = [[0,0,0,0], [1,1,1,1]];
var whitelist = [];


function generateIp() {
    if (behaviour == "range") {
        var ip = Array();

        range_from = range_from.map((octet) => parseInt(octet, 10));
        range_to = range_to.map((octet) => parseInt(octet, 10));

        for (var i=0; i<4; i++) {
            ip[i] = Math.floor(Math.random()*(range_to[i]-range_from[i]+1)+range_from[i]);
        }
        return ip.join(".");
    }
    else {
        return list[Math.floor(Math.random()*list.length)].join(".");
    }
}

function handleBeforeSendHeaders(data) {
    if (!enabled) {
        return {};
    }
    for (var r in whitelist) {
        if (data.url.match(whitelist[r])) {
            return;
        }
    }
    var xdata=data.requestHeaders;
    var value = 0;
    for (var h in headers) {
        if (!(sync && (value != 0))) {
            value = generateIp();
        }
        xdata.push({
            "name": headers[h],
            "value": value
        });
    }
    return {requestHeaders: xdata};
}

function registerListener() {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        handleBeforeSendHeaders,
        {urls:filter},
        ["blocking","requestHeaders","extraHeaders"]
    );
    console.log("registered listener.");
}

function removeListener() {
    chrome.webRequest.onBeforeSendHeaders.removeListener(
        handleBeforeSendHeaders);
    console.log("removed listener.");
}

function reload() {
    // simply re-register listener
    removeListener();
    registerListener();
    console.log("reload done.");
}

function loadDefaultSettings() {
    localStorage["enabled"] = false;
    localStorage["filter"] = "<all_urls>";
    localStorage["headers"] = "X-Forwarded-For";
    localStorage["behaviour"] = "range";
    localStorage["sync"] = true;
    localStorage["range_from"] = "0.0.0.0";
    localStorage["range_to"] = "255.255.255.255";
    localStorage["list"] = "0.0.0.0;1.1.1.1";
    localStorage["whitelist"] = "http://ignore_this_domain.com/.*";
    loadSettings();
}

function loadSettings() {
    try {
        enabled = localStorage["enabled"];
        filter = localStorage["filter"].split(";");
        headers = localStorage["headers"].split(";");
        behaviour = localStorage["behaviour"];
        sync = localStorage["sync"];
        range_from = localStorage["range_from"].split(".");
        range_to = localStorage["range_to"].split(".");
        
        list = Array();
        var lslist = localStorage["list"].split(";");
        for (var i=0; i<lslist.length; i++) {
            list.push(lslist[i].split("."));
        }
        whitelist = localStorage["whitelist"].split(";");
    } catch(e) {
        // load defaults
        console.log("resettings config ("+e+")");
        loadDefaultSettings();
    }
}

function saveSettings() {
    localStorage["enabled"] = enabled;
    localStorage["filter"] = filter.join(";");
    localStorage["headers"] = headers.join(";");
    localStorage["behaviour"] = behaviour;
    localStorage["sync"] = sync;
    localStorage["range_from"] = range_from.join(".");
    localStorage["range_to"] = range_to.join(".");
    localStorage["list"] = "";
    for (var i=0; i<list.length; i++) {
        localStorage["list"] += list[i].join(".")+";";
    }
    localStorage["whitelist"] = whitelist.join(";");
}

function applySettings() {
    removeListener();
    if (enabled) {
        registerListener();
    }
}

loadSettings();
applySettings();
