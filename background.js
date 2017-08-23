'use strict';
chrome.runtime.onMessage.addListener(function(request, _ , cb){
	var data;
	
	if(request.action === 'get'){
		data = localStorage.getItem(request.name);
		if(typeof cb === 'function'){
			cb(data)
		}
	}else if(request.action === 'set'){
		localStorage.setItem(request.name, request.value);
		var newdata =data = localStorage.getItem(request.name);
	}
})

