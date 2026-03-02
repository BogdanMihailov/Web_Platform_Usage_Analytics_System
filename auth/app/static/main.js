const el = id => document.getElementById(id);

const apiBase = '';

async function doLogin(){
  const username = el('username').value.trim();
  const password = el('password').value;
  try{
    const r = await fetch(apiBase + '/auth/login', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ username, password }) });
    if(!r.ok) throw new Error(await r.text());
    const j = await r.json();
    // redirect to main frontend and pass token in query so frontend can store it
    window.location.href = `http://localhost:5173/?token=${encodeURIComponent(j.access_token)}`;
  }catch(e){
    alert('Login failed');
  }
}

el('btn-login').addEventListener('click', (e)=>{ e.preventDefault(); doLogin(); });
el('username').addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); doLogin(); } });
el('password').addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); doLogin(); } });

// Floating label behaviour: toggle .filled on field when input has value
function wireFloating(id){
  const input = el(id);
  const field = input.closest('.field');
  function update(){
    if(input.value && input.value.trim() !== '') field.classList.add('filled'); else field.classList.remove('filled');
  }
  input.addEventListener('input', update);
  input.addEventListener('focus', ()=> field.classList.add('filled'));
  input.addEventListener('blur', update);
  // initial
  update();
}

wireFloating('username');
wireFloating('password');
