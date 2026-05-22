const WORLD_PREMIUM = {
  name: 'Worldgroup Premium',
  game: 'Premium World Cup',
  price: 20,
  amountLabel: 'S/ 20.00',
  prize: 'Pozo mayor mundialista'
};

const ROUNDS = [
  { key: 'ronda32', title: 'Ronda de 32', short: 'R32', total: 16, description: 'Define los ganadores de los 16 cruces iniciales.' },
  { key: 'octavos', title: 'Octavos de final', short: 'OCT', total: 8, description: 'Los clasificados avanzan hacia la fase decisiva.' },
  { key: 'cuartos', title: 'Cuartos de final', short: '4TOS', total: 4, description: 'Elige los cuatro semifinalistas del torneo.' },
  { key: 'semis', title: 'Semifinales', short: 'SEM', total: 2, description: 'Define los finalistas.' },
  { key: 'final', title: 'Final', short: 'FINAL', total: 1, description: 'Elige al ganador de la gran final.' }
];

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

const DRAFT_KEY = 'premiumlott_worldgroup_premium_draft_v3';
const worldState = { teams: [], groups: [], groupPicks: {}, bestThirds: Array(8).fill(''), winners: {}, champion: '' };
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => window.PL ? PL.money(value) : 'S/ ' + Number(value || 0).toFixed(2);

function findTeam(name){ return worldState.teams.find(t => t.name === name) || { name:name || '', flag:'' }; }
function teamLabel(team){ return team ? `${team.flag || ''} ${team.name || team}`.trim() : ''; }
function groupPick(group, pos){ return worldState.groupPicks[group]?.[pos] || ''; }
function groupTeams(groupKey){ return (worldState.groups.find(g => g.group === groupKey)?.teams || []); }
function thirdPool(){ return Object.values(worldState.groupPicks).map(p => p.third).filter(Boolean).map(findTeam); }
function groupIsComplete(group){ const p=worldState.groupPicks[group] || {}; return !!(p.first && p.second && p.third); }
function completedGroups(){ return worldState.groups.filter(g => groupIsComplete(g.group)).length; }
function groupsComplete(){ return worldState.groups.length > 0 && completedGroups() === worldState.groups.length; }
function bestThirdsCount(){ return worldState.bestThirds.filter(Boolean).length; }
function bestThirdsComplete(){ return bestThirdsCount() === 8; }
function roundComplete(round){ return (KNOCKOUT_FIXTURES[round] || []).every(m => !!worldState.winners[m.id]); }
function roundCount(round){ return (KNOCKOUT_FIXTURES[round] || []).filter(m => !!worldState.winners[m.id]).length; }
function previousRoundsComplete(round){
  if(round === 'ronda32') return groupsComplete() && bestThirdsComplete();
  const order = ROUNDS.map(r => r.key);
  const idx = order.indexOf(round);
  return groupsComplete() && bestThirdsComplete() && order.slice(0, idx).every(roundComplete);
}
function totalSelections(){
  let n = 0;
  Object.values(worldState.groupPicks).forEach(p => ['first','second','third'].forEach(k => { if(p[k]) n++; }));
  n += bestThirdsCount();
  n += Object.values(worldState.winners).filter(Boolean).length;
  if(worldState.champion) n++;
  return n;
}
function requiredSelections(){ return 36 + 8 + 16 + 8 + 4 + 2 + 1 + 1; }
function allRequiredComplete(){ return groupsComplete() && bestThirdsComplete() && ROUNDS.every(r => roundComplete(r.key)) && !!worldState.champion; }
function optionList(teams, placeholder, selected){
  return `<option value="">${esc(placeholder)}</option>` + teams.map(t => `<option value="${esc(t.name)}" ${selected===t.name?'selected':''}>${esc(teamLabel(t))}</option>`).join('');
}
function draft(){ return { groupPicks: worldState.groupPicks, bestThirds: worldState.bestThirds, winners: worldState.winners, champion: worldState.champion }; }
function saveDraft(){ localStorage.setItem(DRAFT_KEY, JSON.stringify(draft())); }
function loadDraft(){
  try{
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    worldState.groupPicks = raw.groupPicks || {};
    worldState.bestThirds = Array.isArray(raw.bestThirds) ? raw.bestThirds.slice(0,8).concat(Array(8).fill('')).slice(0,8) : Array(8).fill('');
    worldState.winners = raw.winners || {};
    worldState.champion = raw.champion || '';
  } catch(e){ worldState.groupPicks = {}; worldState.bestThirds = Array(8).fill(''); worldState.winners = {}; worldState.champion = ''; }
}

