import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL = "https://gsaxsfghhjuhltnnwcvf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OYybjNMQ1gzu_R8gw_9NGg_vsZBxPPM";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const MODULES = [
  {id:'e3904-05', code:'E-3904/05', title:'Absorvedora Primária e Retificadora', url:'https://robexter.github.io/E-3904-05-Concept/'},
  {id:'e3906', code:'E-3906', title:'Absorvedora Secundária', url:'https://robexter.github.io/E-3906-concept/'},
  {id:'e3907', code:'E-3907', title:'Desbutanizadora', url:'https://robexter.github.io/E-3907-concept/'},
  {id:'e3908', code:'E-3908', title:'Desetanizadora', url:'https://robexter.github.io/E-3908-concept/'},
  {id:'e3909', code:'E-3909', title:'Despropanizadora', url:'https://robexter.github.io/E-3909-concept/'},
  {id:'e3910', code:'E-3910', title:'Despropenizadora', url:'https://robexter.github.io/E-3910-concept/'},
  {id:'e3911', code:'E-3911', title:'Absorvedora de H₂S do Gás Combustível', url:'https://robexter.github.io/E-3911-concept/'},
  {id:'e3912', code:'E-3912', title:'Extratora de H₂S do GLP', url:'https://robexter.github.io/E-3912-concept/'},
  {id:'e3913', code:'E-3913', title:'Retificadora de DEA', url:'https://robexter.github.io/E-3913-concept/'},
  {id:'e3914', code:'E-3914', title:'Tratamento Merox do GLP', url:'https://robexter.github.io/E-3914-Concept/'},
  {id:'merox-gasolina', code:'Merox Gasolina', title:'Tratamento Merox da Gasolina', url:'https://robexter.github.io/Merox-Gasolina/'}
];

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>[...document.querySelectorAll(s)];

let currentUser = null;
let currentProfile = null;
let currentSessionId = null;
let heartbeatTimer = null;
let accessPollTimer = null;
let adminRefreshTimer = null;
let currentModuleIndex = -1;
let progressMap = {};
let favorites = new Set();
let installPrompt = null;
let lampEditMode = false;
let iframeLampEditor = null;
let syncingChildEditButton = false;
let officialModuleEdits = {};
let officialLampLayout = null;
let iframeContentBridge = null;
let officialTablesAvailable = true;
let lastTextItemId = null;
let officialSyncTimer = null;
let officialLastSyncAt = null;


let adminTapCount = 0;
let adminTapReset = null;

function showToast(msg, type='ok'){
  const t=$('#toast'); t.textContent=msg; t.dataset.type=type; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}
function sanitizeUsername(v){
  return v.trim().toLowerCase().replace(/[^a-z0-9._-]/g,'');
}
function usernameToEmail(username){ return `${sanitizeUsername(username)}@u39concept.app`; }
function fmtMinutes(mins){
  if(mins < 60) return `${Math.max(0,Math.round(mins))} min`;
  const h=Math.floor(mins/60), m=Math.round(mins%60);
  return `${h}h ${m}min`;
}
function elapsedMinutes(start,end){ return (new Date(end)-new Date(start))/60000; }
function setView(id){
  $$('.view').forEach(v=>v.classList.add('hidden'));
  $(id).classList.remove('hidden');
}
function isApproved(profile){
  return profile?.role==='admin' || profile?.access_status==='approved';
}
function cleanupAccessPoll(){
  if(accessPollTimer){ clearInterval(accessPollTimer); accessPollTimer=null; }
}
function cleanupAdminRefresh(){
  if(adminRefreshTimer){ clearInterval(adminRefreshTimer); adminRefreshTimer=null; }
}

async function init(){
  registerInstall();
  wireUI();
const {data:{session}}=await supabase.auth.getSession();
  if(session?.user){
    await enterApp(session.user);
  }else{
    setView('#authView');
  }

  supabase.auth.onAuthStateChange(async (event)=>{
    if(event==='SIGNED_OUT'){
      cleanupHeartbeat();
      cleanupAccessPoll();
      cleanupAdminRefresh();
      stopOfficialSync();
      currentUser=currentProfile=null; currentSessionId=null;
      setView('#authView');
    }
  });
}

function wireUI(){
  $('#tabLogin').onclick=()=>switchAuthTab('login');
  $('#tabRegister').onclick=()=>switchAuthTab('register');
  $('#loginForm').addEventListener('submit',login);
  $('#registerForm').addEventListener('submit',register);
  $('#logoutBtn').onclick=logout;
  $('#accessLogoutBtn').onclick=logout;
  $('#checkAccessBtn').onclick=()=>checkAccessStatus(true);
  $('#search').addEventListener('input',renderModules);
  $('#continueBtn').onclick=continueTraining;
  $('#viewerClose').onclick=closeViewer;
  $('#viewerEditBtn').onclick=toggleViewerLampEdit;
  $('#resetLampsBtn').onclick=restoreViewerLampPositions;
  $('#syncOfficialBtn').onclick=()=>forceOfficialSync(true);
  $('#saveTextDraftBtn').onclick=()=>{
    if(!saveCurrentTextDraft(true)){
      showToast('Abra uma lâmpada/atalho e edite o texto antes de salvar.','err');
    }
  };
  $('#useOfficialBtn').onclick=useOfficialVersion;
  $('#publishOfficialBtn').onclick=publishCurrentOfficialEdit;
  $('#publishLampsBtn').onclick=publishOfficialLampLayout;
  $('#moduleFrame').addEventListener('load', initializeIframeLampEditor);
  $('#prevBtn').onclick=()=>navigateModule(-1);
  $('#nextBtn').onclick=()=>navigateModule(1);
  $('#completeBtn').onclick=toggleComplete;
  $('#favoriteBtn').onclick=toggleFavorite;
  $('#openExternal').onclick=()=>{ if(currentModuleIndex>=0) window.open(MODULES[currentModuleIndex].url,'_blank','noopener'); };
  $('#homeBtn').onclick=closeViewer;
  $('#adminClose').onclick=()=>{ $('#adminModal').classList.add('hidden'); cleanupAdminRefresh(); };
  $('#adminRefresh').onclick=loadAdminDashboard;
  $('#adminLoginClose').onclick=()=>$('#adminLoginModal').classList.add('hidden');
  $('#adminLoginForm').addEventListener('submit', adminLogin);

  // Área admin oculta: 7 toques rápidos no logotipo.
  $('#brandTap').addEventListener('click',()=>{
    adminTapCount++;
    clearTimeout(adminTapReset);
    adminTapReset=setTimeout(()=>adminTapCount=0,3500);
    if(adminTapCount>=7){
      adminTapCount=0;
      if(currentProfile?.role==='admin'){
        openAdmin();
      }else{
        $('#adminLoginModal').classList.remove('hidden');
        $('#adminLoginPass').value='';
        setTimeout(()=>$('#adminLoginPass').focus(),100);
      }
    }
  });
  window.addEventListener('focus',()=>{
    if(currentModuleId()) forceOfficialSync(false);
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && currentModuleId()) forceOfficialSync(false);
  });

}

function switchAuthTab(mode){
  $('#tabLogin').classList.toggle('active',mode==='login');
  $('#tabRegister').classList.toggle('active',mode==='register');
  $('#loginForm').classList.toggle('hidden',mode!=='login');
  $('#registerForm').classList.toggle('hidden',mode!=='register');
}

async function register(e){
  e.preventDefault();
  const name=$('#regName').value.trim();
  const username=sanitizeUsername($('#regUser').value);
  const password=$('#regPass').value;
  if(username.length<3) return showToast('Login deve ter pelo menos 3 caracteres.','err');
  if(password.length<6) return showToast('Senha deve ter pelo menos 6 caracteres.','err');

  const {data,error}=await supabase.auth.signUp({
    email:usernameToEmail(username), password,
    options:{data:{display_name:name,username}}
  });
  if(error) return showToast(error.message,'err');

  if(data.session?.user){
    showToast('Cadastro criado. Aguardando liberação do administrador.');
    await enterApp(data.session.user);
  }else{
    showToast('Cadastro criado, mas o Supabase ainda exige confirmação de e-mail. Desative Confirm Email.','err');
  }
}

async function login(e){
  e.preventDefault();
  const username=sanitizeUsername($('#loginUser').value);
  const password=$('#loginPass').value;
  const {data,error}=await supabase.auth.signInWithPassword({
    email: usernameToEmail(username), password
  });
  if(error) return showToast('Login ou senha inválidos.','err');
  await enterApp(data.user);
}

async function fetchOwnProfile(){
  if(!currentUser) return null;
  const {data,error}=await supabase.from('profiles').select('*').eq('id',currentUser.id).single();
  if(error){
    showToast('Perfil não carregado. Execute a migration_access_approval.sql no Supabase.','err');
    return null;
  }
  return data;
}

