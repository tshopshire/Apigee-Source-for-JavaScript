$(document).ready(function() {
  if(apiEndpoint && targetId) {
    var jumpCall = new JumpstartCall(apiEndpoint,targetId);
  }
});

function JumpstartCall(endPoint,containerId) {
  var theCall = this;
  this.makeCall = function() {
    $.getJSON(endPoint,function(data) {
      theCall.processCall(data);
    });
  }
  this.processCall = function(data) {
    var outputHTML = this.iterateData(data);
    $('#'+containerId).html(outputHTML);
  }
  this.iterateData = function(loopData) {
    var tempText = '<ul>';
    for (var key in loopData) {
      var val = loopData[key];
      tempText += '<li>'+key+' : ';
      if ((typeof(val)=='object') && val != null) {
        tempText += theCall.iterateData(val);
      } else {
        tempText += val;
      }
      tempText += '</li>';
    }
    tempText += '</ul>';
    return tempText;
  }
  this.makeCall();
}