async function initMundial(){
  if(!$('[data-worldgroup-app]')) return;
  const data = await fetch('../assets/data/mundial-fixture.json').then(r => r.json());
  worldState.groups = data.groups || [];
  worldState.teams = worldState.groups.flatMap(g => g.teams || []);
  loadDraft();
  bindStaticEvents();
  renderAll();
}

function bindStaticEvents(){
  $('[data-confirm-world]')?.addEventListener('click', openConfirmBridge);
  $('[data-reset-world]')?.addEventListener('click', () => {
    if(confirm('¿Quieres limpiar tu fixture y empezar de nuevo?')){
      localStorage.removeItem(DRAFT_KEY);
      worldState.groupPicks = {}; worldState.bestThirds = Array(8).fill(''); worldState.winners = {}; worldState.champion = '';
      renderAll();
    }
  });
  $$('[data-close-world-modal]').forEach(btn => btn.addEventListener('click', closeWorldModal));
  $('[data-pay-mercado]')?.addEventListener('click', completePaymentFlow);
}

function renderAll(){
  trimInvalidWinners();
  renderGroups();
  renderBestThirds();
  renderRounds();
  renderChampionBlock();
  renderProgress();
  updateSummary();
  saveDraft();
}

function renderGroups(){
  const container = $('[data-world-groups]');
  if(!container) return;
  const openGroups = new Set(
    $$('[data-group-card]', container)
      .filter(card => card.open)
      .map(card => card.dataset.groupCard)
  );
  container.innerHTML = worldState.groups.map((group, idx) => {
    const complete = groupIsComplete(group.group);
    const picks = worldState.groupPicks[group.group] || {};
    const shouldStayOpen = openGroups.has(group.group) && !complete;
    const open = shouldStayOpen || (!complete && idx < 2 && openGroups.size === 0) ? 'open' : '';
    const summary = complete ? `${esc(picks.first)} · ${esc(picks.second)} · ${esc(picks.third)}` : 'Selecciona 1.º, 2.º y 3.º';
    return `<details class="wc-accordion wc-group-card ${complete ? 'is-complete' : 'is-pending'}" ${open} data-group-card="${esc(group.group)}">
      <summary class="wc-accordion-summary">
        <span><small>Grupo ${esc(group.group)}</small><strong>${complete ? 'Grupo completo' : 'Clasificación del grupo'}</strong><em>${summary}</em></span>
        <b>${complete ? 'Completo' : 'Pendiente'}</b>
      </summary>
      <div class="wc-group-body">
        <div class="wc-team-grid">${group.teams.map(t => `<span><i>${esc(t.flag)}</i>${esc(t.name)}</span>`).join('')}</div>
        <div class="wc-select-grid">
          ${renderGroupSelect(group, 'first', '1.º lugar')}
          ${renderGroupSelect(group, 'second', '2.º lugar')}
          ${renderGroupSelect(group, 'third', '3.º lugar')}
        </div>
        <details class="wc-mini-fixture"><summary>Ver fixture y horarios del grupo</summary><div>${(GROUP_FIXTURES[group.group] || []).map(item => `<small>${esc(item)}</small>`).join('')}</div></details>
      </div>
    </details>`;
  }).join('');
  $$('[data-group-select]', container).forEach(sel => sel.addEventListener('change', onGroupChange));
}

function renderGroupSelect(group, pos, label){
  const selected = groupPick(group.group, pos);
  return `<label class="field"><span>${label}</span><select data-group-select data-group="${esc(group.group)}" data-pos="${pos}">${optionList(group.teams, 'Selecciona equipo', selected)}</select></label>`;
}

function onGroupChange(e){
  const group = e.currentTarget.dataset.group;
  const pos = e.currentTarget.dataset.pos;
  const value = e.currentTarget.value;
  worldState.groupPicks[group] = worldState.groupPicks[group] || { first:'', second:'', third:'' };
  const duplicatePos = Object.entries(worldState.groupPicks[group]).find(([key, val]) => key !== pos && val && val === value);
  if(value && duplicatePos){
    alert('No puedes repetir el mismo equipo dentro del grupo.');
    e.currentTarget.value = '';
    worldState.groupPicks[group][pos] = '';
  } else {
    worldState.groupPicks[group][pos] = value;
  }
  sanitizeBestThirds();
  trimInvalidWinners();
  renderAll();
}

