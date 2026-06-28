;(function(){
	// Simple tracker for local testing. Sends events to ingestion at localhost:8200
	const SITE_ID = 'example';
	const BASE = 'http://localhost:8200';
	const PATH = '/collect';

	function send(payload){
		const url = BASE.replace(/\/$/, '') + PATH;
		const body = JSON.stringify(payload);
		try{
			if(navigator.sendBeacon){
				const blob = new Blob([body], {type: 'application/json'});
				navigator.sendBeacon(url, blob);
				return;
			}
		}catch(e){}
		// keepalive for page unload; best-effort
		fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body, keepalive: true }).catch(()=>{});
	}

	function getSid(){
		try{
			const m = document.cookie.split('; ').find(c=>c.trim().startsWith('wa_sid='));
			if(m) return m.split('=')[1];
		}catch(e){}
		const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
		try{ document.cookie = 'wa_sid='+sid+'; path=/; max-age=' + (60*60*24*365); }catch(e){}
		return sid;
	}

	const sid = getSid();

	function nowISO(){ return (new Date()).toISOString(); }

	function findTrackedElement(node){
		let current = node;
		while(current && current !== document.body){
			if(current.nodeType === 1){
				if(current.matches && current.matches('a, button, input, label, [role="button"], [data-wa-track]')) return current;
				try{
					if(window.getComputedStyle(current).cursor === 'pointer') return current;
				}catch(e){}
			}
			current = current.parentElement;
		}
		return null;
	}

	// one physical click -> one event, so use pointerup and ignore synthetic click/keyboard cascades
	document.addEventListener('pointerup', function(ev){
		try{
			if(!ev.isTrusted) return;
			const target = findTrackedElement(ev.target);
			if(!target) return;
			const href = target.getAttribute && target.getAttribute('href') ? target.getAttribute('href') : null;
			const targetPath = href ? (href.startsWith('http') ? new URL(href).pathname : href) : location.pathname;
			send({
				site_id: SITE_ID,
				path: targetPath,
				url: href ? (href.startsWith('http') ? href : location.origin + href) : location.href,
				referrer: location.href,
				user_agent: navigator.userAgent || null,
				ip: null,
				timestamp: nowISO(),
				session_id: sid,
				event_type: 'click',
				properties: { text: target.textContent || '', tag: target.tagName || '' }
			});
		}catch(e){}
	}, true);

})();
