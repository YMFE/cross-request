### 一个赋予html页面跨域请求能力的谷歌扩展

### Install
        npm install crossRequest --save

### Example

```
//1. require方式
var crossRequest = require('crossRequest');

crossRequest({
    url: 'http://caibaojian.com/ajax-jsonp.html',
    method: 'GET',
    data: {
        a:1
    },
    success: function(res, header){
        console.log(header)
    }
})

//2. 在页面引用js脚本index.js,可直接使用全局变量 crossRequest
crossRequest({
    url: 'http://caibaojian.com/ajax-jsonp.html',
    method: 'GET',
    data: {
        a:1
    },
    success: function(res, header){
        console.log(header)
    }
})

```