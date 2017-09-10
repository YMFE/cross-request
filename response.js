/*==============common begin=================*/
var container = 'y-request';
var INITSTATUS = 0;
var RUNSTATUS = 1;
var ENDSTATUS = 2;
var localStorageKey = 'y_request_allow_urls'

function encode(data){
    return window.base64.encode(encodeURIComponent(JSON.stringify(data)));
}

function decode(data){
    return JSON.parse(decodeURIComponent(window.base64.decode(data)));
}
/*==============common end=================*/



function injectJs(path){
    var s = document.createElement('script');
    // TODO: add "script.js" to web_accessible_resources in manifest.json
    s.src = chrome.extension.getURL(path);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

injectJs('base64.js');
injectJs('index.js');

var yRequestDom ;

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

function resFn(res, dom, data) {
    var id = dom.getAttribute("_id");
    var headers = handleHeader(this.getAllResponseHeaders());
    data.res = {
        id: id,
        status: this.status,
        statusText: this.statusText,
        header: headers,
        body: res
    }

    dom.innerText = encode(data);
    dom.setAttribute('status', ENDSTATUS);
}

function formUrlencode(data) {
    return Object.keys(data).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
    }).join('&')
}

function sendAjax(req, successFn, errorFn) {

    var formDatas;
    var xhr = new XMLHttpRequest();

    req.headers = req.headers || {};
    req.headers['Content-Type'] = req.headers['Content-Type'] || req.headers['Content-type'] || req.headers['content-type'] || 'text/plain';// 兼容多种写法

    if (req.files && Object.keys(req.files).length > 0) {
        req.headers['Content-Type'] = 'multipart/form-data'
    }

    xhr.timeout = req.timeout || 5000;

    req.method = req.method || 'GET';
    req.async = req.async === false ? false : true;
    req.headers = req.headers || {};

    if (req.method.toLowerCase() !== 'get' || req.method.toLowerCase() !== 'head' || req.method.toLowerCase() !== 'options') {
        if (!req.headers['Content-Type'] || req.headers['Content-Type'] == 'application/x-www-form-urlencoded') {
            req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            req.data = formUrlencode(req.data);
        } else if (req.headers['Content-Type'] === 'multipart/form-data') {
            delete req.headers['Content-Type'];
            formDatas = new FormData();
            if (req.data) {
                for (var name in req.data) {
                    formDatas.append(name, req.data[name]);
                }
            }
            if (req.files) {
                for (var name in req.files) {
                    var files = document.getElementById(req.files[name]).files;
                    if (files.length > 0) {
                        formDatas.append(name, files[0]);
                    }
                }
            }
            req.data = formDatas;
        } else if (typeof req.data === 'object' && req.data) {
            req.data = JSON.stringify(req.data);
        }
        if(req.file){
            req.data = document.getElementById(req.file).files[0];
        }
    }
    if (req.query && typeof req.query === 'object') {
        var getUrl = formUrlencode(req.query);
        req.url = req.url + '?' + getUrl;
        req.query = '';
    }

    

    xhr.open(req.method, req.url, req.async);

    if (req.headers) {
        for (var name in req.headers) {
            xhr.setRequestHeader(name, req.headers[name]);
        }
    }

    xhr.onload = function (e) {
        if (this.status == 200) {
            successFn.call(xhr, this.responseText);
        } else {
            errorFn.call(xhr, this.responseText)
        }
    };
    xhr.ontimeout = function (e) {
        errorFn.call(xhr, 'Error:Request timeout that the time is ' + xhr.timeout)
    };
    xhr.onerror = function (e) {
        errorFn.call(xhr, xhr.statusText)
    };
    xhr.upload.onprogress = function (e) { };

    try {
        xhr.send(req.data);
    } catch (error) {
        errorFn.call(xhr, error.message)
    }
    

}

function yResponse() {
    var reqsDom = yRequestDom.childNodes;
    if (!reqsDom || reqsDom.length === 0) return;
    reqsDom.forEach(function (dom) {
        try {
            var status = dom.getAttribute("status"), request;

            if (+status === INITSTATUS) {
                dom.setAttribute("status", RUNSTATUS);
                var data = decode(dom.innerText);
                var req = data.req;

                sendAjax(req, function (res) {
                    resFn.bind(this)(res, dom, data);
                }, function (err) {
                    resFn.bind(this)(err, dom, data);
                })
            }
        } catch (error) {
            console.error(error.message)
            dom.parentNode.removeChild(dom)
        }

    })
}

function isAllowHost() {
    chrome.runtime.sendMessage({ action: 'get', name: localStorageKey }, function (res) {
        try {
            try{
                res = JSON.parse(res);
            }catch(e){
                res = null;
            }
            if(!res || Object.keys(res).length === 0){
                res = { '*': true};
                chrome.runtime.sendMessage({action:'set', name: localStorageKey, value: JSON.stringify(res)})
            }
            
            var flag = false;
            for (var name in res) {
                name = name.replace(/\*/, ".*?");
                var nameRegexp = new RegExp(name);
                if (nameRegexp.test(location.hostname)) {
                    flag = true;
                }
            }
            var crossRequestSign = document.getElementById('cross-request-sign');
            if ((flag || crossRequestSign) && yRequestDom) {
                setInterval(function () {
                    yResponse()
                }, 100)
            }
        } catch (e) {
            console.error(e)
        }
    })

}

var findDom = setInterval(function(){
    try{
        yRequestDom = document.getElementById(container);
        if (yRequestDom) {
            clearInterval(findDom)
            yRequestDom.setAttribute('key', 'yapi');
            yRequestDom.setAttribute('v', '1.8');
            isAllowHost();
        }
        
    }catch(e){
        clearInterval(findDom)
        console.error(e)
    }
}, 100)




