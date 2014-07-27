

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

function initAutoScrollCheckbox() {
    var autoScrollCheckbox = document.getElementById("autoScrollCheckbox");
    autoScrollCheckbox.checked = false;
    chrome.storage.local.get("autoScroll", function(result){
        if(result.autoScroll == "enable") {
            autoScrollCheckbox.checked = true;
        }
    });
}


function initCaseLocationButton() {
    //var pluginStateButton = document.getElementById("caseLocationButton");
    //pluginStateButton.addEventListener("click", caseLocationButtonOnClick, true);
}
function caseLocationButtonOnClick() {
    try {
    alert("select folder");
        var Message = "选中案件所在目录"; //选择框提示信息
        var Shell = new ActiveXObject("Shell.Application");
        var Folder = Shell.BrowseForFolder(0, Message, 64, 17); //起始目录为：我的电脑
        //var Folder = Shell.BrowseForFolder(0, Message, 0); //起始目录为：桌面
        if (Folder != null) {
            Folder = Folder.items(); // 返回 FolderItems 对象
            Folder = Folder.item(); // 返回 Folderitem 对象
            Folder = Folder.Path; // 返回路径
            if (Folder.charAt(Folder.length - 1) != "\\") {
                Folder = Folder + "\\";
            }
            document.getElementById("caseLocationText").value = Folder;
            return Folder;
        }
    }
    catch (e) {
        alert(e.message);
    }
}

function initCaseInfo() {
	$.ajax({
            url: "http://127.0.0.1:8080/caseInfo",
            cache: false,
            type: "get",
            timeout: 500
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
        initCaseInfo()
    	initSaveButton();
        initCaseLocationButton();
        //initCaseNameText();
        //initCaseInvestigatorText();
        //initCaseUrlText();
        //initCaseLocationText();
        initMd5Checkbox();
        initSha256Checkbox();
        initCapturePicCheckbox();
		initAutoScrollCheckbox();
    } catch(err) {
    	alert("init throw a exception:" + err);
    }
}

function saveButtonOnClick(e) {
    caseName = trim(document.getElementById("caseNameText").value)
	if(caseName.length == 0) {
		alert("案件名不能为空");
		return;
	}
	
	caseInvestigator = trim(document.getElementById("caseInvestigatorText").value)
	if(caseInvestigator.length == 0) {
		alert("调查者不能为空");
		return;
	}
	caseUrl = trim(document.getElementById("caseUrlText").value)
	if(caseUrl.length == 0) {
		alert("URL不能为空");
		return;
	}
	caseLocation = trim(document.getElementById("caseLocationText").value)
	if(caseLocation.length == 0) {
		alert("案卷目录不能为空");
		return;
	}
    chrome.storage.local.set({"caseName": caseName}, function(){});
    chrome.storage.local.set({"caseInvestigator": caseInvestigator}, function(){});
    chrome.storage.local.set({"caseUrl": caseUrl}, function(){});
    
    chrome.storage.local.get("pluginState", function(result) {
        //alert("pluginState=" + result.pluginState);
        if(result.pluginState == "enable")  {
            var bgp = chrome.extension.getBackgroundPage();
            bgp.sendMessageToOtherPlugin("enable", caseUrl)
        } else {
            var bgp = chrome.extension.getBackgroundPage();
            bgp.sendMessageToOtherPlugin("disable", caseUrl)
        }
     });
    
        
    chrome.storage.local.set({"caseLocation": caseLocation}, function(){});
    
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
	
	if(document.getElementById("autoScrollCheckbox").checked) {
        chrome.storage.local.set({"autoScroll":"enable"}, function(){});
    } else {
        chrome.storage.local.set({"autoScroll":"disable"}, function(){});
    }
    
    
    var caseInfo = { 'caseName': caseName,
        'caseInvestigator': caseInvestigator,
        'caseUrl': caseUrl,
        'caseLocation': caseLocation};
    if(document.getElementById("md5Checkbox").checked) {
        caseInfo["md5"] = true;
    } else {
        caseInfo["md5"] = false;
    }
    
    if(document.getElementById("sha256Checkbox").checked) {
        caseInfo["sha256"] = true;
    } else {
        caseInfo["sha256"] = false;
    }
    
    if(document.getElementById("capturePicCheckbox").checked) {
        caseInfo["capturePic"] = true;
    } else {
        caseInfo["capturePic"] = false;
    }
        
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





