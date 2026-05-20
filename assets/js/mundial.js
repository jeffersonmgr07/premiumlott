const WORLD_MODES = {
  express: { name: 'World Cup Express', short: 'Express', price: 5, label: 'Fase de grupos', description: 'Pronostica los clasificados de cada grupo y los 8 mejores terceros.', maxRound: 'groups' },
  pro: { name: 'World Cup Pro', short: 'Pro', price: 10, label: 'Grupos + llaves hasta cuartos', description: 'Completa grupos, mejores terceros y define ganadores hasta cuartos de final.', maxRound: 'cuartos' },
  premium: { name: 'World Cup Premium', short: 'Premium', price: 20, label: 'Fixture completo', description: 'Construye el camino completo del torneo y corona a tu campeón.', maxRound: 'final' }
};

const ROUND_LIMITS = { express: [], pro: ['ronda32','octavos','cuartos'], premium: ['ronda32','octavos','cuartos','semis','final'] };
const ROUND_LABELS = { ronda32:'Ronda de 32', octavos:'Octavos', cuartos:'Cuartos', semis:'Semifinales', final:'Final' };
const POSITIONS = { first:'1.º', second:'2.º', third:'3.º' };

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



const worldState = { mode:null, teams:[], groups:[], groupPicks:{}, bestThirds:Array(8).fill(''), winners:{}, champion:'' };
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money = value => PL ? PL.money(value) : 'S/ ' + Number(value || 0).toFixed(2);
function findTeam(name){ return worldState.teams.find(t => t.name === name) || { name:name || '', flag:'' }; }
function teamLabel(team){ return team ? `${team.flag || ''} ${team.name || team}`.trim() : ''; }
function optionList(teams, placeholder, selected){
  return `<option value="">${esc(placeholder)}</option>` + teams.map(t => `<option value="${esc(t.name)}" ${selected===t.name?'selected':''}>${esc(teamLabel(t))}</option>`).join('');
}
function selectedFromGroups(){ return Object.values(worldState.groupPicks).flatMap(p => [p.first,p.second,p.third]).filter(Boolean); }
function thirdPool(){ return Object.values(worldState.groupPicks).map(p => p.third).filter(Boolean).map(findTeam); }
function groupPick(group, pos){ return worldState.groupPicks[group]?.[pos] || ''; }
function totalSelections(){
  let n=0;
  Object.values(worldState.groupPicks).forEach(p => ['first','second','third'].forEach(k => { if(p[k]) n++; }));
  worldState.bestThirds.forEach(v => { if(v) n++; });
  Object.values(worldState.winners).forEach(v => { if(v) n++; });
  if(worldState.champion) n++;
  return n;
}
function requiredSelections(){
  if(worldState.mode === 'express') return 36 + 8;
  if(worldState.mode === 'pro') return 36 + 8 + 16 + 8 + 4;
  if(worldState.mode === 'premium') return 36 + 8 + 16 + 8 + 4 + 2 + 1 + 1;
  return 0;
}
function groupIsComplete(group){ const p=worldState.groupPicks[group] || {}; return !!(p.first && p.second && p.third); }
function groupsComplete(){ return worldState.groups.length && worldState.groups.every(g => groupIsComplete(g.group)); }
function bestThirdsComplete(){ return worldState.bestThirds.filter(Boolean).length === 8; }
function modeRounds(){ return ROUND_LIMITS[worldState.mode] || []; }
function roundComplete(round){ return (KNOCKOUT_FIXTURES[round] || []).every(m => !!worldState.winners[m.id]); }
function previousRoundsComplete(round){
  if(round === 'ronda32') return groupsComplete() && bestThirdsComplete();
  const order = ['ronda32','octavos','cuartos','semis','final'];
  const idx = order.indexOf(round);
  return order.slice(0,idx).every(roundComplete);
}
function allRequiredComplete(){
  if(!groupsComplete()) return false;
  if(!bestThirdsComplete()) return false;
  if(worldState.mode === 'express') return true;
  const rounds = modeRounds();
  if(!rounds.every(roundComplete)) return false;
  if(worldState.mode === 'premium' && !worldState.champion) return false;
  return true;
}

