//var archors = document.getElementsByTagName("a");
//for(int i = 0; i < archors.length; i++) {
//	
//}

try {
//alert("content.js init");
//chrome.tabs.onUpdated.addListener(tabUpdateListener);
} catch(e) {
    alert("content.js" + e)
}

function tabUpdateListener(tabId, info) {
alert("chrome.tabs.onUpdated event happen");
    chrome.tabs.get(tabId, function(tab){
        alert("info.status=" + info.status+", tab.url="+tab.url);
    });
  
}