async function enterApp(user){
  currentUser=user;
  const profile=await fetchOwnProfile();
  if(!profile) return;
  currentProfile=profile;

  if(!isApproved(profile)){
    showAccessGate(profile);
    return;
  }

  cleanupAccessPoll();
  $('#memberName').textContent=profile.display_name || profile.username;
  $('#memberLogin').textContent='@'+profile.username;
  setView('#appView');
  updateViewerRoleControls();

  if(!currentSessionId) await startAccessSession();
  await loadProgress();
  renderModules();
  renderFlow();
  updateProgressUI();
}

function showAccessGate(profile){
  cleanupHeartbeat();
  cleanupAccessPoll();
  currentProfile=profile;

  const pending=profile.access_status==='pending';
  const blocked=profile.access_status==='blocked';
  $('#accessMemberName').textContent=profile.display_name || profile.username;
  $('#accessMemberLogin').textContent='@'+profile.username;
  $('#accessStatusIcon').textContent=pending?'⏳':blocked?'⛔':'⚠️';
  $('#accessStatusBadge').textContent=pending?'PENDENTE':blocked?'BLOQUEADO':'ATUALIZAÇÃO NECESSÁRIA';
  $('#accessStatusBadge').className='access-badge '+(pending?'pending':blocked?'blocked':'unknown');

  if(pending){
    $('#accessStatusTitle').textContent='Aguardando liberação do administrador';
    $('#accessStatusMessage').textContent='Seu cadastro foi realizado com sucesso. O administrador pode liberar seu acesso remotamente pelo painel administrativo.';
    $('#accessAutoText').textContent='Esta tela verifica automaticamente a liberação a cada 15 segundos.';
  }else if(blocked){
    $('#accessStatusTitle').textContent='Acesso bloqueado';
    $('#accessStatusMessage').textContent='Seu cadastro continua salvo, mas o acesso ao portal está bloqueado. O administrador pode liberar novamente sem necessidade de novo cadastro.';
    $('#accessAutoText').textContent='Esta tela verifica automaticamente uma nova liberação a cada 15 segundos.';
  }else{
    $('#accessStatusTitle').textContent='Atualização do banco necessária';
    $('#accessStatusMessage').textContent='O perfil ainda não possui o novo campo de autorização. Execute migration_access_approval.sql no SQL Editor do Supabase antes de usar esta versão.';
    $('#accessAutoText').textContent='Depois da atualização, toque em Verificar liberação.';
  }

  setView('#accessView');
  if(pending || blocked){
    accessPollTimer=setInterval(()=>checkAccessStatus(false),15000);
  }
}

async function checkAccessStatus(manual=false){
  const profile=await fetchOwnProfile();
  if(!profile) return;
  currentProfile=profile;
  if(isApproved(profile)){
    cleanupAccessPoll();
    if(manual) showToast('Acesso liberado!');
    await enterApp(currentUser);
  }else{
    showAccessGate(profile);
    if(manual) showToast(profile.access_status==='blocked'?'O acesso continua bloqueado.':'Aguardando liberação do administrador.','err');
  }
}

async function logout(){
  await endAccessSession();
  cleanupAccessPoll();
  cleanupAdminRefresh();
  await supabase.auth.signOut();
}

async function startAccessSession(){
  const {data,error}=await supabase.from('access_sessions').insert({
    user_id:currentUser.id,
    user_agent:navigator.userAgent,
    current_module:null
  }).select('id').single();
  if(!error && data) currentSessionId=data.id;
  cleanupHeartbeat();
  heartbeatTimer=setInterval(heartbeat,60000);
}

async function heartbeat(){
  if(!currentUser) return;

  // Confere se o administrador bloqueou o usuário durante a sessão.
  const profile=await fetchOwnProfile();
  if(profile){
    currentProfile=profile;
    if(!isApproved(profile)){
      await endAccessSession();
      if(!$('#viewer').classList.contains('hidden')){
        $('#viewer').classList.add('hidden');
        $('#moduleFrame').src='about:blank';
        document.body.classList.remove('no-scroll');
        currentModuleIndex=-1;
      }
      showAccessGate(profile);
      return;
    }
  }

  if(!currentSessionId) return;
  await supabase.from('access_sessions').update({
    last_seen_at:new Date().toISOString(),
    current_module: currentModuleIndex>=0 ? MODULES[currentModuleIndex].code : null
  }).eq('id',currentSessionId).eq('user_id',currentUser.id);
}

async function endAccessSession(){
  if(currentSessionId){
    await supabase.from('access_sessions').update({
      last_seen_at:new Date().toISOString(),
      ended_at:new Date().toISOString()
    }).eq('id',currentSessionId).eq('user_id',currentUser.id);
  }
  currentSessionId=null;
  cleanupHeartbeat();
}
function cleanupHeartbeat(){
  if(heartbeatTimer){ clearInterval(heartbeatTimer); heartbeatTimer=null; }
}

async function loadProgress(){
  const {data}=await supabase.from('module_progress').select('*').eq('user_id',currentUser.id);
  progressMap={}; favorites=new Set();
  (data||[]).forEach(r=>{
    progressMap[r.module_id]=r;
    if(r.favorite) favorites.add(r.module_id);
  });
}
async function saveProgress(moduleId, patch){
  const existing=progressMap[moduleId]||{};
  const row={
    user_id:currentUser.id,
    module_id:moduleId,
    visited:existing.visited||false,
    completed:existing.completed||false,
    favorite:existing.favorite||false,
    last_opened_at:existing.last_opened_at||null,
    ...patch
  };
  const {data,error}=await supabase.from('module_progress').upsert(row,{onConflict:'user_id,module_id'}).select().single();
  if(!error && data){
    progressMap[moduleId]=data;
    if(data.favorite) favorites.add(moduleId); else favorites.delete(moduleId);
  }
  updateProgressUI();
  renderModules();
  renderFlow();
}

function renderModules(){
  const q=$('#search').value.trim().toLowerCase();
  const filtered=MODULES.filter(m=>
    !q || m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
  );
  $('#moduleGrid').innerHTML=filtered.map(m=>{
    const p=progressMap[m.id]||{};
    return `<button class="module-card ${p.completed?'done':''}" data-id="${m.id}">
      <div class="module-top"><span class="module-code">${m.code}</span><span class="star">${p.favorite?'★':'☆'}</span></div>
      <strong>${m.title}</strong>
      <small>${p.completed?'✅ Concluído':p.visited?'🟡 Em andamento':'○ Não iniciado'}</small>
    </button>`;
  }).join('');
  $$('#moduleGrid .module-card').forEach(b=>b.onclick=()=>openModule(b.dataset.id));
}

function renderFlow(){
  $('#processFlow').innerHTML=MODULES.map((m,i)=>{
    const p=progressMap[m.id]||{};
    return `<button class="flow-node ${p.completed?'done':''}" data-id="${m.id}">
      <span>${i+1}</span><b>${m.code}</b><small>${m.title}</small>
    </button>`;
  }).join('<div class="flow-arrow">↓</div>');
  $$('#processFlow .flow-node').forEach(b=>b.onclick=()=>openModule(b.dataset.id));
}

function updateProgressUI(){
  const completed=MODULES.filter(m=>progressMap[m.id]?.completed).length;
  const pct=Math.round(completed/MODULES.length*100);
  $('#progressBar').style.width=pct+'%';
  $('#progressText').textContent=`${completed} de ${MODULES.length} módulos concluídos — ${pct}%`;

  const last=MODULES
    .map(m=>({m,p:progressMap[m.id]}))
    .filter(x=>x.p?.last_opened_at)
    .sort((a,b)=>new Date(b.p.last_opened_at)-new Date(a.p.last_opened_at))[0];

  $('#continueBtn').disabled=!last && completed===MODULES.length;
  $('#continueBtn').dataset.id=last?.m.id || MODULES.find(m=>!progressMap[m.id]?.completed)?.id || MODULES[0].id;
}

async function openModule(id){
  const idx=MODULES.findIndex(m=>m.id===id);
  if(idx<0) return;
  currentModuleIndex=idx;
  const m=MODULES[idx];
  lampEditMode=false;
  iframeLampEditor=null;
  iframeContentBridge=null;
  officialModuleEdits={};
  officialLampLayout=null;
  lastTextItemId=null;
  updateViewerLampEditUI();
  updateOfficialEditUI();
  updateViewerRoleControls();

  await loadOfficialModuleData(m.id,{applyCurrent:false,silent:false});
  startOfficialSync();

  $('#viewerTitle').textContent=`${m.code} — ${m.title}`;
  $('#moduleFrame').src=m.url;
  $('#viewer').classList.remove('hidden');
  document.body.classList.add('no-scroll');

  await saveProgress(m.id,{visited:true,last_opened_at:new Date().toISOString()});
  updateViewerButtons();
  heartbeat();
}
function closeViewer(){
  stopOfficialSync();
  capturePersonalDraftIfNeeded();
  lampEditMode=false;
  iframeLampEditor=null;
  iframeContentBridge=null;
  officialModuleEdits={};
  officialLampLayout=null;
  updateViewerLampEditUI();
  updateOfficialEditUI();
  $('#viewer').classList.add('hidden');
  $('#moduleFrame').src='about:blank';
  document.body.classList.remove('no-scroll');
  currentModuleIndex=-1;
  heartbeat();
}
function navigateModule(delta){
  const n=currentModuleIndex+delta;
  if(n>=0 && n<MODULES.length) openModule(MODULES[n].id);
}
function updateViewerButtons(){
  const m=MODULES[currentModuleIndex], p=progressMap[m.id]||{};
  $('#prevBtn').disabled=currentModuleIndex<=0;
  $('#nextBtn').disabled=currentModuleIndex>=MODULES.length-1;
  $('#completeBtn').textContent=p.completed?'✓ Concluído':'Marcar como concluído';
  $('#completeBtn').classList.toggle('done',!!p.completed);
  $('#favoriteBtn').textContent=p.favorite?'★ Favorito':'☆ Favoritar';
  updateOfficialEditUI();
}
async function toggleComplete(){
  const m=MODULES[currentModuleIndex], p=progressMap[m.id]||{};
  await saveProgress(m.id,{completed:!p.completed,visited:true,last_opened_at:new Date().toISOString()});
  updateViewerButtons();
}
async function toggleFavorite(){
  const m=MODULES[currentModuleIndex], p=progressMap[m.id]||{};
  await saveProgress(m.id,{favorite:!p.favorite});
  updateViewerButtons();
}
function continueTraining(){
  const id=$('#continueBtn').dataset.id;
  if(id) openModule(id);
}



