const WORLD_MODES={
  express:{name:'World Cup Express',short:'Express',price:5,label:'Fase de grupos',description:'Pronostica primeros, segundos y mejores terceros de cada grupo.',rounds:[]},
  pro:{name:'World Cup Pro',short:'Pro',price:10,label:'Grupos + octavos + cuartos',description:'Completa la fase de grupos y define ganadores hasta cuartos de final.',rounds:[{key:'octavos',name:'Octavos de final',matches:8},{key:'cuartos',name:'Cuartos de final',matches:4}]},
  premium:{name:'World Cup Premium',short:'Premium',price:20,label:'Fixture completo',description:'Completa grupos, ronda de 32, octavos, cuartos, semifinales, final y campeón.',rounds:[{key:'ronda32',name:'Ronda de 32',matches:16},{key:'octavos',name:'Octavos de final',matches:8},{key:'cuartos',name:'Cuartos de final',matches:4},{key:'semis',name:'Semifinales',matches:2},{key:'final',name:'Final',matches:1}]}
};
const ROUND_ORDER=['ronda32','octavos','cuartos','semis','final'];
let worldState={mode:null,teams:[],groups:[],groupPicks:{},bracketPicks:{},champion:'',pendingTicket:null};
function money(v){return 'S/ '+Number(v).toFixed(2)}
function teamLabel(t){return `${t.flag||''} ${t.name}`.trim()}
function findTeam(name){return worldState.teams.find(t=>t.name===name)||{name,flag:''}}
function uniqueTeams(names){const seen=new Set();return names.filter(Boolean).filter(n=>!seen.has(n)&&seen.add(n)).map(findTeam)}
function optionList(teams,placeholder='Selecciona',selected=''){
  return `<option value="">${placeholder}</option>`+teams.map(t=>`<option value="${t.name}" ${t.name===selected?'selected':''}>${teamLabel(t)}</option>`).join('')
}
async function initMundial(){
  if(!document.querySelector('[data-start-mode]')) return;
  const data=await fetch('../assets/data/mundial-fixture.json').then(r=>r.json());
  worldState.groups=data.groups; worldState.teams=data.groups.flatMap(g=>g.teams);
  document.querySelectorAll('[data-start-mode]').forEach(card=>card.addEventListener('click',()=>startMode(card.dataset.startMode)));
  document.querySelector('[data-change-mode]')?.addEventListener('click',resetToModes);
  document.querySelector('[data-confirm-world]')?.addEventListener('click',openConfirmBridge);
  document.querySelectorAll('[data-close-world-modal]').forEach(btn=>btn.addEventListener('click',closeWorldModal));
  document.querySelector('[data-pay-mercado]')?.addEventListener('click',completePaymentFlow);
}
function resetToModes(){
  document.querySelector('.world-hero').scrollIntoView({behavior:'smooth'});
  ['[data-world-play]','[data-groups-section]','[data-bracket-section]','[data-champion-section]'].forEach(sel=>{const el=document.querySelector(sel); if(el) el.hidden=true;});
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
  wrap.innerHTML=worldState.groups.map(g=>`<article class="card group-card"><span class="pill">Grupo ${g.group}</span><div class="teams">${g.teams.map(t=>`<div class="team-row"><span class="flag-badge">${t.flag}</span><span>${t.name}</span></div>`).join('')}</div><div class="group-selects"><div class="field"><label>1.º lugar</label><select data-group-pick="${g.group}" data-position="1">${optionList(g.teams,'Primer lugar')}</select></div><div class="field"><label>2.º lugar</label><select data-group-pick="${g.group}" data-position="2">${optionList(g.teams,'Segundo lugar')}</select></div><div class="field"><label>3.º lugar</label><select data-group-pick="${g.group}" data-position="3">${optionList(g.teams,'Tercer lugar')}</select></div></div></article>`).join('');
  wrap.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',e=>{
    const g=e.target.dataset.groupPick; const pos=e.target.dataset.position; worldState.groupPicks[g]=worldState.groupPicks[g]||{}; worldState.groupPicks[g][pos]=e.target.value;
    renderBracket(); renderChampion(); updateWorldCount();
  }));
}
function groupQualifiedNames(){
  const picks=[];
  worldState.groups.forEach(g=>{
    const groupPick=worldState.groupPicks[g.group]||{};
    ['1','2','3'].forEach(pos=>{ if(groupPick[pos]) picks.push(groupPick[pos]); });
  });
  return picks.length?picks:worldState.teams.map(t=>t.name);
}
function roundCandidateNames(roundKey,matchIndex){
  const mode=worldState.mode;
  if(mode==='premium'){
    if(roundKey==='ronda32') return groupQualifiedNames();
    const prev={octavos:'ronda32',cuartos:'octavos',semis:'cuartos',final:'semis'}[roundKey];
    const base=(worldState.bracketPicks[prev]||{});
    return [base[matchIndex*2]?.winner,base[matchIndex*2+1]?.winner].filter(Boolean);
  }
  if(mode==='pro'){
    if(roundKey==='octavos') return groupQualifiedNames();
    if(roundKey==='cuartos'){
      const base=worldState.bracketPicks.octavos||{};
      return [base[matchIndex*2]?.winner,base[matchIndex*2+1]?.winner].filter(Boolean);
    }
  }
  return worldState.teams.map(t=>t.name);
}
function winnerOptions(match){
  return uniqueTeams([match?.a,match?.b]);
}
function renderBracket(){
  const section=document.querySelector('[data-bracket-section]'); const wrap=document.querySelector('[data-world-bracket]'); const mode=WORLD_MODES[worldState.mode];
  if(!mode.rounds.length){ section.hidden=true; return; }
  section.hidden=false; document.querySelector('[data-bracket-title]').textContent=worldState.mode==='pro'?'Llaves hasta cuartos':'Fixture completo';
  document.querySelector('[data-bracket-description]').textContent=worldState.mode==='pro'?'Define ganadores en octavos y cuartos de final.':'Completa cada ronda: los ganadores avanzan como opciones para la siguiente llave.';
  wrap.innerHTML=mode.rounds.map(round=>`<article class="card round-card"><div class="round-title"><h3>${round.name}</h3><span class="pill">${round.matches} partidos</span></div><div class="round-matches">${Array.from({length:round.matches},(_,i)=>renderMatch(round,i)).join('')}</div></article>`).join('');
  wrap.querySelectorAll('select').forEach(sel=>sel.addEventListener('change',handleBracketChange));
}
function renderMatch(round,i){
  const match=(worldState.bracketPicks[round.key]||{})[i]||{};
  const candidates=uniqueTeams(roundCandidateNames(round.key,i));
  const candidateTeams=candidates.length?candidates:worldState.teams;
  const winners=winnerOptions(match);
  return `<div class="match bracket-match"><div class="match-title"><strong>Partido ${i+1}</strong><small>${round.name}</small></div><div class="bracket-selects"><div class="field"><label>Equipo A</label><select data-round="${round.key}" data-match="${i}" data-side="a">${optionList(candidateTeams,'Equipo A',match.a||'')}</select></div><div class="field"><label>Equipo B</label><select data-round="${round.key}" data-match="${i}" data-side="b">${optionList(candidateTeams,'Equipo B',match.b||'')}</select></div><div class="field"><label>Ganador</label><select data-round="${round.key}" data-match="${i}" data-side="winner">${optionList(winners,'Ganador',match.winner||'')}</select></div></div></div>`;
}
function clearFollowingRounds(roundKey){
  const idx=ROUND_ORDER.indexOf(roundKey);
  ROUND_ORDER.slice(idx+1).forEach(k=>{ if(worldState.bracketPicks[k]) worldState.bracketPicks[k]={}; });
  worldState.champion='';
}
function handleBracketChange(e){
  const {round,match,side}=e.target.dataset; const idx=Number(match);
  worldState.bracketPicks[round]=worldState.bracketPicks[round]||{}; worldState.bracketPicks[round][idx]=worldState.bracketPicks[round][idx]||{};
  worldState.bracketPicks[round][idx][side]=e.target.value;
  const m=worldState.bracketPicks[round][idx];
  if(side==='a'||side==='b'){
    if(m.winner && ![m.a,m.b].includes(m.winner)) m.winner='';
  }
  clearFollowingRounds(round);
  renderBracket(); renderChampion(); updateWorldCount();
}
function finalWinnerNames(){
  if(worldState.mode!=='premium') return [];
  const final=(worldState.bracketPicks.final||{})[0]||{};
  return [final.winner].filter(Boolean);
}
function renderChampion(){
  const section=document.querySelector('[data-champion-section]'); const select=document.querySelector('[data-champion-select]');
  if(worldState.mode!=='premium'){section.hidden=true; return;}
  section.hidden=false;
  const championPool=uniqueTeams(finalWinnerNames().length?finalWinnerNames():Object.values(worldState.bracketPicks.semis||{}).map(m=>m.winner).filter(Boolean));
  select.innerHTML=optionList(championPool.length?championPool:worldState.teams,'Elige campeón',worldState.champion);
  select.onchange=e=>{worldState.champion=e.target.value; updateWorldCount();};
}
function updateWorldCount(){
  const groupCount=Object.values(worldState.groupPicks).reduce((a,p)=>a+Object.values(p).filter(Boolean).length,0);
  const bracketCount=Object.values(worldState.bracketPicks).reduce((a,round)=>a+Object.values(round).reduce((b,m)=>b+Object.values(m).filter(Boolean).length,0),0);
  const championCount=worldState.champion?1:0;
  document.querySelector('[data-world-count]').textContent=groupCount+bracketCount+championCount;
}
function openConfirmBridge(){
  if(!worldState.mode){return alert('Elige una modalidad para continuar.');}
  const modal=document.querySelector('[data-world-modal]');
  const login=document.querySelector('[data-modal-login]'); const payment=document.querySelector('[data-modal-payment]');
  const mode=WORLD_MODES[worldState.mode];
  document.querySelector('[data-payment-mode]').textContent=mode.name;
  document.querySelector('[data-payment-total]').textContent=money(mode.price);
  if(PL.isLoggedIn()){ login.hidden=true; payment.hidden=false; } else { login.hidden=false; payment.hidden=true; }
  modal.hidden=false;
}
function closeWorldModal(){document.querySelector('[data-world-modal]').hidden=true;}
function completePaymentFlow(){
  const mode=WORLD_MODES[worldState.mode]; const code='PWC-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-6);
  addTicket({code,game:mode.name,date:new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}),amount:PL.money(mode.price),status:'Registrado',prize:'Pozo '+mode.short},mode.price);
  closeWorldModal(); alert('Jugada registrada: '+code); location.href='../mis-jugadas.html';
}
document.addEventListener('DOMContentLoaded',initMundial);
