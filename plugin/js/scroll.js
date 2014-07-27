
chrome.extension.onRequest.addListener(onMessage);


function onMessage(request, sender, callback) {
    //alert("screen.js receive " + request.msg);
    if (request.msg === 'scrollPageToBottom') {
        scrollPageToButtom(callback);
    } else if (request.msg === 'scrollPageToTop') {
        scrollPageToTop(callback);
    } else {
        console.error('Unknown message received from background: ' + request.msg);
    }
}


function max(nums) {
    return Math.max.apply(Math, nums.filter(function(x) { return x; }));
}

function scrollPageToTop(callback) {
    //alert("scrollPageToTop");
    window.scrollTo(0, 0);
}

function scrollPageToButtom(callback) {
    //alert("scrollPageToButtom start");
    
    chrome.storage.local.get("scrollRate", function(result) {
		scrollRate = 300
		if(result.scrollRate && result.scrollRate.length != 0) {
			scrollRate = result.scrollRate
		} else {
		}
		
		var id = window.setInterval(function(){
			var body = document.body,
			widths = [
				document.documentElement.clientWidth,
				document.body.scrollWidth,
				document.documentElement.scrollWidth,
				document.body.offsetWidth,
				document.documentElement.offsetWidth
			],
			heights = [
				document.documentElement.clientHeight,
				document.body.scrollHeight,
				document.documentElement.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.offsetHeight
			],
			fullWidth = max(widths),
			fullHeight = max(heights),
			windowWidth = window.innerWidth,
			windowHeight = window.innerHeight,
			originalX = window.scrollX,
			originalY = window.scrollY;

			//alert(originalX + ":" + originalY);
		
			//alert(fullWidth + ":" + fullHeight);

			if(originalY >= fullHeight) {
				//alert("stop scroll");
				
				window.clearInterval(id);  
				window.scrollTo(0, 0);  
				callback();    
			} else {
				window.scrollTo(0, originalY + scrollRate);
				if(originalY == window.scrollY) {
					//alert("stop scroll");
					window.clearInterval(id);
					window.scrollTo(0, 0);
					//alert(originalX + ":" + originalY);
					//alert(fullWidth + ":" + fullHeight);
					callback();
				}
			}
			
		}, 500);
		
	});
    
    
    
    //windows.scrollTo(0, 0);
}