/* ==========================================================
   V8 — SEGUNDO MODELO DE EDIÇÃO
   - rascunho pessoal: somente neste navegador
   - publicação oficial: Supabase, visível para todos
   ========================================================== */

function currentModuleId(){
  return currentModuleIndex>=0 ? MODULES[currentModuleIndex].id : null;
}

function personalDraftKey(itemId){
  const moduleId=currentModuleId();
  return moduleId && itemId ? `u39-personal-draft-v1:${moduleId}:${itemId}` : null;
}

function getPersonalDraft(itemId){
  const key=personalDraftKey(itemId);
  if(!key) return null;
  try{
    return JSON.parse(localStorage.getItem(key)||'null');
  }catch(_){
    return null;
  }
}

function savePersonalDraft(itemId,draft){
  const key=personalDraftKey(itemId);
  if(!key || !draft?.html) return;
  localStorage.setItem(key,JSON.stringify({
    title:draft.title||'',
    subtitle:draft.subtitle||'',
    html:draft.html,
    updated_at:new Date().toISOString()
  }));
  updateOfficialEditUI();
}

function clearPersonalDraft(itemId){
  const key=personalDraftKey(itemId);
  if(key) localStorage.removeItem(key);
  updateOfficialEditUI();
}

function expectedEquipmentTag(itemId){
  const id=String(itemId||'').trim().toLowerCase();
  let m=id.match(/^([efjcd])(\d{4})$/);
  if(m) return `${m[1].toUpperCase()}-${m[2]}`;
  m=id.match(/^(pic|fic|lic|tic|hic|ffic|pdic|pdi|pi|fv|xv|zic|tdic)(\d{4,5}[a-z]?)$/);
  if(m) return `${m[1].toUpperCase()}-${m[2].toUpperCase()}`;
  return null;
}

function extractEquipmentTags(text){
  const raw=String(text||'').toUpperCase();
  const matches=raw.match(/\b(?:E|F|J|C|D)-?\d{4}\b|\b(?:PIC|FIC|LIC|TIC|HIC|FFIC|PDIC|PDI|PI|FV|XV|ZIC|TDIC)-?\d{4,5}[A-Z]?\b/g)||[];
  return [...new Set(matches.map(tag=>{
    const m=tag.match(/^([A-Z]+)-?(.+)$/);
    return m ? `${m[1]}-${m[2]}` : tag;
  }))];
}

function officialEditMatchesItem(itemId,row){
  const expected=expectedEquipmentTag(itemId);
  if(!expected || !row) return true;
  const tags=extractEquipmentTags(`${row.title||''} ${row.subtitle||''}`);
  if(!tags.length) return true;
  return tags.includes(expected);
}

async function loadOfficialModuleData(moduleId,{applyCurrent=false,silent=false}={}){
  const previousEdits=officialModuleEdits || {};
  const previousLamp=officialLampLayout;

  // Texto oficial: primeiro usa a RPC v14, que valida usuário aprovado
  // dentro do banco. Se a migration ainda não foi aplicada, cai no SELECT direto.
  let editsData=null;
  let editsError=null;
  let readMode='rpc';

  const rpcRes=await supabase.rpc('get_official_page_edits',{p_module_id:moduleId});

  if(!rpcRes.error){
    editsData=rpcRes.data || [];
  }else{
    readMode='direct';
    const directRes=await supabase
      .from('official_page_edits')
      .select('module_id,item_id,title,subtitle,content_html,updated_at,updated_by')
      .eq('module_id',moduleId);

    editsData=directRes.data || [];
    editsError=directRes.error || rpcRes.error;
  }

  const lampsRes=await supabase
    .from('official_lamp_layouts')
    .select('module_id,positions,updated_at,updated_by')
    .eq('module_id',moduleId)
    .maybeSingle();

  if(editsError || lampsRes.error){
    const message=(editsError?.message||'')+' '+(lampsRes.error?.message||'');
    if(/does not exist|schema cache|relation|function .* does not exist/i.test(message)){
      officialTablesAvailable=false;
      if(!silent){
        showToast('Execute migration_official_text_sync_v14.sql no Supabase.','err');
      }
    }else{
      console.warn('Sincronização oficial:',editsError,lampsRes.error);
      if(!silent){
        showToast('Falha ao ler conteúdo oficial: '+(editsError?.message||lampsRes.error?.message||'erro desconhecido'),'err');
      }
    }
    updateOfficialEditUI();
    return {ok:false,changed:false,readMode,error:editsError||lampsRes.error};
  }

  officialTablesAvailable=true;

  const nextEdits={};
  const rejectedEdits=[];
  (editsData||[]).forEach(row=>{
    if(officialEditMatchesItem(row.item_id,row)){
      nextEdits[row.item_id]=row;
    }else{
      rejectedEdits.push(row);
      console.warn('Edição oficial cruzada ignorada:',row.item_id,row.title);
    }
  });
  officialModuleEdits=nextEdits;
  officialLampLayout=lampsRes.data||null;
  officialLastSyncAt=new Date();

  const oldSig=JSON.stringify(
    Object.values(previousEdits).map(r=>[r.item_id,r.updated_at]).sort()
  );
  const newSig=JSON.stringify(
    Object.values(nextEdits).map(r=>[r.item_id,r.updated_at]).sort()
  );
  const lampChanged=(previousLamp?.updated_at||null)!==(officialLampLayout?.updated_at||null);
  const changed=oldSig!==newSig || lampChanged;

  if(applyCurrent && currentModuleId()===moduleId){
    const editingNow=isTextActivelyBeingEdited();
    const itemId=getCurrentChildItemId();

    if(itemId && !editingNow){
      applyEffectiveContent(itemId);
    }

    if(lampChanged && iframeLampEditor?.items?.length && !editingNow){
      applyOfficialLampPositions();
      loadViewerLampPositions();
    }
  }

  updateOfficialEditUI();
  return {ok:true,changed,readMode,count:Object.keys(nextEdits).length,rejectedCount:rejectedEdits.length};
}

function stopOfficialSync(){
  if(officialSyncTimer){
    clearInterval(officialSyncTimer);
    officialSyncTimer=null;
  }
}

function startOfficialSync(){
  stopOfficialSync();

  // Sincronização automática enquanto uma one page estiver aberta.
  officialSyncTimer=setInterval(async()=>{
    const moduleId=currentModuleId();
    if(!moduleId || document.hidden) return;

    if(isTextActivelyBeingEdited()){
      saveCurrentTextDraft(false);
      return;
    }

    await loadOfficialModuleData(moduleId,{applyCurrent:true,silent:true});
  },4000);
}

async function forceOfficialSync(showMessage=true){
  // A sincronização automática continua ativa para usuários.
  // O botão/manual é administrativo; chamadas internas com showMessage=false
  // continuam permitidas para manter o conteúdo atualizado.
  if(showMessage && currentProfile?.role!=='admin') return false;

  const moduleId=currentModuleId();
  if(!moduleId){
    if(showMessage) showToast('Abra uma one page para sincronizar.','err');
    return false;
  }

  const editingNow=isTextActivelyBeingEdited();
  const result=await loadOfficialModuleData(moduleId,{
    applyCurrent:!editingNow,
    silent:!showMessage
  });

  if(result?.ok && showMessage){
    const mode=result.readMode==='rpc' ? 'RPC' : 'leitura direta';
    if(editingNow){
      showToast('Edição em andamento: sincronização adiada para preservar o cursor.');
    }else{
      showToast(
        result.changed
          ? `Conteúdo oficial atualizado (${mode}, ${result.count||0} itens).`
          : `Sincronizado (${mode}, ${result.count||0} itens oficiais).`
      );
    }
  }
  return !!result?.ok;
}

