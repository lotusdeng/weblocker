

function initPluginStateButton() {
    var pluginStateButton = document.getElementById("pluginStateButton");
    pluginStateButton.addEventListener("click", pluginStateButtonOnClick, true);
    pluginStateButton.style.backgroundImage = "url('../images/start.png')";
    chrome.storage.local.get("pluginState", function(result){
        if(result.pluginState == "enable") {
            pluginStateButton.style.backgroundImage = "url('../images/end.png')";
            chrome.browserAction.setBadgeText({text: "ON"});
        } else {
            pluginStateButton.style.backgroundImage = "url('../images/start.png')";
            chrome.browserAction.setBadgeText({text: "OFF"});
        }
    });
}

function initOptionsButton() {
    var optionsButton = document.getElementById("optionButton");
    optionsButton.addEventListener("click",  function(){
        chrome.tabs.create({ url: 'option.html'});
    });
}

function initCaseNameText() {
    var caseNameText = document.getElementById("caseNameText");
    caseNameText.addEventListener("blur", caseNameTextOnBlur, true);
}

function initCaseInvestigatorText() {
    var caseInvestigatorText = document.getElementById("caseInvestigatorText");
    caseInvestigatorText.addEventListener("blur", caseInvestigatorTextOnBlur, true);
}

function initCaseUrlText() {
    var caseUrlText = document.getElementById("caseUrlText");
    caseUrlText.addEventListener("blur", caseUrlTextOnBlur, true);
}

function initCaseInfo() {
    $.ajax({
            url: "http://127.0.0.1:8080/caseInfo",
            cache: false,
            type: "get", 
            timeout: 1000
        }).done(function(msg) {
        	
            if(msg.error){
                
            } else {
                
                var caseNameText = document.getElementById("caseNameText");
                caseNameText.value = msg.caseName;
                
                var caseInvestigatorText = document.getElementById("caseInvestigatorText");
                caseInvestigatorText.value = msg.caseInvestigator
                
                var caseUrlText = document.getElementById("caseUrlText");
                caseUrlText.value = msg.caseUrl;
                
                var caseLocationText = document.getElementById("caseLocationText");
                caseLocationText.value = msg.caseLocation;
                
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            alert("GET http://127.0.0.1:8080/caseInfo fail, reason:" + 
            ' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
            + ", please restart WebLockerService");
        });
}

function init() {
    try {
        //alert("init")
    	initCaseInfo()
        initPluginStateButton();
        initOptionsButton();
        initCaseNameText();
        initCaseInvestigatorText();
        initCaseUrlText();
    } catch(err) {
        alert("init throw a exception:" + err);
    }
}

function pluginStateButtonOnClick(e) {
    chrome.storage.local.get("pluginState", function(result){
        if(result.pluginState == "enable") {
            chrome.storage.local.set({"pluginState": "disable"}, function(){});
            pluginStateButton.style.backgroundImage = "url('../images/start.png')";    
            chrome.browserAction.setBadgeText({text: "OFF"});

            caseUrl = document.getElementById("caseUrlText").value;
            var bgp = chrome.extension.getBackgroundPage();
            bgp.sendMessageToOtherPlugin("disable", caseUrl);
            
			//send start case info to backserver
			$.ajax({
            url: "http://127.0.0.1:8080/caseEnd",
            cache: false,
            type: "post", 
            timeout: 1000
			}).done(function(msg) {
				
			}).fail(function(jqXHR, textStatus, errorThrown) {
				alert("GET http://127.0.0.1:8080/caseEnd fail, reason:" + 
				' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
				+ ", please restart WebLockerService");
			});
			
            if(confirm("生成报告")) {
                var bgp = chrome.extension.getBackgroundPage();
                bgp.sendGenerateReportToBackServer();
            }

        } else {
			if(trim(document.getElementById("caseNameText").value).length == 0) {
            	alert("案件名不能为空");
            	return;
            }
			if(trim(document.getElementById("caseInvestigatorText").value).length == 0) {
            	alert("调查者不能空");
            	return;
            }
            if(trim(document.getElementById("caseUrlText").value).length == 0) {
            	alert("URL不能为空");
            	return;
            }
            
            caseUrl = trim(document.getElementById("caseUrlText").value);
            var bgp = chrome.extension.getBackgroundPage();
            bgp.sendMessageToOtherPlugin("enable", caseUrl);
            
            var caseInfo = { 'caseName': trim(document.getElementById("caseNameText").value),
                'caseInvestigator': trim(document.getElementById("caseInvestigatorText").value),
                'caseUrl': trim(document.getElementById("caseUrlText").value)};
            
            var bgp = chrome.extension.getBackgroundPage();
            bgp.sendCaseInfoToBackServer(caseInfo);
            
            chrome.storage.local.set({"pluginState": "enable"}, function(){});  
            pluginStateButton.style.backgroundImage = "url('../images/end.png')"; 
            chrome.browserAction.setBadgeText({text: "ON"}); 
            
            chrome.storage.local.set({"caseUrl": trim(document.getElementById("caseUrlText").value)}, function(){});  
			
			//send start case info to backserver
			$.ajax({
            url: "http://127.0.0.1:8080/caseStart",
            cache: false,
            type: "post", 
            timeout: 1000
			}).done(function(msg) {
				
			}).fail(function(jqXHR, textStatus, errorThrown) {
				alert("GET http://127.0.0.1:8080/caseStart fail, reason:" + 
				' (errorThrow:' + errorThrown + "|textStatus:" + textStatus + ")"
				+ ", please restart WebLockerService");
			});
        }
    });  
}

function caseNameTextOnBlur(e) {
    chrome.storage.local.set({"caseName": document.getElementById("caseNameText").value}, function(){});
}

function caseInvestigatorTextOnBlur(e) {
    chrome.storage.local.set({"caseInvestigator": document.getElementById("caseInvestigatorText").value}, function(){});
}

function caseUrlTextOnBlur(e) {
    chrome.storage.local.set({"caseUrl": document.getElementById("caseUrlText").value}, function(){});
}

try {
    document.addEventListener("DOMContentLoaded", function () {
        
        try {
            init();    
        } catch(err) {
            $("#message").text("init fail" + err);
        }
    });
    
//    alert("window");
//    window.addEventListener("load", function(e){
//        alert("window.load");
//    });
//    window.addEventListener("unload", function(e){
//        alert("window.unload");
//    });
 } catch(err) {
    alert("popup.js throw exception:" + err);
 }





