import React, {useEffect, useState} from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { AdminPanel } from './AdminPanel'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

// Suppress React DevTools message in development
try { (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__!.isDisabled = true; } catch(e) {}

async function api(path: string, opts: any = {}){
  try{
    const API_BASE = (import.meta as any).env?.VITE_API_URL || `http://${window.location.hostname}:8000`;
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...opts })
    if(!res.ok){
      const text = await res.text().catch(()=>null)
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    try{ return await res.json() }catch(e){ return null }
  }catch(e:any){ console.error('API error', e); throw e }
}

const AUTH_BASE = (import.meta as any).env?.VITE_AUTH_URL || `http://${window.location.hostname}:8400`;

async function authRequest(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text().catch(() => '');
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (e) {
    parsed = null;
  }
  if (!res.ok) {
    const detail = parsed?.detail;
    const details = Array.isArray(detail?.errors) ? detail.errors.filter(Boolean) : [];
    const message = typeof parsed?.detail === 'string'
      ? parsed.detail
      : typeof detail?.message === 'string'
        ? (details.length ? `${detail.message}: ${details.join('; ')}` : detail.message)
        : text || `HTTP ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    error.payload = parsed;
    throw error;
  }
  return parsed;
}

function extractAuthError(error: any): string {
  const raw = error?.message || String(error || '');
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.detail === 'string') return parsed.detail;
    if (typeof parsed?.detail?.message === 'string') {
      const errors = Array.isArray(parsed?.detail?.errors) ? parsed.detail.errors.filter(Boolean) : [];
      return errors.length ? `${parsed.detail.message}: ${errors.join('; ')}` : parsed.detail.message;
    }
  } catch (e) {}
  return raw;
}

function getPasswordHints(password: string): string[] {
  const value = password || '';
  return [
    'Минимум 8 символов',
    'Хотя бы одна заглавная буква',
    'Хотя бы одна строчная буква',
    'Хотя бы одна цифра',
    'Хотя бы один специальный символ',
  ].filter((hint) => {
    if (hint === 'Минимум 8 символов') return value.length < 8;
    if (hint === 'Хотя бы одна заглавная буква') return !/[A-ZА-Я]/.test(value);
    if (hint === 'Хотя бы одна строчная буква') return !/[a-zа-я]/.test(value);
    if (hint === 'Хотя бы одна цифра') return !/\d/.test(value);
    if (hint === 'Хотя бы один специальный символ') return !/[^A-Za-zА-Яа-я0-9]/.test(value);
    return false;
  });
}

function getPasswordRequirements(password: string) {
  const value = password || '';
  return [
    { text: 'Минимум 8 символов', met: value.length >= 8 },
    { text: 'Хотя бы одна заглавная буква', met: /[A-ZА-Я]/.test(value) },
    { text: 'Хотя бы одна строчная буква', met: /[a-zа-я]/.test(value) },
    { text: 'Хотя бы одна цифра', met: /\d/.test(value) },
    { text: 'Хотя бы один специальный символ', met: /[^A-Za-zА-Яа-я0-9]/.test(value) },
  ];
}


function Dashboard() {
  // simple localStorage helpers
  const lsGet = (k: string) => { try { return window.localStorage.getItem(k); } catch(e){ return null } }
  const lsSet = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch(e){} }

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(() => lsGet('auth_token'));
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginBusy, setLoginBusy] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerUsername, setRegisterUsername] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('');
  const [registerBusy, setRegisterBusy] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotBusy, setForgotBusy] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [pendingResetToken, setPendingResetToken] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [resetBusy, setResetBusy] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  

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
  const [showAdmin, setShowAdmin] = useState<boolean>(() => lsGet('showAdmin') === '1');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [format, setFormat] = useState<string>(() => lsGet('format') || 'csv');
  const [exporting, setExporting] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [demoCount, setDemoCount] = useState<number>(200);
  const generatingAbortRef = React.useRef<AbortController | null>(null);
  const isAdmin = !!(currentUser && (currentUser.is_admin || currentUser.role === 'admin'));
  const inAdminPanel = isAdmin && showAdmin;

  async function fetchCurrentUser(token: string){
    const res = await fetch(`${AUTH_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if(!res.ok){
      const text = await res.text().catch(()=>null);
      throw new Error(text || `HTTP ${res.status}`);
    }
    return await res.json();
  }

  function formatLoginError(errorMessage: string): string {
    if (!errorMessage) return '';
    try {
      const parsed = JSON.parse(errorMessage);
      if (typeof parsed?.detail === 'string') {
        errorMessage = parsed.detail;
      } else if (typeof parsed?.detail?.message === 'string') {
        const details = Array.isArray(parsed?.detail?.errors) ? parsed.detail.errors.filter(Boolean) : [];
        errorMessage = details.length ? `${parsed.detail.message}: ${details.join('; ')}` : parsed.detail.message;
      }
    } catch (e) {
    }

    const lower = errorMessage.toLowerCase();
    if (lower.includes('invalid credentials') || lower.includes('invalid') || lower.includes('unauthorized')) {
      return 'Неверный логин или пароль';
    }
    if (lower.includes('blocked') || lower.includes('заблокирован')) {
      return 'Ваш аккаунт заблокирован';
    }
    if (lower.includes('email not verified') || lower.includes('verify your email')) {
      return 'Электронная почта не подтверждена';
    }
    if (lower.includes('too many login attempts')) {
      return 'Слишком много попыток входа. Попробуйте позже';
    }
    if (lower.includes('weak password')) {
      return 'Пароль не соответствует требованиям';
    }
    if (lower.includes('missing auth') || lower.includes('no token')) {
      return 'Требуется авторизация';
    }
    return errorMessage;
  }

  async function handleRegister(e: React.FormEvent){
    e.preventDefault();
    setRegisterError(null);
    setRegisterMessage(null);
    setAuthNotice(null);
    setRegisterBusy(true);
    try{
      const username = registerUsername.trim();
      const email = registerEmail.trim();
      if(!username || !email || !registerPassword || !registerConfirmPassword){
        throw new Error('Заполните все поля регистрации');
      }
      if(registerPassword !== registerConfirmPassword){
        throw new Error('Пароли не совпадают');
      }
      const data = await authRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password: registerPassword }),
      });
      const message = data?.message || 'Регистрация завершена. Проверьте почту.';
      setRegisterMessage(message);
      setAuthNotice(message);
      setAuthMode('login');
      setLoginUsername(username);
      setLoginPassword('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
    }catch(err:any){
      setRegisterError(extractAuthError(err));
    }finally{
      setRegisterBusy(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent){
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotBusy(true);
    try{
      const email = forgotEmail.trim();
      if(!email){
        throw new Error('Введите email');
      }
      const data = await authRequest('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setForgotMessage(data?.message || 'Если аккаунт найден, письмо отправлено.');
    }catch(err:any){
      setForgotError(extractAuthError(err));
    }finally{
      setForgotBusy(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent){
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetBusy(true);
    try{
      if(!pendingResetToken){
        throw new Error('Токен сброса не найден');
      }
      if(!resetPassword || !resetConfirmPassword){
        throw new Error('Введите новый пароль');
      }
      if(resetPassword !== resetConfirmPassword){
        throw new Error('Пароли не совпадают');
      }
      const data = await authRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token: pendingResetToken, password: resetPassword }),
      });
      const message = data?.message || 'Пароль изменён. Теперь войдите заново.';
      setResetMessage(message);
      setAuthNotice(message);
      setAuthMode('login');
      setPendingResetToken(null);
      setResetPassword('');
      setResetConfirmPassword('');
      setLoginPassword('');
    }catch(err:any){
      setResetError(extractAuthError(err));
    }finally{
      setResetBusy(false);
    }
  }

  

  async function handleLogin(e: React.FormEvent){
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    try{
      const username = (loginUsername || '').trim();
      if(!username || !loginPassword){
        throw new Error('Введите username и password');
      }
      const data = await authRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password: loginPassword }),
      });
      if(!data?.access_token){
        throw new Error('Не получен access token');
      }
      lsSet('auth_token', data.access_token);
      setAuthToken(data.access_token);
      const me = await fetchCurrentUser(data.access_token);
      setCurrentUser(me);
      setLoginPassword('');
    }catch(err:any){
      setLoginError(extractAuthError(err));
    }finally{
      setLoginBusy(false);
      setAuthReady(true);
    }
  }

  function handleLogout(){
    try{ window.localStorage.removeItem('auth_token'); }catch(e){}
    setAuthToken(null);
    setCurrentUser(null);
    setShowAdmin(false);
    setShowHelp(false);
    setLoginError(null);
    setRegisterError(null);
    setForgotError(null);
    setResetError(null);
    setAuthNotice(null);
    setVerificationStatus(null);
    setAuthMode('login');
  }

  useEffect(() => {
    // Do not reset view while auth bootstrap is still loading.
    if (!authReady || !currentUser) return;
    if (!isAdmin && showAdmin) {
      setShowAdmin(false);
    }
  }, [authReady, currentUser, isAdmin, showAdmin]);

  // Auth init: read token from query/localStorage and validate it.
  useEffect(() => {
    let initialToken = authToken;
    try{
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');
      const verifyEmailToken = params.get('verify_email_token');
      const resetToken = params.get('reset_token');
      if(queryToken){
        initialToken = queryToken;
        lsSet('auth_token', queryToken);
        setAuthToken(queryToken);
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
      if (verifyEmailToken) {
        setVerificationStatus('Подтверждаем электронную почту...');
        void (async () => {
          try {
            const data = await authRequest('/auth/verify-email', {
              method: 'POST',
              body: JSON.stringify({ token: verifyEmailToken }),
            });
            setVerificationStatus(data?.message || 'Электронная почта подтверждена. Теперь можно войти.');
          } catch (err: any) {
            setVerificationStatus(extractAuthError(err));
          } finally {
            const url = new URL(window.location.href);
            url.searchParams.delete('verify_email_token');
            window.history.replaceState({}, '', url.toString());
            setAuthReady(true);
          }
        })();
      }
      if (resetToken) {
        setPendingResetToken(resetToken);
        setAuthMode('reset');
        const url = new URL(window.location.href);
        url.searchParams.delete('reset_token');
        window.history.replaceState({}, '', url.toString());
      }
    }catch(e){}

    if(!initialToken){
      setAuthReady(true);
      return;
    }

    fetchCurrentUser(initialToken)
      .then((me)=>{
        setCurrentUser(me);
      })
      .catch(()=>{
        try{ window.localStorage.removeItem('auth_token'); }catch(e){}
        setAuthToken(null);
        setCurrentUser(null);
      })
      .finally(()=>setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist selected values to localStorage
  useEffect(()=>{ lsSet('site', site || ''); }, [site]);
  useEffect(()=>{ lsSet('days', String(days)); }, [days]);
  useEffect(()=>{ lsSet('timezone', timezone); }, [timezone]);
  useEffect(()=>{ lsSet('format', format); }, [format]);
  useEffect(()=>{ lsSet('showAdmin', showAdmin ? '1' : '0'); }, [showAdmin]);
  useEffect(()=>{ try{ lsSet('collapsed', JSON.stringify(collapsed)) }catch(e){} }, [collapsed]);
  useEffect(()=>{ try{ lsSet('sectionsOrder', JSON.stringify(sectionsOrder)) }catch(e){} }, [sectionsOrder]);

  // Ref to hold debounce timer id for site input changes
  const siteChangeTimerRef = React.useRef<number | null>(null);
  // Ref to hold latest site value so WS messages and debounced loader use current site
  const latestSiteRef = React.useRef<string>(site);
  const latestDaysRef = React.useRef<number>(days);
  const loadRequestIdRef = React.useRef<number>(0);
  const wsRefreshTimerRef = React.useRef<number | null>(null);

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
      try{ load({site: latestSiteRef.current, days: latestDaysRef.current}); }catch(e){}
      siteChangeTimerRef.current = null;
    }, 350);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if(siteChangeTimerRef.current) window.clearTimeout(siteChangeTimerRef.current);
      if(wsRefreshTimerRef.current) window.clearTimeout(wsRefreshTimerRef.current);
    }
  }, []);

  async function load(overrides?: {site?:string, days?:number, timezone?:string}) {
    const requestId = ++loadRequestIdRef.current;
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
      if (requestId !== loadRequestIdRef.current) return;
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
      if (requestId !== loadRequestIdRef.current) return;
      setError(String(e));
    }
  }

  // After auth, load only if a site is present.
  useEffect(() => {
    if(!authReady || !authToken) return;
    if((site||'').trim()) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authToken]);

  // keep latestSiteRef in sync with site changes (covers programmatic setSite and localStorage init)
  useEffect(() => { latestSiteRef.current = site; }, [site]);
  useEffect(() => { latestDaysRef.current = days; }, [days]);

  useEffect(() => {
    if(!authToken) return;
    let ws: WebSocket | null = null;
    try{
      const envHost = (import.meta as any).env?.VITE_REALTIME_HOST;
      const host = envHost || window.location.hostname || 'localhost';
      const normalizedHost = (host === '0.0.0.0' || host === '') ? 'localhost' : host;
      const url = `ws://${normalizedHost}:8700/ws`;
      ws = new WebSocket(url);
      // Throttle realtime-driven refreshes so UI remains responsive during heavy event streams.
      ws.onmessage = (_ev) => {
        try{
          if(!(latestSiteRef.current||'').trim()) return;
          if(wsRefreshTimerRef.current !== null) return;
          wsRefreshTimerRef.current = window.setTimeout(()=>{
            wsRefreshTimerRef.current = null;
            try{ load({site: latestSiteRef.current, days: latestDaysRef.current}); }catch(e){}
          }, 250);
        }catch(e){}
      }
      ws.onopen = () => { console.info('Realtime WS connected', url); setWsConnected(true); }
      ws.onclose = () => { console.info('Realtime WS closed'); setWsConnected(false); }
      ws.onerror = (e) => { console.warn('Realtime WS error', e); setWsConnected(false); }
    }catch(e){ console.warn('Failed to connect realtime ws', e) }
    return () => {
      if(wsRefreshTimerRef.current) {
        window.clearTimeout(wsRefreshTimerRef.current);
        wsRefreshTimerRef.current = null;
      }
      if(ws) try{ ws.close() }catch(e){}
    }
  }, [authToken]);

  

  function toggleSection(key: string){
    setCollapsed(prev => ({...prev, [key]: !prev[key]}));
  }

  function formatMetric(value:any, opts: {allowZero?: boolean, strong?: boolean, unit?:string} = {}){
    const allowZero = !!opts.allowZero;
    const strong = !!opts.strong;
    const unit = opts.unit;
    if (value === undefined || value === null) return strong ? <span className="dash-strong">-</span> : <span className="dash">-</span>;
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
            <div style={{opacity:0.6}}>{collapsed.overviewMetrics ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.topPages ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.peakHours ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.referrers ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.campaigns ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.browsers ? '>' : 'v'}</div>
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
            <div style={{opacity:0.6}}>{collapsed.sessions ? '>' : 'v'}</div>
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

  if(!authReady){
    return (
      <div className="container">
        <div className="card">Проверка сессии...</div>
      </div>
    );
  }

  if(!authToken || !currentUser){
    return (
      <div className="auth-page">
        <section id="panel-login" className="panel auth-login-panel">
          <div className="hero-card">
            <div className="hero-left">
              <div className="brand-big">WebAnalyzer</div>
              <h1 className="hero-title">
                {authMode === 'register' ? 'Создать аккаунт' : authMode === 'forgot' ? 'Сбросить пароль' : authMode === 'reset' ? 'Новый пароль' : 'Войти в систему'}
              </h1>
              <p className="hero-desc">
                {authMode === 'register'
                  ? 'Зарегистрируйте аккаунт, подтвердите email и получите доступ к аналитике.'
                  : authMode === 'forgot'
                    ? 'Запросите ссылку для восстановления пароля на почту.'
                    : authMode === 'reset'
                      ? 'Введите новый пароль по ссылке из письма.'
                      : 'Используйте свой аккаунт для доступа к аналитике.'}
              </p>
              {verificationStatus && <div className="auth-banner auth-banner--info">{verificationStatus}</div>}
              {authNotice && <div className="auth-banner auth-banner--success">{authNotice}</div>}
            </div>
            <div className="hero-right">
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="hero-form">
                  <div className={`field ${(loginUsername || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-login-username" value={loginUsername} onChange={(e)=>setLoginUsername(e.target.value)} autoComplete="username" disabled={loginBusy} />
                    <label htmlFor="frontend-login-username">Username</label>
                  </div>

                  <div className={`field ${(loginPassword || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-login-password" type="password" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} autoComplete="current-password" disabled={loginBusy} />
                    <label htmlFor="frontend-login-password">Password</label>
                  </div>

                  {loginError && <div className="auth-error">{formatLoginError(loginError)}</div>}

                  <div className="hero-links">
                    <button className="text-link" type="button" onClick={()=>setAuthMode('forgot')}>Забыли пароль?</button>
                    <button className="text-link" type="button" onClick={()=>setAuthMode('register')}>Нет аккаунта? Зарегистрироваться</button>
                  </div>

                  <div className="hero-cta">
                    <button className="btn large" type="submit" disabled={loginBusy}>{loginBusy ? 'Входим...' : 'Войти'}</button>
                  </div>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="hero-form">
                  <div className={`field ${(registerUsername || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-register-username" value={registerUsername} onChange={(e)=>setRegisterUsername(e.target.value)} autoComplete="username" disabled={registerBusy} />
                    <label htmlFor="frontend-register-username">Username</label>
                  </div>

                  <div className={`field ${(registerEmail || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-register-email" type="email" value={registerEmail} onChange={(e)=>setRegisterEmail(e.target.value)} autoComplete="email" disabled={registerBusy} />
                    <label htmlFor="frontend-register-email">Email</label>
                  </div>

                  <div className={`field ${(registerPassword || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-register-password" type="password" value={registerPassword} onChange={(e)=>setRegisterPassword(e.target.value)} autoComplete="new-password" disabled={registerBusy} />
                    <label htmlFor="frontend-register-password">Password</label>
                  </div>

                  <div className={`field ${(registerConfirmPassword || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-register-confirm" type="password" value={registerConfirmPassword} onChange={(e)=>setRegisterConfirmPassword(e.target.value)} autoComplete="new-password" disabled={registerBusy} />
                    <label htmlFor="frontend-register-confirm">Repeat password</label>
                  </div>

                  <div className="password-hints">
                    {getPasswordHints(registerPassword).length === 0 ? (
                      <div className="password-hints__ok">✓ Пароль подходит</div>
                    ) : (
                      getPasswordRequirements(registerPassword).map((req) => (
                        <div key={req.text} className={`password-hints__item ${req.met ? 'password-hints__item--met' : ''}`}>
                          <span className="password-hints__icon">{req.met ? '✓' : '✕'}</span>
                          {req.text}
                        </div>
                      ))
                    )}
                  </div>

                  {registerError && <div className="auth-error">{formatLoginError(registerError)}</div>}
                  {registerMessage && <div className="auth-banner auth-banner--success">{registerMessage}</div>}

                  <div className="hero-links">
                    <button className="text-link" type="button" onClick={()=>setAuthMode('login')}>Уже есть аккаунт? Войти</button>
                  </div>

                  <div className="hero-cta">
                    <button className="btn large" type="submit" disabled={registerBusy}>{registerBusy ? 'Создаём...' : 'Зарегистрироваться'}</button>
                  </div>
                </form>
              )}

              {authMode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="hero-form">
                  <div className={`field ${(forgotEmail || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-forgot-email" type="email" value={forgotEmail} onChange={(e)=>setForgotEmail(e.target.value)} autoComplete="email" disabled={forgotBusy} />
                    <label htmlFor="frontend-forgot-email">Email</label>
                  </div>

                  {forgotError && <div className="auth-error">{formatLoginError(forgotError)}</div>}
                  {forgotMessage && <div className="auth-banner auth-banner--success">{forgotMessage}</div>}

                  <div className="hero-links">
                    <button className="text-link" type="button" onClick={()=>setAuthMode('login')}>Вернуться ко входу</button>
                  </div>

                  <div className="hero-cta">
                    <button className="btn large" type="submit" disabled={forgotBusy}>{forgotBusy ? 'Отправляем...' : 'Отправить ссылку'}</button>
                  </div>
                </form>
              )}

              {authMode === 'reset' && (
                <form onSubmit={handleConfirmReset} className="hero-form">
                  <div className={`field ${(resetPassword || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-reset-password" type="password" value={resetPassword} onChange={(e)=>setResetPassword(e.target.value)} autoComplete="new-password" disabled={resetBusy} />
                    <label htmlFor="frontend-reset-password">New password</label>
                  </div>

                  <div className={`field ${(resetConfirmPassword || '').trim() ? 'filled' : ''}`}>
                    <input className="hero-input" id="frontend-reset-confirm" type="password" value={resetConfirmPassword} onChange={(e)=>setResetConfirmPassword(e.target.value)} autoComplete="new-password" disabled={resetBusy} />
                    <label htmlFor="frontend-reset-confirm">Repeat password</label>
                  </div>

                  <div className="password-hints">
                    {getPasswordHints(resetPassword).length === 0 ? (
                      <div className="password-hints__ok">Пароль подходит</div>
                    ) : (
                      getPasswordHints(resetPassword).map((hint) => <div key={hint} className="password-hints__item">{hint}</div>)
                    )}
                  </div>

                  {resetError && <div className="auth-error">{formatLoginError(resetError)}</div>}
                  {resetMessage && <div className="auth-banner auth-banner--success">{resetMessage}</div>}

                  <div className="hero-links">
                    <button className="text-link" type="button" onClick={()=>setAuthMode('login')}>Вернуться ко входу</button>
                  </div>

                  <div className="hero-cta">
                    <button className="btn large" type="submit" disabled={resetBusy || !pendingResetToken}>{resetBusy ? 'Сохраняем...' : 'Сменить пароль'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`container ${inAdminPanel ? 'container-admin-mode' : ''}`}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>{inAdminPanel ? 'Admin Panel' : 'Website Analytics Dashboard'}</h1>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {isAdmin && (
            <button className="btn" onClick={()=>setShowAdmin((prev)=>!prev)}>
              {inAdminPanel ? 'Dashboard' : 'Admin Panel'}
            </button>
          )}
          <button className="btn" onClick={()=>setShowHelp(true)}>Help</button>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {!inAdminPanel && (
        <>
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
          <select value={days} onChange={e=>{ const v = Number(e.target.value); setDays(v); latestDaysRef.current = v; load({days:v, site: latestSiteRef.current}); }}>
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
                
                {isAdmin && (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <label className="timezone-label">Demo events:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10000" 
                    value={demoCount}
                    onChange={(e)=>setDemoCount(Math.max(1, Number(e.target.value) || 1))}
                    style={{padding:'6px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',fontWeight:400,color:'#0f172a',background:'white'}}
                    disabled={generating}
                  />
                  <button className="btn" onClick={async ()=>{
                    const siteId = (site || '').trim();
                    if(siteId !== 'example') { alert('Demo traffic can only be generated for site_id="example"'); return; }
                    
                    if(generating) {
                      try{
                        const host = window.location.hostname || 'localhost';
                        await fetch(`http://${host}:8000/api/admin/stop-demo-traffic`, {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({site_id: siteId})
                        });
                      }catch(e){
                        console.error('Stop demo traffic failed', e);
                      }finally{
                        if(generatingAbortRef.current) generatingAbortRef.current.abort();
                        setGenerating(false);
                      }
                      return;
                    }
                    
                    try{
                      setGenerating(true);
                      generatingAbortRef.current = new AbortController();
                      const host = window.location.hostname || 'localhost';
                      const res = await fetch(`http://${host}:8000/api/admin/generate-demo-traffic`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
                        // Generate across a wider window so 1/7/30 period switching is visibly different.
                        body: JSON.stringify({site_id: siteId, count: demoCount, days: 30}),
                        signal: generatingAbortRef.current.signal
                      });
                      if(!res.ok) {
                        const errData = await res.text().catch(()=>'Unknown error');
                        throw new Error(`HTTP ${res.status}: ${errData}`);
                      }
                      const data = await res.json();
                      setTimeout(()=>{ try{ load({site: siteId, days: latestDaysRef.current}); }catch(e){} }, 500);
                    }catch(e){
                      if((e as any).name !== 'AbortError') {
                        console.error('Generate demo traffic failed', e);
                        alert('Failed to generate demo traffic: '+String(e));
                      }
                    }finally{ setGenerating(false); generatingAbortRef.current = null; }
                  }} >{generating ? 'Stop' : 'Generate'}</button>
                </div>
                )}
              </div>

              {isAdmin && (
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
                      // Ensure widgets stay synced with the currently selected period after clear.
                      try{ await load({site: siteId, days: latestDaysRef.current}); }catch(e){}
                    }catch(e){
                      console.error('clear-site failed', e);
                      alert('Clear failed: '+String(e));
                    }
                  }}
                >Clear site data</button>
              </div>
              )}
            </div>
        </div>
        {error && <div style={{color:'red',marginTop:8}}>Error: {error}</div>}
      </div>

      {sectionsOrder.map(k=> renderSection(k))}
        </>
      )}

      {inAdminPanel && <AdminPanel />}


      {showHelp && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}} onClick={()=>setShowHelp(false)}>
          <div style={{background:'white',padding:20,borderRadius:8,maxWidth:900,width:'90%',maxHeight:'80%',overflow:'auto'}} onClick={(e)=>e.stopPropagation()}>
            <h2>Help - Metrics Explained</h2>
            <p>Below are short explanations of the metrics shown in the dashboard. If you're new to analytics, start with the "Overview" section - it contains the key indicators.</p>
            <h3>Overview</h3>
            <ul>
              <li><strong>Total Views</strong> - total number of page views during the selected period.</li>
              <li><strong>Unique Pages</strong> - count of distinct page paths visited by users.</li>
              <li><strong>Unique Sessions</strong> - number of distinct sessions (determined by session_id).</li>
              <li><strong>Avg. Session Duration</strong> - average duration of user sessions in seconds, computed as the difference between the first and last event timestamps for each session. Sessions without timestamps or with a single event contribute 0 seconds to this average.</li>
              <li><strong>Avg. Views per Session</strong> - average number of page view events per session (total views divided by unique sessions).</li>
              <li><strong>Bounce Rate</strong> - percent of sessions that had only a single event (often indicates users left after viewing one page).</li>
            </ul>

            <h3>Top Pages</h3>
            <p>Shows the pages with the highest number of views. Note: query parameters (including UTM tags) are stripped from URLs for accurate aggregation.</p>

            <h3>Peak Hours (UTC)</h3>
            <p>Histogram of page views by hour (UTC). Use this to identify when your site receives the most traffic.</p>

            <h3>Referrers &amp; Campaigns</h3>
            <p><strong>Referrers</strong> - the referring sites or sources visitors came from ("(direct)" means no referrer). <strong>Campaigns</strong> - UTM campaign labels extracted from incoming URLs when present.</p>

            <h3>Browsers</h3>
            <p>Counts grouped by major browser families (Chrome, Firefox, Safari, Edge, Other). Useful for prioritizing compatibility testing.</p>

            <h3>Sessions</h3>
            <p>Shows average events per session and a list of top sessions by event count. Use this to analyze visitor engagement and find sessions with many interactions.</p>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />)