function normalizeChildPageToU39Standard(doc){
  if(!doc?.body) return null;

  const already=doc.querySelector('[data-u39-role="text-body"]');
  if(already){
    return {
      body:already,
      title:doc.querySelector('[data-u39-role="text-title"]'),
      subtitle:doc.querySelector('[data-u39-role="text-subtitle"]'),
      saveBtn:doc.querySelector('[data-u39-role="save-text"]'),
      resetBtn:doc.querySelector('[data-u39-role="reset-text"]'),
      editBtn:doc.querySelector('[data-u39-role="edit-mode"]'),
      pattern:doc.documentElement.dataset.u39Pattern || 'normalized'
    };
  }

  let pattern='generic';
  let body=null, title=null, subtitle=null;

  // Padrão 1 — E-3904/05
  body=doc.querySelector('#body');
  title=doc.querySelector('#title');
  subtitle=doc.querySelector('#subtitle');
  if(body) pattern='legacy-body';

  // Padrão 2 — E-3906 até E-3913 + Merox Gasolina
  if(!body){
    body=doc.querySelector('#panelBody');
    title=doc.querySelector('#panelTitle');
    subtitle=doc.querySelector('#panelSubtitle');
    if(body) pattern='panel';
  }

  // Padrão 3 — E-3914
  if(!body){
    body=doc.querySelector('#drawerBody');
    title=doc.querySelector('#drawerTitle');
    subtitle=doc.querySelector('#drawerSub');
    if(body) pattern='drawer';
  }

  // Fallback para páginas futuras.
  if(!body){
    body=doc.querySelector(
      '.panelbody,.panel-body,.drawer-body,.info-panel .body,' +
      'aside.info-panel .body,[contenteditable="true"]'
    );
    if(body) pattern='generic-class';
  }

  if(!body) return null;

  const shell=body.closest('.panel,.drawer,.info-panel,aside,section');

  if(!title){
    title=shell?.querySelector(
      '#panelTitle,#title,#drawerTitle,h2,h3,[class*="title"]'
    ) || null;
  }

  if(!subtitle){
    subtitle=shell?.querySelector(
      '#panelSubtitle,#subtitle,#drawerSub,.subtitle,.drawer-sub,[class*="subtitle"]'
    ) || null;
  }

  const buttons=[...doc.querySelectorAll('button,input[type="button"],input[type="submit"]')];

  const saveBtn=doc.querySelector('#saveBtn') || buttons.find(el=>{
    const txt=(el.textContent||el.value||'').trim().toLowerCase();
    return txt.includes('salvar');
  }) || null;

  const resetBtn=doc.querySelector('#resetBtn') || buttons.find(el=>{
    const txt=(el.textContent||el.value||'').trim().toLowerCase();
    return txt.includes('restaurar') || txt.includes('reset');
  }) || null;

  const editBtn=doc.querySelector('#editBtn') || buttons.find(el=>{
    const txt=(el.textContent||el.value||'').trim().toLowerCase();
    return txt.includes('modo edi') || txt.includes('edição') || txt.includes('edicao');
  }) || null;

  body.dataset.u39Role='text-body';
  if(title) title.dataset.u39Role='text-title';
  if(subtitle) subtitle.dataset.u39Role='text-subtitle';
  if(saveBtn) saveBtn.dataset.u39Role='save-text';
  if(resetBtn) resetBtn.dataset.u39Role='reset-text';
  if(editBtn) editBtn.dataset.u39Role='edit-mode';

  doc.querySelectorAll('[data-id]').forEach(el=>{
    if(el.dataset.id) el.dataset.u39ItemId=el.dataset.id;
  });

  const summaryBtn=doc.querySelector('#summaryBtn');
  if(summaryBtn) summaryBtn.dataset.u39ItemId='summary';

  const openFlow=doc.querySelector('#openFlow');
  if(openFlow) openFlow.dataset.u39ItemId='flow';

  doc.documentElement.dataset.u39Pattern=pattern;
  doc.documentElement.dataset.u39Standard='1';

  return {body,title,subtitle,saveBtn,resetBtn,editBtn,pattern};
}

function getChildPanel(doc){
  return normalizeChildPageToU39Standard(doc);
}

function setChildTextEditMode(on){
  const doc=iframeLampEditor?.doc;
  if(!doc) return;

  const standard=normalizeChildPageToU39Standard(doc);
  if(!standard?.body) return;

  standard.body.contentEditable=on ? 'true' : 'false';
  standard.body.dataset.u39TextEditable=on ? '1' : '0';
  doc.body.classList.toggle('u39-central-text-edit',!!on);

  // Mantém também o botão nativo em sincronia, sem depender dele.
  const native=standard.editBtn;
  if(native){
    const nativeActive=
      doc.body.classList.contains('editmode') ||
      native.classList.contains('active') ||
      /edição ativa|edicao ativa/i.test(native.textContent||'');

    if(nativeActive!==!!on && !syncingChildEditButton){
      syncingChildEditButton=true;
      try{ native.click(); }catch(_){}
      setTimeout(()=>{ syncingChildEditButton=false; },0);
    }

    // Alguns scripts nativos reescrevem contentEditable depois do clique.
    setTimeout(()=>{
      const again=normalizeChildPageToU39Standard(doc);
      if(again?.body){
        again.body.contentEditable=on ? 'true' : 'false';
        again.body.dataset.u39TextEditable=on ? '1' : '0';
      }
    },40);
  }
}

function isTextActivelyBeingEdited(){
  const doc=iframeLampEditor?.doc;
  if(!doc) return false;
  const standard=normalizeChildPageToU39Standard(doc);
  const body=standard?.body;
  if(!body) return false;
  const active=doc.activeElement;
  const focusInside=!!active && (active===body || body.contains(active));
  return !!(lampEditMode || body.dataset.u39TextEditable==='1' || focusInside);
}

function getActiveChildItemId(){
  const doc=iframeLampEditor?.doc;
  if(!doc) return null;
  const active=doc.querySelector(
    '[data-u39-item-id].active,' +
    '.quick.active[data-id],.quick-card.active[data-id],' +
    '.hotspot.active[data-id],button.lamp.active[data-id],.lamp.active[data-id],' +
    '[data-id].active'
  );
  return active?.dataset?.u39ItemId || active?.dataset?.id || null;
}

function panelMatchesItem(itemId,panel){
  if(!itemId || !panel) return false;
  const expected=expectedEquipmentTag(itemId);
  if(!expected) return true;
  const tags=extractEquipmentTags(
    `${panel.title?.textContent||''} ${panel.subtitle?.textContent||''}`
  );
  if(!tags.length) return true;
  return tags.includes(expected);
}

function getCurrentChildItemId(){
  const activeId=getActiveChildItemId();
  if(activeId) return activeId;

  if(iframeContentBridge?.currentItemId) return iframeContentBridge.currentItemId;
  if(iframeContentBridge?.lastDraftItemId) return iframeContentBridge.lastDraftItemId;
  if(iframeContentBridge?.lastItemId) return iframeContentBridge.lastItemId;
  if(lastTextItemId) return lastTextItemId;
  return null;
}

function childIsEditMode(){
  const doc=iframeLampEditor?.doc;
  if(!doc) return false;

  const standard=normalizeChildPageToU39Standard(doc);
  const btn=standard?.editBtn;

  return lampEditMode ||
         standard?.body?.dataset?.u39TextEditable==='1' ||
         standard?.body?.isContentEditable ||
         doc.body.classList.contains('editmode') ||
         btn?.classList.contains('active') ||
         /edição ativa|edicao ativa/i.test(btn?.textContent||'');
}

function captureCurrentChildContent(){
  const doc=iframeLampEditor?.doc;
  if(!doc) return null;

  const panel=getChildPanel(doc);
  if(!panel || !panel.body || !panel.body.innerHTML.trim()) return null;

  // A própria one page (.active) tem prioridade.
  let itemId=getActiveChildItemId() || getCurrentChildItemId();
  if(!itemId) return null;

  // Nunca associa o painel visível a outro equipamento.
  if(!panelMatchesItem(itemId,panel)) return null;

  lastTextItemId=itemId;
  if(iframeContentBridge){
    iframeContentBridge.currentItemId=itemId;
    iframeContentBridge.lastItemId=itemId;
    iframeContentBridge.pendingItemId=null;
  }

  return {
    itemId,
    title:panel.title?.textContent||'',
    subtitle:panel.subtitle?.textContent||'',
    html:panel.body.innerHTML
  };
}


let textDraftSaveTimer=null;

function saveCurrentTextDraft(showMessage=true){
  const activeId=getActiveChildItemId();
  if(activeId && iframeContentBridge){
    iframeContentBridge.currentItemId=activeId;
  }

  const current=captureCurrentChildContent();
  if(!current) return false;

  savePersonalDraft(current.itemId,current);
  lastTextItemId=current.itemId;

  if(iframeContentBridge){
    iframeContentBridge.currentItemId=current.itemId;
    iframeContentBridge.lastItemId=current.itemId;
    iframeContentBridge.lastDraftItemId=current.itemId;
  }

  if(showMessage){
    showToast('Rascunho de texto salvo neste aparelho.');
  }
  updateOfficialEditUI();
  return true;
}

