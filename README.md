### A chrome extension that gives the html page cross-domain request capability.
### 一个赋予html页面跨域请求能力的chrome扩展

https://chrome.google.com/webstore/detail/cross-request/cmnlfmgbjmaciiopcgodlhpiklaghbok?hl=en-US

### Api
crossRequest(OPTIONS)

### Usage
1. GET
```
crossRequest({
    url: 'http://caibaojian.com/ajax-jsonp.html',
    method: 'GET',
    success: function(res, header){

    }
})
```
2. POST
```
    crossRequest({
        url: 'http://127.0.0.1:3000/api',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            a: 1,
            b: 2,
            c: {
                t: 1
            }
        },
        success: function (res) {
            console.log(arguments)
        }
    })
```
3. FILE upload
```
    crossRequest({
        url: 'http://127.0.0.1:8081/upload',
        method: 'POST',
        data: {
            name: 'hello',
            id: '19'
        },
        files: {
            file: 'fileId' //File Upload ElementId
        },
        success: function (res) {
            alert(res)
        }
    })
```