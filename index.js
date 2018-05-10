(function (win) {

    if(!document.getElementById('cross-request-sign')){
        return;
    }

    /*==============common begin=================*/

    var container = 'y-request';
    var INITSTATUS = 0;
    var RUNSTATUS = 1;
    var ENDSTATUS = 2;

    var base64 = _base64();
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
    /*==============common end=================*/


    function createNode(tagName, attributes, parentNode) {
        options = attributes || {};
        tagName = tagName || 'div';
        var dom = document.createElement(tagName);
        for (var attr in attributes) {
            if (attr === 'id') dom.id = options[attr];
            else dom.setAttribute(attr, options[attr]);
        }
        if (parentNode) parentNode.appendChild(dom);
        return dom;
    }

    function getid() {
        return container + '-' + id++;
    }


    var yRequestDom = createNode('div', { id: container, style: 'display:none' }, document.getElementsByTagName('body')[0]);
    var yRequestMap = {};
    var id = 0;
    var interval;


    function run(req) {
        if (!req) return;
        if (typeof req === 'string') req = { url: req }

        data = {
            res: null,
            req: req
        }
        data = encode(data);
        var newId = getid();
        var div = createNode('div', {
            _id: newId,
            status: INITSTATUS
        }, yRequestDom);
        div.innerText = data;
        yRequestMap[newId] = {
            id: newId,
            status: INITSTATUS,
            success: function (res, header, data) {
                if (typeof req.success === 'function') {
                    req.success(res, header, data);
                }
            },
            error: function (error, header, data) {
                if (typeof req.error === 'function') {
                    req.error(error, header, data)
                }
            }
        }
        monitor();
    }



    function monitor() {
        if (interval) return;
        interval = setInterval(function () {
            var queueDom = yRequestDom.childNodes;
            if (!queueDom || queueDom.length === 0) {
                interval = clearInterval(interval);
            }

            try {
                for (var i = 0; i < queueDom.length; i++) {
                    try {
                        var dom = queueDom[i];
                        if (+dom.getAttribute('status') === ENDSTATUS) {
                            var text = dom.innerText;
                            if (text) {
                                var data = decode(dom.innerText);
                                var id = dom.getAttribute('_id');
                                var res = data.res;
                                if (res.status === 200) {
                                    yRequestMap[id].success(res.body, res.header, data);
                                } else {
                                    yRequestMap[id].error(res.statusText, res.header, data);
                                }
                                dom.parentNode.removeChild(dom);
                            } else {
                                dom.parentNode.removeChild(dom);
                            }

                        }
                    } catch (err) {
                        console.error(err.message);
                        dom.parentNode.removeChild(dom);
                    }
                }
            } catch (err) {
                console.error(err.message);
                interval = clearInterval(interval);
            }


        }, 50)
    }

    win.crossRequest = run;
    if (typeof define == 'function' && define.amd) {
        define('crossRequest', [], function () {
            return run;
        });
    }

})(window)

