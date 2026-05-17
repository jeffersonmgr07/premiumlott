const WORLD_MODES = {
  express: { name: 'World Cup Express', short: 'Express', price: 5, label: 'Fase de grupos', description: 'Pronostica primeros, segundos y mejores terceros de cada grupo.', maxRound: 'groups' },
  pro: { name: 'World Cup Pro', short: 'Pro', price: 10, label: 'Grupos + eliminatorias hasta cuartos', description: 'Completa la fase de grupos y define las llaves hasta cuartos de final.', maxRound: 'cuartos' },
  premium: { name: 'World Cup Premium', short: 'Premium', price: 20, label: 'Fixture completo', description: 'Completa grupos, ronda de 32, octavos, cuartos, semifinales, final y campeon.', maxRound: 'final' }
};

const ROUNDS = [
  { key: 'ronda32', title: 'Ronda de 32', short: 'R32' },
  { key: 'octavos', title: 'Octavos de final', short: 'OCT' },
  { key: 'cuartos', title: 'Cuartos de final', short: '4TOS' },
  { key: 'semis', title: 'Semifinales', short: 'SEMIS' },
  { key: 'final', title: 'Final', short: 'FINAL' }
];

const ROUND_LIMITS = { pro: ['ronda32','octavos','cuartos'], premium: ['ronda32','octavos','cuartos','semis','final'] };

