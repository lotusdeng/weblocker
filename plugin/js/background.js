var tabUUIDs = {};

var weblockerurlExtensionId = "";

chrome.management.getAll(function callback(extensions){
    for(i = 0; i < extensions.length; i++) {
        //alert(extensions[i].id + ":" + extensions[i].name);
        if(extensions[i].name == "WebLockerURL") {
            weblockerurlExtensionId = extensions[i].id;
            return;
        }
    }
});
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  

function generateUUID() {
	 return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
}

try {
	chrome.storage.local.set({"pluginState": "disable"}, function(){});
//	chrome.storage.local.set({"caseName": "case1"}, function(){});
//	chrome.storage.local.set({"caseInvestigator": "denglian"}, function(){});
//	chrome.storage.local.set({"caseUrl": ""}, function(){});
	chrome.storage.local.set({"caseLocation": "cases"}, function(){});
	chrome.storage.local.set({"md5": "disable"}, function(){});
	chrome.storage.local.set({"sha256": "disable"}, function(){});
	chrome.storage.local.set({"capturePic": "disable"}, function(){});
	
    chrome.tabs.onUpdated.addListener(function(tabId , info) {
        //alert("chrome.tabs.onUpdated event happen");
        chrome.tabs.get(tabId, function(tab){
            //alert("info.status=" + info.status+", tab.url="+tab.url);
            
            if(tab.url.indexOf("chrome") == 0) {
                //alert("chrome page");
                return;
            }
            //alert("info.status=" + info.status+", tab.url="+tab.url);
            if (info.status == "complete") {
                
                willCaptureThisUrl(tab.url, function(captureIt){
                    //alert("willCaptureThisUrl start callback" );
                    if(captureIt) {
                        //alert("doCaptureThisUrl");
                        doCaptureThisUrl(tab);
                    }
                });
            } else if(info.status == "loading") {
                currentUrlUUID = generateUUID();
               	tabUUIDs[tab.id] = currentUrlUUID;
                willCaptureThisUrl(tab.url, function(captureIt) {
                    if(captureIt) {
                    	tryCaptureThisUrl(tab);
                    }
                });
            } else {
               	
            }
        });
    });
    
    
    chrome.extension.onRequest.addListener(function(request, sender, callback) {
        if (request.msg === 'capturePage') {
            capturePage(request, sender, callback);
        } else {
            console.error('Unknown message received from content script: ' + request.msg);
        }
    });
} catch(err) {
    alert("chrome.tabs.onUpdated.addListener throw exception:" + err);
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

function willCaptureThisUrl(url, callback) {
	var matchModel = "domain"; //child url
    chrome.storage.local.get("pluginState", function(result) {
        //alert("pluginState=" + result.pluginState);
        if(result.pluginState == "enable") {
	       chrome.storage.local.get("caseUrl", function(result) {
	           //alert("caseUrl:" + result.caseUrl);
	           //alert("url:" + url);
               if(result.caseUrl.length != 0) {
	               if(matchModel == "domain") {
                       var match = false;
                       
                       var destUrls = result.caseUrl.split(" ")
                       for(var i = 0; i < destUrls.length; i++) {
                           
                           destUrl = destUrls[i];
                           //alert("destUrl:" + destUrl);
                           //alert("currentUrl:" + url);
                           var arr1 = parseURL(destUrl);
                           var arr2 = parseURL(url);
                           
                           if(arr1.host.indexOf("www.") == -1) {
                            arr1.host = "www." + arr1.host;
                           } 
                           
                           if(arr2.host.indexOf("www.") == -1) {
                            arr2.host = "www." + arr2.host;
                           } 
                           //alert("domain1:" + arr1.host);
                           //alert("domain2:" + arr2.host);
                           
                           if(arr1.host == arr2.host) {
                               match = true;
                               break;
                           } else {
                               
                           }
                       }
                       
                       callback(match)
	               	   
	               } else {
	               	   if(url.indexOf(result.caseUrl) != -1) {
	               	   	   callback(true);
	               	   } else {
	               	   	   callback(false);
	               	   }
	               }
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }
        
    });
}



function sendFileToBackServer(query, blob) {
   try {
     //alert("sendFileToBackServer start ");
    $.ajax({
            url: "http://127.0.0.1:8080/capturedUrl/add?" + query,
            cache: false,
            type: "POST",
            data: blob, 
	   		processData: false,
            timeout: 500
        }).done(function(msg) {
            if(msg.error){
            } else {
            }

        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("GET http://127.0.0.1:8080/capturedUrl/add fail, reason:" + 
            ' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
            + ", please restart WebLockerService");
        });
    } catch(err) {
        alert("sendFileToBackServer throw exception:" + err);
    }
}


function EncodeQueryData(data) {
	var ret = [];
	for (var d in data)
		ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
	return ret.join('&')
}

function saveTabAsMHTML(tab) {
    //alert("saveTabAsMHTML start");
    chrome.pageCapture.saveAsMHTML({tabId: tab.id}, function (mhtml){  
        if(mhtml) {
        	 chrome.storage.local.get('md5', function(result) {
                if(result.md5.length != 0 && result.md5 == "enable") {
                    chrome.storage.local.get('sha256', function(result) {
                        if(result.sha256.length != 0 && result.sha256 == "enable") {
                        	var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': 'mhtml',
                        	'uuid': tabUUIDs[tab.id], "md5": "enable", "sha256": "enable"};
                            query = EncodeQueryData(data);
                            sendFileToBackServer(query, mhtml);
                        } else {
                        	var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': 'mhtml',
                            'uuid': tabUUIDs[tab.id], "md5": "enable", "sha256": "disable"};
                            query = EncodeQueryData(data);
                            sendFileToBackServer(query, mhtml);
                        }
                    });
                } else {
                	chrome.storage.local.get('sha256', function(result) {
                        if(result.sha256.length != 0 && result.sha256 == "enable") {
                            var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': 'mhtml',
                            'uuid': tabUUIDs[tab.id], "md5": "disable", "sha256": "enable"};
                            query = EncodeQueryData(data);
                            sendFileToBackServer(query, mhtml);
                        } else {
                            var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': 'mhtml',
                            'uuid': tabUUIDs[tab.id], "md5": "disable", "sha256": "disable"};
                            query = EncodeQueryData(data);
                            sendFileToBackServer(query, mhtml);
                        }
                    });
                }
            });  
        	
        } else {
        	alert("chrome.pageCapture.saveAsMHTML's callbakc get a null blob");
        }
	});
}


