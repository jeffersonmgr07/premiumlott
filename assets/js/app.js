const PL = {
  key: 'premiumlott_state_v2',
  oldKey: 'premiumlott_state_v1',
  defaults: {
    user: { name: 'Invitado Premium', email: '', document: '', phone: '', country: 'PE' },
    wallet: { balance: 125.00, currency: 'S/' },
    tickets: [
      { code:'PLG-2026-000128', game:'PremiumGol', mode:'Semanal', date:'16 May 2026', amount:'S/ 5.00', price:5, status:'En juego', prize:'Pozo S/ 48,500' },
      { code:'PWC-2026-000041', game:'Premium World Cup', mode:'Premium', date:'16 May 2026', amount:'S/ 20.00', price:20, status:'Registrado', prize:'Pozo mayor' }
    ],
    session: { active: false, at: null },
    movements: [
      { date:'16 May 2026', detail:'Recarga de saldo', amount:'+ S/ 100.00', type:'credit' },
      { date:'16 May 2026', detail:'Ticket PremiumGol', amount:'- S/ 5.00', type:'debit' },
      { date:'16 May 2026', detail:'Ticket Premium World Cup', amount:'- S/ 20.00', type:'debit' }
    ]
  },
  clone(value){ return JSON.parse(JSON.stringify(value)); },
  normalize(state){
    const base = this.clone(this.defaults);
    state = state && typeof state === 'object' ? state : {};
    base.user = { ...base.user, ...(state.user || {}) };
    base.wallet = { ...base.wallet, ...(state.wallet || {}) };
    base.wallet.balance = Number(base.wallet.balance || 0);
    base.session = { ...base.session, ...(state.session || {}) };
    base.tickets = Array.isArray(state.tickets) ? state.tickets : base.tickets;
    base.movements = Array.isArray(state.movements) ? state.movements : base.movements;
    base.tickets = base.tickets.map(t => ({
      code: t.code || t.id || ('PL-' + Date.now()),
      game: t.game || 'PremiumLott',
      mode: t.mode || t.modalidad || 'General',
      date: t.date || this.today(),
      amount: t.amount || this.money(t.price || t.cost || 0),
      price: Number(t.price || t.cost || String(t.amount || '').replace(/[^0-9.]/g,'') || 0),
      status: t.status || 'Registrado',
      prize: t.prize || t.premio || 'Por definir',
      selections: t.selections || t.groups || t.picks || null,
      hash: t.hash || this.hash(`${t.code || ''}-${t.game || ''}-${t.date || ''}`)
    }));
    return base;
  },
  load(){
    let raw = localStorage.getItem(this.key);
    if(!raw){
      const oldRaw = localStorage.getItem(this.oldKey);
      let oldState = oldRaw ? JSON.parse(oldRaw) : this.clone(this.defaults);
      const oldWorldTickets = JSON.parse(localStorage.getItem('premiumlott_tickets') || '[]');
      if(Array.isArray(oldWorldTickets) && oldWorldTickets.length){
        const converted = oldWorldTickets.map(t => ({
          code: t.code || ('PWC-' + Date.now()),
          game: 'Premium World Cup',
          mode: t.mode || 'World Cup',
          date: t.date || this.today(),
          amount: this.money(t.price || 0),
          price: Number(t.price || 0),
          status: t.status === 'Pendiente de pago' ? 'Registrado' : (t.status || 'Registrado'),
          prize: 'Pozo mayor',
          selections: { groups:t.groups, bestThirds:t.bestThirds, winners:t.winners, champion:t.champion }
        }));
        oldState.tickets = [...converted, ...(oldState.tickets || [])];
      }
      const migrated = this.normalize(oldState);
      this.save(migrated);
      return migrated;
    }
    try { return this.normalize(JSON.parse(raw)); }
    catch(e){ const fresh = this.clone(this.defaults); this.save(fresh); return fresh; }
  },
  save(state){ localStorage.setItem(this.key, JSON.stringify(this.normalize(state))); },
  money(value){ return 'S/ ' + Number(value || 0).toFixed(2); },
  today(){ return new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}); },
  isLoggedIn(){ const state=this.load(); return !!(state.session && state.session.active); },
  requireLogin(redirect){
    if(this.isLoggedIn()) return true;
    const next = redirect || location.pathname.split('/').pop() || 'dashboard.html';
    alert('Para registrar una jugada debes iniciar sesión o crear una cuenta.');
    location.href = (location.pathname.includes('/juegos/') ? '../login.html' : 'login.html') + '?redirect=' + encodeURIComponent(next);
    return false;
  },
  canPay(cost){ return Number(this.load().wallet.balance || 0) >= Number(cost || 0); },
  addTicket(ticket, cost){
    const state = this.load();
    const price = Number(cost || ticket.price || 0);
    if(price > 0 && state.wallet.balance < price) return { ok:false, reason:'Saldo insuficiente', state };
    const normalizedTicket = {
      code: ticket.code || this.makeCode('PL'),
      game: ticket.game || 'PremiumLott',
      mode: ticket.mode || 'General',
      date: ticket.date || this.today(),
      amount: ticket.amount || this.money(price),
      price,
      status: ticket.status || 'Registrado',
      prize: ticket.prize || 'Por definir',
      selections: ticket.selections || null,
      hash: ticket.hash || this.hash(JSON.stringify(ticket) + Date.now())
    };
    state.tickets.unshift(normalizedTicket);
    if(price > 0){
      state.wallet.balance = Number((state.wallet.balance - price).toFixed(2));
      state.movements.unshift({ date:this.today(), detail:'Ticket ' + normalizedTicket.game + (normalizedTicket.mode ? ' · ' + normalizedTicket.mode : ''), amount:'- ' + this.money(price), type:'debit', code: normalizedTicket.code });
    }
    this.save(state);
    return { ok:true, ticket:normalizedTicket, state };
  },
  addMovement(movement){
    const state=this.load();
    state.movements.unshift({date:this.today(), ...movement});
    this.save(state);
    return state;
  },
  makeCode(prefix){ return prefix + '-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-8); },
  hash(text){
    let h = 0, str = String(text || '');
    for(let i=0;i<str.length;i++){ h = Math.imul(31,h) + str.charCodeAt(i) | 0; }
    return 'H' + Math.abs(h).toString(16).toUpperCase().padStart(8,'0');
  }
};

