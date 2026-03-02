const BACKEND_URL = 'http://localhost:8200/collect';

chrome.runtime.onMessage.addListener((msg, sender, sendResp) => {
  try{
    if(!msg) return;
    if(msg.type === 'ping'){ sendResp && sendResp({ ok: true }); }
  }catch(e){}
});

chrome.action.onClicked.addListener((tab) => {
  try{
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content_script.js']
    }).then(() => {
      console.log('SiteAnalytics: injected content script into', tab.id);
    }).catch(err => {
      console.error('SiteAnalytics: injection failed', err);
    });
  }catch(e){
    console.error('SiteAnalytics: action click handler error', e);
  }
});