function capturePersonalDraftIfNeeded(){
  if(!iframeLampEditor?.doc || !childIsEditMode()) return;
  const current=captureCurrentChildContent();
  if(current) savePersonalDraft(current.itemId,current);
}

function detectLegacyLocalDraft(panel,itemId){
  // A partir da v13 não transformamos automaticamente o localStorage antigo
  // das one pages em rascunho do portal. Essa migração podia fazer um texto
  // antigo do celular ter prioridade sobre uma publicação oficial nova.
  // Rascunhos do portal continuam sendo salvos normalmente pelo botão
  // "Salvar texto" e pelo autosave durante edição.
  return;
}

function effectiveEditFor(itemId){
  let personal=getPersonalDraft(itemId);
  const official=officialModuleEdits[itemId];

  if(personal && !officialEditMatchesItem(itemId,personal)){
    clearPersonalDraft(itemId);
    personal=null;
    console.warn('Rascunho pessoal cruzado removido:',itemId);
  }

  if(personal && official){
    const personalTime=personal.updated_at ? new Date(personal.updated_at).getTime() : 0;
    const officialTime=official.updated_at ? new Date(official.updated_at).getTime() : 0;

    if(officialTime >= personalTime){
      return {
        source:'official',
        title:official.title||'',
        subtitle:official.subtitle||'',
        html:official.content_html||'',
        updated_at:official.updated_at
      };
    }
    return {source:'personal',...personal};
  }

  if(personal) return {source:'personal',...personal};

  if(official){
    return {
      source:'official',
      title:official.title||'',
      subtitle:official.subtitle||'',
      html:official.content_html||'',
      updated_at:official.updated_at
    };
  }
  return null;
}

function applyEffectiveContent(itemId,attempt=0,force=false){
  if(!force && isTextActivelyBeingEdited()) return false;
  const doc=iframeLampEditor?.doc;
  const panel=getChildPanel(doc);
  if(!doc || !itemId || !panel) return false;

  // Aguarda a troca nativa e exige que o painel visível corresponda ao item.
  if((!panel.body.innerHTML.trim() || !panelMatchesItem(itemId,panel)) && attempt<6){
    setTimeout(()=>applyEffectiveContent(itemId,attempt+1,force),80);
    return false;
  }

  if(!panelMatchesItem(itemId,panel)){
    console.warn('Aplicação cancelada: painel não corresponde ao item',itemId);
    return false;
  }

  detectLegacyLocalDraft(panel,itemId);

  const effective=effectiveEditFor(itemId);
  if(effective?.html){
    panel.body.innerHTML=effective.html;
    if(panel.title && effective.title) panel.title.textContent=effective.title;
    if(panel.subtitle && effective.subtitle) panel.subtitle.textContent=effective.subtitle;
  }

  if(iframeContentBridge) iframeContentBridge.currentItemId=itemId;

  // A troca de item pode fazer a one page recriar o conteúdo.
  // Reafirma a editabilidade do corpo padronizado.
  setChildTextEditMode(lampEditMode);
  updateOfficialEditUI();
}

function initializeIframeContentBridge(){
  const doc=iframeLampEditor?.doc;
  if(!doc) return;

  const standard=normalizeChildPageToU39Standard(doc);
  if(!standard?.body){
    showToast('Esta one page não possui área de texto editável reconhecida.','err');
    return;
  }

  iframeContentBridge={
    doc,
    currentItemId:null,
    pendingItemId:null,
    lastItemId:null,
    lastDraftItemId:null,
    pattern:standard.pattern,
    navToken:0,
    applyTimer:null
  };

  const setStableCurrent=(itemId)=>{
    if(!itemId) return;
    lastTextItemId=itemId;
    iframeContentBridge.currentItemId=itemId;
    iframeContentBridge.lastItemId=itemId;
    iframeContentBridge.pendingItemId=null;
  };

  const rememberPending=(itemId)=>{
    if(itemId) iframeContentBridge.pendingItemId=itemId;
  };

  const scheduleStableApply=(requestedId,delay=280)=>{
    if(!requestedId) return;

    const token=++iframeContentBridge.navToken;
    rememberPending(requestedId);

    if(iframeContentBridge.applyTimer){
      clearTimeout(iframeContentBridge.applyTimer);
    }

    iframeContentBridge.applyTimer=setTimeout(async()=>{
      if(!iframeContentBridge || token!==iframeContentBridge.navToken) return;

      const moduleId=currentModuleId();
      if(moduleId){
        await loadOfficialModuleData(moduleId,{applyCurrent:false,silent:true});
      }

      if(!iframeContentBridge || token!==iframeContentBridge.navToken) return;

      const activeId=getActiveChildItemId();
      const stableId=activeId || requestedId;

      // Nunca deixa um timer de clique antigo voltar o painel.
      if(activeId && activeId!==requestedId) return;

      const panel=getChildPanel(doc);
      if(!panelMatchesItem(stableId,panel)){
        // A one page pode ainda estar dentro da própria animação/troca.
        iframeContentBridge.applyTimer=setTimeout(()=>{
          if(!iframeContentBridge || token!==iframeContentBridge.navToken) return;
          const finalActive=getActiveChildItemId() || requestedId;
          const finalPanel=getChildPanel(doc);
          if(finalActive===requestedId && panelMatchesItem(finalActive,finalPanel)){
            setStableCurrent(finalActive);
            applyEffectiveContent(finalActive,0,true);
            setChildTextEditMode(lampEditMode);
          }
        },160);
        return;
      }

      setStableCurrent(stableId);
      applyEffectiveContent(stableId,0,true);
      setChildTextEditMode(lampEditMode);
      updateOfficialEditUI();
    },delay);
  };

  const findTrigger=(ev)=>{
    const trigger=ev.target.closest?.('[data-u39-item-id],[data-id]');
    if(!trigger) return null;
    return trigger.dataset.u39ItemId || trigger.dataset.id || null;
  };

  // Somente intenção: não muda o item atual antes da troca nativa terminar.
  doc.addEventListener('pointerdown',ev=>{
    const id=findTrigger(ev);
    if(id) rememberPending(id);
  },true);

  doc.addEventListener('click',ev=>{
    const id=findTrigger(ev);
    if(!id) return;

    // Captura o painel anterior sob o ID anterior, nunca sob o novo ID.
    const outgoingId=iframeContentBridge.currentItemId || getActiveChildItemId();
    if(outgoingId && outgoingId!==id && childIsEditMode()){
      const panel=getChildPanel(doc);
      if(panelMatchesItem(outgoingId,panel)){
        saveCurrentTextDraft(false);
        iframeContentBridge.lastDraftItemId=outgoingId;
      }
    }

    scheduleStableApply(id);
  },true);

  const summaryBtn=doc.querySelector('#summaryBtn');
  if(summaryBtn){
    summaryBtn.dataset.u39ItemId='summary';
    summaryBtn.addEventListener('pointerdown',()=>rememberPending('summary'),true);
    summaryBtn.addEventListener('click',()=>scheduleStableApply('summary'),true);
  }

  const openFlowBtn=doc.querySelector('#openFlow');
  if(openFlowBtn){
    openFlowBtn.dataset.u39ItemId='flow';
    openFlowBtn.addEventListener('pointerdown',()=>rememberPending('flow'),true);
    openFlowBtn.addEventListener('click',()=>scheduleStableApply('flow'),true);
  }

  const saveBtn=normalizeChildPageToU39Standard(doc)?.saveBtn;
  if(saveBtn && saveBtn.dataset.u39TextSaveBound!=='1'){
    saveBtn.dataset.u39TextSaveBound='1';
    saveBtn.addEventListener('click',()=>{
      setTimeout(()=>{
        const activeId=getActiveChildItemId();
        if(activeId) setStableCurrent(activeId);

        const panel=getChildPanel(doc);
        const id=getCurrentChildItemId();
        if(id && panelMatchesItem(id,panel) && saveCurrentTextDraft(true)){
          iframeContentBridge.lastDraftItemId=id;
        }else{
          showToast('Não foi possível confirmar qual item está aberto.','err');
        }
      },100);
    },true);
  }

  // Autosave só grava se item ativo e painel concordarem.
  doc.addEventListener('input',ev=>{
    const st=normalizeChildPageToU39Standard(doc);
    const textBody=st?.body;
    if(!textBody) return;
    if(ev.target!==textBody && !textBody.contains(ev.target)) return;

    const activeId=getActiveChildItemId();
    if(activeId && panelMatchesItem(activeId,st)){
      setStableCurrent(activeId);
    }

    clearTimeout(textDraftSaveTimer);
    textDraftSaveTimer=setTimeout(()=>{
      const panel=getChildPanel(doc);
      const id=getActiveChildItemId() || getCurrentChildItemId();
      if(id && panelMatchesItem(id,panel)){
        setStableCurrent(id);
        saveCurrentTextDraft(false);
        iframeContentBridge.lastDraftItemId=id;
      }
    },500);
  },true);

  const resetBtn=normalizeChildPageToU39Standard(doc)?.resetBtn;
  if(resetBtn){
    resetBtn.addEventListener('click',()=>{
      const itemId=getActiveChildItemId() || getCurrentChildItemId();
      setTimeout(()=>{
        if(itemId){
          clearPersonalDraft(itemId);
          applyEffectiveContent(itemId,0,true);
          setChildTextEditMode(lampEditMode);
        }
      },250);
    },true);
  }

  const closeBtn=doc.querySelector('#closeBtn');
  if(closeBtn){
    closeBtn.addEventListener('click',()=>{
      capturePersonalDraftIfNeeded();
      if(iframeContentBridge?.applyTimer) clearTimeout(iframeContentBridge.applyTimer);
      if(iframeContentBridge){
        iframeContentBridge.currentItemId=null;
        iframeContentBridge.pendingItemId=null;
      }
      updateOfficialEditUI();
    },true);
  }

  setChildTextEditMode(lampEditMode);
  updateOfficialEditUI();
}

