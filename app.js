const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const toast=(msg)=>{const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)};
const store={get:(k,d)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(d)),set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};

$('.menu-toggle').addEventListener('click',e=>{const n=$('.main-nav');n.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',n.classList.contains('open'))});
$$('.main-nav a').forEach(a=>a.addEventListener('click',()=>$('.main-nav').classList.remove('open')));

const authModal=$('#authModal'), dashboard=$('#dashboardModal');
function showAuth(tab='login'){authModal.classList.add('open');authModal.setAttribute('aria-hidden','false');setAuthTab(tab)}
function hideAuth(){authModal.classList.remove('open');authModal.setAttribute('aria-hidden','true')}
function setAuthTab(tab){$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));$('#loginPane').classList.toggle('active',tab==='login');$('#registerPane').classList.toggle('active',tab==='register')}
$$('[data-open-auth]').forEach(b=>b.addEventListener('click',()=>showAuth(b.dataset.openAuth)));
$$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>setAuthTab(b.dataset.authTab)));
$$('[data-close-modal]').forEach(b=>b.addEventListener('click',hideAuth));

$('#registerForm').addEventListener('submit',e=>{e.preventDefault();const users=store.get('omaUsers',[]);const email=$('#regEmail').value.trim().toLowerCase();if(users.some(u=>u.email===email)){toast('Ese correo ya está registrado.');return;}const user={id:Date.now(),name:$('#regName').value.trim(),last:$('#regLast').value.trim(),doc:$('#regId').value.trim(),email,phone:$('#regPhone').value.trim(),password:$('#regPassword').value};users.push(user);store.set('omaUsers',users);store.set('omaSession',user.id);hideAuth();openDashboard();toast('Cuenta creada correctamente.');e.target.reset()});

$('#loginForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#loginEmail').value.trim().toLowerCase(),pass=$('#loginPassword').value;const user=store.get('omaUsers',[]).find(u=>u.email===email&&u.password===pass);if(!user){toast('Correo o contraseña incorrectos.');return;}store.set('omaSession',user.id);hideAuth();openDashboard();toast('Sesión iniciada.');e.target.reset()});

function currentUser(){const id=store.get('omaSession',null);return store.get('omaUsers',[]).find(u=>u.id===id)}
function userQuotes(){const u=currentUser();return u?store.get('omaQuotes',[]).filter(q=>q.userId===u.id):[]}
function openDashboard(){const u=currentUser();if(!u){showAuth('login');return;}dashboard.classList.add('open');dashboard.setAttribute('aria-hidden','false');$('#dashWelcome').textContent=`Hola, ${u.name}`;renderDashboard();setDash('summary')}
function closeDashboard(){dashboard.classList.remove('open');dashboard.setAttribute('aria-hidden','true')}
$$('[data-close-dashboard]').forEach(b=>b.addEventListener('click',closeDashboard));
$('.nav-actions .btn-ghost').addEventListener('click',e=>{if(currentUser()){e.stopImmediatePropagation();openDashboard()}});
$('#logoutBtn').addEventListener('click',()=>{localStorage.removeItem('omaSession');closeDashboard();toast('Sesión cerrada.')});

function setDash(name){$$('.dash-nav[data-dash]').forEach(b=>b.classList.toggle('active',b.dataset.dash===name));$$('.dash-pane').forEach(p=>p.classList.toggle('active',p.id===`dash-${name}`));if(name==='quotes'||name==='summary'||name==='profile')renderDashboard()}
$$('.dash-nav[data-dash]').forEach(b=>b.addEventListener('click',()=>setDash(b.dataset.dash)));
$$('[data-go-new]').forEach(b=>b.addEventListener('click',()=>setDash('new')));

function renderDashboard(){const u=currentUser();if(!u)return;const qs=userQuotes();$('#statQuotes').textContent=qs.length;$('#statReview').textContent=qs.filter(q=>q.status==='En revisión').length;$('#statQuoted').textContent=qs.filter(q=>q.status==='Cotizada').length;const list=$('#quoteList');list.innerHTML=qs.length?qs.map(q=>`<div class="quote-item"><div><strong>${q.code} · ${q.type}</strong><small>${q.date} · ${q.details}</small></div><span class="status">${q.status}</span></div>`).join(''):'<p style="color:#71666a">Aún no tienes cotizaciones registradas.</p>';$('#profileData').innerHTML=`<div><span>Nombre</span><strong>${u.name} ${u.last}</strong></div><div><span>Identificación</span><strong>${u.doc}</strong></div><div><span>Correo</span><strong>${u.email}</strong></div><div><span>Teléfono</span><strong>${u.phone}</strong></div>`}

$('#dashboardQuoteForm').addEventListener('submit',e=>{e.preventDefault();const u=currentUser();if(!u)return;const all=store.get('omaQuotes',[]);const q={id:Date.now(),userId:u.id,code:`COT-${String(all.length+1).padStart(4,'0')}`,type:$('#dashQuoteType').value,amount:$('#dashAmount').value.trim(),details:$('#dashDetails').value.trim(),date:new Date().toLocaleDateString('es-PA'),status:'Recibida'};all.unshift(q);store.set('omaQuotes',all);e.target.reset();renderDashboard();setDash('quotes');toast('Cotización guardada.')});

$('#publicQuoteForm').addEventListener('submit',e=>{e.preventDefault();const draft={type:$('#quoteType').value,name:$('#quoteName').value.trim(),email:$('#quoteEmail').value.trim(),phone:$('#quotePhone').value.trim(),notes:$('#quoteNotes').value.trim()};store.set('omaPublicDraft',draft);const u=currentUser();if(u){openDashboard();setDash('new');$('#dashQuoteType').value=draft.type;$('#dashDetails').value=draft.notes;toast('Completa y guarda tu solicitud en Mi OMA.')}else{showAuth('register');$('#regName').value=draft.name.split(' ')[0]||'';$('#regEmail').value=draft.email;$('#regPhone').value=draft.phone;toast('Crea tu cuenta para guardar y dar seguimiento a la cotización.')}});

$$('.quote-trigger').forEach(b=>b.addEventListener('click',()=>{location.hash='cotizar';$('#quoteType').value=b.dataset.type;setTimeout(()=>$('#quoteName').focus(),350)}));
$('#contactForm').addEventListener('submit',e=>{e.preventDefault();toast('Mensaje registrado en el demo.');e.target.reset()});

// If a demo session exists, Mi OMA opens the dashboard instead of login.
$$('[data-open-auth="login"]').forEach(btn=>btn.addEventListener('click',e=>{if(currentUser()){e.preventDefault();e.stopImmediatePropagation();hideAuth();openDashboard()}},true));