const KNOCKOUT_FIXTURES = {
  ronda32: [
    { id:'r32_1', label:'M1', a:{type:'group', group:'A', pos:'second'}, b:{type:'group', group:'B', pos:'second'}, date:'Dom. 28 jun.', time:'3:00 p.m. ET', venue:'SoFi Stadium, Inglewood' },
    { id:'r32_2', label:'M2', a:{type:'group', group:'E', pos:'first'}, b:{type:'third', index:0}, date:'Lun. 29 jun.', time:'4:30 p.m. ET', venue:'Gillette Stadium, Foxborough' },
    { id:'r32_3', label:'M3', a:{type:'group', group:'F', pos:'first'}, b:{type:'group', group:'C', pos:'second'}, date:'Lun. 29 jun.', time:'9:00 p.m. ET', venue:'Estadio BBVA, Guadalupe' },
    { id:'r32_4', label:'M4', a:{type:'group', group:'C', pos:'first'}, b:{type:'group', group:'F', pos:'second'}, date:'Lun. 29 jun.', time:'1:00 p.m. ET', venue:'NRG Stadium, Houston' },
    { id:'r32_5', label:'M5', a:{type:'group', group:'I', pos:'first'}, b:{type:'third', index:1}, date:'Mar. 30 jun.', time:'5:00 p.m. ET', venue:'MetLife Stadium, East Rutherford' },
    { id:'r32_6', label:'M6', a:{type:'group', group:'E', pos:'second'}, b:{type:'group', group:'I', pos:'second'}, date:'Mar. 30 jun.', time:'1:00 p.m. ET', venue:'AT&T Stadium, Arlington' },
    { id:'r32_7', label:'M7', a:{type:'group', group:'A', pos:'first'}, b:{type:'third', index:2}, date:'Mar. 30 jun.', time:'9:00 p.m. ET', venue:'Estadio Azteca, Ciudad de Mexico' },
    { id:'r32_8', label:'M8', a:{type:'group', group:'L', pos:'first'}, b:{type:'third', index:3}, date:'Mie. 1 jul.', time:'12:00 p.m. ET', venue:'Mercedes-Benz Stadium, Atlanta' },
    { id:'r32_9', label:'M9', a:{type:'group', group:'D', pos:'first'}, b:{type:'third', index:4}, date:'Mie. 1 jul.', time:'8:00 p.m. ET', venue:'Levi\'s Stadium, Santa Clara' },
    { id:'r32_10', label:'M10', a:{type:'group', group:'G', pos:'first'}, b:{type:'third', index:5}, date:'Mie. 1 jul.', time:'4:00 p.m. ET', venue:'Lumen Field, Seattle' },
    { id:'r32_11', label:'M11', a:{type:'group', group:'K', pos:'second'}, b:{type:'group', group:'L', pos:'second'}, date:'Jue. 2 jul.', time:'7:00 p.m. ET', venue:'BMO Field, Toronto' },
    { id:'r32_12', label:'M12', a:{type:'group', group:'H', pos:'first'}, b:{type:'group', group:'J', pos:'second'}, date:'Jue. 2 jul.', time:'3:00 p.m. ET', venue:'SoFi Stadium, Inglewood' },
    { id:'r32_13', label:'M13', a:{type:'group', group:'B', pos:'first'}, b:{type:'third', index:6}, date:'Jue. 2 jul.', time:'11:00 p.m. ET', venue:'BC Place, Vancouver' },
    { id:'r32_14', label:'M14', a:{type:'group', group:'J', pos:'first'}, b:{type:'group', group:'H', pos:'second'}, date:'Vie. 3 jul.', time:'6:00 p.m. ET', venue:'Hard Rock Stadium, Miami' },
    { id:'r32_15', label:'M15', a:{type:'group', group:'K', pos:'first'}, b:{type:'third', index:7}, date:'Vie. 3 jul.', time:'9:30 p.m. ET', venue:'Arrowhead Stadium, Kansas City' },
    { id:'r32_16', label:'M16', a:{type:'group', group:'D', pos:'second'}, b:{type:'group', group:'G', pos:'second'}, date:'Vie. 3 jul.', time:'2:00 p.m. ET', venue:'AT&T Stadium, Arlington' }
  ],
  octavos: [
    { id:'oct_1', label:'O1', a:{type:'winner', match:'r32_2'}, b:{type:'winner', match:'r32_5'}, date:'Sab. 4 jul.', time:'5:00 p.m. ET', venue:'Lincoln Financial Field, Philadelphia' },
    { id:'oct_2', label:'O2', a:{type:'winner', match:'r32_1'}, b:{type:'winner', match:'r32_3'}, date:'Sab. 4 jul.', time:'1:00 p.m. ET', venue:'NRG Stadium, Houston' },
    { id:'oct_3', label:'O3', a:{type:'winner', match:'r32_4'}, b:{type:'winner', match:'r32_6'}, date:'Dom. 5 jul.', time:'4:00 p.m. ET', venue:'MetLife Stadium, East Rutherford' },
    { id:'oct_4', label:'O4', a:{type:'winner', match:'r32_7'}, b:{type:'winner', match:'r32_8'}, date:'Dom. 5 jul.', time:'8:00 p.m. ET', venue:'Estadio Azteca, Ciudad de Mexico' },
    { id:'oct_5', label:'O5', a:{type:'winner', match:'r32_11'}, b:{type:'winner', match:'r32_12'}, date:'Lun. 6 jul.', time:'3:00 p.m. ET', venue:'AT&T Stadium, Arlington' },
    { id:'oct_6', label:'O6', a:{type:'winner', match:'r32_9'}, b:{type:'winner', match:'r32_10'}, date:'Lun. 6 jul.', time:'8:00 p.m. ET', venue:'Lumen Field, Seattle' },
    { id:'oct_7', label:'O7', a:{type:'winner', match:'r32_14'}, b:{type:'winner', match:'r32_16'}, date:'Mar. 7 jul.', time:'12:00 p.m. ET', venue:'Mercedes-Benz Stadium, Atlanta' },
    { id:'oct_8', label:'O8', a:{type:'winner', match:'r32_13'}, b:{type:'winner', match:'r32_15'}, date:'Mar. 7 jul.', time:'4:00 p.m. ET', venue:'BC Place, Vancouver' }
  ],
  cuartos: [
    { id:'qf_1', label:'QF1', a:{type:'winner', match:'oct_1'}, b:{type:'winner', match:'oct_2'}, date:'Jue. 9 jul.', time:'4:00 p.m. ET', venue:'Gillette Stadium, Foxborough' },
    { id:'qf_2', label:'QF2', a:{type:'winner', match:'oct_5'}, b:{type:'winner', match:'oct_6'}, date:'Vie. 10 jul.', time:'3:00 p.m. ET', venue:'SoFi Stadium, Inglewood' },
    { id:'qf_3', label:'QF3', a:{type:'winner', match:'oct_3'}, b:{type:'winner', match:'oct_4'}, date:'Sab. 11 jul.', time:'5:00 p.m. ET', venue:'Hard Rock Stadium, Miami' },
    { id:'qf_4', label:'QF4', a:{type:'winner', match:'oct_7'}, b:{type:'winner', match:'oct_8'}, date:'Sab. 11 jul.', time:'9:00 p.m. ET', venue:'Arrowhead Stadium, Kansas City' }
  ],
  semis: [
    { id:'sf_1', label:'SF1', a:{type:'winner', match:'qf_1'}, b:{type:'winner', match:'qf_2'}, date:'Mar. 14 jul.', time:'3:00 p.m. ET', venue:'AT&T Stadium, Arlington' },
    { id:'sf_2', label:'SF2', a:{type:'winner', match:'qf_3'}, b:{type:'winner', match:'qf_4'}, date:'Mie. 15 jul.', time:'3:00 p.m. ET', venue:'Mercedes-Benz Stadium, Atlanta' }
  ],
  final: [
    { id:'final_1', label:'Final', a:{type:'winner', match:'sf_1'}, b:{type:'winner', match:'sf_2'}, date:'Dom. 19 jul.', time:'3:00 p.m. ET', venue:'MetLife Stadium, East Rutherford' }
  ]
};