function updateViewerRoleControls(){
  const isAdmin=currentProfile?.role==='admin';

  // Controles administrativos do rodapé do visualizador.
  // Usuário comum não deve visualizar nenhum deles.
  [
    '#viewerEditBtn',
    '#resetLampsBtn',
    '#saveTextDraftBtn',
    '#syncOfficialBtn',
    '#useOfficialBtn'
  ].forEach(selector=>{
    const el=$(selector);
    if(el) el.classList.toggle('hidden',!isAdmin);
  });

  // Publicação já era exclusiva do admin; reforçamos aqui.
  const publishBtn=$('#publishOfficialBtn');
  const publishLampsBtn=$('#publishLampsBtn');
  if(publishBtn) publishBtn.classList.toggle('hidden',!isAdmin);
  if(publishLampsBtn) publishLampsBtn.classList.toggle('hidden',!isAdmin);

  // Botões operacionais permanecem para todos:
  // Anterior, Favoritar, Marcar como concluído e Próximo.
}

function updateOfficialEditUI(){
  updateViewerRoleControls();

  const publishBtn=$('#publishOfficialBtn');
  const publishLampsBtn=$('#publishLampsBtn');
  const useOfficialBtn=$('#useOfficialBtn');
  const saveTextBtn=$('#saveTextDraftBtn');

  if(!publishBtn || !publishLampsBtn || !useOfficialBtn) return;

  const isAdmin=currentProfile?.role==='admin';
  publishBtn.classList.toggle('hidden',!isAdmin);
  publishLampsBtn.classList.toggle('hidden',!isAdmin);

  const itemId=getCurrentChildItemId();
  const hasDraft=!!(itemId && getPersonalDraft(itemId));
  const hasOfficial=!!(itemId && officialModuleEdits[itemId]);

  if(saveTextBtn) saveTextBtn.disabled=!itemId;
  useOfficialBtn.disabled=!itemId;
  useOfficialBtn.classList.toggle('has-draft',hasDraft);
  useOfficialBtn.classList.toggle('has-official',!hasDraft && hasOfficial);

  if(hasDraft){
    useOfficialBtn.textContent='↩ Descartar rascunho / usar oficial';
  }else if(hasOfficial){
    useOfficialBtn.textContent='✅ Versão oficial';
  }else{
    useOfficialBtn.textContent='↩ Conteúdo original';
  }
}

async function publishCurrentOfficialEdit(){
  if(currentProfile?.role!=='admin'){
    showToast('Somente o administrador pode publicar alterações para todos.','err');
    return;
  }
  if(!officialTablesAvailable){
    showToast('Execute migration_official_edits.sql no Supabase primeiro.','err');
    return;
  }

  // Padroniza e salva silenciosamente o conteúdo atual antes de publicar.
  if(iframeLampEditor?.doc) normalizeChildPageToU39Standard(iframeLampEditor.doc);
  saveCurrentTextDraft(false);

  let current=captureCurrentChildContent();
  const moduleId=currentModuleId();

  // Se o painel perdeu a referência visual, usa o último rascunho salvo.
  if(!current){
    const fallbackId=
      iframeContentBridge?.lastDraftItemId ||
      iframeContentBridge?.lastItemId ||
      lastTextItemId;

    const draft=fallbackId ? getPersonalDraft(fallbackId) : null;
    if(fallbackId && draft?.html){
      current={
        itemId:fallbackId,
        title:draft.title||'',
        subtitle:draft.subtitle||'',
        html:draft.html
      };
    }
  }

  if(!moduleId || !current){
    showToast('Nenhum texto editado foi localizado. Abra a lâmpada, edite e toque em Salvar alterações.','err');
    return;
  }

  if(!officialEditMatchesItem(current.itemId,{title:current.title,subtitle:current.subtitle})){
    showToast('Publicação bloqueada: o texto aberto corresponde a outro equipamento.','err');
    return;
  }

  if(!confirm(`Publicar esta edição de "${current.title||current.itemId}" para todos os usuários?`)){
    return;
  }

  const row={
    module_id:moduleId,
    item_id:current.itemId,
    title:current.title,
    subtitle:current.subtitle,
    content_html:current.html,
    updated_by:currentUser.id,
    updated_at:new Date().toISOString()
  };

  const {data,error}=await supabase
    .from('official_page_edits')
    .upsert(row,{onConflict:'module_id,item_id'})
    .select()
    .single();

  if(error){
    showToast('Não foi possível publicar: '+error.message,'err');
    return;
  }

  // Confirma a gravação por leitura independente do Supabase.
  let verify=null;
  let verifyError=null;

  const rpcVerify=await supabase.rpc('get_official_page_edits',{p_module_id:moduleId});
  if(!rpcVerify.error){
    verify=(rpcVerify.data||[]).find(r=>r.item_id===current.itemId) || null;
  }else{
    const directVerify=await supabase
      .from('official_page_edits')
      .select('module_id,item_id,title,subtitle,content_html,updated_at,updated_by')
      .eq('module_id',moduleId)
      .eq('item_id',current.itemId)
      .maybeSingle();
    verify=directVerify.data||null;
    verifyError=directVerify.error||rpcVerify.error;
  }

  if(verifyError || !verify || verify.content_html!==current.html){
    showToast('A gravação não pôde ser confirmada para leitura dos usuários.','err');
    console.warn('Falha na confirmação da publicação:',verifyError,verify);
    return;
  }

  officialModuleEdits[current.itemId]=verify;
  lastTextItemId=current.itemId;
  if(iframeContentBridge){
    iframeContentBridge.lastItemId=current.itemId;
    iframeContentBridge.lastDraftItemId=null;
  }
  clearPersonalDraft(current.itemId);
  await forceOfficialSync(false);
  showToast('Texto confirmado no Supabase e liberado para usuários aprovados.');
  updateOfficialEditUI();
}

async function publishOfficialLampLayout(){
  if(currentProfile?.role!=='admin'){
    showToast('Somente o administrador pode publicar posições oficiais.','err');
    return;
  }
  if(!officialTablesAvailable){
    showToast('Execute migration_official_edits.sql no Supabase primeiro.','err');
    return;
  }

  const moduleId=currentModuleId();
  const ed=iframeLampEditor;
  if(!moduleId || !ed?.items?.length){
    showToast('Nenhuma lâmpada foi encontrada nesta one page.','err');
    return;
  }

  const positions={};
  ed.items.forEach(item=>{
    const p=readElementPercentPosition(item.el,item.container);
    positions[item.id]={left:+p.left.toFixed(3),top:+p.top.toFixed(3)};
  });

  if(!confirm('Publicar estas posições de lâmpadas como layout oficial para todos os usuários?')){
    return;
  }

  const row={
    module_id:moduleId,
    positions,
    updated_by:currentUser.id,
    updated_at:new Date().toISOString()
  };

  const {data,error}=await supabase
    .from('official_lamp_layouts')
    .upsert(row,{onConflict:'module_id'})
    .select()
    .single();

  if(error){
    showToast('Não foi possível publicar as lâmpadas: '+error.message,'err');
    return;
  }

  officialLampLayout=data;
  showToast('Posições oficiais das lâmpadas publicadas.');
}

function useOfficialVersion(){
  const itemId=getCurrentChildItemId();
  if(!itemId){
    showToast('Selecione uma informação da one page.','err');
    return;
  }

  const hadDraft=!!getPersonalDraft(itemId);
  if(hadDraft && !confirm('Descartar seu rascunho pessoal e voltar para a versão oficial?')){
    return;
  }

  clearPersonalDraft(itemId);

  const official=officialModuleEdits[itemId];
  if(official){
    applyEffectiveContent(itemId,0,true);
    showToast('Versão oficial carregada.');
  }else{
    // Sem publicação oficial, acionamos o restaurar original da one page.
    const doc=iframeLampEditor?.doc;
    const resetBtn=doc?.querySelector('#resetBtn');
    if(resetBtn){
      resetBtn.click();
      setTimeout(()=>applyEffectiveContent(itemId,0,true),230);
    }else{
      showToast('Não existe versão oficial publicada para este item.');
    }
  }
}


/* ==========================================================
   V6 — EDITOR UNIVERSAL DE LÂMPADAS DAS ONE PAGES
   Funciona nas páginas carregadas no iframe do portal.
   Todas as páginas publicadas em robexter.github.io usam a
   mesma origem, permitindo ao portal ajustar os hotspots.
   ========================================================== */