function renderBestThirds(){
  const box = $('[data-best-thirds]');
  if(!box) return;
  const pool = thirdPool();
  const locked = !groupsComplete();
  box.innerHTML = `<details class="wc-accordion wc-stage-card ${bestThirdsComplete() ? 'is-complete' : ''}" ${groupsComplete() && !bestThirdsComplete() ? 'open' : ''}>
    <summary class="wc-accordion-summary">
      <span><small>Repesca mundialista</small><strong>8 mejores terceros</strong><em>${locked ? 'Completa primero los 12 grupos' : `${bestThirdsCount()}/8 seleccionados`}</em></span>
      <b>${bestThirdsComplete() ? 'Completo' : locked ? 'Bloqueado' : 'En progreso'}</b>
    </summary>
    <div class="wc-stage-body">
      <p class="muted">Elige los 8 mejores terceros que avanzan a la ronda de 32. No se permiten duplicados.</p>
      <div class="wc-third-grid">
        ${Array.from({length:8}).map((_, i) => `<label class="field"><span>Mejor tercero ${i+1}</span><select data-third-index="${i}" ${locked ? 'disabled' : ''}>${optionList(pool, locked ? 'Bloqueado' : 'Selecciona tercer puesto', worldState.bestThirds[i])}</select></label>`).join('')}
      </div>
    </div>
  </details>`;
  $$('[data-third-index]', box).forEach(sel => sel.addEventListener('change', e => {
    const idx = Number(e.currentTarget.dataset.thirdIndex);
    const value = e.currentTarget.value;
    if(value && worldState.bestThirds.some((t, i) => i !== idx && t === value)){
      alert('Ese tercer puesto ya fue seleccionado.');
      e.currentTarget.value = '';
      worldState.bestThirds[idx] = '';
    } else {
      worldState.bestThirds[idx] = value;
    }
    trimInvalidWinners();
    renderAll();
  }));
}

function renderRounds(){
  const box = $('[data-rounds]');
  if(!box) return;
  box.innerHTML = ROUNDS.map((round, idx) => renderRoundBlock(round, idx)).join('');
  $$('[data-winner]', box).forEach(btn => btn.addEventListener('click', e => {
    worldState.winners[e.currentTarget.dataset.match] = e.currentTarget.dataset.winner;
    if(e.currentTarget.dataset.match === 'final_1') worldState.champion = e.currentTarget.dataset.winner;
    trimInvalidWinners();
    renderAll();
  }));
}

function renderRoundBlock(round, idx){
  const locked = !previousRoundsComplete(round.key);
  const count = roundCount(round.key);
  const total = (KNOCKOUT_FIXTURES[round.key] || []).length;
  const isComplete = count === total;
  const open = !locked && !isComplete ? 'open' : '';
  const status = locked ? 'Bloqueado' : isComplete ? 'Completo' : `${count}/${total}`;
  return `<details class="wc-accordion wc-stage-card wc-round-block ${isComplete ? 'is-complete' : ''} ${locked ? 'is-locked' : ''}" ${open} data-round="${round.key}">
    <summary class="wc-accordion-summary">
      <span><small>${esc(round.short)}</small><strong>${esc(round.title)}</strong><em>${esc(round.description)}</em></span>
      <b>${status}</b>
    </summary>
    <div class="wc-stage-body">
      ${locked ? `<div class="notice">Completa las fases anteriores para activar ${esc(round.title)}.</div>` : ''}
      <div class="wc-match-grid ${round.key === 'final' ? 'is-final-grid' : ''}">${(KNOCKOUT_FIXTURES[round.key] || []).map(match => renderMatchCard(match, locked)).join('')}</div>
    </div>
  </details>`;
}

