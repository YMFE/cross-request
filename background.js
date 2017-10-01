'use strict';

function formUrlencode(data) {
	return Object.keys(data).map(function (key) {
			return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
	}).join('&')
}
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

function sendAjax(req, successFn, errorFn){
	var formDatas;
	var xhr = new XMLHttpRequest();

	req.headers = req.headers || {};
	req.headers['Content-Type'] = req.headers['Content-Type'] || req.headers['Content-type'] || req.headers['content-type'] || 'text/plain';// 兼容多种写法

	xhr.timeout = req.timeout || 5000;

	req.method = req.method || 'GET';
	req.async = req.async === false ? false : true;
	req.headers = req.headers || {};

	if (req.method.toLowerCase() !== 'get' || req.method.toLowerCase() !== 'head' || req.method.toLowerCase() !== 'options') {
			if (!req.headers['Content-Type'] || req.headers['Content-Type'] == 'application/x-www-form-urlencoded') {
					req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
					req.data = formUrlencode(req.data);
			}else if (typeof req.data === 'object' && req.data) {
					req.data = JSON.stringify(req.data);
			}
	}
	if (req.query && typeof req.query === 'object') {
			var getUrl = formUrlencode(req.query);
			req.url = req.url + '?' + getUrl;
			req.query = '';
	}
	xhr.open(req.method, req.url, req.async);
	var response = {};
	if (req.headers) {
			for (var name in req.headers) {
					xhr.setRequestHeader(name, req.headers[name]);
			}
	}

	xhr.onload = function (e) {
			response = {
					headers: xhr.getAllResponseHeaders(),
					status: xhr.status,
					statusText: xhr.statusText,
					body: xhr.responseText 
			}
			if (xhr.status == 200) {
					successFn(response);
			} else {
					errorFn(response);
			}
	};
	xhr.ontimeout = function (e) {
			errorFn({
					body: 'Error:Request timeout that the time is ' + xhr.timeout
			})
	};
	xhr.onerror = function (e) {
			errorFn( {
					body: xhr.statusText
			})
	};
	xhr.upload.onprogress = function (e) { };

	try {
			xhr.send(req.data);
	} catch (error) {
			errorFn( {
					body: error.message
			})
	}
}

chrome.runtime.onConnect.addListener(function(connect) {
  if(connect.name === 'request'){
		connect.onMessage.addListener(function(msg){
			sendAjax(msg.req, function(res){
				connect.postMessage({
					id: msg.id,
					res: res
				})
			}, function(err){
				connect.postMessage({
					id: msg.id,
					res: err
				})
			})
		})
	}
});

