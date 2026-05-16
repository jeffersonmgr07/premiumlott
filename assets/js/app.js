const PL = {
  key: 'premiumlott_state_v1',
  defaults: {
    user: { name: 'Invitado Premium', email: 'cliente@premiumlott.com', document: '', phone: '', country: 'PE' },
    wallet: { balance: 125.00, currency: 'S/' },
    tickets: [
      { code:'PLG-2026-000128', game:'PremiumGol', date:'16 May 2026', amount:'S/ 5.00', status:'En juego', prize:'Pozo S/ 48,500' },
      { code:'PMD-2026-000041', game:'Premium World Cup', date:'16 May 2026', amount:'S/ 20.00', status:'Registrado', prize:'Pozo mayor' }
    ],
    movements: [
      { date:'16 May 2026', detail:'Recarga de saldo', amount:'+ S/ 100.00' },
      { date:'16 May 2026', detail:'Ticket PremiumGol', amount:'- S/ 5.00' },
      { date:'16 May 2026', detail:'Ticket Premium World Cup', amount:'- S/ 20.00' }
    ]
  },
  load(){ return JSON.parse(localStorage.getItem(this.key) || JSON.stringify(this.defaults)); },
  save(state){ localStorage.setItem(this.key, JSON.stringify(state)); },
  money(value){ return 'S/ ' + Number(value || 0).toFixed(2); }
};
function initLayout(){
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const toggle = document.querySelector('[data-mobile-toggle]'); const nav = document.querySelector('.nav');
  if(toggle && nav) toggle.addEventListener('click',()=>nav.classList.toggle('open'));
  const state = PL.load();
  document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=state.user.name || 'Cliente Premium');
  document.querySelectorAll('[data-balance]').forEach(el=>el.textContent=PL.money(state.wallet.balance));
  document.querySelectorAll('[data-ticket-count]').forEach(el=>el.textContent=state.tickets.length);
}
function addTicket(ticket, cost){
  const state = PL.load();
  state.tickets.unshift(ticket);
  state.wallet.balance = Math.max(0, Number(state.wallet.balance) - Number(cost || 0));
  state.movements.unshift({date:new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}), detail:'Ticket '+ticket.game, amount:'- '+ticket.amount});
  PL.save(state); return state;
}
function renderTickets(){
  const body = document.querySelector('[data-tickets-body]'); if(!body) return;
  const state=PL.load();
  body.innerHTML=state.tickets.map(t=>`<tr><td><strong>${t.code}</strong></td><td>${t.game}</td><td>${t.date}</td><td>${t.amount}</td><td><span class="status ok">${t.status}</span></td><td>${t.prize}</td></tr>`).join('');
}
document.addEventListener('DOMContentLoaded',()=>{initLayout();renderTickets();});