function renderMatchCard(match, locked){
  const teams = matchTeams(match);
  const ready = !locked && teams.length === 2;
  const picked = worldState.winners[match.id] || '';
  return `<article class="wc-match-card ${picked ? 'is-picked' : ''} ${!ready ? 'is-disabled' : ''}">
    <div class="wc-match-top"><span>${esc(match.label)}</span><small>${esc(match.date)} · ${esc(match.time)}</small></div>
    <div class="wc-venue">${esc(match.venue)}</div>
    <div class="wc-versus">
      ${renderTeamSlot(sourceTeam(match.a), match.a)}
      <i>vs</i>
      ${renderTeamSlot(sourceTeam(match.b), match.b)}
    </div>
    <div class="wc-winner-actions">
      ${ready ? teams.map(t => `<button type="button" class="winner-chip ${picked===t.name?'active':''}" data-match="${match.id}" data-winner="${esc(t.name)}">${esc(teamLabel(t))}</button>`).join('') : '<small>Esperando clasificados anteriores.</small>'}
    </div>
  </article>`;
}

function renderTeamSlot(teamName, source){
  if(teamName){
    const t = findTeam(teamName);
    return `<div class="wc-team-slot"><span>${esc(t.flag)}</span><strong>${esc(t.name)}</strong></div>`;
  }
  return `<div class="wc-team-slot pending"><span>•</span><strong>${esc(sourceLabel(source))}</strong></div>`;
}

function renderChampionBlock(){
  const box = $('[data-champion-block]');
  if(!box) return;
  const finalTeams = matchTeams(KNOCKOUT_FIXTURES.final[0]);
  const locked = !roundComplete('final');
  const champion = worldState.champion ? findTeam(worldState.champion) : null;
  box.innerHTML = `<details class="wc-accordion wc-stage-card wc-champion-block ${worldState.champion ? 'is-complete' : ''} ${locked ? 'is-locked' : ''}" ${!locked && !worldState.champion ? 'open' : ''}>
    <summary class="wc-accordion-summary">
      <span><small>Trofeo</small><strong>Campeón del mundo</strong><em>${champion ? teamLabel(champion) : locked ? 'Completa la final' : 'Elige tu campeón'}</em></span>
      <b>${worldState.champion ? 'Completo' : locked ? 'Bloqueado' : 'Pendiente'}</b>
    </summary>
    <div class="wc-stage-body wc-champion-body">
      <div class="wc-trophy-card"><div class="trophy-orb">🏆</div><p>Tu campeón</p><strong>${champion ? esc(teamLabel(champion)) : 'Por definir'}</strong></div>
      <label class="field"><span>Selecciona campeón</span><select data-champion-select ${locked ? 'disabled' : ''}>${optionList(finalTeams, locked ? 'Bloqueado' : 'Selecciona campeón', worldState.champion)}</select></label>
    </div>
  </details>`;
  $('[data-champion-select]', box)?.addEventListener('change', e => {
    worldState.champion = e.currentTarget.value;
    if(worldState.champion) worldState.winners.final_1 = worldState.champion;
    renderAll();
  });
}

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

function sanitizeBestThirds(){
  const valid = new Set(thirdPool().map(t => t.name));
  worldState.bestThirds = worldState.bestThirds.map(t => valid.has(t) ? t : '');
  const seen = new Set();
  worldState.bestThirds = worldState.bestThirds.map(t => {
    if(!t) return '';
    if(seen.has(t)) return '';
    seen.add(t);
    return t;
  });
}
function trimInvalidWinners(){
  sanitizeBestThirds();
  let changed = true;
  const allMatches = ROUNDS.flatMap(r => KNOCKOUT_FIXTURES[r.key] || []);
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
  if(worldState.champion && !finalTeams.includes(worldState.champion)) worldState.champion = worldState.winners.final_1 || '';
}

function renderProgress(){
  const progress = $('[data-progress-rail]');
  if(progress){
    const stages = [
      { label:'Grupos', done:groupsComplete(), current:!groupsComplete(), value:`${completedGroups()}/12` },
      { label:'Terceros', done:bestThirdsComplete(), current:groupsComplete() && !bestThirdsComplete(), value:`${bestThirdsCount()}/8` },
      ...ROUNDS.map(r => ({ label:r.short, done:roundComplete(r.key), current:previousRoundsComplete(r.key) && !roundComplete(r.key), value:`${roundCount(r.key)}/${(KNOCKOUT_FIXTURES[r.key] || []).length}` })),
      { label:'Campeón', done:!!worldState.champion, current:roundComplete('final') && !worldState.champion, value:worldState.champion ? '1/1' : '0/1' }
    ];
    progress.innerHTML = stages.map(s => `<span class="${s.done?'done':s.current?'current':''}"><b>${esc(s.label)}</b><em>${esc(s.value)}</em></span>`).join('');
  }
  const bar = $('[data-progress-bar]');
  if(bar) bar.style.width = Math.min(100, Math.round(totalSelections() / requiredSelections() * 100)) + '%';
}

