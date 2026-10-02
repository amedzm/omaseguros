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

$('#registerForm').addEventListener('submit',e=>{e.preventDefault();const users=store.get('omaUsers',[]);const email=$('#regEmail').value.trim().toLowerCase();if(users.some(u=>u.email===email)){toast('Ese correo ya está registrado.');return;}const user={id:Date.now(),name:$('#regName').value.trim(),last:$('#regLast').value.trim(),doc:$('#regId').value.trim(),email,phone:$('#regPhone').value.trim(),password:$('#regPassword').value};users.push(user);store.set('omaUsers',users);store.set('omaSession',user.id);hideAuth();const hadDraft=saveDraftAsQuote();openDashboard();if(hadDraft)setDash('quotes');toast(hadDraft?'Cuenta creada y cotización enviada.':'Cuenta creada correctamente.');e.target.reset()});

$('#loginForm').addEventListener('submit',e=>{e.preventDefault();const email=$('#loginEmail').value.trim().toLowerCase(),pass=$('#loginPassword').value;const user=store.get('omaUsers',[]).find(u=>u.email===email&&u.password===pass);if(!user){toast('Correo o contraseña incorrectos.');return;}store.set('omaSession',user.id);hideAuth();const hadDraft=saveDraftAsQuote();openDashboard();if(hadDraft)setDash('quotes');toast(hadDraft?'Sesión iniciada y cotización enviada.':'Sesión iniciada.');e.target.reset()});

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

