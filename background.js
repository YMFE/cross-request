'use strict';

var base64 = _base64();

function formUrlencode(data) {
	return Object.keys(data).map(function (key) {
		return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
	}).join('&')
}

function encode(data) {
	return base64.encode(encodeURIComponent(JSON.stringify(data)));
}

function decode(data) {
	return JSON.parse(decodeURIComponent(base64.decode(data)));
}


function _base64() {

	/*--------------------------------------------------------------------------*/

	var InvalidCharacterError = function (message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function (message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /<%= spaceCharacters %>/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function (input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function (input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};

	return {
		'encode': encode,
		'decode': decode,
		'version': '<%= version %>'
	};
};






var unsafeHeader = ['Accept-Charset',
	'Accept-Encoding',
	'Access-Control-Request-Headers',
	'Access-Control-Request-Method',
	'Connection',
	'Content-Length',
	'Cookie',
	'Cookie2',
	'Content-Transfer-Encoding',
	'Date',
	'Expect',
	'Host',
	'Keep-Alive',
	'Origin',
	'Referer',
	'TE',
	'Trailer',
	'Transfer-Encoding',
	'Upgrade',
	'User-Agent',
	'Via'];

var requestBatch = {};

function handleHeader(headers) {
	if (!headers) return;
	var newHeaders = {}, headers = headers.split(/[\r\n]/).forEach(function (header) {
		var index = header.indexOf(":");
		var name = header.substr(0, index);
		var value = header.substr(index + 2);
		if (name) {
			newHeaders[name] = value;
		}

	})
	return newHeaders;
}

chrome.runtime.onMessage.addListener(function (request, _, cb) {
	var data;

	if (request.action === 'get') {
		data = localStorage.getItem(request.name);
		if (typeof cb === 'function') {
			cb(data)
		}
	} else if (request.action === 'set') {
		localStorage.setItem(request.name, request.value);
		var newdata = data = localStorage.getItem(request.name);
	}
})

function sendAjax(req, successFn, errorFn) {
	var formDatas;
	var xhr = new XMLHttpRequest();

	req.headers = req.headers || {};
	req.headers['Content-Type'] = req.headers['Content-Type'] || req.headers['Content-type'] || req.headers['content-type'];// 兼容多种写法

	xhr.timeout = req.timeout || 1000000;

	req.method = req.method || 'GET';
	req.async = req.async === false ? false : true;
	req.headers = req.headers || {};

	if (req.method.toLowerCase() !== 'get' && req.method.toLowerCase() !== 'head' && req.method.toLowerCase() !== 'options') {
		if (!req.headers['Content-Type'] || req.headers['Content-Type'] == 'application/x-www-form-urlencoded') {
			req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			req.data = formUrlencode(req.data);
		} else if (typeof req.data === 'object' && req.data) {
			req.data = JSON.stringify(req.data);
		}
	}else{
    delete req.headers['Content-Type'];
  }
	if (req.query && typeof req.query === 'object') {
		var getUrl = formUrlencode(req.query);
		req.url = req.url + '?' + getUrl;
		req.query = '';
	}
	xhr.open(req.method, req.url, req.async);
	var response = {};
	if (req.headers) {
		var unsafeHeaderArr = [];
		for (var name in req.headers) {
			if (unsafeHeader.indexOf(name) > -1) {
				unsafeHeaderArr.push({
					name: name,
					value: req.headers[name]
				})
			} else {
				xhr.setRequestHeader(name, req.headers[name]);
			}
		}
		if (unsafeHeaderArr.length > 0) {
			xhr.setRequestHeader('cross-request-unsafe-headers-list', encode(unsafeHeaderArr));
		}
	}

	xhr.setRequestHeader('cross-request-open-sign', '1')

	xhr.onload = function (e) {
		var headers = xhr.getAllResponseHeaders();
		headers = handleHeader(headers);
		var newHeaders;
		if(headers['cross-response-unsafe-headers-list']){
			newHeaders = decode(headers['cross-response-unsafe-headers-list'])
			delete headers['cross-response-unsafe-headers-list'];
			if(newHeaders && typeof newHeaders === 'object' && Object.keys(newHeaders).length > 0){
					headers = newHeaders;
			}
		}
		response = {
			headers: headers,
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
		errorFn({
			body: xhr.statusText
		})
	};
	xhr.upload.onprogress = function (e) { };

	try {
		xhr.send(req.data);
	} catch (error) {
		errorFn({
			body: error.message
		})
	}
}

chrome.runtime.onConnect.addListener(function (connect) {
	if (connect.name === 'request') {
		connect.onMessage.addListener(function (msg) {
			sendAjax(msg.req, function (res) {
				connect.postMessage({
					id: msg.id,
					res: res
				})
			}, function (err) {
				connect.postMessage({
					id: msg.id,
					res: err
				})
			})
		})
	}
});

function ensureItem(arr, name, value) {
	if (!arr || !Array.isArray(arr)) {
		return arr;
	}
	var find = false;
	arr = arr.map(function (item) {
		if (item.name == name) {
			item.value = value;
			find = true;
		}
		return item;
	})
	if (find === false) {
		arr.push({ name: name, value: value })
	}
	return arr;
}

 function responseListener(details) {
	if (requestBatch[details.requestId] === true) {
		delete requestBatch[details.requestId];
		var unsafeHeaderArr = { cookie: [] };
		var cookie = unsafeHeaderArr.cookie;
		details.responseHeaders.forEach(function (item) {
			if (item.name === 'Set-Cookie') {
				cookie.push(item.value)
			}
			else {
				unsafeHeaderArr[item.name] = item.value;
			}
		})
		details.responseHeaders.push({
			name: 'cross-response-unsafe-headers-list',
			value: encode(unsafeHeaderArr)
		})
	}
	return { responseHeaders: details.responseHeaders }

}

function requestListener (details) {
	var find = false;
	details.requestHeaders.forEach(function (item, index) {
		if (item.name === 'cross-request-open-sign' && item.value == '1') {
			requestBatch[details.requestId] = true;
		}
		if (item.name === 'cross-request-unsafe-headers-list') {
			var val = decode(item.value);
			val.forEach(function (v) {
				details.requestHeaders = ensureItem(details.requestHeaders, v.name, v.value)
			})
		}
	})

	return { requestHeaders: details.requestHeaders };
}

chrome.webRequest.onHeadersReceived.removeListener(responseListener);
chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

chrome.webRequest.onHeadersReceived.addListener(responseListener, {
		urls: ["<all_urls>"]
	}, ['blocking', 'responseHeaders', 'extraHeaders']);

chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {
		urls: ["<all_urls>"]
	}, ['blocking', 'requestHeaders', 'extraHeaders']);