function updateSummary(){
  const percent = Math.min(100, Math.round(totalSelections() / requiredSelections() * 100));
  $('[data-world-count]') && ($('[data-world-count]').textContent = `${totalSelections()}/${requiredSelections()}`);
  $('[data-groups-count]') && ($('[data-groups-count]').textContent = `${completedGroups()}/12`);
  $('[data-thirds-count]') && ($('[data-thirds-count]').textContent = `${bestThirdsCount()}/8`);
  $('[data-rounds-count]') && ($('[data-rounds-count]').textContent = `${ROUNDS.reduce((sum, r) => sum + roundCount(r.key), 0)}/31`);
  $('[data-champion-name]') && ($('[data-champion-name]').textContent = worldState.champion ? teamLabel(findTeam(worldState.champion)) : 'Por definir');
  $('[data-progress-percent]') && ($('[data-progress-percent]').textContent = percent + '%');
  $('[data-summary-price]') && ($('[data-summary-price]').textContent = money(WORLD_PREMIUM.price));
}

function openConfirmBridge(){
  if(!allRequiredComplete()){
    alert('Aún faltan selecciones para completar tu Worldgroup Premium. Revisa los bloques pendientes.');
    return;
  }
  const modal = $('[data-world-modal]');
  if(!modal) return;
  const isLogged = PL.isLoggedIn();
  $('[data-modal-login]').hidden = isLogged;
  $('[data-modal-payment]').hidden = !isLogged;
  $('[data-payment-mode]').textContent = WORLD_PREMIUM.name;
  $('[data-payment-total]').textContent = money(WORLD_PREMIUM.price);
  $('[data-payment-ticket]').innerHTML = renderTicketPreview();
  modal.hidden = false;
}
function closeWorldModal(){ const modal = $('[data-world-modal]'); if(modal) modal.hidden = true; }
function renderTicketPreview(){
  return `<div class="ticket-mini">
    <div><span>Juego</span><strong>${esc(WORLD_PREMIUM.game)}</strong></div>
    <div><span>Modalidad</span><strong>${esc(WORLD_PREMIUM.name)}</strong></div>
    <div><span>Grupos</span><strong>${completedGroups()}/12</strong></div>
    <div><span>Mejores terceros</span><strong>${bestThirdsCount()}/8</strong></div>
    <div><span>Llaves</span><strong>${ROUNDS.reduce((sum, r) => sum + roundCount(r.key), 0)}/31</strong></div>
    <div><span>Campeón</span><strong>${esc(worldState.champion ? teamLabel(findTeam(worldState.champion)) : 'Por definir')}</strong></div>
  </div>`;
}
function collectTicketData(code){
  return {
    code,
    game: WORLD_PREMIUM.game,
    mode: WORLD_PREMIUM.name,
    price: WORLD_PREMIUM.price,
    amount: money(WORLD_PREMIUM.price),
    status: 'Registrado',
    prize: WORLD_PREMIUM.prize,
    selections: draft()
  };
}
function completePaymentFlow(){
  if(!PL.canPay(WORLD_PREMIUM.price)){
    alert('Saldo insuficiente. Recarga tu saldo para registrar esta jugada.');
    location.href = '../saldo.html';
    return;
  }
  const code = PL.makeCode('PWC');
  const result = PL.addTicket(collectTicketData(code), WORLD_PREMIUM.price);
  if(!result.ok){ alert(result.reason || 'No se pudo registrar el ticket.'); return; }
  localStorage.removeItem(DRAFT_KEY);
  const modalPayment = $('[data-modal-payment]');
  modalPayment.innerHTML = `<p class="eyebrow">Ticket registrado</p>
    <h2>Tu Worldgroup Premium está listo</h2>
    <div class="ticket-code">${esc(result.ticket.code)}</div>
    ${renderTicketPreview()}
    <p class="muted">Tu ticket fue guardado en Mis jugadas y el saldo fue descontado correctamente.</p>
    <div class="modal-actions"><a class="btn btn-primary" href="../mis-jugadas.html">Ver mis jugadas</a><a class="btn btn-outline" href="mundial.html">Crear otro fixture</a></div>`;
}

document.addEventListener('DOMContentLoaded', initMundial);
