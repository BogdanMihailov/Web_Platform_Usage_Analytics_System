import React, {useEffect, useState} from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

async function api(path: string, opts: any = {}){
  try{
    const API_BASE = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname}:8000`;
    const res = await fetch(`${API_BASE}${path}`, opts)
    if(!res.ok){
      const text = await res.text().catch(()=>null)
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    try{ return await res.json() }catch(e){ return null }
  }catch(e:any){ console.error('API error', e); throw e }
}


function Dashboard() {
  // simple localStorage helpers
  const lsGet = (k: string) => { try { return window.localStorage.getItem(k); } catch(e){ return null } }
  const lsSet = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch(e){} }

  const [site, setSite] = useState<string>(() => lsGet('site') || "");
  const [days, setDays] = useState<number>(() => { const v = lsGet('days'); return v ? Number(v) : 1 });
  const [timezone, setTimezone] = useState<string>(() => lsGet('timezone') || 'Local');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {
      overviewMetrics: false,
      topPages: true,
      peakHours: false,
      referrers: true,
      campaigns: true,
      browsers: true,
      sessions: true,
    };
    try {
      const s = lsGet('collapsed');
      if (s) return JSON.parse(s);
      return defaults;
    } catch (e) {
      return defaults;
    }
  });
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(() => {
    try{ const s = lsGet('sectionsOrder'); return s ? JSON.parse(s) : ['overviewMetrics','peakHours','topPages','referrers','campaigns','browsers','sessions'] }catch(e){ return ['overviewMetrics','peakHours','topPages','referrers','campaigns','browsers','sessions'] }
  });
  const [topPages, setTopPages] = useState<any[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [overview, setOverview] = useState<any | null>(null);
  const [referrers, setReferrers] = useState<any[]>([]);
  const [browsers, setBrowsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [format, setFormat] = useState<string>(() => lsGet('format') || 'csv');
  const [exporting, setExporting] = useState<boolean>(false);

  // persist selected values to localStorage
  useEffect(()=>{ lsSet('site', site || ''); }, [site]);
  useEffect(()=>{ lsSet('days', String(days)); }, [days]);
  useEffect(()=>{ lsSet('timezone', timezone); }, [timezone]);
  useEffect(()=>{ lsSet('format', format); }, [format]);
  useEffect(()=>{ try{ lsSet('collapsed', JSON.stringify(collapsed)) }catch(e){} }, [collapsed]);
  useEffect(()=>{ try{ lsSet('sectionsOrder', JSON.stringify(sectionsOrder)) }catch(e){} }, [sectionsOrder]);

  // Ref to hold debounce timer id for site input changes
  const siteChangeTimerRef = React.useRef<number | null>(null);
  // Ref to hold latest site value so WS messages and debounced loader use current site
  const latestSiteRef = React.useRef<string>(site);

  // Debounced site change handler: update state and schedule load
  function handleSiteChange(newSite: string){
    const trimmed = (newSite || '').trim();
    setSite(newSite);
    latestSiteRef.current = newSite;
    // If site is empty, clear UI immediately and don't schedule API loads
    if(!trimmed){
      if(siteChangeTimerRef.current) window.clearTimeout(siteChangeTimerRef.current);
      siteChangeTimerRef.current = null;
      setTopPages([]);
      setHours([]);
      setOverview(null);
      setReferrers([]);
      setBrowsers([]);
      setSessions(null);
      setCampaigns([]);
      return;
    }

    if(siteChangeTimerRef.current) window.clearTimeout(siteChangeTimerRef.current);
    siteChangeTimerRef.current = window.setTimeout(()=>{
      try{ load({site: latestSiteRef.current}); }catch(e){}
      siteChangeTimerRef.current = null;
    }, 350);
  }

  // Cleanup timer on unmount
  useEffect(() => { return () => { if(siteChangeTimerRef.current) window.clearTimeout(siteChangeTimerRef.current); } }, []);

  async function load(overrides?: {site?:string, days?:number, timezone?:string}) {
    setError(null);
    try {
      const useDays = overrides?.days ?? days;
      const useSite = overrides?.site ?? site;
      const [tp, ph, ov, rf, br, ss, cp] = await Promise.all([
        api(`/api/analytics/top-pages?days=${useDays}&limit=10&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/peak-hours?days=${useDays}&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/overview?days=${useDays}&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/referrers?days=${useDays}&limit=10&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/browsers?days=${useDays}&limit=10&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/sessions?days=${useDays}&site_id=${encodeURIComponent(useSite)}`),
        api(`/api/analytics/campaigns?days=${useDays}&limit=10&site_id=${encodeURIComponent(useSite)}`),
      ]);
      setTopPages(tp || []);
      
      try{
        if (Array.isArray(ph) && ph.length > 0 && typeof ph[0] === 'object'){
          const arr = new Array(24).fill(0);
          (ph as any[]).forEach((it:any)=>{
            const h = Number(it.hour);
            const v = Number(it.views || 0);
            if (!Number.isNaN(h) && h>=0 && h<24) arr[h]=v;
          })
          setHours(arr);
        } else {
          setHours((ph as any) || []);
        }
      }catch(e){ setHours([]) }
      setOverview(ov || null);
      setReferrers(rf || []);
      setBrowsers(br || []);
      setSessions(ss || null);
  setCampaigns(cp || []);
    } catch (e: any) {
      setError(String(e));
    }
  }

  // On mount, load only if a site is present (prevent loading metrics for empty site)
  useEffect(() => { if((site||'').trim()) load();
    // read token from query string on initial load (frontend receives token from auth redirect)
    try{
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if(t){ window.localStorage.setItem('auth_token', t); // store for frontend usage
        // remove token from url for cleanliness
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
    }catch(e){}
  }, []);

  // keep latestSiteRef in sync with site changes (covers programmatic setSite and localStorage init)
  useEffect(() => { latestSiteRef.current = site; }, [site]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try{
      const envHost = (import.meta as any).env?.VITE_REALTIME_HOST;
      const host = envHost || window.location.hostname || 'localhost';
      const normalizedHost = (host === '0.0.0.0' || host === '') ? 'localhost' : host;
      const url = `ws://${normalizedHost}:8700/ws`;
      ws = new WebSocket(url);
      // Call load immediately on each WS message (no debounce)
      ws.onmessage = (ev) => { try{ if((latestSiteRef.current||'').trim()) load({site: latestSiteRef.current}); }catch(e){} }
      ws.onopen = () => { console.info('Realtime WS connected', url); setWsConnected(true); }
      ws.onclose = () => { console.info('Realtime WS closed'); setWsConnected(false); }
      ws.onerror = (e) => { console.warn('Realtime WS error', e); setWsConnected(false); }
    }catch(e){ console.warn('Failed to connect realtime ws', e) }
    return () => { if(ws) try{ ws.close() }catch(e){} }
  }, []);

  

  function toggleSection(key: string){
    setCollapsed(prev => ({...prev, [key]: !prev[key]}));
  }

  function formatMetric(value:any, opts: {allowZero?: boolean, strong?: boolean, unit?:string} = {}){
    const allowZero = !!opts.allowZero;
    const strong = !!opts.strong;
    const unit = opts.unit;
    if (value === undefined || value === null) return strong ? <span className="dash-strong">-</span> : <span className="dash">—</span>;
    if (!allowZero && Number(value) === 0) return strong ? <span className="dash-strong">-</span> : <span className="dash-inline">-</span>;
    return unit ? <span>{`${value} ${unit}`}</span> : <span>{value}</span>;
  }

  // return true when there's any metric data shown in the UI
  function hasMetrics(){
    try{
      if (overview && Number(overview.total_views || 0) > 0) return true;
      if (topPages && topPages.length > 0) return true;
      if (hours && hours.length > 0 && hours.reduce((s,n)=>s+(Number(n)||0),0) > 0) return true;
      if (referrers && referrers.length > 0) return true;
      if (browsers && browsers.length > 0) return true;
      if (campaigns && campaigns.length > 0) return true;
      if (sessions && ((sessions.top_sessions && sessions.top_sessions.length>0) || Number(sessions.avg_events_per_session || 0) > 0)) return true;
    }catch(e){}
    return false;
  }

  

  function onDragStart(e: React.DragEvent, key: string){
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDrop(e: React.DragEvent, targetKey: string){
    e.preventDefault();
    const srcKey = e.dataTransfer.getData('text/plain');
    if(!srcKey || srcKey === targetKey) return;
    setSectionsOrder(prev => {
      const next = prev.filter(k=>k!==srcKey);
      const idx = next.indexOf(targetKey);
      if(idx === -1) next.push(srcKey);
      else next.splice(idx, 0, srcKey);
      return next;
    });
  }

  function onDragOver(e: React.DragEvent){ e.preventDefault(); }

  function renderSection(key: string){
    switch(key){
      case 'overviewMetrics': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('overviewMetrics')}>
            <div className="heading">Overview</div>
            <div style={{flex:1}} />
            <div style={{opacity:0.6}}>{collapsed.overviewMetrics ? '▸' : '▾'}</div>
          </div>
          {!collapsed.overviewMetrics && (
            <div className="metrics">
              <div className="metric"><div className="k">Total Views</div><div className="v">{formatMetric(overview ? overview.total_views : undefined, {strong:true})}</div></div>
              <div className="metric"><div className="k">Unique Pages</div><div className="v">{formatMetric(overview ? overview.unique_pages : undefined, {strong:true})}</div></div>
              <div className="metric"><div className="k">Unique Sessions</div><div className="v">{formatMetric(overview ? overview.unique_sessions : undefined, {strong:true})}</div></div>
              <div className="metric"><div className="k">Avg. Session Duration</div><div className="v">{formatMetric(overview ? overview.avg_session_duration : undefined, {strong:true, unit:'s'})}</div></div>
              <div className="metric"><div className="k">Avg. Views per Session</div><div className="v">{formatMetric(overview ? overview.avg_views_per_session : undefined, {strong:true})}</div></div>
              <div className="metric"><div className="k">Bounce Rate</div><div className="v">{formatMetric(overview ? overview.bounce_rate_percent : undefined, {strong:true, unit:'%'})}</div></div>
            </div>
          )}
        </div>
      );
      case 'topPages': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('topPages')}>
            <div className="heading">Top Pages</div>
            <div style={{opacity:0.6}}>{collapsed.topPages ? '▸' : '▾'}</div>
          </div>
          {!collapsed.topPages && (
            <div style={{marginTop:12}}>
              {topPages.length===0 && <div className="no-data">No data</div>}
              {topPages.map((p:any, idx:number)=> {
                const max = topPages[0]?.views || 1;
                const w = Math.round((p.views / max) * 100);
                return (
                  <div key={p.path} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}} className="body">
                    <div style={{flex:1,fontSize:13}}>{p.path}</div>
                    <div style={{width:160,background:'#f1f5f9',borderRadius:6,height:18,overflow:'hidden'}}>
                      <div style={{width:`${w}%`,height:'100%',background:'#60a5fa'}}></div>
                    </div>
                    <div className="num-right body">{p.views}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      );
      case 'peakHours': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('peakHours')}>
            <div className="heading">Peak Hours</div>
            <div style={{opacity:0.6}}>{collapsed.peakHours ? '▸' : '▾'}</div>
          </div>
          {!collapsed.peakHours && (() => {
            let displayHours = hours;
            if (timezone === 'Local' && hours && hours.length === 24){
              const offsetMinutes = new Date().getTimezoneOffset();
              const offsetHours = -Math.round(offsetMinutes/60);
              displayHours = new Array(24).fill(0);
              for (let utc=0; utc<24; utc++){
                const local = (utc + offsetHours + 24) % 24;
                displayHours[local] = hours[utc];
              }
            }
            const arr = displayHours || [];
            const total = arr.reduce((s,n) => s + (Number(n)||0), 0);
            if (!arr || arr.length === 0 || total === 0) {
              return <div style={{marginTop:12}}><div className="no-data">No data</div></div>
            }
            const max = Math.max(...arr.map(h => Number(h)||0), 1);
            const logScale = (n:number) => { if(!n) return 0; return Math.log10(n+1)/Math.log10(max+1) }
            return (
              <div style={{display:'flex',gap:8,marginTop:8,alignItems:'flex-end'}}>
                {arr.map((v:number,i:number)=>{
                  const cnt = Number(v)||0;
                  const hFrac = logScale(cnt);
                  const height = Math.max(4, Math.round(hFrac * 160));
                  return (
                    <div key={i} style={{flex:1,textAlign:'center'}}>
                      <div className="peak-bar" style={{height: height}}>
                        {height>40 && <div style={{color:'white',fontSize:11,paddingBottom:4}}>{cnt}</div>}
                      </div>
                      <div style={{fontSize:12,marginTop:6}}>{String(i).padStart(2,'0')}:00</div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      );
      case 'referrers': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('referrers')}>
            <div className="heading">Referrers</div>
            <div style={{opacity:0.6}}>{collapsed.referrers ? '▸' : '▾'}</div>
          </div>
          {!collapsed.referrers && (
            <table style={{width:'100%',marginTop:8}}>
              <thead><tr><th className="subheading">Referrer</th><th className="subheading" style={{width:120}}>Views</th></tr></thead>
              <tbody>
                {referrers.length===0 && <tr><td colSpan={2} className="no-data">No data</td></tr>}
                {referrers.map((r:any, idx:number)=> <tr key={idx}><td className="body">{r.referrer}</td><td className="num-right body">{r.count}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      );
      case 'campaigns': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('campaigns')}>
            <div className="heading">Campaigns</div>
            <div style={{opacity:0.6}}>{collapsed.campaigns ? '▸' : '▾'}</div>
          </div>
          {!collapsed.campaigns && (
            <div style={{marginTop:8}}>
              {campaigns.length===0 && <div className="no-data">No data</div>}
              {campaigns.map((c:any, idx:number)=> {
                const max = campaigns[0]?.count || 1;
                const w = Math.round((c.count / max) * 100);
                return (
                  <div key={idx} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}} className="body">
                    <div style={{flex:1,fontSize:13}}>{c.campaign}</div>
                    <div style={{width:160,background:'#f1f5f9',borderRadius:6,height:14,overflow:'hidden'}}>
                      <div style={{width:`${w}%`,height:'100%',background:'#34d399'}}></div>
                    </div>
                    <div className="num-right body">{c.count}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      );
      case 'browsers': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('browsers')}>
            <div className="heading">Browsers</div>
            <div style={{opacity:0.6}}>{collapsed.browsers ? '▸' : '▾'}</div>
          </div>
          {!collapsed.browsers && (
            <table style={{width:'100%',marginTop:8}}>
              <thead><tr><th className="subheading">Browser</th><th className="subheading" style={{width:120}}>Count</th></tr></thead>
              <tbody>
                {browsers.length===0 && <tr><td colSpan={2} className="no-data">No data</td></tr>}
                {browsers.map((b:any, idx:number)=> <tr key={idx}><td className="body">{b.browser}</td><td className="num-right body">{b.count}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      );
      case 'sessions': return (
        <div className="card" style={{marginTop:16}} key={key} draggable onDragStart={(e)=>onDragStart(e,key)} onDragOver={onDragOver} onDrop={(e)=>onDrop(e,key)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'grab'}} onClick={()=>toggleSection('sessions')}>
            <div className="heading">Sessions (Top 50)</div>
            <div style={{opacity:0.6}}>{collapsed.sessions ? '▸' : '▾'}</div>
          </div>
          {!collapsed.sessions && (
            <div>
              <div style={{fontSize:12,marginTop:8}}>Avg. events per session: {formatMetric(sessions ? sessions.avg_events_per_session : undefined, {strong:false})}</div>
              <table style={{width:'100%',marginTop:8}}>
                <thead><tr><th className="subheading">Session ID</th><th className="subheading" style={{width:120}}>Events</th><th className="subheading" style={{width:120}}>Unique pages</th></tr></thead>
                <tbody>
                  {sessions && sessions.top_sessions.length===0 && <tr><td colSpan={3} className="no-data">No data</td></tr>}
                  {sessions && sessions.top_sessions.map((s:any, idx:number)=> <tr key={idx}><td className="body" style={{fontSize:12}}>{String(s.session_id).slice(0,12)}</td><td className="num-right body">{s.events}</td><td className="num-right body">{s.unique_pages}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  }

  return (
    <div className="container">
      {}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>Website Analytics Dashboard</h1>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn" onClick={()=>setShowHelp(true)}>Help</button>
          <button className="btn" onClick={()=>{ window.localStorage.removeItem('auth_token'); window.location.href = 'http://localhost:8400'; }}>Logout</button>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="controls">
          <div className="site-label">Site:</div>
          <input
            className="site-input"
            value={site}
            onChange={e=>handleSiteChange(e.target.value)}
            onKeyDown={(e:any)=>{
              if(e.key === 'Enter'){
                const v = (e.currentTarget?.value || '').trim();
                setSite(v);
                try{ load({site: v}); }catch(_){}
              }
            }}
            placeholder="site ID" />

          <div className="period-label">Period:</div>
          <select value={days} onChange={e=>{ const v = Number(e.target.value); setDays(v); load({days:v}); }}>
            <option value={1}>Last 1 day</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>

          {/* Move Timezone left, next to Period */}
          <label className="timezone-label" style={{marginLeft:0}}>Timezone:</label>
          <select value={timezone} onChange={e=>setTimezone(e.target.value)}>
            <option value="UTC">UTC</option>
            <option value="Local">Local</option>
          </select>

          <div style={{marginLeft:'auto', display:'flex', alignItems:'center'}}>
            <div className="realtime-label">
              <div>Realtime:</div>
              <div className={wsConnected ? 'status-connected' : 'status-disconnected'}>{wsConnected ? ' connected' : ' disconnected'}</div>
            </div>
          </div>

            {/* Lower row: Format + Clear site data */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4, width: '100%'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <label className="timezone-label">Format:</label>
                <select value={format} onChange={e=>setFormat(e.target.value)}>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                <button className="btn" style={{marginLeft:6}} disabled={exporting} onClick={async ()=>{
                  const siteId = (site || '').trim();
                  if(!siteId) { alert('Please enter site id'); return; }
                  // do not proceed if there are no metrics to export
                  if(!hasMetrics()) { alert('No metrics to export'); return; }
                  try{
                    setExporting(true);
                    const host = window.location.hostname || 'localhost';
                    const url = `http://${host}:8600/export/events?site_id=${encodeURIComponent(site)}&format=${encodeURIComponent(format)}`;
                    const res = await fetch(url);
                    if(!res.ok) throw new Error(`HTTP ${res.status}`);
                    const blob = await res.blob();
                    const disp = res.headers.get('content-disposition') || '';
                    let filename = `events_${site}.${format}`;
                    const m = /filename=(?:"?)([^";]+)/i.exec(disp);
                    if(m && m[1]) filename = m[1].replace(/"/g,'');
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(link.href);
                  }catch(e){
                    console.error('Export failed', e);
                    alert('Export failed: '+String(e));
                  }finally{ setExporting(false) }
                }} >Export</button>
              </div>

              <div style={{marginLeft:'auto'}}>
                <button
                  className="btn btn--danger"
                  disabled={false}
                  onClick={async ()=>{
                    const siteId = (site || '').trim();
                    if(!siteId) { alert('Please enter site id'); return; }
                    // If there are no metrics, don't attempt clear and inform the user
                    if(!hasMetrics()){ alert('No metrics to clear'); return; }
                    if(!confirm(`Clear all data for site "${siteId}"? This cannot be undone.`)) return;
                    try{
                      const res = await api('/api/admin/clear-site', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({site_id: siteId})});
                      console.info('clear-site', res);
                      // Clear frontend state so UI shows no data for this site
                      setTopPages([]);
                      setHours([]);
                      setOverview(null);
                      setReferrers([]);
                      setBrowsers([]);
                      setSessions(null);
                      setCampaigns([]);
                    }catch(e){
                      console.error('clear-site failed', e);
                      alert('Clear failed: '+String(e));
                    }
                  }}
                >Clear site data</button>
              </div>
            </div>
        </div>
        {error && <div style={{color:'red',marginTop:8}}>Error: {error}</div>}
      </div>

      {sectionsOrder.map(k=> renderSection(k))}
      {showHelp && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}} onClick={()=>setShowHelp(false)}>
          <div style={{background:'white',padding:20,borderRadius:8,maxWidth:900,width:'90%',maxHeight:'80%',overflow:'auto'}} onClick={(e)=>e.stopPropagation()}>
            <h2>Help — Metrics Explained</h2>
            <p>Below are short explanations of the metrics shown in the dashboard. If you're new to analytics, start with the "Overview" section — it contains the key indicators.</p>
            <h3>Overview</h3>
            <ul>
              <li><strong>Total Views</strong> — total number of page views during the selected period.</li>
              <li><strong>Unique Pages</strong> — count of distinct page paths visited by users.</li>
              <li><strong>Unique Sessions</strong> — number of distinct sessions (determined by session_id).</li>
              <li><strong>Avg. Session Duration</strong> — average duration of user sessions in seconds, computed as the difference between the first and last event timestamps for each session. Sessions without timestamps or with a single event contribute 0 seconds to this average.</li>
              <li><strong>Avg. Views per Session</strong> — average number of page view events per session (total views divided by unique sessions).</li>
              <li><strong>Bounce Rate</strong> — percent of sessions that had only a single event (often indicates users left after viewing one page).</li>
            </ul>

            <h3>Top Pages</h3>
            <p>Shows the pages with the highest number of views. Note: query parameters (including UTM tags) are stripped from URLs for accurate aggregation.</p>

            <h3>Peak Hours (UTC)</h3>
            <p>Histogram of page views by hour (UTC). Use this to identify when your site receives the most traffic.</p>

            <h3>Referrers &amp; Campaigns</h3>
            <p><strong>Referrers</strong> — the referring sites or sources visitors came from ("(direct)" means no referrer). <strong>Campaigns</strong> — UTM campaign labels extracted from incoming URLs when present.</p>

            <h3>Browsers</h3>
            <p>Counts grouped by major browser families (Chrome, Firefox, Safari, Edge, Other). Useful for prioritizing compatibility testing.</p>

            <h3>Sessions</h3>
            <p>Shows average events per session and a list of top sessions by event count. Use this to analyze visitor engagement and find sessions with many interactions.</p>

            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
              <button className="btn" onClick={()=>setShowHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />)
