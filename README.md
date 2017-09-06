### 一个赋予html页面跨域请求能力的chrome扩展
扩展地址： https://chrome.google.com/webstore/detail/cross-request/cmnlfmgbjmaciiopcgodlhpiklaghbok?hl=en-US
### Install
        npm install cross-request --save
        安装chrome扩展 cross-request
### Demo

```
//1. require方式
var crossRequest = require('cross-request');

crossRequest({
    url: 'http://caibaojian.com/ajax-jsonp.html',
    method: 'GET',
    success: function(res, header){
        console.log(header)
    }
})

//2. 在页面引用js脚本index.js,可直接使用全局变量 crossRequest
crossRequest({
    url: 'http://caibaojian.com/ajax-jsonp.html',
    method: 'POST',
    data: {
        a:1
    },
    success: function(res, header){
        console.log(header)
    }
})

//3. html 页面测试用例
<html>

<body>
    <h1>CrossRequest</h1>
     <input id="file" type="file" name="file" />
     <button id="upload">upload</button>
    <script src="index.js"></script>

    <script>
        crossRequest({
            url: 'http://caibaojian.com/ajax-jsonp.html',
            method: 'GET',
            success: function(res, header){
                console.log(header)
            }
        })


        //test get
        crossRequest({
            url: 'http://127.0.0.1:3000/api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                a: 1,
                b:2,
                c: {
                    t:1
                }
            },
            success: function(res){
                console.log(arguments)
            }
        })

        //test error get
        crossRequest({
            url: 'http://127.0.0.1:3000/error_get',
            method: 'GET',
            error: function(err, header){
                console.log(err)
            }
        })

        //test upload
        var file = document.getElementById('file');
        document.getElementById('upload').addEventListener('click', function(){
            crossRequest({
                url: 'http://127.0.0.1:3000/upload',
                method: 'POST',
                data: {
                    name: 'hello',
                    id: '19'
                },
                files: {
                    file: 'file'
                },
                success: function(res){
                    alert(res)
                }
            })
        })
        

    </script>

   
</body>

</html>

```