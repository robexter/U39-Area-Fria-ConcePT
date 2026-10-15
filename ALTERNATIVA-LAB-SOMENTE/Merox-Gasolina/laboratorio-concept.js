/* LABORATÓRIO CONCEPT V5 — extensão didática sem alterar o HTML original nem a V4. */
(()=>{'use strict';
const cfg={"name":"Merox Gasolina","title":"Tratamento Merox da gasolina","family":"merox","sliders":[["Carga de gasolina","%",60,140,100],["Contato soda/gasolina","%",60,140,100],["Disponibilidade de ar","%",60,140,100],["Atividade de tratamento","%",40,120,100]],"flow":["Gasolina com RSH","Contato químico","Ar / oxidação catalítica","Gasolina tratada"],"physics":"A oxidação catalítica de mercaptanos transforma RSH em dissulfetos RSSR. A velocidade e conversão são condicionadas por contato, disponibilidade de oxigênio e estado do sistema químico; não se trata de retirar necessariamente todo enxofre total.","diagnostic":"Confrontar ar J-3938, condições de contato com soda, carregamento de mercaptanos e qualidade do produto; confirmar arranjo real do circuito antes de manobras.","faults":[["Ar reduzido",{"2":60},"Oxidação","Mercaptanos residuais crescem com baixa disponibilidade de ar.","O₂ limita oxidação catalítica",["Verificar ar e eficiência de contato","Concluir que ar não participa","Assumir dessulfurização total"]],["Atividade baixa",{"3":45},"Conversão","A qualidade piora com ar e carga estáveis.","Atividade do sistema de tratamento caiu",["Avaliar atividade e qualidade química","Atribuir tudo ao refluxo da torre","Descartar o contato entre fases"]],["Carga alta",{"0":140,"1":70},"Capacidade","A vazão aumenta e contato relativo diminui.","Tempo/área efetiva de contato limitam conversão",["Confrontar carga e contato relativo","Mais carga sempre melhora conversão","Ignorar fase soda/gasolina"]]]};
const steps=[["Produto demonstra aumento de mercaptanos residuais. O que comparar?",[["Confrontar carga, contato, atividade química e oxidante.",2,2,8,"Qualidade depende de múltiplas etapas e transferência."],["Verificar disponibilidade do oxidante isoladamente.",1,2,3,"Importante, mas há outras limitações."],["Concluir que oxidação independe de contato interfacial.",-2,8,-5,"A disponibilidade de contato altera conversão."]]],["A carga aumenta e o tempo relativo de contato cai. Qual hipótese?",[["Investigar capacidade hidráulica e contato real entre fases.",2,2,7,"A elevação de carga pode reduzir desempenho relativo."],["Comparar análise de produto com a base anterior.",1,1,3,"Comparação útil, requer condições de contato."],["Assumir que qualquer aumento de vazão eleva conversão.",-2,9,-5,"Carga maior não é ganho de conversão garantido."]]],["A disponibilidade química mudou sem alterar a carga. Que avaliação?",[["Checar atividade química e oxidante, com dados de qualidade.",2,1,6,"A etapa química condiciona desempenho."],["Verificar apenas a pressão de circuito.",0,3,1,"Pressão não demonstra condição química."],["Descartar qualidade do reagente porque existe soda.",-2,7,-4,"O estado químico pode degradar."]]],["Qual síntese CIC final é adequada?",[["Documentar evidência de contato/química e validar com campo.",2,-2,5,"Simulação não define dosagem ou alinhamento autorizado."],["Solicitar análises complementares e verificar medidores.",1,0,3,"Aumento de evidência melhora a conclusão."],["Alterar dosagem sem folha de processo para recuperar índice.",-3,10,-6,"Índice arbitrário não é critério de manobra."]]]];
if(document.getElementById('lc5-overlay'))return;
const css=String.raw`
/* Scoped CSS, no overrides of existing Concept UI */
#lc5-open{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(70px,calc(58px + env(safe-area-inset-bottom)));z-index:2147483002;background:#14384b;border:1px solid #a4e8d4;border-radius:999px;padding:11px 16px;font:800 13px/1.3 system-ui;color:#effff9;box-shadow:0 8px 25px #0018;cursor:pointer;max-width:calc(100vw - 20px)}
#lc5-overlay{display:none;position:fixed;inset:0;background:#06111a;color:#f3fbff;z-index:2147483004;overflow:hidden;font:400 14px/1.58 system-ui,-apple-system,Segoe UI,sans-serif}
#lc5-overlay.lc5-show{display:flex;flex-direction:column}
#lc5-overlay,#lc5-overlay *{box-sizing:border-box}
#lc5-overlay button{font:inherit;color:#eaf7ff;cursor:pointer;touch-action:manipulation}
#lc5-overlay button:focus-visible{outline:2px solid #b7f1d8;outline-offset:3px}
#lc5-overlay .lc5-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;background:#0b2230;border-bottom:1px solid #345566;min-width:0}
#lc5-overlay .lc5-head>div:first-child{min-width:0}
#lc5-overlay .lc5-head small{color:#a7ccdc;display:block;font-size:10px;letter-spacing:.08em;font-weight:800}
#lc5-overlay .lc5-head strong{font-size:clamp(16px,2vw,23px);line-height:1.3;display:block}
#lc5-overlay .lc5-headeractions{display:flex;flex-wrap:wrap;gap:7px}
#lc5-overlay .lc5-headeractions button,#lc5-overlay .lc5-reset,#lc5-overlay .lc5-next,#lc5-overlay .lc5-restart,#lc5-overlay .lc5-totrend{background:#17384a;border:1px solid #55869e;border-radius:11px;padding:9px 12px;font-weight:800}
#lc5-overlay .lc5-intro{flex:none;padding:12px 18px;background:#09202c;display:flex;align-items:flex-start;gap:10px;font-size:12px}
#lc5-overlay .lc5-intro>b{color:#91ebd1;flex:none;max-width:30%;}
#lc5-overlay .lc5-intro>span{min-width:0;color:#bad4e3}
#lc5-overlay .lc5-tabs{flex:none;display:flex;gap:6px;overflow-x:auto;background:#071724;padding:8px 12px;border-bottom:1px solid #2d5266;min-width:0}
#lc5-overlay .lc5-tabs button{flex:none;border:1px solid #315366;background:#102d3d;color:#c8e8f7;border-radius:9px;padding:8px 12px;font-weight:800;font-size:12px}
#lc5-overlay .lc5-tabs button.selected{background:#1c625d;border-color:#94edce;color:#fff}
#lc5-overlay .lc5-content{overflow:auto;flex:1;min-width:0;min-height:0;padding:clamp(12px,2vw,22px);overscroll-behavior:contain}
#lc5-overlay .lc5-view{display:none;max-width:990px;margin:auto}
#lc5-overlay .lc5-view.selected{display:block}
#lc5-overlay .lc5-panel{min-width:0;border:1px solid #315268;border-radius:15px;background:#0d2532;padding:clamp(14px,2vw,25px)}
#lc5-overlay h2{font-size:clamp(20px,2.2vw,27px);line-height:1.3;margin:0 0 10px}
#lc5-overlay h3{font-size:16px;line-height:1.55}
#lc5-overlay p{color:#c9d9e5;line-height:1.7}
#lc5-overlay .lc5-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:15px 0}
#lc5-overlay .lc5-controls label{min-width:0;display:grid;gap:10px;border:1px solid #35576d;background:#081b26;border-radius:12px;padding:13px;color:#d2eaf6;font-weight:700}
#lc5-overlay .lc5-controls label span{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
#lc5-overlay .lc5-controls output{color:#93e9d5;white-space:nowrap}
#lc5-overlay input[type=range]{width:100%;min-width:0;accent-color:#7bdec6}
#lc5-overlay .lc5-readouts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
#lc5-overlay .lc5-readouts>div{background:#142f3b;border:1px solid #426879;border-radius:10px;padding:12px;min-width:0}
#lc5-overlay .lc5-readouts small{display:block;color:#b2d5dd;font-size:12px}
#lc5-overlay .lc5-readouts strong{font-size:clamp(21px,4vw,31px);color:#9bf1db}
#lc5-overlay .lc5-insight,#lc5-overlay .lc5-incident,#lc5-overlay .lc5-state,#lc5-overlay .lc5-response{background:#0b1d2a;border-left:3px solid #7cdbbb;padding:12px;border-radius:6px;overflow-wrap:anywhere;margin-top:13px}
#lc5-overlay .lc5-flow{display:flex;gap:7px;align-items:stretch;overflow-x:auto;padding:6px 0 14px;min-width:0}
#lc5-overlay .lc5-node{flex:1;min-width:108px;background:#142e40;border:1px solid #426279;border-radius:12px;padding:12px}
#lc5-overlay .lc5-node small{display:block;color:#9de1dc;font-size:10px}
#lc5-overlay .lc5-node b{font-size:13px}
#lc5-overlay .lc5-arrow{color:#7dd3b5;align-self:center;font-size:20px}
#lc5-overlay .lc5-chart{border:1px solid #36556a;border-radius:12px;background:#071923;overflow:hidden;padding:7px}
#lc5-overlay .lc5-chart svg{display:block;width:100%;max-width:100%;height:auto}
#lc5-overlay .lc5-grid line{stroke:#365365;stroke-width:1}
#lc5-overlay .lc5-grid text{fill:#9cbdcb;font-size:10px}
#lc5-overlay .lc5-lineA{stroke:#8ceacf;stroke-width:3;fill:none}
#lc5-overlay .lc5-lineB{stroke:#ffcc7e;stroke-width:3;fill:none}
#lc5-overlay .lc5-legend{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:9px 0;color:#c8e0ea}
#lc5-overlay .lc5-legend span:first-child{color:#8ceacf}#lc5-overlay .lc5-legend span:last-child{color:#ffcc7e}
#lc5-overlay .lc5-faults{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
#lc5-overlay .lc5-faults button{border:1px solid #44687b;background:#102e3d;border-radius:12px;padding:12px;text-align:left;min-width:0}
#lc5-overlay .lc5-faults button.selected{background:#17564b;border-color:#8fedce}
#lc5-overlay .lc5-faults small{display:block;font-size:11px;color:#acd5e5}
#lc5-overlay .lc5-diagnosticanswers,#lc5-overlay .lc5-choices{display:grid;gap:8px;margin:14px 0}
#lc5-overlay .lc5-diagnosticanswers button,#lc5-overlay .lc5-choices button{width:100%;text-align:left;background:#123046;border:1px solid #426579;border-radius:11px;padding:11px;overflow-wrap:anywhere}
#lc5-overlay .lc5-diagnosticanswers .correct,#lc5-overlay .lc5-choices .correct{border-color:#80dca9;background:#1a493d}
#lc5-overlay .lc5-diagnosticanswers .wrong,#lc5-overlay .lc5-choices .wrong{border-color:#dfa7a7;background:#522e36}
#lc5-overlay .lc5-choices .neutral{border-color:#e1c67d;background:#4d4030}
#lc5-overlay button:disabled{cursor:default;opacity:.74}
#lc5-overlay .lc5-progress{display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-weight:800}
#lc5-overlay .lc5-points{color:#99eacf;margin-left:auto}
#lc5-overlay .lc5-next{margin-right:10px}
#lc5-overlay .lc5-footnote{max-width:990px;margin:18px auto;color:#96b2c0!important;font-size:12px}
#ci-overlay .lc5-bridge{font:700 12px system-ui,sans-serif;background:#164d50;color:#fff;border:1px solid #69cbb4;border-radius:9px;padding:9px;cursor:pointer}
@media(max-width:760px){#lc5-open{right:10px;bottom:max(70px,calc(58px + env(safe-area-inset-bottom)));padding:9px 12px;font-size:11px}#lc5-overlay .lc5-head{padding:9px 11px;align-items:flex-start}#lc5-overlay .lc5-headeractions{flex-direction:column;flex:none}#lc5-overlay .lc5-headeractions button{padding:6px 8px;font-size:11px}#lc5-overlay .lc5-head small{font-size:9px}#lc5-overlay .lc5-head strong{font-size:15px}#lc5-overlay .lc5-intro{display:block;padding:9px 11px;max-height:110px;overflow:auto}#lc5-overlay .lc5-intro>b{display:block;max-width:none}#lc5-overlay .lc5-tabs{padding:7px}#lc5-overlay .lc5-tabs button{padding:8px 9px;font-size:11px}#lc5-overlay .lc5-content{padding:10px}#lc5-overlay .lc5-controls{grid-template-columns:1fr}#lc5-overlay .lc5-readouts{grid-template-columns:repeat(2,minmax(0,1fr))}#lc5-overlay .lc5-faults{grid-template-columns:1fr}}
@media(max-width:350px){#lc5-overlay .lc5-readouts{grid-template-columns:1fr}#lc5-overlay .lc5-head strong{font-size:13px}}
@media(prefers-reduced-motion:reduce){#lc5-overlay *{scroll-behavior:auto!important}}
`;
const clip=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const round=v=>Math.round(v);
let state=cfg.sliders.map(s=>s[4]),fault=-1,step=0,score=0,history=[],baseline=null,diagnosisSolved=false;
function metrics(v){
 const [a,b,c,d]=v, fam=cfg.family;
 let hyd=100, perf=100, margin=100, loss=100;
 if(fam==='abs'){
   hyd=100*Math.pow(a/100,1.45)*Math.pow(b/100,.33);
   let driving=(1-.48*(d-30)/100)*Math.exp(-.014*c);
   perf=100*Math.pow(b/a,.48)*driving;
   perf-=Math.max(0,hyd-138)*1.35; margin=160-hyd; loss=hyd;
 }else if(fam==='dist'){
   hyd=100*Math.pow(a/100,.28)*Math.pow(b/100,.38)*Math.pow(c/100,.79);
   perf=100+.38*(b-100)+.32*(c-100)-.23*(a-100)-.32*d;
   perf-=Math.max(0,hyd-137)*1.35+Math.max(0,75-c)*.4;
   margin=155-hyd;loss=hyd;
 }else if(fam==='dea'||fam==='dea_extract'){
   hyd=100*Math.pow(a/100,.82)*Math.pow(b/100,.35);
   perf=100*Math.pow(b/a,.56)*Math.exp(-.012*c)*(1-.52*(d-30)/100);
   perf-=Math.max(0,hyd-137)*1.2; margin=160-hyd;loss=hyd;
 }else if(fam==='regen'){
   hyd=100*Math.pow(a/100,.43)*Math.pow(b/100,.79);
   perf=100*Math.pow(b/a,.72)*Math.pow(100/c,.46)*(1-.004*d);
   perf-=Math.max(0,hyd-141)*1.1; margin=160-hyd;loss=hyd;
 }else if(fam==='merox'){
   hyd=100*Math.pow(a/100,1.28)*Math.pow(b/100,.15);
   const oxy=clip(c/100,.3,1.6),act=clip(d/100,.35,1.5);
   perf=100*Math.pow(b/a,.48)*Math.pow(oxy,.27)*Math.pow(act,.5);
   perf-=Math.max(0,hyd-145)*1.05; margin=165-hyd;loss=hyd;
 }
 // clamp applies ONLY to synthetic illustration, no predictive plant basis
 return {hyd:clip(hyd,28,195),perf:clip(perf,15,175),margin:clip(margin,0,130),loss:clip(loss,20,190)};
}
const mount=()=>{
 if(document.getElementById('lc5-overlay'))return;
 const style=document.createElement('style');style.id='lc5-style';style.textContent=css;document.head.append(style);
 const launcher=document.createElement('button');launcher.id='lc5-open';launcher.type='button';launcher.textContent='🧪 Laboratório Concept';launcher.setAttribute('aria-controls','lc5-overlay');launcher.setAttribute('aria-expanded','false');document.body.append(launcher);
 const host=document.createElement('section');host.id='lc5-overlay';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-hidden','true');host.setAttribute('aria-label',`Laboratório Concept ${cfg.name}`);
 host.innerHTML=`<header class="lc5-head"><div><small>ÁREA FRIA • U-39 • CONCEPT V5 • LABORATÓRIO DIDÁTICO</small><strong>🧪 Laboratório Concept — ${esc(cfg.name)}</strong></div><div class="lc5-headeractions"><button type="button" class="lc5-integral">📚 Conteúdo Integral</button><button type="button" class="lc5-close">✕ Fechar</button></div></header>
 <div class="lc5-intro"><b>${esc(cfg.title)}</b><span>${esc(cfg.physics)}</span></div>
 <nav class="lc5-tabs" aria-label="Ambientes do laboratório"><button type="button" data-tab="physics" class="selected">1. Fundamentos físicos</button><button type="button" data-tab="equipment">2. Processo e tendências</button><button type="button" data-tab="diagnostic">3. Diagnóstico CIC</button><button type="button" data-tab="decisions">4. Decisões encadeadas</button></nav>
 <main class="lc5-content">
 <section data-view="physics" class="lc5-view selected"><div class="lc5-panel"><h2>Experimento multifatorial</h2><p>Altere as quatro variáveis ilustrativas. Observe que uma melhoria de força motriz ou energia pode coexistir com um aumento de carga hidráulica. <b>As curvas não são modelo calibrado da U-39.</b></p><div class="lc5-controls">${cfg.sliders.map((s,i)=>`<label><span>${esc(s[0])} <output data-n="${i}">${s[4]}${esc(s[1])}</output></span><input type="range" data-input="${i}" min="${s[2]}" max="${s[3]}" step="1" value="${s[4]}"></label>`).join('')}</div><div class="lc5-readouts" aria-live="polite"></div><div class="lc5-insight"></div></div></section>
 <section data-view="equipment" class="lc5-view"><div class="lc5-panel"><h2>Fluxo, comportamento e tendências</h2><p>Os indicadores são <b>adimensionais e arbitrários</b>; use as correlações para pensar causalidade, não para calcular limites ou prever especificação.</p><div class="lc5-flow">${cfg.flow.map((s,i)=>`<div class="lc5-node"><small>ETAPA ${i+1}</small><b>${esc(s)}</b></div>`).join('<span class="lc5-arrow" aria-hidden="true">→</span>')}</div><div class="lc5-chart" aria-label="Curvas sintéticas de processo" role="img"><svg viewBox="0 0 640 245" preserveAspectRatio="xMidYMid meet"><g class="lc5-grid"></g><path class="lc5-lineA"></path><path class="lc5-lineB"></path></svg></div><div class="lc5-legend"><span>● Eficiência/remoção relativa</span><span>● Carga hidráulica relativa</span></div><p class="lc5-diagnostic"></p><button type="button" class="lc5-reset">↺ Retornar à referência</button></div></section>
 <section data-view="diagnostic" class="lc5-view"><div class="lc5-panel"><h2>Falhas virtuais e interpretação CIC</h2><p>Escolha um desvio; os parâmetros do experimento são modificados e a tendência reage. Compare variáveis e selecione uma hipótese antes de conferir a fundamentação.</p><div class="lc5-faults">${cfg.faults.map((f,i)=>`<button type="button" data-fault="${i}"><b>${esc(f[0])}</b><small>${esc(f[1])}</small></button>`).join('')}</div><div class="lc5-incident">Selecione um desvio para começar.</div><div class="lc5-diagnosticanswers"></div><p class="lc5-explanation" aria-live="polite"></p><button type="button" class="lc5-totrend">Ver tendência do cenário →</button></div></section>
 <section data-view="decisions" class="lc5-view"><div class="lc5-panel"><h2>Missão CIC — quatro decisões encadeadas</h2><p>As escolhas anteriores alteram os índices de capacidade, qualidade e risco do caso hipotético. As opções são apresentadas em ordem variável; a melhor decisão exige correlacionar variáveis, sem dedução por tamanho de texto.</p><div class="lc5-progress">Decisão <strong class="lc5-stage">1 / 4</strong><span class="lc5-points">Pontuação: 0</span></div><div class="lc5-state"></div><h3 class="lc5-question"></h3><div class="lc5-choices"></div><div class="lc5-response" aria-live="polite"></div><button type="button" class="lc5-next" disabled>Próxima decisão →</button><button type="button" class="lc5-restart">↺ Reiniciar missão</button></div></section>
 <p class="lc5-footnote">Concept V5 — laboratório educacional. Nenhum indicador, cor de risco, resultado de decisão ou valor é critério operacional, curva de desempenho ou limite de proteção aprovado. Consultar documentação vigente e equipe técnica.</p>
 </main>`;
 document.body.append(host);
 const views=[...host.querySelectorAll('.lc5-view')];const tabbtns=[...host.querySelectorAll('.lc5-tabs button')];let priorOverflow=null,priorFocus=null;
 const close=()=>{host.classList.remove('lc5-show');host.setAttribute('aria-hidden','true');launcher.setAttribute('aria-expanded','false');document.documentElement.style.overflow=priorOverflow||'';(priorFocus||launcher).focus();};
 const open=()=>{priorFocus=document.activeElement;priorOverflow=document.documentElement.style.overflow;host.classList.add('lc5-show');host.setAttribute('aria-hidden','false');launcher.setAttribute('aria-expanded','true');document.documentElement.style.overflow='hidden';host.querySelector('.lc5-close').focus();};
 launcher.addEventListener('click',open);host.querySelector('.lc5-close').addEventListener('click',close);
 host.querySelector('.lc5-integral').addEventListener('click',()=>{close();document.getElementById('ci-open')?.click();});
 host.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
 // Make the V4 overlay a two-way navigation affordance, without removing any original V4 nodes or listeners.
 const bridge=()=>{const top=document.querySelector('#ci-overlay .ci-top');if(top && !top.querySelector('.lc5-bridge')){const b=document.createElement('button');b.type='button';b.className='lc5-bridge';b.textContent='🧪 Laboratório Concept';b.addEventListener('click',()=>{const closeV4=document.querySelector('#ci-overlay .ci-close');if(closeV4)closeV4.click();open();});top.append(b);}};
 bridge();setTimeout(bridge,100);
 function switchTab(t){views.forEach(x=>x.classList.toggle('selected',x.dataset.view===t));tabbtns.forEach(x=>{const active=x.dataset.tab===t;x.classList.toggle('selected',active);x.setAttribute('aria-current',active?'page':'false');}); host.querySelector('.lc5-content').scrollTop=0;if(t==='equipment')renderTrend();}
 tabbtns.forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
 const controls=[...host.querySelectorAll('input[data-input]')];controls.forEach((input,i)=>{input.addEventListener('input',()=>{state[i]=Number(input.value);refresh();});});
 const nfmt=v=>Math.round(v).toLocaleString('pt-BR');
 const labels=['Eficiência/remoção relativa','Carga hidráulica relativa','Margem hidráulica didática'];
 function observation(m){
    let v=m.hyd>137?'Carga hidráulica relativa elevada: conferir vazões, ΔP, níveis e possibilidade de retenção.':m.hyd<72?'Carga hidráulica relativa baixa: considerar contato insuficiente e carga de processo.':'Carga hidráulica relativa moderada no exemplo.';
    if(m.perf<86)v+=' Índice de desempenho baixo: investigar força motriz, energia e composição antes de propor ajuste.';
    else if(m.perf>115)v+=' Índice de desempenho favorável, sem garantia de produto especificado.';
    return v+' '+cfg.diagnostic;
 }
 function refresh(){const m=metrics(state);controls.forEach((input,i)=>{input.value=state[i];host.querySelector(`[data-n="${i}"]`).textContent=nfmt(state[i])+cfg.sliders[i][1];});host.querySelector('.lc5-readouts').innerHTML=[['Índice de desempenho',m.perf],['Índice de carga interna',m.hyd],['Margem didática',m.margin]].map(([k,v])=>`<div><small>${esc(k)}</small><strong>${nfmt(v)}</strong></div>`).join('');host.querySelector('.lc5-insight').textContent=observation(m);host.querySelector('.lc5-diagnostic').textContent=observation(m);renderTrend();}
 function renderTrend(){const g=host.querySelector('.lc5-grid');if(!g)return; g.innerHTML=[40,80,120,160].map(v=>`<line x1="38" y1="${220-v}" x2="618" y2="${220-v}"/><text x="5" y="${224-v}">${v}</text>`).join('')+'<line x1="38" y1="214" x2="618" y2="214"/>';
 const m=metrics(state),neutral=metrics(cfg.sliders.map(s=>s[4]));const s1=[],s2=[];
 for(let i=0;i<24;i++){const k=clip((i-2)/19,0,1),lag=clip((i-6)/16,0,1);const wave=Math.sin(i*.65)*1.15; s1.push(neutral.perf+(m.perf-neutral.perf)*(lag*.75+k*.25)+wave);s2.push(neutral.hyd+(m.hyd-neutral.hyd)*k+wave*.6);}
 const plot=series=>series.map((v,i)=>`${i?'L':'M'}${(38+i*580/23).toFixed(1)} ${(214-(clip(v,10,190)-10)*1.08).toFixed(1)}`).join(' ');
 host.querySelector('.lc5-lineA').setAttribute('d',plot(s1));host.querySelector('.lc5-lineB').setAttribute('d',plot(s2));}
 host.querySelector('.lc5-reset').addEventListener('click',()=>{state=cfg.sliders.map(x=>x[4]);fault=-1;refresh();});
 const faultbuttons=[...host.querySelectorAll('[data-fault]')];let correctAnswer=-1;
 const shuffle=arr=>{const a=arr.map((v,i)=>({v,i}));for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function faultOpen(i){fault=i;const f=cfg.faults[i];state=cfg.sliders.map(x=>x[4]);Object.entries(f[1]).forEach(([i,v])=>state[Number(i)]=v);refresh();faultbuttons.forEach((b,j)=>b.classList.toggle('selected',i===j));host.querySelector('.lc5-incident').innerHTML=`<b>${esc(f[0])}</b><p>${esc(f[3])}</p><p>Interprete as alterações dos índices juntamente com as variáveis alteradas. <b>Qual hipótese tem maior suporte?</b></p>`;
 const container=host.querySelector('.lc5-diagnosticanswers');container.innerHTML='';correctAnswer=-1;
 const items=shuffle(f[5]);items.forEach(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.v;container.append(b);b.addEventListener('click',()=>{correctAnswer=o.i;container.querySelectorAll('button').forEach(x=>x.disabled=true);b.classList.add(o.i===0?'correct':'wrong');host.querySelector('.lc5-explanation').textContent=(o.i===0?'Hipótese mais sustentada. ':'Ainda faltam evidências. ')+f[4]+' — '+cfg.diagnostic;});});
 host.querySelector('.lc5-explanation').textContent='';}
 faultbuttons.forEach((b,i)=>b.addEventListener('click',()=>faultOpen(i)));
 host.querySelector('.lc5-totrend').addEventListener('click',()=>switchTab('equipment'));
 let decisionIndex=0,quality=100,hyd=100,risk=0,nextAllowed=false;
 function renderStep(){const item=steps[decisionIndex];host.querySelector('.lc5-stage').textContent=(decisionIndex+1)+' / '+steps.length;host.querySelector('.lc5-points').textContent='Pontuação: '+score;host.querySelector('.lc5-state').textContent=`Estado após escolhas anteriores — qualidade relativa: ${round(quality)} | carga hidráulica: ${round(hyd)} | risco didático: ${round(risk)}. Estes valores são sintéticos.`;
 const consequence=decisionIndex===0?'':risk>20?' Efeitos acumulados: sinais de restrição mais pronunciados.':quality>108?' Efeitos acumulados: interpretação mais consistente, mas ainda requer validação.':' Efeitos acumulados: diagnóstico ainda incompleto.';
 host.querySelector('.lc5-question').textContent=item[0]+consequence;
 const opts=host.querySelector('.lc5-choices');opts.innerHTML='';const order=shuffle(item[1]);order.forEach(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.v[0];opts.append(b);b.addEventListener('click',()=>{if(nextAllowed)return;nextAllowed=true; const decision=o.v;score+=Math.max(0,decision[1]);quality=clip(quality+decision[3],50,150);hyd=clip(hyd+decision[2],50,185);risk=clip(risk+Math.max(0,decision[2]) + (decision[1]<0?7:0)- (decision[1]>1?5:0),0,100);
 for(const p of opts.querySelectorAll('button')){p.disabled=true;p.classList.toggle('chosen',p===b);}b.classList.add(decision[1]>=2?'correct':decision[1]<0?'wrong':'neutral');host.querySelector('.lc5-response').textContent=decision[4]+` Consequência acumulada: risco ${round(risk)} e qualidade ${round(quality)} (índices sintéticos).`;
 const next=host.querySelector('.lc5-next');next.disabled=false;next.textContent=decisionIndex+1===steps.length?'Ver resultado final →':'Próxima decisão →';});});
 host.querySelector('.lc5-response').textContent='';host.querySelector('.lc5-next').disabled=true;nextAllowed=false;}
 host.querySelector('.lc5-next').addEventListener('click',()=>{if(!nextAllowed)return;decisionIndex++;if(decisionIndex>=steps.length){host.querySelector('.lc5-stage').textContent='Concluída';host.querySelector('.lc5-question').textContent=`Resultado: ${score} pontos (máximo 8)`;host.querySelector('.lc5-state').textContent=`Estado final hipotético — qualidade ${round(quality)}, carga ${round(hyd)}, risco ${round(risk)}. Compare cada decisão com evidências e revise as hipóteses.`;host.querySelector('.lc5-choices').innerHTML='';host.querySelector('.lc5-response').textContent='Avaliação educacional concluída. Cenário não representa processo real nem autoriza alteração de variáveis.';host.querySelector('.lc5-next').disabled=true;return;}renderStep();});
 host.querySelector('.lc5-restart').addEventListener('click',()=>{decisionIndex=0;score=0;quality=100;hyd=100;risk=0;renderStep();});
 refresh();renderStep();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();