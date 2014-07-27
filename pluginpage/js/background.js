
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
function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
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
                
                for(i = 0; i < urls.length; i++) {
					destUrl = urls[i];
					//alert(destUrl);
					if(destUrl.indexOf("http://") == -1 && destUrl.indexOf("https://") == -1){
						destUrl = "http://" + destUrl
					}
					var arr1 = parseURL(destUrl);
					var arr2 = parseURL(tab.url);
					   
				   if(arr1.host.indexOf("www.") == 0) {
					arr1.host = arr1.host.substring(4)
				   } 
				   
				   if(arr2.host.indexOf("www.") == 0) {
					arr2.host = arr2.host.substring(4);
				   } 
				   //alert("domain1:" + arr1.host);
				   //alert("domain2:" + arr2.host);
				   
				   if(arr2.host.indexOf(arr1.host) != -1) {
					   chrome.pageAction.show(tabId);  
					   break;
				   } else {
					   
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