const GROUP_FIXTURES = {
  A:['11 jun. 3:00 p.m. ET - Mexico vs Sudafrica - Mexico City Stadium','11 jun. 10:00 p.m. ET - Corea del Sur vs Czechia - Estadio Guadalajara','18 jun. 12:00 p.m. ET - Czechia vs Sudafrica - Mercedes-Benz Stadium','18 jun. 9:00 p.m. ET - Mexico vs Corea del Sur - Estadio Guadalajara','24 jun. 9:00 p.m. ET - Czechia vs Mexico - Mexico City Stadium','24 jun. 9:00 p.m. ET - Sudafrica vs Corea del Sur - Estadio Monterrey'],
  B:['12 jun. 3:00 p.m. ET - Canada vs Bosnia y Herzegovina - BMO Field','13 jun. 3:00 p.m. ET - Qatar vs Suiza - Levi\'s Stadium','18 jun. 3:00 p.m. ET - Bosnia y Herzegovina vs Suiza - SoFi Stadium','18 jun. 6:00 p.m. ET - Canada vs Qatar - BC Place','24 jun. 3:00 p.m. ET - Suiza vs Canada - BC Place','24 jun. 3:00 p.m. ET - Bosnia y Herzegovina vs Qatar - Lumen Field'],
  C:['13 jun. 6:00 p.m. ET - Brasil vs Marruecos - MetLife Stadium','13 jun. 9:00 p.m. ET - Haiti vs Escocia - Gillette Stadium','19 jun. 6:00 p.m. ET - Escocia vs Marruecos - Lincoln Financial Field','19 jun. 9:00 p.m. ET - Brasil vs Haiti - Gillette Stadium','24 jun. 6:00 p.m. ET - Escocia vs Brasil - Hard Rock Stadium','24 jun. 6:00 p.m. ET - Marruecos vs Haiti - Mercedes-Benz Stadium'],
  D:['12 jun. 9:00 p.m. ET - Estados Unidos vs Paraguay - SoFi Stadium','13 jun. 12:00 a.m. ET - Australia vs Turquia - BC Place','20 jun. 12:00 a.m. ET - Turquia vs Paraguay - Levi\'s Stadium','19 jun. 3:00 p.m. ET - Estados Unidos vs Australia - Lumen Field','25 jun. 10:00 p.m. ET - Turquia vs Estados Unidos - SoFi Stadium','25 jun. 10:00 p.m. ET - Paraguay vs Australia - Levi\'s Stadium'],
  E:['14 jun. 1:00 p.m. ET - Alemania vs Curacao - NRG Stadium','14 jun. 7:00 p.m. ET - Costa de Marfil vs Ecuador - Lincoln Financial Field','20 jun. 4:00 p.m. ET - Alemania vs Costa de Marfil - BMO Field','20 jun. 8:00 p.m. ET - Ecuador vs Curacao - Arrowhead Stadium','25 jun. 4:00 p.m. ET - Ecuador vs Alemania - MetLife Stadium','25 jun. 4:00 p.m. ET - Curacao vs Costa de Marfil - Lincoln Financial Field'],
  F:['14 jun. 4:00 p.m. ET - Paises Bajos vs Japon - AT&T Stadium','14 jun. 10:00 p.m. ET - Suecia vs Tunez - Estadio BBVA','20 jun. 1:00 p.m. ET - Tunez vs Japon - Estadio BBVA','20 jun. 12:00 a.m. ET - Paises Bajos vs Suecia - NRG Stadium','25 jun. 7:00 p.m. ET - Tunez vs Paises Bajos - AT&T Stadium','25 jun. 7:00 p.m. ET - Japon vs Suecia - Arrowhead Stadium'],
  G:['15 jun. 3:00 p.m. ET - Belgica vs Egipto - SoFi Stadium','15 jun. 9:00 p.m. ET - Iran vs Nueva Zelanda - Lumen Field','21 jun. 3:00 p.m. ET - Belgica vs Iran - SoFi Stadium','21 jun. 9:00 p.m. ET - Nueva Zelanda vs Egipto - BC Place','26 jun. 8:00 p.m. ET - Nueva Zelanda vs Belgica - Lumen Field','26 jun. 8:00 p.m. ET - Egipto vs Iran - BC Place'],
  H:['15 jun. 12:00 p.m. ET - Espana vs Cabo Verde - Mercedes-Benz Stadium','15 jun. 6:00 p.m. ET - Arabia Saudita vs Uruguay - Hard Rock Stadium','21 jun. 12:00 p.m. ET - Espana vs Arabia Saudita - Mercedes-Benz Stadium','21 jun. 6:00 p.m. ET - Uruguay vs Cabo Verde - Hard Rock Stadium','26 jun. 8:00 p.m. ET - Uruguay vs Espana - NRG Stadium','26 jun. 8:00 p.m. ET - Cabo Verde vs Arabia Saudita - Estadio Akron'],
  I:['16 jun. 3:00 p.m. ET - Francia vs Senegal - MetLife Stadium','16 jun. 6:00 p.m. ET - Irak vs Noruega - Gillette Stadium','22 jun. 5:00 p.m. ET - Francia vs Irak - Lincoln Financial Field','22 jun. 8:00 p.m. ET - Noruega vs Senegal - MetLife Stadium','26 jun. 3:00 p.m. ET - Noruega vs Francia - Gillette Stadium','26 jun. 3:00 p.m. ET - Senegal vs Irak - BMO Field'],
  J:['16 jun. 9:00 p.m. ET - Argentina vs Argelia - Arrowhead Stadium','17 jun. 12:00 a.m. ET - Austria vs Jordania - Levi\'s Stadium','22 jun. 1:00 p.m. ET - Argentina vs Austria - AT&T Stadium','22 jun. 11:00 p.m. ET - Jordania vs Argelia - Levi\'s Stadium','27 jun. 10:00 p.m. ET - Jordania vs Argentina - Arrowhead Stadium','27 jun. 10:00 p.m. ET - Argelia vs Austria - AT&T Stadium'],
  K:['17 jun. 1:00 p.m. ET - Portugal vs RD Congo - NRG Stadium','17 jun. 10:00 p.m. ET - Uzbekistan vs Colombia - Estadio Azteca','23 jun. 1:00 p.m. ET - Portugal vs Uzbekistan - NRG Stadium','23 jun. 10:00 p.m. ET - Colombia vs RD Congo - Estadio Akron','27 jun. 7:30 p.m. ET - Colombia vs Portugal - Hard Rock Stadium','27 jun. 7:30 p.m. ET - RD Congo vs Uzbekistan - Mercedes-Benz Stadium'],
  L:['17 jun. 4:00 p.m. ET - Inglaterra vs Croacia - AT&T Stadium','17 jun. 7:00 p.m. ET - Ghana vs Panama - BMO Field','23 jun. 4:00 p.m. ET - Inglaterra vs Ghana - Gillette Stadium','23 jun. 7:00 p.m. ET - Panama vs Croacia - BMO Field','27 jun. 5:00 p.m. ET - Panama vs Inglaterra - MetLife Stadium','27 jun. 5:00 p.m. ET - Croacia vs Ghana - Lincoln Financial Field']
};

