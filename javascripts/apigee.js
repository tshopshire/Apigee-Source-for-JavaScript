/**
  * This library depends on jQuery and the base64 jQuery plugin (http://plugins.jquery.com/project/base64)
*/

/**
  * Accepts the endpoint (ex: "http://user.apigee.com/") and builds the API Caller object
*/
function ComApigeeApiCaller(endPoint) {
  var theCall = this;
  /**
    * Takes an API Request (ex: "statuses/public_timeline.json") and an optional array of specified call parameters.
    * theCall's rawResponse is set to the raw JSON object response.
    * If a DOM container ID was provided, response is also sent through processCall.
  */
  this.callAPI = function (apiRequest,callParams) {
    if (!apiRequest) var apiRequest = "";
    if (!callParams) var callParams = {};
    if (!callParams.containerId) callParams.containerId = null;
    if (!callParams.callVerb) callParams.callVerb = "GET";
    if (!callParams.htmlConstruct) callParams.htmlConstruct = "ul";
    if (!callParams.includeElements) callParams.includeElements = {};
    this.doPrune = false;
    for (var key in callParams.includeElements) {
      if (callParams.includeElements.hasOwnProperty(key)) {
        this.doPrune = true;
        break;
      }
    }
    var callAuth = new ComApigeeAuthHandler();
    var urlParams = {
      "auth" : $.base64Encode(callAuth.userName + ":" + callAuth.userPass),
      "apigee_verb" : callParams.callVerb,
      "apigee_testbed" : window.location.hostname
    };
    if (callParams.extraParams) $.extend(true, urlParams, callParams.extraParams);
    $.ajax({
      url: endPoint+apiRequest,
      dataType: 'jsonp',
      data: urlParams,
      success: function (data) {
        theCall.rawResponse = data;
        theCall.partialResponse = (theCall.doPrune) ? theCall.pruneResponse(data) : data;
        if (callParams.containerId !== null) {
          theCall.processCall(theCall.partialResponse,callParams.containerId,callParams.htmlConstruct);
        }
      }
    });
  }
  /**
    * Filters response data based on submitted prototype object (callParams.includeElements)
  */
  this.pruneResponse = function (rawData) {
    var prunedData = {};
    var pruneLoop = function(rawObject,protoObject,prunedObject) {
      for (var rawKey in rawObject) {
        if (rawObject.hasOwnProperty(rawKey) && protoObject.hasOwnProperty(rawKey)) {
          var rawVal = rawObject[rawKey];
          var protoVal = protoObject[rawKey];
          if ((typeof(protoVal)==='object') && protoVal !== null) {
            prunedObject[rawKey] = {};
            pruneLoop(rawVal,protoVal,prunedObject[rawKey]);
          } else {
            prunedObject[rawKey] = rawVal;
          }
        }
      }
    }
    for (var key in rawData) {
      if (rawData.hasOwnProperty(key)) {
        prunedData[key] = {};
        pruneLoop(rawData[key],callParams.includeElements,prunedData[key]);
      }
    }
    return prunedData;  
  }
  /**
    * Takes the request data, an optional DOM ID of the target container, and an HTML construct (ul, ol, div, or dl).
    * setConstruct and iterateData format the response; the target container is populated accordingly.
  */
  this.processCall = function (data,containerId,htmlConstruct) {
    theCall.setConstruct(htmlConstruct);
    var outputHTML = this.iterateData(data);
    $('#'+containerId).html(outputHTML);
  }
  /**
    * Loops through the response data and formats it based on the construct.
  */
  this.iterateData = function (loopData) {
    var tempText = theCall.htmlStructure[0];
    for (var key in loopData) {
      if (loopData.hasOwnProperty(key)) {
        var val = loopData[key];
        var keyText = this.addClassToConstruct(theCall.htmlStructure[2],key)+key+theCall.htmlStructure[4];
        if ((typeof(val)==='object') && val !== null) {
          tempText += (keyText + this.iterateData(val));
        } else {
          tempText += (keyText + val);
        }
        tempText += theCall.htmlStructure[3];
      }
    }
    tempText += theCall.htmlStructure[1];
    return tempText;
  }
  /**
    * Sets the HTML construct based on the provided parameter (ul, ol, div, or dl).
  */
  this.setConstruct = function (htmlConstruct) {
    var constructKey = '<'+htmlConstruct.toLowerCase()+'>';
    var constructMap = [
      ['<ul>','</ul>','<li>','</li>',' : '],
      ['<ol>','</ol>','<li>','</li>',' : '],
      ['<div>','</div>','<div>','</div>',''],
      ['<dl>','</dl>','<dt>','</dd>','</dt><dd>']
    ];
    for (var key in constructMap) {
      if (constructMap.hasOwnProperty(key)) {
        var thisMap = constructMap[key];
        if (thisMap[0] == constructKey) {
          theCall.htmlStructure = thisMap;
          break;
        }
      }
    }
  }
  /**
    * Adds a CSS class to the rendered object based on the element's name.
  */
  this.addClassToConstruct = function (rawTag,newClass) {
    return rawTag.replace('>',' class="'+newClass+'">');
  }
}

/**
  * Handles and stores authentication information.
*/
function ComApigeeAuthHandler() {
  var theHandler = this;
  this.userName = '';
  this.userPass = '';
  /**
    * Checks to see if the browser supports localStorage; returns true or false accordingly.
  */
  this.checkLocalStorage = function () {
    try {
      return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
      return false;
    }
  }
  this.doesLocalStorage = this.checkLocalStorage();
  /**
    * If the browser supports localStorage and the credentials exist in LS, confirms that the user wants to keep using these, and either sets userName and userPass accordingly or calls getCredentials to query for them.
    * If the browser does not support localStorage (or the credentials do not exist), call getCredentials to query for them.
  */
  this.init = function () {
    var doSet = true;
    if(theHandler.doesLocalStorage) {
      if(localStorage.userName && localStorage.userPass) {
        theHandler.userName = localStorage.userName;
        theHandler.userPass = localStorage.userPass;
        doSet = !(confirm("Existing Apigee credentials (\""+theHandler.userName+"\") detected.\nUse these?"));
      }
    }
    if(doSet) {
      this.getCredentials();
    }
  }
  /**
    * Prompts for username and password.
    * Passes prompted data into setCredentials.
  */
  this.getCredentials = function () {
    theHandler.userName = prompt("Log into your Apigee Source account.\nEmail:",theHandler.userName);
    theHandler.userPass = prompt("Password:",theHandler.userPass);
    this.setCredentials();
  }
  /**
    * If the browser supports localStorage, store the prompted data.
  */
  this.setCredentials = function () {
    if(theHandler.doesLocalStorage) {
      localStorage.userName = theHandler.userName;
      localStorage.userPass = theHandler.userPass;
    }
  }
  this.init();
}