const quoteSchemas={
  'Automóvil':[
    {id:'vehicleMake',label:'Marca del vehículo',type:'text',placeholder:'Ej. Toyota',required:true},
    {id:'vehicleModel',label:'Modelo',type:'text',placeholder:'Ej. RAV4',required:true},
    {id:'vehicleYear',label:'Año',type:'number',placeholder:'Ej. 2024',min:'1980',max:'2030',required:true},
    {id:'vehicleValue',label:'Valor aproximado',type:'text',placeholder:'Ej. B/. 28,000',required:true},
    {id:'vehicleUse',label:'Uso del vehículo',type:'select',options:['Particular','Comercial','Transporte ejecutivo','Otro'],required:true},
    {id:'vehicleCondition',label:'Condición',type:'select',options:['Nuevo','Usado'],required:true},
    {id:'vehiclePlate',label:'Placa',type:'text',placeholder:'Opcional'},
    {id:'vehicleCoverage',label:'Cobertura de interés',type:'select',options:['Cobertura completa','Daños a terceros','No estoy seguro / requiero asesoría'],required:true}
  ],
  'Vida':[
    {id:'lifeDob',label:'Fecha de nacimiento',type:'date',required:true},
    {id:'lifeOccupation',label:'Ocupación',type:'text',placeholder:'Ej. Ingeniero / Comerciante',required:true},
    {id:'lifeSmoker',label:'¿Fuma actualmente?',type:'select',options:['No','Sí'],required:true},
    {id:'lifeCoverage',label:'Suma asegurada deseada',type:'text',placeholder:'Ej. B/. 100,000',required:true},
    {id:'lifePurpose',label:'Objetivo principal',type:'select',options:['Protección familiar','Protección de deudas','Ahorro / planificación','Cobertura empresarial','Otro'],required:true},
    {id:'lifeTerm',label:'Plazo preferido',type:'select',options:['10 años','20 años','30 años','Hasta cierta edad','No estoy seguro']},
    {id:'lifeExisting',label:'¿Tiene seguro de vida actualmente?',type:'select',options:['No','Sí']},
    {id:'lifeDependents',label:'Personas que dependen económicamente de usted',type:'number',placeholder:'Ej. 2',min:'0'}
  ],
  'Salud':[
    {id:'healthDob',label:'Fecha de nacimiento del titular',type:'date',required:true},
    {id:'healthPeople',label:'Personas a asegurar',type:'number',placeholder:'Ej. 3',min:'1',required:true},
    {id:'healthDependents',label:'Edades de dependientes',type:'text',placeholder:'Ej. 8, 12 y 35 años'},
    {id:'healthArea',label:'Área de cobertura',type:'select',options:['Panamá','Panamá y Centroamérica','Internacional','No estoy seguro'],required:true},
    {id:'healthPlan',label:'Tipo de plan',type:'select',options:['Individual','Familiar','Colectivo / empresa'],required:true},
    {id:'healthDeductible',label:'Preferencia de deducible',type:'select',options:['Bajo','Medio','Alto','No estoy seguro']},
    {id:'healthCurrent',label:'¿Cuenta con seguro médico actualmente?',type:'select',options:['No','Sí']},
    {id:'healthBudget',label:'Presupuesto mensual aproximado',type:'text',placeholder:'Opcional'}
  ],
  'Hogar':[
    {id:'homeType',label:'Tipo de inmueble',type:'select',options:['Casa','Apartamento','PH','Local / propiedad de inversión','Otro'],required:true},
    {id:'homeProvince',label:'Provincia / ubicación',type:'text',placeholder:'Ej. Panamá, San Francisco',required:true},
    {id:'homeOwnership',label:'Condición del inmueble',type:'select',options:['Propio','Hipotecado','Alquilado'],required:true},
    {id:'homeUse',label:'Uso',type:'select',options:['Residencia principal','Residencia secundaria','Alquiler','Otro'],required:true},
    {id:'homeBuildingValue',label:'Valor aproximado de la estructura',type:'text',placeholder:'Ej. B/. 180,000',required:true},
    {id:'homeContentsValue',label:'Valor aproximado del contenido',type:'text',placeholder:'Ej. B/. 30,000'},
    {id:'homeConstruction',label:'Tipo de construcción',type:'select',options:['Concreto / mampostería','Mixta','Madera','No estoy seguro']},
    {id:'homeSecurity',label:'Medidas de seguridad',type:'text',placeholder:'Ej. alarma, garita, cámaras'}
  ],
  'Empresas':[
    {id:'businessName',label:'Nombre de la empresa',type:'text',required:true},
    {id:'businessRuc',label:'RUC / identificación',type:'text',required:true},
    {id:'businessActivity',label:'Actividad comercial',type:'text',placeholder:'Ej. construcción, tecnología, restaurante',required:true},
    {id:'businessEmployees',label:'Cantidad de colaboradores',type:'number',min:'1',placeholder:'Ej. 18',required:true},
    {id:'businessRevenue',label:'Facturación anual aproximada',type:'text',placeholder:'Ej. B/. 500,000'},
    {id:'businessAssets',label:'Valor aproximado de activos',type:'text',placeholder:'Ej. B/. 250,000'},
    {id:'businessCoverage',label:'Cobertura de interés',type:'select',options:['Incendio / multirriesgo','Responsabilidad civil','Equipo electrónico','Robo','Transporte de mercancías','Colectivo de vida / salud','Varias / requiero asesoría'],required:true},
    {id:'businessLocations',label:'Cantidad de ubicaciones',type:'number',min:'1',placeholder:'Ej. 2'}
  ],
  'Fianzas':[
    {id:'bondApplicant',label:'Solicitante',type:'text',placeholder:'Persona o empresa',required:true},
    {id:'bondId',label:'Cédula / RUC',type:'text',required:true},
    {id:'bondType',label:'Tipo de fianza',type:'select',options:['Propuesta / licitación','Cumplimiento','Pago','Anticipo','Aduanera','Judicial','Otra'],required:true},
    {id:'bondBeneficiary',label:'Beneficiario de la fianza',type:'text',required:true},
    {id:'bondContract',label:'Monto del contrato',type:'text',placeholder:'Ej. B/. 150,000',required:true},
    {id:'bondAmount',label:'Monto requerido de la fianza',type:'text',placeholder:'Ej. B/. 15,000',required:true},
    {id:'bondTerm',label:'Vigencia requerida',type:'text',placeholder:'Ej. 12 meses',required:true},
    {id:'bondProject',label:'Proyecto / obligación relacionada',type:'text',placeholder:'Nombre o breve descripción',required:true}
  ],
  'Otros':[
    {id:'otherSubject',label:'¿Qué deseas asegurar?',type:'text',placeholder:'Describe el bien, actividad o riesgo',required:true},
    {id:'otherValue',label:'Valor aproximado',type:'text',placeholder:'Si aplica'},
    {id:'otherUse',label:'Uso o finalidad',type:'text',placeholder:'Personal, comercial, profesional...'},
    {id:'otherDate',label:'¿Cuándo necesitas la cobertura?',type:'date'},
    {id:'otherCurrent',label:'¿Tiene cobertura actualmente?',type:'select',options:['No','Sí','No aplica']},
    {id:'otherHelp',label:'Tipo de ayuda requerida',type:'select',options:['Cotización','Comparar alternativas','Renovación','Asesoría general'],required:true}
  ]
};

const schemaLabels={
  'Automóvil':'Seguro de automóvil',
  'Vida':'Seguro de vida',
  'Salud':'Seguro de salud',
  'Hogar':'Seguro de hogar',
  'Empresas':'Seguro para empresas',
  'Fianzas':'Fianzas',
  'Otros':'Necesidad especial'
};

