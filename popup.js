function generateHtml(url) {
  return `
        <div class="item">
          <span class="url">${url}</span> 
          <span class="del">✕</span>
        </div>
      `
}


var key = 'y_request_allow_urls';

var urls = chrome.runtime.sendMessage({action:'get', name: key}, function(urls){
  var urlDom = $('#urls');
  try{
    urls = JSON.parse(urls);
  }catch(e){
    urls = null;
  }
  
  if(!urls ||  Object.keys(urls).length === 0){
    urls = { '*': true};
    chrome.runtime.sendMessage({action:'set', name: key, value: JSON.stringify(urls)})
  }

  for (var url in urls) {
    urlDom.append(generateHtml(url));
  }

  $('#add .submit').bind('click', function () {    
    var val = $('#add input').val()
    if (val) urls[val] = true;
    chrome.runtime.sendMessage({
      action:'set',
      name: key,
      value: JSON.stringify(urls)
    })
    
    urlDom.append(generateHtml(val))
  })

  urlDom.on('click', '.del', function (event) {
    var p = event.target.parentNode;
    var url = $(p).find('.url').text();
    delete urls[url]

    chrome.runtime.sendMessage({
      action:'set',
      name: key,
      value: JSON.stringify(urls)
    })
    p.parentNode.removeChild(p)
  })
});