function initLayout(){
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const toggle = document.querySelector('[data-mobile-toggle]'); const nav = document.querySelector('.nav');
  if(toggle && nav) toggle.addEventListener('click',()=>nav.classList.toggle('open'));
  const state = PL.load();
  document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=state.user.name || 'Cliente Premium');
  document.querySelectorAll('[data-balance]').forEach(el=>el.textContent=PL.money(state.wallet.balance));
  document.querySelectorAll('[data-ticket-count]').forEach(el=>el.textContent=state.tickets.length);
  document.querySelectorAll('.header-actions .btn-primary').forEach(btn => {
    if(PL.isLoggedIn() && /login\.html/.test(btn.getAttribute('href') || '')){
      btn.textContent = 'Mi cuenta';
      btn.setAttribute('href', btn.getAttribute('href').startsWith('../') ? '../dashboard.html' : 'dashboard.html');
    }
  });
}

function addTicket(ticket, cost){ return PL.addTicket(ticket, cost); }

function renderTickets(){
  const body = document.querySelector('[data-tickets-body]'); if(!body) return;
  const state=PL.load();
  if(!state.tickets.length){
    body.innerHTML = '<tr><td colspan="6" class="muted">Aún no tienes jugadas registradas.</td></tr>';
    return;
  }
  body.innerHTML=state.tickets.map(t=>`<tr><td><strong>${t.code}</strong><br><small class="muted">${t.hash || ''}</small></td><td>${t.game}${t.mode ? `<br><small class="muted">${t.mode}</small>` : ''}</td><td>${t.date}</td><td>${t.amount}</td><td><span class="status ok">${t.status}</span></td><td>${t.prize || 'Por definir'}</td></tr>`).join('');
}

document.addEventListener('DOMContentLoaded',()=>{initLayout();renderTickets();});