function fieldMarkup(f){
  const req=f.required?' required':'';
  const min=f.min?` min="${f.min}"`:'';
  const max=f.max?` max="${f.max}"`:'';
  if(f.type==='select') return `<label>${f.label}<select id="${f.id}" data-quote-field="${f.id}"${req}><option value="">Seleccionar</option>${f.options.map(o=>`<option>${o}</option>`).join('')}</select></label>`;
  return `<label>${f.label}<input id="${f.id}" data-quote-field="${f.id}" type="${f.type}" placeholder="${f.placeholder||''}"${min}${max}${req}></label>`;
}

function renderQuoteFields(type){
  const fields=$('#quoteSpecificFields'), empty=$('#quoteEmptyState'), title=$('#quoteFormTitle'), badge=$('#quoteTypeBadge');
  if(!quoteSchemas[type]){
    fields.innerHTML='';
    empty.style.display='flex';
    title.textContent='Selecciona el seguro que deseas cotizar';
    badge.textContent='Cotización';
    return;
  }
  empty.style.display='none';
  fields.innerHTML=quoteSchemas[type].map(fieldMarkup).join('');
  title.textContent=schemaLabels[type]||type;
  badge.textContent=type;
}

$('#quoteType').addEventListener('change',e=>renderQuoteFields(e.target.value));

function collectSpecificData(type){
  const schema=quoteSchemas[type]||[];
  return schema.reduce((acc,f)=>{const el=$(`#${f.id}`);acc[f.label]=el?el.value.trim():'';return acc;},{});
}

function quoteDetailsText(specific,notes){
  const parts=Object.entries(specific).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`);
  if(notes)parts.push(`Información adicional: ${notes}`);
  return parts.join(' · ');
}

function saveDraftAsQuote(){
  const u=currentUser(), draft=store.get('omaPublicDraft',null);
  if(!u||!draft)return false;
  const all=store.get('omaQuotes',[]);
  all.unshift({id:Date.now(),userId:u.id,code:`COT-${String(all.length+1).padStart(4,'0')}`,type:draft.type,amount:draft.specific?.['Valor aproximado']||draft.specific?.['Suma asegurada deseada']||draft.specific?.['Valor aproximado de la estructura']||draft.specific?.['Monto requerido de la fianza']||'',details:quoteDetailsText(draft.specific||{},draft.notes||''),formData:draft.specific||{},date:new Date().toLocaleDateString('es-PA'),status:'Recibida'});
  store.set('omaQuotes',all);
  localStorage.removeItem('omaPublicDraft');
  return true;
}

$('#publicQuoteForm').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('#quoteType').value;
  if(!quoteSchemas[type]){toast('Selecciona el tipo de seguro que deseas cotizar.');return;}
  const draft={type,name:$('#quoteName').value.trim(),email:$('#quoteEmail').value.trim(),phone:$('#quotePhone').value.trim(),specific:collectSpecificData(type),notes:$('#quoteNotes').value.trim()};
  store.set('omaPublicDraft',draft);
  const u=currentUser();
  if(u){
    saveDraftAsQuote();
    e.target.reset();renderQuoteFields('');
    openDashboard();setDash('quotes');toast('Solicitud de cotización enviada correctamente.');
  }else{
    showAuth('register');
    $('#regName').value=draft.name.split(' ')[0]||'';
    $('#regLast').value=draft.name.split(' ').slice(1).join(' ');
    $('#regEmail').value=draft.email;
    $('#regPhone').value=draft.phone;
    toast('Crea tu cuenta para guardar y dar seguimiento a la cotización.');
  }
});

$$('.quote-trigger').forEach(b=>b.addEventListener('click',()=>{
  let type=b.dataset.type;
  if(type==='Personas')type='Vida';
  if(type==='Generales')type='Automóvil';
  location.hash='cotizar';
  $('#quoteType').value=type;
  renderQuoteFields(type);
  setTimeout(()=>{$('#quoteSpecificFields input, #quoteSpecificFields select')?.focus();},350);
}));
$('#contactForm').addEventListener('submit',e=>{e.preventDefault();toast('Mensaje registrado en el demo.');e.target.reset()});

// If a demo session exists, Mi OMA opens the dashboard instead of login.
$$('[data-open-auth="login"]').forEach(btn=>btn.addEventListener('click',e=>{if(currentUser()){e.preventDefault();e.stopImmediatePropagation();hideAuth();openDashboard()}},true));