function lampStorageKey(){
  if(currentModuleIndex < 0) return null;
  return `u39-area-fria-lamps-v1:${MODULES[currentModuleIndex].id}`;
}

function updateViewerLampEditUI(){
  const editBtn=$('#viewerEditBtn');
  const resetBtn=$('#resetLampsBtn');
  if(!editBtn || !resetBtn) return;

  const count=iframeLampEditor?.items?.length || 0;
  editBtn.disabled=currentModuleIndex<0 || count===0;
  resetBtn.disabled=currentModuleIndex<0 || count===0;
  editBtn.classList.toggle('editing',lampEditMode);
  editBtn.textContent=lampEditMode
    ? `✅ Edição das lâmpadas (${count})`
    : count
      ? `✏️ Modo edição (${count})`
      : '✏️ Modo edição';
}

function findLampCandidates(doc){
  const selectors=[
    '.hotspot[data-id]',
    'button.lamp[data-id]',
    '.lamp[data-id]',
    'button[data-id][style*="left"][style*="top"]',
    '[data-id].hotspot'
  ];

  const all=[...doc.querySelectorAll(selectors.join(','))];
  const unique=[...new Set(all)];

  return unique.filter(el=>{
    const cs=doc.defaultView.getComputedStyle(el);
    if(cs.position!=='absolute' && cs.position!=='fixed') return false;

    // Evita selecionar um span interno "lamp" quando o verdadeiro hotspot
    // é o botão pai.
    if(el.tagName!=='BUTTON' && el.parentElement?.matches?.('.hotspot[data-id],button.lamp[data-id]')){
      return false;
    }
    return true;
  });
}

function getLampIdentifier(el,index){
  return el.dataset.id || el.id || el.getAttribute('aria-label') ||
         el.getAttribute('title') || `lamp-${index}`;
}

function readElementPercentPosition(el,container){
  let left=parseFloat(el.style.left);
  let top=parseFloat(el.style.top);
  const leftIsPercent=(el.style.left||'').includes('%');
  const topIsPercent=(el.style.top||'').includes('%');

  if(leftIsPercent && topIsPercent && Number.isFinite(left) && Number.isFinite(top)){
    return {left,top};
  }

  const cr=container.getBoundingClientRect();
  const er=el.getBoundingClientRect();
  if(!cr.width || !cr.height) return {left:50,top:50};

  // A maioria das one pages usa transform: translate(-50%,-50%).
  // O centro visual é uma boa aproximação universal.
  left=((er.left + er.width/2 - cr.left)/cr.width)*100;
  top=((er.top + er.height/2 - cr.top)/cr.height)*100;
  return {left,top};
}