function saveTabWindowAsPicture(tab) {
    //alert("saveTabAsPicture start");
    try {
    	
    	
        chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataUrl) {
            
            if (dataUrl) {
                //alert(dataUrl);
                //alert("sendFileToBackServer png start");
                var byteString = atob(dataUrl.split(',')[1]);
                var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];

                // write the bytes of the string to an ArrayBuffer
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }

                // create a blob for writing to a file
                var blob = new Blob([ab], {type: mimeString});
                
                var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': 'png', 'uuid': tabUUIDs[tab.id]};
                
                
                query = EncodeQueryData(data);
                //alert("sendFileToBackServer png");
                sendFileToBackServer(query, blob);
            }
        });    
    } catch (err) {
        alert("tabs.captureVisibleTab throw exception:" + err);
    }
}

function doCaptureThisUrl(tab) {
//	chrome.storage.local.get('saveAsMHTML', function(result) {
//        if(result.saveAsMHTML.length != 0 && result.saveAsMHTML == "enable") {
//             saveTabAsMHTML(tab);                    
//        }              
//    });                
    saveTabAsMHTML(tab);
    
    chrome.storage.local.get('capturePic', function(result) {
        if(result.capturePic.length != 0 && result.capturePic == "enable") {
            //alert("saveTabPageAsPicture");
            saveTabPageAsPicture(tab);                    
        }         
    });  
}

function tryCaptureThisUrl(tab) {
	try {
		//alert("tryCaptureThisUrl start");
        var data = { 'url': tab.url, 'title': tab.title, 'uuid': tabUUIDs[tab.id]};
        query = EncodeQueryData(data);
        $.ajax({
                url: "http://127.0.0.1:8080/tryCaptureUrl/add?" + query,
                cache: false,
                type: "POST",
                data: "test", 
                processData: false,
                timeout: 500
        }).done(function(msg) {
                if(msg.error){
                } else {
                }
    
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("GET http://127.0.0.1:8080/tryCaptureUrl/add fail, reason:" + 
                ' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
                + ", please restart WebLockerService");
        });
        
    } catch(err) {
        alert("sendFileToBackServer throw exception:" + err);
    }
}


function sendCaseInfoToBackServer(caseInfo) {
    try {
        //alert("tryCaptureThisUrl start");
//        var data = { 'caseName': caseInfo.caseName, 'caseInvestigator': caseInfo.caseInvestigator,
//        'caseUrl': caseInfo.caseUrl, 'caseLocation': caseInfo.caseLocation};
        var data = {};
        if(caseInfo.caseName) {
        	data['caseName'] = caseInfo.caseName;
        }
        if(caseInfo.caseInvestigator) {
            data['caseInvestigator'] = caseInfo.caseInvestigator;
        }
        if(caseInfo.caseUrl) {
            data['caseUrl'] = caseInfo.caseUrl;
        }
        if(caseInfo.caseLocation) {
            data['caseLocation'] = caseInfo.caseLocation;
        }
        
        query = EncodeQueryData(data);
        $.ajax({
                url: "http://127.0.0.1:8080/setCaseInfo?" + query,
                cache: false,
                type: "POST",
                data: "test", 
                processData: false,
                timeout: 500
        }).done(function(msg) {
                if(msg.error){
                } else {
                }
    
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("GET http://127.0.0.1:8080/setCaseInfo fail, reason:" + 
            ' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
            + ", please restart WebLockerService");
        });
        
    } catch(err) {
        alert("sendCaseInfoToBackServer throw exception:" + err);
    }
}

