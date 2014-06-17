
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
	chrome.storage.local.get("caseUrl", function(result){
    if(result.caseUrl.length != 0) {
        urls = result.caseUrl.split(" ");
        currentHost = getDomainFromUrl(tab.url).toLowerCase();
        for(i = 0; i < urls.length; i++) {
            host =   getDomainFromUrl(urls[i]).toLowerCase();
            if(host = currentHost) {
                chrome.pageAction.show(tabId);            
            }      
        }    
    }});
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

// Bind event:
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if(request.type == "caseUrlUpdate") {
        chrome.storage.local.set({"caseUrl": request.caseUrl});    
    }
});