function initializeIframeLampEditor(){
  if(currentModuleIndex<0) return;

  const frame=$('#moduleFrame');
  let doc,win;
  try{
    doc=frame.contentDocument;
    win=frame.contentWindow;
    if(!doc || !doc.body) return;
    // Acessar location força a verificação de same-origin.
    void win.location.href;
  }catch(err){
    iframeLampEditor=null;
    updateViewerLampEditUI();
    showToast('Esta página não permite edição integrada das lâmpadas.','err');
    return;
  }

  const candidates=findLampCandidates(doc);
  const items=[];
  const defaults={};

  // CSS visual injetado no documento filho.
  let style=doc.getElementById('u39-global-lamp-editor-style');
  if(!style){
    style=doc.createElement('style');
    style.id='u39-global-lamp-editor-style';
    style.textContent=`
      body.u39-global-lamp-edit [data-u39-global-lamp="1"]{
        cursor:grab !important;
        touch-action:none !important;
        z-index:99999 !important;
        outline:1px dashed rgba(255,220,45,.95) !important;
        outline-offset:5px !important;
        filter:drop-shadow(0 0 7px rgba(255,225,55,.9)) !important;
      }
      body.u39-global-lamp-edit [data-u39-global-lamp="1"]:active{
        cursor:grabbing !important;
      }
      body.u39-central-text-edit [data-u39-role="text-body"]{
        outline:2px dashed rgba(105,184,255,.88) !important;
        outline-offset:6px !important;
        border-radius:8px !important;
        cursor:text !important;
      }
    `;
    doc.head.appendChild(style);
  }

  candidates.forEach((el,index)=>{
    const id=getLampIdentifier(el,index);
    const container=el.offsetParent || el.parentElement;
    if(!container) return;

    const pos=readElementPercentPosition(el,container);
    defaults[id]={left:pos.left,top:pos.top};
    el.dataset.u39GlobalLamp='1';

    items.push({el,id,container});
  });

  iframeLampEditor={doc,win,items,defaults,activeDrag:null};

  // Primeiro aplica o layout oficial publicado pelo administrador.
  const officialPositions=officialLampLayout?.positions || {};
  items.forEach(item=>{
    const p=officialPositions[item.id];
    if(p && Number.isFinite(p.left) && Number.isFinite(p.top)){
      item.el.style.left=`${p.left}%`;
      item.el.style.top=`${p.top}%`;
    }
  });

  // Depois aplica a posição pessoal deste navegador, quando existir.
  // Assim, o rascunho pessoal sempre prevalece sobre a versão oficial.
  const key=lampStorageKey();
  if(key){
    try{
      const saved=JSON.parse(localStorage.getItem(key)||'{}');
      items.forEach(item=>{
        const p=saved[item.id];
        if(p && Number.isFinite(p.left) && Number.isFinite(p.top)){
          item.el.style.left=`${p.left}%`;
          item.el.style.top=`${p.top}%`;
        }
      });
    }catch(err){
      console.warn('Posições das lâmpadas:',err);
    }
  }

  function savePositions(){
    const key=lampStorageKey();
    if(!key) return;
    const result={};
    items.forEach(item=>{
      const p=readElementPercentPosition(item.el,item.container);
      result[item.id]={left:+p.left.toFixed(3),top:+p.top.toFixed(3)};
    });
    localStorage.setItem(key,JSON.stringify(result));
  }

  iframeLampEditor.savePositions=savePositions;

  // Um único conjunto de listeners no documento filho.
  items.forEach(item=>{
    if(item.el.dataset.u39GlobalBound==='1') return;
    item.el.dataset.u39GlobalBound='1';

    item.el.addEventListener('pointerdown',ev=>{
      if(!lampEditMode) return;

      // Não bloqueia o toque simples. Se o usuário apenas tocar, a one page
      // ainda pode abrir a explicação. O clique só será suprimido se houver
      // arraste real.
      const container=item.el.offsetParent || item.container;
      const rect=container.getBoundingClientRect();
      iframeLampEditor.activeDrag={
        item,
        container,
        rect,
        pointerId:ev.pointerId,
        startX:ev.clientX,
        startY:ev.clientY,
        moved:false
      };
      try{ item.el.setPointerCapture(ev.pointerId); }catch(_){}
    },true);

    // Um toque simples continua abrindo o item mesmo no modo edição.
    // Apenas o clique gerado após um arraste é bloqueado.
    item.el.addEventListener('click',ev=>{
      if(item.el.dataset.u39SuppressClick==='1'){
        item.el.dataset.u39SuppressClick='0';
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    },true);
  });

  doc.addEventListener('pointermove',ev=>{
    const d=iframeLampEditor?.activeDrag;
    if(!d || !lampEditMode || ev.pointerId!==d.pointerId) return;

    ev.preventDefault();
    const rect=d.container.getBoundingClientRect();
    if(!rect.width || !rect.height) return;

    if(Math.abs(ev.clientX-d.startX)>3 || Math.abs(ev.clientY-d.startY)>3){
      d.moved=true;
    }

    let left=((ev.clientX-rect.left)/rect.width)*100;
    let top=((ev.clientY-rect.top)/rect.height)*100;
    left=Math.max(0.8,Math.min(99.2,left));
    top=Math.max(1.0,Math.min(99.0,top));

    d.item.el.style.left=`${left.toFixed(3)}%`;
    d.item.el.style.top=`${top.toFixed(3)}%`;
  },true);

  function finishDrag(ev){
    const d=iframeLampEditor?.activeDrag;
    if(!d || (ev && ev.pointerId!==d.pointerId)) return;

    if(d.moved){
      d.item.el.dataset.u39SuppressClick='1';
      savePositions();
      showToast('Posição da lâmpada salva.');
    }
    try{ d.item.el.releasePointerCapture(d.pointerId); }catch(_){}
    iframeLampEditor.activeDrag=null;
  }

  doc.addEventListener('pointerup',finishDrag,true);
  doc.addEventListener('pointercancel',finishDrag,true);

  // Se a one page já tiver seu próprio botão "Modo edição",
  // sincronizamos o editor universal com ele.
  const childEditBtn=doc.querySelector('#editBtn');
  if(childEditBtn && childEditBtn.dataset.u39GlobalSync!=='1'){
    childEditBtn.dataset.u39GlobalSync='1';
    childEditBtn.addEventListener('click',()=>{
      if(syncingChildEditButton) return;
      setTimeout(()=>{
        const active=doc.body.classList.contains('editmode') ||
                     childEditBtn.classList.contains('active') ||
                     /edição ativa/i.test(childEditBtn.textContent||'');
        lampEditMode=active;
        doc.body.classList.toggle('u39-global-lamp-edit',lampEditMode);
        updateViewerLampEditUI();
      },0);
    });
  }

  // Normaliza qualquer família de one page para o mesmo contrato interno.
  normalizeChildPageToU39Standard(doc);

  doc.body.classList.toggle('u39-global-lamp-edit',lampEditMode);
  setChildTextEditMode(lampEditMode);
  updateViewerLampEditUI();
  initializeIframeContentBridge();
  updateOfficialEditUI();
}

function setViewerLampEdit(on){
  if(currentProfile?.role!=='admin'){
    lampEditMode=false;
    updateViewerRoleControls();
    return;
  }

  const wasEditing=lampEditMode;

  if(wasEditing && !on){
    saveCurrentTextDraft(false);
  }

  lampEditMode=!!on;

  const ed=iframeLampEditor;
  if(ed?.doc?.body){
    ed.doc.body.classList.toggle('u39-global-lamp-edit',lampEditMode);
    setChildTextEditMode(lampEditMode);
  }

  updateViewerLampEditUI();

  if(iframeLampEditor){
    showToast(lampEditMode
      ? 'Modo edição ativo. Cursor protegido durante a digitação.'
      : 'Edição encerrada e rascunho preservado.');
  }
}

function toggleViewerLampEdit(){
  if(!iframeLampEditor?.items?.length){
    showToast('Nenhuma lâmpada editável foi encontrada nesta one page.','err');
    return;
  }
  setViewerLampEdit(!lampEditMode);
}

function restoreViewerLampPositions(){
  const ed=iframeLampEditor;
  if(!ed?.items?.length) return;

  if(!confirm('Restaurar todas as lâmpadas desta one page para as posições originais?')){
    return;
  }

  const key=lampStorageKey();
  if(key) localStorage.removeItem(key);

  const officialPositions=officialLampLayout?.positions || {};
  ed.items.forEach(item=>{
    const p=officialPositions[item.id] || ed.defaults[item.id];
    if(!p) return;
    item.el.style.left=`${p.left}%`;
    item.el.style.top=`${p.top}%`;
  });

  showToast(officialLampLayout
    ? 'Posições pessoais removidas. Layout oficial restaurado.'
    : 'Posições originais das lâmpadas restauradas.');
}


async function adminLogin(e){
  e.preventDefault();
  const password=$('#adminLoginPass').value;
  if(!password) return;

  const {data,error}=await supabase.auth.signInWithPassword({
    email:'admin@u39concept.app', password
  });
  if(error) return showToast('Login administrativo inválido.','err');

  currentUser=data.user;
  const profile=await fetchOwnProfile();
  if(!profile || profile.role!=='admin'){
    await supabase.auth.signOut();
    return showToast('Conta sem permissão de administrador.','err');
  }

  currentProfile=profile;
  $('#memberName').textContent=profile.display_name || profile.username;
  $('#memberLogin').textContent='@'+profile.username;
  updateViewerRoleControls();
  $('#adminLoginModal').classList.add('hidden');

  if(!currentSessionId) await startAccessSession();
  await loadProgress();
  renderModules();
  renderFlow();
  updateProgressUI();
  setView('#appView');
  await openAdmin();
}

async function openAdmin(){
  if(!currentProfile || currentProfile.role!=='admin'){
    showToast('Área restrita.','err');
    return;
  }
  $('#adminModal').classList.remove('hidden');
  await loadAdminDashboard();
  cleanupAdminRefresh();
  adminRefreshTimer=setInterval(loadAdminDashboard,30000);
}

function accessText(status){
  if(status==='approved') return 'Liberado';
  if(status==='blocked') return 'Bloqueado';
  return 'Pendente';
}
function accessClass(status){
  if(status==='approved') return 'approved';
  if(status==='blocked') return 'blocked';
  return 'pending';
}

async function setUserAccess(userId,newStatus){
  if(currentProfile?.role!=='admin') return;
  const action=newStatus==='approved'?'liberar':'bloquear';
  const {error}=await supabase.rpc('set_user_access',{
    target_user_id:userId,
    new_status:newStatus
  });
  if(error){
    showToast(`Não foi possível ${action} o usuário: ${error.message}`,'err');
    return;
  }
  showToast(newStatus==='approved'?'Acesso liberado remotamente.':'Usuário bloqueado.');
  await loadAdminDashboard();
}

async function loadAdminDashboard(){
  if(currentProfile?.role!=='admin') return;
  $('#adminBody').innerHTML='<div class="loading">Carregando usuários e acessos...</div>';

  const [{data:profiles,error:pe},{data:sessions,error:se}] = await Promise.all([
    supabase.from('profiles').select('id,username,display_name,created_at,role,access_status,approved_at,access_updated_at'),
    supabase.from('access_sessions').select('id,user_id,started_at,last_seen_at,ended_at,current_module').order('started_at',{ascending:false}).limit(1000)
  ]);

  if(pe||se){
    $('#adminBody').innerHTML='<div class="error-box">Não foi possível carregar o controle de acesso. Execute <strong>migration_access_approval.sql</strong> no SQL Editor do Supabase e tente novamente.</div>';
    return;
  }

  const now=Date.now();
  const byUser=new Map();
  (profiles||[]).forEach(p=>byUser.set(p.id,{profile:p,sessions:[]}));
  (sessions||[]).forEach(s=>{
    if(byUser.has(s.user_id)) byUser.get(s.user_id).sessions.push(s);
  });

  const rows=[...byUser.values()].map(x=>{
    const ss=x.sessions;
    const last=ss[0];
    const online=last && !last.ended_at && (now-new Date(last.last_seen_at).getTime())<130000;
    const total=ss.reduce((sum,s)=>{
      const end=s.ended_at||s.last_seen_at;
      return sum+Math.max(0,elapsedMinutes(s.started_at,end));
    },0);
    const current=online ? (last.current_module||'Portal') : '—';
    const lastSeen=last ? new Date(last.last_seen_at).toLocaleString('pt-BR') : 'Nunca';
    return {...x.profile,online,total,current,lastSeen,sessions:ss.length};
  }).sort((a,b)=>{
    const order={pending:0,approved:1,blocked:2};
    return (order[a.access_status]??3)-(order[b.access_status]??3) || (b.online-a.online) || (a.display_name||a.username).localeCompare(b.display_name||b.username);
  });

  const pendingCount=rows.filter(r=>r.access_status==='pending').length;
  const approvedCount=rows.filter(r=>r.access_status==='approved' || r.role==='admin').length;
  const blockedCount=rows.filter(r=>r.access_status==='blocked').length;
  const onlineCount=rows.filter(r=>r.online).length;

  $('#adminStats').innerHTML=`
    <div><b>${pendingCount}</b><span>aguardando liberação</span></div>
    <div><b>${approvedCount}</b><span>acessos liberados</span></div>
    <div><b>${blockedCount}</b><span>bloqueados</span></div>
    <div><b>${onlineCount}</b><span>online agora</span></div>`;

  $('#adminBody').innerHTML=`<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Acesso</th><th>Conexão</th><th>Usuário</th><th>Login</th><th>Módulo atual</th><th>Última atividade</th><th>Tempo total</th><th>Sessões</th><th>Ação</th></tr></thead>
    <tbody>${rows.map(r=>{
      const admin=r.role==='admin';
      const action=admin
        ? '<span class="admin-tag">Administrador</span>'
        : r.access_status==='approved'
          ? `<button class="access-action danger" data-user="${r.id}" data-status="blocked">Bloquear</button>`
          : `<button class="access-action allow" data-user="${r.id}" data-status="approved">Liberar acesso</button>`;
      return `<tr>
        <td><span class="access-status ${accessClass(r.access_status)}">${admin?'Administrador':accessText(r.access_status)}</span></td>
        <td><span class="status ${r.online?'on':'off'}">${r.online?'Online':'Offline'}</span></td>
        <td>${r.display_name||'—'}</td><td>@${r.username}</td><td>${r.current}</td>
        <td>${r.lastSeen}</td><td>${fmtMinutes(r.total)}</td><td>${r.sessions}</td><td>${action}</td>
      </tr>`;
    }).join('')}</tbody></table></div>`;

  $$('#adminBody .access-action').forEach(btn=>{
    btn.addEventListener('click',()=>setUserAccess(btn.dataset.user,btn.dataset.status));
  });
}

function registerInstall(){
  window.addEventListener('beforeinstallprompt',(e)=>{
    e.preventDefault(); installPrompt=e; $('#installBtn').classList.remove('hidden');
  });
  $('#installBtn').onclick=async()=>{
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt=null;
    }else{
      const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
      alert(ios
        ? 'No iPhone/iPad: Compartilhar → Adicionar à Tela de Início.'
        : 'Use o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.');
    }
  };
  window.addEventListener('appinstalled',()=>$('#installBtn').classList.add('hidden'));
}

window.addEventListener('pagehide',()=>{ heartbeat(); });
init();
