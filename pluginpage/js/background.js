
﻿function getDomainFromUrl(url){
	var host = "null";
	if(typeof url == "undefined" || null == url)
		url = window.location.href;
	var regex = /.*\:\/\/([^\/]*).*/;
	var match = url.match(regex);
	if(typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
    //alert("hidepage");
    chrome.pageAction.hide(tabId); 
    
    chrome.storage.local.get("pluginState", function(result){
        if(result.pluginState.length != 0 && result.pluginState == "enable") {
            //alert(result.pluginState);
            chrome.storage.local.get("caseUrl", function(result){
            if(result.caseUrl.length != 0) {
                //alert(result.caseUrl);
                urls = result.caseUrl.split(" ");
                currentHost = getDomainFromUrl(tab.url).toLowerCase();
                for(i = 0; i < urls.length; i++) {
                    host =   getDomainFromUrl(urls[i]).toLowerCase();
                    //alert(currentHost);
                    //alert(host);
                    if(host.indexOf("www.") == -1) {
                    host = "www." + host;
                   } 
                   
                   if(currentHost.indexOf("www.") == -1) {
                    currentHost = "www." + currentHost;
                   } 
                    if(host == currentHost) {
                        //alert("showpage");
                        chrome.pageAction.show(tabId);  
                        return;
                    }      
                }    
            }});
        }
    });
	
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.storage.local.get("pluginState", function callback(result){
    if(result.pluginState) {
    } else {
        chrome.storage.local.set({"pluginState": "disable"});
    }
}); 

chrome.storage.local.get("caseUrl", function callback(result){
    if(result.caseUrl) {
    } else {
        chrome.storage.local.set({"caseUrl": ""});
    }
}); 

// Bind event:
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if(request.type == "caseUrlUpdate") {
        //alert("receive message from weblocker, " + request.caseUrl + request.pluginState);
        chrome.storage.local.set({"caseUrl": request.caseUrl});  
        chrome.storage.local.set({"pluginState": request.pluginState});  
    }
});

