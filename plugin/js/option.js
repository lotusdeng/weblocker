
function initSaveButton() {
	var pluginStateButton = document.getElementById("saveButton");
    pluginStateButton.addEventListener("click", saveButtonOnClick, true);
}

function initCaseNameText() {
	var caseNameText = document.getElementById("caseNameText");
	caseNameText.value = "";
	chrome.storage.local.get("caseName", function(result){
        caseNameText.value = result.caseName;
    });
}

function initCaseInvestigatorText() {
    var caseInvestigatorText = document.getElementById("caseInvestigatorText");
    caseInvestigatorText.value = "";
    chrome.storage.local.get("caseInvestigator", function(result){
        caseInvestigatorText.value = result.caseInvestigator;
    });
}

function initCaseUrlText() {
    var caseUrlText = document.getElementById("caseUrlText");
    caseUrlText.value = "";
    chrome.storage.local.get("caseUrl", function(result){
        caseUrlText.value = result.caseUrl;
    });
}

function initCaseLocationText() {
    var caseLocationText = document.getElementById("caseLocationText");
//    caseLocationText.value = "";
//    chrome.storage.local.get("caseLocation", function(result){
//        caseLocationText.value = result.caseLocation;
//    });
    
}

function initMd5Checkbox() {
    var md5Checkbox = document.getElementById("md5Checkbox");
    md5Checkbox.checked = false;
    chrome.storage.local.get("md5", function(result){
        if(result.md5 == "enable") {
            md5Checkbox.checked = true;
        }
    });
}

function initSha256Checkbox() {
    var sha256Checkbox = document.getElementById("sha256Checkbox");
    sha256Checkbox.checked = false;
    chrome.storage.local.get("sha256", function(result){
        if(result.sha256 == "enable") {
            sha256Checkbox.checked = true;
        }
    });
}

function initCapturePicCheckbox() {
    var capturePicCheckbox = document.getElementById("capturePicCheckbox");
    capturePicCheckbox.checked = false;
    chrome.storage.local.get("capturePic", function(result){
        if(result.capturePic == "enable") {
            capturePicCheckbox.checked = true;
        }
    });
}

function initCaseInfo() {
	$.ajax({
            url: "http://localhost:8080/caseInfo",
            cache: false,
            type: "get",
            data: JSON.stringify({test:""}),
            dataType: "json"
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
        }).fail(function(jqXHR, textStatus) {
            
        });
}

function init() {
    try {
        initCaseInfo()
    	initSaveButton();
        //initCaseNameText();
        //initCaseInvestigatorText();
        //initCaseUrlText();
        //initCaseLocationText();
        initMd5Checkbox();
        initSha256Checkbox();
        initCapturePicCheckbox();
    } catch(err) {
    	alert("init throw a exception:" + err);
    }
}

function saveButtonOnClick(e) {
    
    chrome.storage.local.set({"caseName": document.getElementById("caseNameText").value}, function(){});
    chrome.storage.local.set({"caseInvestigator": document.getElementById("caseInvestigatorText").value}, function(){});
    chrome.storage.local.set({"caseUrl": document.getElementById("caseUrlText").value}, function(){});
    chrome.storage.local.set({"caseLocation": document.getElementById("caseLocationText").value}, function(){});
    
    if(document.getElementById("md5Checkbox").checked) {
        chrome.storage.local.set({"md5":"enable"}, function(){});
    } else {
        chrome.storage.local.set({"md5":"disable"}, function(){});
    }
    
    if(document.getElementById("sha256Checkbox").checked) {
        chrome.storage.local.set({"sha256":"enable"}, function(){});
    } else {
        chrome.storage.local.set({"sha256":"disable"}, function(){});
    }
    
    if(document.getElementById("capturePicCheckbox").checked) {
        chrome.storage.local.set({"capturePic":"enable"}, function(){});
    } else {
        chrome.storage.local.set({"capturePic":"disable"}, function(){});
    }
    
    
    var caseInfo = { 'caseName': document.getElementById("caseNameText").value,
        'caseInvestigator': document.getElementById("caseInvestigatorText").value,
        'caseUrl': document.getElementById("caseUrlText").value,
        'caseLocation': document.getElementById("caseLocationText").value};
        
    var bgp = chrome.extension.getBackgroundPage();
    bgp.sendCaseInfoToBackServer(caseInfo);
    
    window.close();
}





function caseNameTextOnBlur(e) {
	var caseName = getCaseName();
	chrome.storage.local.set({"caseName": caseName}, function(){});
}

function caseInvestigatorTextOnBlur(e) {
	var caseInvestigator = getCaseInvestigator();
	chrome.storage.local.set({"caseInvestigator": caseInvestigator}, function(){});
}

function caseUrlTextOnBlur(e) {
    var caseUrl = getCaseUrl();
    chrome.storage.local.set({"caseUrl": caseUrl}, function(){});
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
 	alert("option.js throw exception:" + err);
 }