let worldState = { mode:null, teams:[], groups:[], groupPicks:{}, bestThirds:Array(8).fill(''), winners:{}, champion:'', pendingTicket:null };

function money(v){ return 'S/ ' + Number(v).toFixed(2); }
function esc(s){ return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function teamLabel(t){ return `${t.flag || ''} ${t.name}`.trim(); }
function findTeam(name){ return worldState.teams.find(t => t.name === name) || { name:name || '', flag:'' }; }
function optionList(teams, placeholder='Selecciona', selected=''){
  return `<option value="">${placeholder}</option>` + teams.map(t => `<option value="${esc(t.name)}" ${t.name===selected?'selected':''}>${esc(teamLabel(t))}</option>`).join('');
}
function groupPick(group, pos){ return worldState.groupPicks[group]?.[pos] || ''; }
function totalSelections(){
  let count = 0;
  Object.values(worldState.groupPicks).forEach(p => ['first','second','third'].forEach(k => { if(p[k]) count++; }));
  worldState.bestThirds.forEach(t => { if(t) count++; });
  Object.values(worldState.winners).forEach(v => { if(v) count++; });
  if(worldState.champion) count++;
  return count;
}

async function initMundial(){
  if(!document.querySelector('[data-start-mode]')) return;
  const data = await fetch('../assets/data/mundial-fixture.json').then(r => r.json());
  worldState.groups = data.groups;
  worldState.teams = data.groups.flatMap(g => g.teams);
  document.querySelectorAll('[data-start-mode]').forEach(card => card.addEventListener('click', () => startMode(card.dataset.startMode)));
  document.querySelector('[data-change-mode]')?.addEventListener('click', resetToModes);
  document.querySelector('[data-confirm-world]')?.addEventListener('click', openConfirmBridge);
  document.querySelectorAll('[data-close-world-modal]').forEach(btn => btn.addEventListener('click', closeWorldModal));
  document.querySelector('[data-pay-mercado]')?.addEventListener('click', completePaymentFlow);
}

function resetToModes(){
  ['[data-world-play]','[data-groups-section]','[data-bracket-section]','[data-champion-section]'].forEach(sel => { const el = document.querySelector(sel); if(el) el.hidden = true; });
  document.querySelector('.world-hero')?.scrollIntoView({behavior:'smooth'});
}

function startMode(modeKey){
  worldState.mode = modeKey;
  worldState.groupPicks = {};
  worldState.bestThirds = Array(8).fill('');
  worldState.winners = {};
  worldState.champion = '';
  const mode = WORLD_MODES[modeKey];
  document.querySelector('[data-world-play]').hidden = false;
  document.querySelector('[data-groups-section]').hidden = false;
  document.querySelector('[data-mode-label]').textContent = mode.name;
  document.querySelector('[data-mode-title]').textContent = mode.label;
  document.querySelector('[data-mode-description]').textContent = mode.description;
  document.querySelector('[data-summary-mode]').textContent = mode.short;
  document.querySelector('[data-summary-price]').textContent = money(mode.price);
  document.querySelector('[data-bracket-section]').hidden = modeKey === 'express';
  document.querySelector('[data-champion-section]').hidden = modeKey !== 'premium';
  renderGroups();
  renderBracket();
  updateSteps();
  updateCount();
  document.querySelector('[data-world-play]').scrollIntoView({behavior:'smooth'});
}

function updateSteps(){
  const mode = worldState.mode;
  const stepKnockouts = document.querySelector('[data-step-knockouts]');
  const stepChampion = document.querySelector('[data-step-champion]');
  if(stepKnockouts) stepKnockouts.style.display = mode === 'express' ? 'none' : '';
  if(stepChampion) stepChampion.style.display = mode === 'premium' ? '' : 'none';
}

function renderGroups(){
  const wrap = document.querySelector('[data-world-groups]');
  if(!wrap) return;
  wrap.innerHTML = worldState.groups.map(group => {
    const teams = group.teams;
    const picks = worldState.groupPicks[group.group] || {};
    const fixtures = GROUP_FIXTURES[group.group] || [];
    return `<article class="card group-card">
      <div class="group-card-head"><span class="pill">Grupo ${group.group}</span><span class="mini">6 partidos</span></div>
      <div class="teams">${teams.map(t => `<div class="team-row"><span class="flag-badge">${esc(t.flag)}</span><strong>${esc(t.name)}</strong></div>`).join('')}</div>
      <details class="group-calendar"><summary>Calendario del grupo</summary><div>${fixtures.map(f => `<small>${esc(f)}</small>`).join('')}</div></details>
      <div class="group-selects">
        ${['first','second','third'].map((pos, index) => `<div class="field"><label>${index+1}.º lugar</label><select data-group="${group.group}" data-pos="${pos}">${optionList(teams, 'Selecciona equipo', picks[pos] || '')}</select></div>`).join('')}
      </div>
    </article>`;
  }).join('');
  wrap.querySelectorAll('select[data-group]').forEach(select => select.addEventListener('change', e => {
    const group = e.target.dataset.group;
    const pos = e.target.dataset.pos;
    worldState.groupPicks[group] = worldState.groupPicks[group] || {};
    worldState.groupPicks[group][pos] = e.target.value;
    sanitizeDuplicateGroup(group, pos);
    trimInvalidBestThirds();
    trimInvalidWinners();
    renderGroups();
    renderBracket();
    updateCount();
  }));
}

function sanitizeDuplicateGroup(group, changedPos){
  const p = worldState.groupPicks[group] || {};
  const changed = p[changedPos];
  if(!changed) return;
  ['first','second','third'].forEach(pos => { if(pos !== changedPos && p[pos] === changed) p[pos] = ''; });
}

function thirdPlaceTeams(){
  return worldState.groups.map(g => groupPick(g.group, 'third')).filter(Boolean).map(findTeam);
}
function trimInvalidBestThirds(){
  const valid = new Set(thirdPlaceTeams().map(t => t.name));
  worldState.bestThirds = worldState.bestThirds.map(t => valid.has(t) ? t : '');
}

function sourceTeam(source){
  if(source.type === 'group') return groupPick(source.group, source.pos);
  if(source.type === 'third') return worldState.bestThirds[source.index] || '';
  if(source.type === 'winner') return worldState.winners[source.match] || '';
  return '';
}

function matchTeams(match){
  return [sourceTeam(match.a), sourceTeam(match.b)].filter(Boolean).map(findTeam);
}

function renderBracket(){
  const mode = worldState.mode;
  if(!mode || mode === 'express') return;
  const rounds = ROUND_LIMITS[mode] || [];
  const wrap = document.querySelector('[data-world-bracket]');
  if(!wrap) return;
  document.querySelector('[data-bracket-title]').textContent = mode === 'premium' ? 'Fixture completo tipo llaves' : 'Eliminatorias hasta cuartos';
  document.querySelector('[data-bracket-description]').textContent = 'Cada ganador avanza automaticamente a la siguiente fase. El selector de ganador solo muestra los dos equipos del cruce.';
  wrap.innerHTML = `
    <article class="card best-thirds-panel">
      <div class="round-title"><div><span class="pill">Mejores terceros</span><h3>Selecciona los 8 mejores terceros</h3></div><small>Estos equipos completan la ronda de 32.</small></div>
      <div class="best-third-grid">${Array.from({length:8}).map((_,i) => `<div class="field"><label>Mejor 3.º ${i+1}</label><select data-best-third="${i}">${optionList(thirdPlaceTeams(), 'Selecciona tercero', worldState.bestThirds[i] || '')}</select></div>`).join('')}</div>
    </article>
    <div class="bracket-map ${mode === 'premium' ? 'bracket-premium' : 'bracket-pro'}">
      ${rounds.map(roundKey => renderRound(roundKey)).join('')}
    </div>`;
  wrap.querySelectorAll('select[data-best-third]').forEach(sel => sel.addEventListener('change', e => {
    const i = Number(e.target.dataset.bestThird);
    worldState.bestThirds[i] = e.target.value;
    sanitizeBestThirds(i);
    trimInvalidWinners();
    renderBracket();
    updateCount();
  }));
  wrap.querySelectorAll('button[data-winner]').forEach(btn => btn.addEventListener('click', e => {
    const match = e.currentTarget.dataset.match;
    worldState.winners[match] = e.currentTarget.dataset.winner;
    trimInvalidWinners();
    renderBracket();
    renderChampion();
    updateCount();
  }));
  renderChampion();
}

function sanitizeBestThirds(changedIndex){
  const changed = worldState.bestThirds[changedIndex];
  if(!changed) return;
  worldState.bestThirds = worldState.bestThirds.map((t, i) => i !== changedIndex && t === changed ? '' : t);
}

function trimInvalidWinners(){
  const allMatches = Object.values(KNOCKOUT_FIXTURES).flat();
  let changed = true;
  while(changed){
    changed = false;
    allMatches.forEach(match => {
      const teams = matchTeams(match).map(t => t.name);
      if(worldState.winners[match.id] && !teams.includes(worldState.winners[match.id])){
        worldState.winners[match.id] = '';
        changed = true;
      }
    });
  }
  const finalTeams = matchTeams(KNOCKOUT_FIXTURES.final[0]).map(t => t.name);
  if(worldState.champion && !finalTeams.includes(worldState.champion)) worldState.champion = '';
}

function renderRound(roundKey){
  const round = ROUNDS.find(r => r.key === roundKey);
  const fixtures = KNOCKOUT_FIXTURES[roundKey] || [];
  return `<section class="bracket-round" data-round="${roundKey}">
    <div class="bracket-round-head"><span>${round.short}</span><h3>${round.title}</h3></div>
    <div class="bracket-round-matches">${fixtures.map(match => renderMatch(match)).join('')}</div>
  </section>`;
}

function renderMatch(match){
  const teamA = sourceTeam(match.a);
  const teamB = sourceTeam(match.b);
  const teams = matchTeams(match);
  const picked = worldState.winners[match.id] || '';
  const isReady = teams.length === 2;
  return `<article class="bracket-node ${picked ? 'is-picked' : ''}">
    <div class="node-meta"><strong>${match.label}</strong><span>${esc(match.date)} · ${esc(match.time)}</span></div>
    <div class="node-venue">${esc(match.venue)}</div>
    <div class="node-teams">
      ${renderTeamSlot(teamA, match.a)}
      ${renderTeamSlot(teamB, match.b)}
    </div>
    <div class="winner-buttons ${isReady ? '' : 'is-disabled'}">
      ${isReady ? teams.map(t => `<button type="button" class="winner-chip ${picked===t.name?'active':''}" data-match="${match.id}" data-winner="${esc(t.name)}">${esc(teamLabel(t))}</button>`).join('') : '<small>Completa las rondas anteriores para activar este cruce.</small>'}
    </div>
  </article>`;
}

function renderTeamSlot(teamName, source){
  if(teamName){
    const t = findTeam(teamName);
    return `<div class="node-team"><span>${esc(t.flag)}</span><strong>${esc(t.name)}</strong></div>`;
  }
  return `<div class="node-team pending"><span>·</span><strong>${esc(sourceLabel(source))}</strong></div>`;
}

function sourceLabel(source){
  if(source.type === 'group') return `${source.pos === 'first' ? '1.º' : '2.º'} Grupo ${source.group}`;
  if(source.type === 'third') return `Mejor 3.º ${source.index + 1}`;
  if(source.type === 'winner') return `Ganador ${source.match.toUpperCase().replace('_',' ')}`;
  return 'Pendiente';
}

function renderChampion(){
  const section = document.querySelector('[data-champion-section]');
  if(!section || worldState.mode !== 'premium') return;
  section.hidden = false;
  const sel = document.querySelector('[data-champion-select]');
  const finalTeams = matchTeams(KNOCKOUT_FIXTURES.final[0]);
  sel.innerHTML = optionList(finalTeams, finalTeams.length ? 'Selecciona campeon' : 'Primero completa la final', worldState.champion);
  sel.onchange = e => { worldState.champion = e.target.value; updateCount(); };
}

function updateCount(){
  const el = document.querySelector('[data-world-count]');
  if(el) el.textContent = totalSelections();
}

function openConfirmBridge(){
  const mode = WORLD_MODES[worldState.mode || 'express'];
  const modal = document.querySelector('[data-world-modal]');
  const isLogged = localStorage.getItem('premiumlott_session') || localStorage.getItem('premiumlott_user');
  document.querySelector('[data-modal-login]').hidden = !!isLogged;
  document.querySelector('[data-modal-payment]').hidden = !isLogged;
  document.querySelector('[data-payment-mode]').textContent = mode.name;
  document.querySelector('[data-payment-total]').textContent = money(mode.price);
  modal.hidden = false;
}
function closeWorldModal(){ const modal = document.querySelector('[data-world-modal]'); if(modal) modal.hidden = true; }
function completePaymentFlow(){
  const mode = WORLD_MODES[worldState.mode || 'express'];
  const tickets = JSON.parse(localStorage.getItem('premiumlott_tickets') || '[]');
  const code = 'PWC-' + Date.now().toString().slice(-8);
  tickets.unshift({ code, game:'Premium World Cup', mode:mode.name, price:mode.price, status:'Registrada', date:new Date().toISOString().slice(0,10) });
  localStorage.setItem('premiumlott_tickets', JSON.stringify(tickets));
  alert('Jugada registrada: ' + code);
  closeWorldModal();
}

document.addEventListener('DOMContentLoaded', initMundial);