async function initMundial(){
  if(!$('[data-start-mode]')) return;
  const data = await fetch('../assets/data/mundial-fixture.json').then(r=>r.json());
  worldState.groups = data.groups;
  worldState.teams = data.groups.flatMap(g => g.teams);
  $$('[data-start-mode]').forEach(card => card.addEventListener('click', () => startMode(card.dataset.startMode)));
  $('[data-change-mode]')?.addEventListener('click', resetToLanding);
  $('[data-confirm-world]')?.addEventListener('click', openConfirmBridge);
  $$('[data-close-world-modal]').forEach(btn => btn.addEventListener('click', closeWorldModal));
  $('[data-pay-mercado]')?.addEventListener('click', completePaymentFlow);
}

function startMode(modeKey){
  worldState.mode = modeKey;
  worldState.groupPicks = {};
  worldState.bestThirds = Array(8).fill('');
  worldState.winners = {};
  worldState.champion = '';
  $('.worldcup-landing').hidden = true;
  $('[data-world-play]').hidden = false;
  $('[data-groups-section]').hidden = false;
  $('[data-bracket-section]').hidden = modeKey === 'express';
  $('[data-champion-section]').hidden = modeKey !== 'premium';
  const mode = WORLD_MODES[modeKey];
  $('[data-mode-label]').textContent = mode.name;
  $('[data-mode-title]').textContent = mode.label;
  $('[data-mode-description]').textContent = mode.description;
  $('[data-summary-mode]').textContent = mode.short;
  $('[data-summary-price]').textContent = money(mode.price);
  $('[data-step-knockouts]').classList.toggle('active', modeKey !== 'express');
  $('[data-step-champion]').classList.toggle('active', modeKey === 'premium');
  renderGroups();
  renderBestThirds();
  renderBracket();
  renderChampion();
  updateSummary();
  $('[data-world-play]').scrollIntoView({ behavior:'smooth', block:'start' });
}
function resetToLanding(){
  $('.worldcup-landing').hidden = false;
  $('[data-world-play]').hidden = true;
  $('[data-groups-section]').hidden = true;
  $('[data-bracket-section]').hidden = true;
  $('[data-champion-section]').hidden = true;
  $('.worldcup-landing').scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderGroups(){
  const wrap = $('[data-world-groups]'); if(!wrap) return;
  wrap.innerHTML = worldState.groups.map((group, index) => {
    const picks = worldState.groupPicks[group.group] || {};
    const complete = groupIsComplete(group.group);
    const fixtures = GROUP_FIXTURES[group.group] || [];
    return `<details class="world-group-accordion card ${complete ? 'is-complete' : ''}" ${index===0?'open':''}>
      <summary>
        <span class="group-summary-title">Grupo ${group.group}</span>
        <span class="group-status">${complete ? 'Completo' : 'Pendiente'}</span>
      </summary>
      <div class="group-teams-mini">${group.teams.map(t => `<span><b>${esc(t.flag)}</b>${esc(t.name)}</span>`).join('')}</div>
      <div class="group-selects compact-selects">
        ${['first','second','third'].map(pos => `<div class="field"><label>${POSITIONS[pos]} clasificado</label><select data-group="${group.group}" data-pos="${pos}">${optionList(group.teams, 'Selecciona equipo', picks[pos])}</select></div>`).join('')}
      </div>
      <details class="group-calendar"><summary>Ver fixture del grupo</summary><div>${fixtures.map(f=>`<small>${esc(f)}</small>`).join('')}</div></details>
    </details>`;
  }).join('') + `<article class="best-thirds-card card" data-best-thirds-card></article>`;
  $$('[data-group]').forEach(sel => sel.addEventListener('change', onGroupChange));
}
function onGroupChange(e){
  const group = e.target.dataset.group, pos = e.target.dataset.pos, value = e.target.value;
  worldState.groupPicks[group] ||= { first:'', second:'', third:'' };
  if(value){
    for(const key of ['first','second','third']) if(key !== pos && worldState.groupPicks[group][key] === value) worldState.groupPicks[group][key] = '';
  }
  worldState.groupPicks[group][pos] = value;
  worldState.bestThirds = worldState.bestThirds.map(v => selectedFromGroups().includes(v) ? v : '');
  trimInvalidWinners();
  renderGroups();
  renderBestThirds();
  renderBracket();
  renderChampion();
  updateSummary();
}
function renderBestThirds(){
  const box = $('[data-best-thirds-card]'); if(!box) return;
  const pool = thirdPool();
  const disabled = !groupsComplete();
  box.innerHTML = `<div class="best-third-head"><p class="eyebrow">Mejores terceros</p><h3>Elige 8 clasificados</h3><p class="muted">Se activan cuando completes los 12 grupos.</p></div>
    <div class="best-third-grid">
      ${Array.from({length:8}).map((_,i)=>`<div class="field"><label>Mejor 3.º ${i+1}</label><select data-best-third="${i}" ${disabled?'disabled':''}>${optionList(pool, disabled ? 'Completa grupos primero' : 'Selecciona tercero', worldState.bestThirds[i])}</select></div>`).join('')}
    </div>`;
  $$('[data-best-third]').forEach(sel => sel.addEventListener('change', e => {
    const idx = Number(e.target.dataset.bestThird);
    const val = e.target.value;
    worldState.bestThirds[idx] = val;
    worldState.bestThirds = worldState.bestThirds.map((v,i) => i !== idx && v === val ? '' : v);
    trimInvalidWinners();
    renderBestThirds();
    renderBracket();
    renderChampion();
    updateSummary();
  }));
}

function renderBracket(){
  const realWrap = $('[data-world-bracket]'); if(!realWrap || worldState.mode === 'express') return;
  const mode = WORLD_MODES[worldState.mode];
  $('[data-bracket-title]').textContent = mode.maxRound === 'cuartos' ? 'Llaves hasta cuartos' : 'Fixture completo';
  $('[data-bracket-description]').textContent = groupsComplete() && bestThirdsComplete() ? 'Selecciona el ganador de cada cruce. El bracket se irá completando automáticamente.' : 'Primero completa todos los grupos y mejores terceros para activar las llaves.';
  const rounds = modeRounds();
  realWrap.innerHTML = `<div class="world-flow-bracket ${worldState.mode === 'premium' ? 'premium-bracket' : 'pro-bracket'}">
    ${rounds.map(round => renderRoundColumn(round)).join('')}
    ${worldState.mode === 'premium' ? renderChampionHub() : renderProHub()}
  </div>`;
  $$('[data-winner]').forEach(btn => btn.addEventListener('click', e => {
    worldState.winners[e.currentTarget.dataset.match] = e.currentTarget.dataset.winner;
    if(e.currentTarget.dataset.match === 'final_1') worldState.champion = e.currentTarget.dataset.winner;
    trimInvalidWinners();
    renderBracket();
    renderChampion();
    updateSummary();
  }));
}
function renderRoundColumn(round){
  const locked = !previousRoundsComplete(round);
  return `<section class="flow-round ${locked ? 'is-locked' : ''}">
    <div class="flow-round-head"><span>${esc(roundShort(round))}</span><h3>${esc(ROUND_LABELS[round])}</h3></div>
    <div class="flow-match-list">${(KNOCKOUT_FIXTURES[round] || []).map(m => renderMatch(m, locked)).join('')}</div>
  </section>`;
}
function roundShort(round){ return ({ronda32:'R32',octavos:'OCT',cuartos:'4TOS',semis:'SEM',final:'FINAL'}[round] || round); }
function renderMatch(match, locked){
  const teams = matchTeams(match);
  const picked = worldState.winners[match.id] || '';
  const ready = !locked && teams.length === 2;
  return `<article class="flow-match ${picked ? 'is-picked' : ''} ${ready ? '' : 'is-disabled'}">
    <div class="flow-match-meta"><strong>${esc(match.label)}</strong><small>${esc(match.date)} · ${esc(match.time)}</small></div>
    <div class="flow-slots">${[match.a, match.b].map(src => renderSlot(sourceTeam(src), src)).join('')}</div>
    <div class="flow-actions">${ready ? teams.map(t => `<button type="button" class="winner-chip ${picked===t.name?'active':''}" data-match="${match.id}" data-winner="${esc(t.name)}">${esc(teamLabel(t))}</button>`).join('') : `<small>${locked ? 'Bloqueado por ronda anterior' : 'Completa el cruce previo'}</small>`}</div>
  </article>`;
}
function renderSlot(teamName, src){
  if(teamName){ const t=findTeam(teamName); return `<div class="flow-team"><span>${esc(t.flag)}</span><b>${esc(t.name)}</b></div>`; }
  return `<div class="flow-team pending"><span>·</span><b>${esc(sourceLabel(src))}</b></div>`;
}
function renderChampionHub(){
  const champ = worldState.champion ? findTeam(worldState.champion) : null;
  return `<section class="champion-hub"><div class="trophy-orb">🏆</div><small>CAMPEÓN</small><strong>${champ ? esc(teamLabel(champ)) : 'Por definir'}</strong><span>Premium World Cup</span></section>`;
}
function renderProHub(){ return `<section class="champion-hub pro"><div class="trophy-orb">⚽</div><small>META PRO</small><strong>Cuartos definidos</strong><span>Jugada hasta cuartos</span></section>`; }

function sourceTeam(source){
  if(source.type === 'group') return groupPick(source.group, source.pos);
  if(source.type === 'third') return worldState.bestThirds[source.index] || '';
  if(source.type === 'winner') return worldState.winners[source.match] || '';
  return '';
}
function matchTeams(match){ return [sourceTeam(match.a), sourceTeam(match.b)].filter(Boolean).map(findTeam); }
function sourceLabel(source){
  if(source.type === 'group') return `${source.pos === 'first' ? '1.º' : '2.º'} Grupo ${source.group}`;
  if(source.type === 'third') return `Mejor 3.º ${source.index + 1}`;
  if(source.type === 'winner') return `Ganador ${source.match.toUpperCase().replace('_',' ')}`;
  return 'Pendiente';
}
function trimInvalidWinners(){
  let changed = true;
  const allMatches = Object.values(KNOCKOUT_FIXTURES).flat();
  while(changed){
    changed = false;
    allMatches.forEach(match => {
      const valid = matchTeams(match).map(t => t.name);
      if(worldState.winners[match.id] && !valid.includes(worldState.winners[match.id])){ worldState.winners[match.id]=''; changed = true; }
    });
  }
  const finalValid = matchTeams(KNOCKOUT_FIXTURES.final[0]).map(t=>t.name);
  if(worldState.champion && !finalValid.includes(worldState.champion)) worldState.champion='';
}
function renderChampion(){
  const section = $('[data-champion-section]'); if(!section) return;
  section.hidden = worldState.mode !== 'premium';
  if(worldState.mode !== 'premium') return;
  const sel = $('[data-champion-select]');
  const finalTeams = matchTeams(KNOCKOUT_FIXTURES.final[0]);
  sel.innerHTML = optionList(finalTeams, finalTeams.length ? 'Selecciona campeón' : 'Primero completa la final', worldState.champion);
  sel.disabled = finalTeams.length < 2;
  sel.onchange = e => { worldState.champion = e.target.value; updateSummary(); renderBracket(); };
}
function updateSummary(){
  const filled = totalSelections(), required = requiredSelections();
  $('[data-world-count]').textContent = `${filled}/${required}`;
  const btn = $('[data-confirm-world]');
  if(btn){ btn.textContent = allRequiredComplete() ? 'Confirmar jugada' : 'Completa tu pronóstico'; }
}

function openConfirmBridge(){
  if(!allRequiredComplete()){ alert('Completa todas las selecciones requeridas para esta modalidad antes de confirmar.'); return; }
  const mode = WORLD_MODES[worldState.mode || 'express'];
  const modal = $('[data-world-modal]');
  const isLogged = PL.isLoggedIn();
  $('[data-modal-login]').hidden = isLogged;
  $('[data-modal-payment]').hidden = !isLogged;
  $('[data-payment-mode]').textContent = mode.name;
  $('[data-payment-total]').textContent = money(mode.price);
  const ticketBox = $('[data-payment-ticket]');
  if(ticketBox) ticketBox.innerHTML = renderTicketPreview();
  modal.hidden = false;
}
function closeWorldModal(){ const modal = $('[data-world-modal]'); if(modal) modal.hidden = true; }
function renderTicketPreview(){
  const mode = WORLD_MODES[worldState.mode || 'express'];
  const groupsDone = Object.keys(worldState.groupPicks).filter(groupIsComplete).length;
  const winnersDone = Object.values(worldState.winners).filter(Boolean).length;
  return `<div class="ticket-mini">
    <div><span>Juego</span><strong>Premium World Cup</strong></div>
    <div><span>Modalidad</span><strong>${esc(mode.name)}</strong></div>
    <div><span>Grupos</span><strong>${groupsDone}/12</strong></div>
    <div><span>Mejores terceros</span><strong>${worldState.bestThirds.filter(Boolean).length}/8</strong></div>
    <div><span>Llaves</span><strong>${winnersDone}</strong></div>
    <div><span>Campeón</span><strong>${esc(worldState.champion || 'No aplica')}</strong></div>
  </div>`;
}
function collectTicketData(code){
  const mode = WORLD_MODES[worldState.mode || 'express'];
  return {
    code,
    game:'Premium World Cup',
    mode:mode.name,
    price:mode.price,
    amount:money(mode.price),
    status:'Registrado',
    prize:'Pozo mayor',
    selections:{ groups:worldState.groupPicks, bestThirds:worldState.bestThirds, winners:worldState.winners, champion:worldState.champion }
  };
}
function completePaymentFlow(){
  const mode = WORLD_MODES[worldState.mode || 'express'];
  if(!PL.isLoggedIn()){ openConfirmBridge(); return; }
  if(!PL.canPay(mode.price)){ alert('Saldo insuficiente. Recarga tu cuenta antes de comprar este ticket.'); location.href='../saldo.html'; return; }
  const code = PL.makeCode('PWC');
  const result = PL.addTicket(collectTicketData(code), mode.price);
  if(!result.ok){ alert(result.reason || 'No se pudo registrar el ticket.'); return; }
  const modalPayment = $('[data-modal-payment]');
  if(modalPayment){
    modalPayment.innerHTML = `<p class="eyebrow">Ticket generado</p>
      <h2>Jugada registrada</h2>
      <div class="ticket-code">${esc(code)}</div>
      ${renderTicketPreview()}
      <p class="muted">El ticket fue guardado en Mis jugadas y el saldo fue descontado correctamente.</p>
      <div class="modal-actions"><a class="btn btn-primary" href="../mis-jugadas.html">Ver mis jugadas</a><button class="btn btn-outline" type="button" data-close-world-modal>Volver</button></div>`;
    modalPayment.querySelector('[data-close-world-modal]')?.addEventListener('click', closeWorldModal);
  }
}
document.addEventListener('DOMContentLoaded', initMundial);
