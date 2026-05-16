const WORLD_MODES={
  express:{name:'World Cup Express',short:'Express',price:5,label:'Fase de grupos',description:'Pronostica primeros, segundos y mejores terceros de cada grupo.',rounds:[]},
  pro:{name:'World Cup Pro',short:'Pro',price:10,label:'Grupos + octavos + cuartos',description:'Completa la fase de grupos y define ganadores hasta cuartos de final.',rounds:[{key:'octavos',name:'Octavos de final',matches:8},{key:'cuartos',name:'Cuartos de final',matches:4}]},
  premium:{name:'World Cup Premium',short:'Premium',price:20,label:'Fixture completo',description:'Completa grupos, llaves, finalistas y campeón.',rounds:[{key:'ronda32',name:'Ronda de 32',matches:16},{key:'octavos',name:'Octavos de final',matches:8},{key:'cuartos',name:'Cuartos de final',matches:4},{key:'semis',name:'Semifinales',matches:2},{key:'final',name:'Final',matches:1}]}
};
let worldState={mode:null,teams:[],groups:[],groupPicks:{},bracketPicks:{},champion:''};
function money(v){return 'S/ '+Number(v).toFixed(2)}
function teamLabel(t){return `${t.flag} ${t.name}`}
function optionList(teams,placeholder='Selecciona'){return `<option value="">${placeholder}</option>`+teams.map(t=>`<option value="${t.name}">${teamLabel(t)}</option>`).join('')}
async function initMundial(){
  if(!document.querySelector('[data-start-mode]')) return;
  const data=await fetch('../assets/data/mundial-fixture.json').then(r=>r.json());
  worldState.groups=data.groups; worldState.teams=data.groups.flatMap(g=>g.teams);
  document.querySelectorAll('[data-start-mode]').forEach(card=>card.addEventListener('click',()=>startMode(card.dataset.startMode)));
  document.querySelector('[data-change-mode]')?.addEventListener('click',()=>{document.querySelector('.world-hero').scrollIntoView({behavior:'smooth'});document.querySelector('[data-world-play]').hidden=true;document.querySelector('[data-groups-section]').hidden=true;document.querySelector('[data-bracket-section]').hidden=true;document.querySelector('[data-champion-section]').hidden=true;});
  document.querySelector('[data-confirm-world]')?.addEventListener('click',confirmWorldTicket);
}
function startMode(modeKey){
  worldState.mode=modeKey; worldState.groupPicks={}; worldState.bracketPicks={}; worldState.champion='';
  const mode=WORLD_MODES[modeKey];
  document.querySelector('[data-world-play]').hidden=false; document.querySelector('[data-groups-section]').hidden=false;
  document.querySelector('[data-mode-label]').textContent=mode.name; document.querySelector('[data-mode-title]').textContent=mode.label; document.querySelector('[data-mode-description]').textContent=mode.description;
  document.querySelector('[data-summary-mode]').textContent=mode.short; document.querySelector('[data-summary-price]').textContent=money(mode.price);
  renderGroups(); renderBracket(); renderChampion(); updateWorldCount();
  document.querySelector('[data-world-play]').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderGroups(){
  const wrap=document.querySelector('[data-world-groups]');
  wrap.innerHTML=worldState.groups.map(g=>`<article class="card group-card"><span class="pill">Grupo ${g.group}</span><div class="teams">${g.teams.map(t=>`<div class="team-row"><span>${teamLabel(t)}</span></div>`).join('')}</div><div class="group-selects"><div class="field"><label>1.º lugar</label><select data-group-pick="${g.group}" data-position="1">${optionList(g.teams,'Primer lugar')}</select></div><div class="field"><label>2.º lugar</label><select data-group-pick="${g.group}" data-position="2">${optionList(g.teams,'Segundo lugar')}</select></div><div class="field"><label>3.º lugar</label><select data-group-pick="${g.group}" data-position="3">${optionList(g.teams,'Tercer lugar')}</select></div></div></article>`).join('');
  wrap.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',e=>{const g=e.target.dataset.groupPick; const pos=e.target.dataset.position; worldState.groupPicks[g]=worldState.groupPicks[g]||{}; worldState.groupPicks[g][pos]=e.target.value; updateWorldCount();}));
}
function renderBracket(){
  const section=document.querySelector('[data-bracket-section]'); const wrap=document.querySelector('[data-world-bracket]'); const mode=WORLD_MODES[worldState.mode];
  if(!mode.rounds.length){ section.hidden=true; return; }
  section.hidden=false; document.querySelector('[data-bracket-title]').textContent=worldState.mode==='pro'?'Llaves hasta cuartos':'Fixture completo';
  document.querySelector('[data-bracket-description]').textContent=worldState.mode==='pro'?'Define ganadores en octavos y cuartos de final.':'Completa cada ronda hasta llegar a la final.';
  wrap.innerHTML=mode.rounds.map(round=>`<article class="card round-card"><h3>${round.name}</h3><div class="round-matches">${Array.from({length:round.matches},(_,i)=>`<div class="match bracket-match"><div><strong>Partido ${i+1}</strong><div class="bracket-selects"><select data-round="${round.key}" data-match="${i}" data-side="a">${optionList(worldState.teams,'Equipo A')}</select><select data-round="${round.key}" data-match="${i}" data-side="b">${optionList(worldState.teams,'Equipo B')}</select><select data-round="${round.key}" data-match="${i}" data-side="winner">${optionList(worldState.teams,'Ganador')}</select></div></div></div>`).join('')}</div></article>`).join('');
  wrap.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',e=>{const {round,match,side}=e.target.dataset; worldState.bracketPicks[round]=worldState.bracketPicks[round]||{}; worldState.bracketPicks[round][match]=worldState.bracketPicks[round][match]||{}; worldState.bracketPicks[round][match][side]=e.target.value; updateWorldCount();}));
}
function renderChampion(){
  const section=document.querySelector('[data-champion-section]'); const select=document.querySelector('[data-champion-select]');
  if(worldState.mode!=='premium'){section.hidden=true; return;}
  section.hidden=false; select.innerHTML=optionList(worldState.teams,'Elige campeón'); select.addEventListener('change',e=>{worldState.champion=e.target.value; updateWorldCount();},{once:false});
}
function updateWorldCount(){
  const groupCount=Object.values(worldState.groupPicks).reduce((a,p)=>a+Object.values(p).filter(Boolean).length,0);
  const bracketCount=Object.values(worldState.bracketPicks).reduce((a,round)=>a+Object.values(round).reduce((b,m)=>b+Object.values(m).filter(Boolean).length,0),0);
  const championCount=worldState.champion?1:0;
  document.querySelector('[data-world-count]').textContent=groupCount+bracketCount+championCount;
}
function confirmWorldTicket(){
  if(!worldState.mode){return alert('Elige una modalidad para continuar.');}
  const mode=WORLD_MODES[worldState.mode]; const code='PWC-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-6);
  addTicket({code,game:mode.name,date:new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}),amount:PL.money(mode.price),status:'Registrado',prize:'Pozo '+mode.short},mode.price);
  alert('Jugada confirmada: '+code); location.href='../mis-jugadas.html';
}
document.addEventListener('DOMContentLoaded',initMundial);
