/**
  * This library depends on jQuery and the base64 jQuery plugin (http://plugins.jquery.com/project/base64)
*/

function ComApigeeApiCaller(endPoint) {
    var theCall = this;
    this.callAPI = function (apiRequest, callParams) {
        if (!apiRequest) {
            var apiRequest = ""
        }
        if (!callParams) {
            var callParams = {}
        }
        if (!callParams.containerId) {
            callParams.containerId = null
        }
        if (!callParams.callVerb) {
            callParams.callVerb = "GET"
        }
        if (!callParams.htmlConstruct) {
            callParams.htmlConstruct = "ul"
        }
        if (!callParams.basicAuthCredentials) {
            callParams.basicAuthCredentials = null
        }
        var authArg = null;
        if (callParams.basicAuthCredentials == null) {
            var callAuth = new ComApigeeAuthHandler();
            authArg = "Basic " + $.base64Encode(callAuth.userName + ":" + callAuth.userPass);
            if (callAuth.userName == null || callAuth.userName == "" || callAuth.userName == "null" || callAuth.userPass == null || callAuth.userPass == "" || callAuth.userPass == "null") {
                return
            }
        } else {
            authArg = callParams.basicAuthCredentials
        }
        if (!callParams.includeElements) {
            callParams.includeElements = {}
        }
        this.doPrune = false;
        for (var key in callParams.includeElements) {
            if (callParams.includeElements.hasOwnProperty(key)) {
                this.doPrune = true;
                break
            }
        }
        var urlParams = {
            apigee_auth: authArg,
            apigee_verb: callParams.callVerb,
            apigee_testbed: window.location.hostname
        };
        if (callParams.extraParams) {
            $.extend(true, urlParams, callParams.extraParams)
        }
        $.ajax({
            url: endPoint + apiRequest,
            cache: false,
            dataType: "jsonp",
            data: urlParams,
            success: function (data) {
                theCall.rawResponse = data;
                if (callParams.containerId !== null) {
                    theCall.processCall(data, callParams.containerId, callParams.htmlConstruct)
                }
            }
        })
    };
    this.pruneResponse = function (rawData) {
        var prunedData = {};
        var pruneLoop = function (rawObject, protoObject, prunedObject) {
                for (var rawKey in rawObject) {
                    if (rawObject.hasOwnProperty(rawKey) && protoObject.hasOwnProperty(rawKey)) {
                        var rawVal = rawObject[rawKey];
                        var protoVal = protoObject[rawKey];
                        if ((typeof (protoVal) === "object") && protoVal !== null) {
                            prunedObject[rawKey] = {};
                            pruneLoop(rawVal, protoVal, prunedObject[rawKey])
                        } else {
                            prunedObject[rawKey] = rawVal
                        }
                    }
                }
            };
        for (var key in rawData) {
            if (rawData.hasOwnProperty(key)) {
                prunedData[key] = {};
                pruneLoop(rawData[key], callParams.includeElements, prunedData[key])
            }
        }
        return prunedData
    };
    this.processCall = function (data, containerId, htmlConstruct) {
        theCall.setConstruct(htmlConstruct);
        var outputHTML = this.iterateData(data);
        $("#" + containerId).html(outputHTML)
    };
    this.iterateData = function (loopData) {
        var tempText = theCall.htmlStructure[0];
        for (var key in loopData) {
            if (loopData.hasOwnProperty(key)) {
                var val = loopData[key];
                var keyText = this.addClassToConstruct(theCall.htmlStructure[2], key) + key + theCall.htmlStructure[4];
                if ((typeof (val) === "object") && val !== null) {
                    tempText += (keyText + this.iterateData(val))
                } else {
                    tempText += (keyText + val)
                }
                tempText += theCall.htmlStructure[3]
            }
        }
        tempText += theCall.htmlStructure[1];
        return tempText
    };
    this.setConstruct = function (htmlConstruct) {
        var constructKey = "<" + htmlConstruct.toLowerCase() + ">";
        var constructMap = [
            ["<ul>", "</ul>", "<li>", "</li>", " : "],
            ["<ol>", "</ol>", "<li>", "</li>", " : "],
            ["<div>", "</div>", "<div>", "</div>", ""],
            ["<dl>", "</dl>", "<dt>", "</dd>", "</dt><dd>"]
        ];
        for (var key in constructMap) {
            if (constructMap.hasOwnProperty(key)) {
                var thisMap = constructMap[key];
                if (thisMap[0] == constructKey) {
                    theCall.htmlStructure = thisMap;
                    break
                }
            }
        }
    };
    this.addClassToConstruct = function (rawTag, newClass) {
        return rawTag.replace(">", ' class="' + newClass + '">')
    }
}
function ComApigeeAuthHandler() {
    var theHandler = this;
    this.userName = "";
    this.userPass = "";
    this.checkLocalStorage = function () {
        try {
            return "localStorage" in window && window.localStorage !== null
        } catch (e) {
            return false
        }
    };
    this.doesLocalStorage = this.checkLocalStorage();
    this.init = function () {
        var doSet = true;
        if (theHandler.doesLocalStorage) {
            if (localStorage.userName && localStorage.userName != null && localStorage.userName != "null" && localStorage.userPass && localStorage.userPass != null && localStorage.userPass != "null") {
                theHandler.userName = localStorage.userName;
                theHandler.userPass = localStorage.userPass;
                doSet = !(confirm('Existing Apigee credentials ("' + theHandler.userName + '") detected.\nUse these?'))
            }
        }
        if (doSet) {
            this.getCredentials()
        }
    };
    this.getCredentials = function () {
        theHandler.userName = prompt("Log into your Apigee Source account.\nEmail:", theHandler.userName);
        theHandler.userPass = prompt("Password:", theHandler.userPass);
        this.setCredentials()
    };
    this.setCredentials = function () {
        if (theHandler.doesLocalStorage && theHandler.userName != null && theHandler.userName != "null" && theHandler.userPass != null && theHandler.userPass != "null") {
            localStorage.userName = theHandler.userName;
            localStorage.userPass = theHandler.userPass
        }
    };
    this.init()
};