function sendGenerateReportToBackServer() {
	try {
        //alert("sendGenerateReportToBackServer start");
       
        $.ajax({
                url: "http://127.0.0.1:8080/generateReport",
                cache: false,
                type: "POST",
                data: "test", 
                processData: false,
                timeout: 500
        }).done(function(msg) {
                if(msg.error){
                } else {
                }
    
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("GET http://127.0.0.1:8080/generateReport fail, reason:" + 
            ' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
            + ", please restart WebLockerService");
        });
        
    } catch(err) {
        alert("sendGenerateReportToBackServer throw exception:" + err);
    }
}



function saveTabPageAsPicture(tab) {
    try {
        //alert("saveTabAsPicture2 start");
        chrome.tabs.executeScript(tab.id, {file: 'js/screen.js'}, function() {
            
            sendScrollMessage(tab);
        });

         window.setTimeout(function() {
            
        }, 1000);
        
    } catch(e) {
        alert("getPositons throw exception:" + err);
    }
}


//
// Events
//
var screenshot, contentURL = '';

function sendScrollMessage(tab) {
    contentURL = tab.url;
    screenshot = {};
    chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function(pictureFormat) {
        // We're done taking snapshots of all parts of the window. Display
        // the resulting full screenshot image in a new browser tab.
    	
        sendPage(tab, pictureFormat);
    });
}




function capturePage(data, sender, callback) {
    try {
    	//alert("capturepage start");
        var canvas;
        
        
        //$('#bar').style.width = parseInt(data.complete * 100, 10) + '%';
        
        // Get window.devicePixelRatio from the page, not the popup
        var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ?
            1 / data.devicePixelRatio : 1;

        if (!screenshot.canvas) {
            canvas = document.createElement('canvas');
            if(canvas) {
                canvas.width = data.totalWidth;
                canvas.height = data.totalHeight;
                screenshot.canvas = canvas;
                screenshot.ctx = canvas.getContext('2d');
        
                // Scale to account for device pixel ratios greater than one. (On a
                // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
                if (scale !== 1) {
                    // TODO - create option to not scale? It's not clear if it's
                    // better to scale down the image or to just draw it twice
                    // as large.
                    screenshot.ctx.scale(scale, scale);
                }
            } else {
                alert("document.createElement('canvas') return null");
            }
            
        }

        // if the canvas is scaled, then x- and y-positions have to make
        // up for it in the opposite direction
        if (scale !== 1) {
            data.x = data.x / scale;
            data.y = data.y / scale;
        }
        //alert(" chrome.tabs.captureVisibleTab start " + data.pictureFormat);
        chrome.tabs.captureVisibleTab( null, {format: data.pictureFormat, quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    screenshot.ctx.drawImage(image, data.x, data.y);
                    //alert("capturePage call callback");
                    callback(true);
                };
                image.src = dataURI;
            }
        });
    } catch (err) {
    	alert("capturepage throw exception:" + err);
    }
}

function sendPage(tab, pictureFormat) {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    var dataURI = screenshot.canvas.toDataURL();

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    var blob = new Blob([ab], {type: mimeString});
    
    chrome.storage.local.get('md5', function(result) {
        if(result.md5.length != 0 && result.md5 == "enable") {
            chrome.storage.local.get('sha256', function(result) {
                if(result.sha256.length != 0 && result.sha256 == "enable") {
                    var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': pictureFormat,
                    'uuid': tabUUIDs[tab.id], "md5": "enable", "sha256": "enable"};
                    query = EncodeQueryData(data);
                    sendFileToBackServer(query, blob);
                } else {
                    var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': pictureFormat,
                    'uuid': tabUUIDs[tab.id], "md5": "enable", "sha256": "disable"};
                    query = EncodeQueryData(data);
                    sendFileToBackServer(query, blob);
                }
            });
        } else {
            chrome.storage.local.get('sha256', function(result) {
                if(result.sha256.length != 0 && result.sha256 == "enable") {
                    var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': pictureFormat,
                    'uuid': tabUUIDs[tab.id], "md5": "disable", "sha256": "enable"};
                    query = EncodeQueryData(data);
                    sendFileToBackServer(query, blob);
                } else {
                    var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': pictureFormat,
                    'uuid': tabUUIDs[tab.id], "md5": "disable", "sha256": "disable"};
                    query = EncodeQueryData(data);
                    sendFileToBackServer(query, blob);
                }
            });
        }
    });  
    

    // create a blob for writing to a file
//    var data = { 'url': tab.url, 'title': tab.title, 'fileFormat': pictureFormat, 'uuid': tabUUIDs[tab.id]};
//    query = EncodeQueryData(data);
//    //alert("sendFileToBackServer " + pictureFormat);
//    sendFileToBackServer(query, blob);
    
}


var urls = {};

function addUrl(url) {
	if(urls.indexOf(url) == -1){
		urls.push(url)
	}
}


chrome.browserAction.setBadgeText({text: "OFF"});


function sendMessageToOtherPlugin(pluginState, caseUrl) {
try{
    //alert(weblockerurlExtensionId);
    chrome.runtime.sendMessage(weblockerurlExtensionId, {"type":"caseUrlUpdate", "caseUrl":caseUrl, "pluginState": pluginState});
    } catch(err) {
        alert(err)
    }
}



