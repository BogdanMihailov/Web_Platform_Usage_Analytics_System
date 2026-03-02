(function(){
  try{ if (window.top !== window) return; }catch(e){ return; }
  if (window.__sa_installed) return; window.__sa_installed = true;

  function findTrack(el){
    while(el && el !== document){
      if(el.dataset && el.dataset.saTrack) return {name: el.dataset.saTrack, el};
      el = el.parentElement;
    }
    return null;
  }

  var __sa_session = null;
  function getSession(){
    if(__sa_session) return __sa_session;
    try{
      var s = localStorage.getItem('sa_session_id');
      if(s) { __sa_session = s; return s; }
    }catch(e){}
    var sid = 's_' + Math.random().toString(36).slice(2,12) + Date.now().toString(36).slice(-4);
    try{ localStorage.setItem('sa_session_id', sid); }catch(e){}
    __sa_session = sid;
    return sid;
  }

  const AUTO_SELECTORS = ['[role="tab"]','.tab','.tabs__item','.nav-item','.menu-item','a[href^="#"]','button'];
  function matchesAutoSelector(el){
    if(!el || el === document) return false;
    try{ return AUTO_SELECTORS.some(s => el.matches && el.matches(s)); }catch(e){ return false }
  }

  function normalizeHref(href){
    try{ return new URL(href, location.href).href; }catch(e){ return null }
  }

  function recordRecentClick(url, href){
    try{
      if(!window.__sa_recent_clicks) window.__sa_recent_clicks = {};
      var now = Date.now();
      window.__sa_recent_clicks[url] = now;
      window.__sa_last_click_ts = now;
      if(href){
        var resolved = normalizeHref(href);
        if(resolved) window.__sa_recent_clicks[resolved] = now;
        try{ var u = new URL(resolved); var pk = (u.pathname||'') + (u.hash||''); if(pk) window.__sa_recent_clicks[pk] = now; if(u.hash) window.__sa_recent_clicks[u.hash] = now; }catch(e){}
      }
    }catch(e){}
  }

  function sendPayload(payload){
    try{
      if(!window.__sa_last_sent) window.__sa_last_sent = {};
      var textFrag = (payload.properties && payload.properties.text) ? (payload.properties.text||'').slice(0,40) : '';
      var sig = [payload.site_id, payload.url, payload.path, payload.event_type, (payload.properties && payload.properties.id) || '', payload.session_id || '', textFrag].join('|');
      var now = Date.now();
      var prev = window.__sa_last_sent[sig] || 0;
      if(prev && (now - prev) < 1000) return;
      window.__sa_last_sent[sig] = now;
      payload.session_id = payload.session_id || getSession();
      fetch('http://localhost:8200/collect', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive: true }).catch(()=>{});
    }catch(e){}
  }

  document.addEventListener('click', function(e){
    try{
      if(e && e.__sa_handled) return; if(e) e.__sa_handled = true;
      var t = findTrack(e.target);
      var trackName = null; var el = null;
      if(t){ trackName = t.name; el = t.el; }
      else {
        var cur = e.target;
        while(cur && cur !== document){ if(matchesAutoSelector(cur)){ el = cur; trackName = 'auto_click'; break; } cur = cur.parentElement; }
      }
      if(!el || !trackName) return;
      var href = (el.getAttribute && el.getAttribute('href')) || null;
      var payload = {
        site_id: window.location.hostname,
        url: location.href,
        path: location.pathname,
        user_agent: navigator.userAgent,
        session_id: getSession(),
        event_type: trackName,
        properties: { text: (el.innerText||'').slice(0,200), id: el.id || null, classes: el.className || null, href: href || null },
        timestamp: new Date().toISOString()
      };
      recordRecentClick(payload.url, href);
      sendPayload(payload);
    }catch(e){}
  }, true);

  (function(){
    var SA_ROUTE_IGNORE_WINDOW = 1000;
    if(!window.__sa_recent_clicks) window.__sa_recent_clicks = {};
    function safeSendTrack(){
      var url = location.href;
      var now = Date.now();
      try{ var lastAny = window.__sa_last_click_ts || 0; if(lastAny && (now - lastAny) < SA_ROUTE_IGNORE_WINDOW) return; }catch(e){}
      try{
        var lastClick = window.__sa_recent_clicks[url] || 0;
        var u = new URL(url); var pk = (u.pathname||'') + (u.hash||''); var hk = u.hash || '';
        if(!lastClick) lastClick = window.__sa_recent_clicks[pk] || 0;
        if(!lastClick && hk) lastClick = window.__sa_recent_clicks[hk] || 0;
        if(lastClick && (now - lastClick) < SA_ROUTE_IGNORE_WINDOW) return;
      }catch(e){}
      sendPayload({ site_id: window.location.hostname, url: url, path: location.pathname, event_type: 'route_change', properties: null, timestamp: new Date().toISOString() });
    }
    var _push = history.pushState;
    history.pushState = function(){ _push.apply(this, arguments); safeSendTrack(); };
    window.addEventListener('popstate', safeSendTrack);
  })();

})();