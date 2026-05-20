async function initPremiumGol(){
  const list=document.querySelector('[data-premiumgol-matches]'); if(!list) return;
  const data=await fetch('../assets/data/premiumgol-programs.json').then(r=>r.json());
  const program=data.programs[0];
  const ticketPrice = Number(program.ticketPrice || 5);
  document.querySelector('[data-program-title]').textContent=program.title;
  document.querySelector('[data-jackpot]').textContent=program.jackpotLabel;
  document.querySelector('[data-ticket-price]').textContent=program.ticketPriceLabel;
  const picks={};
  list.innerHTML=program.matches.map(m=>`<div class="match"><div><strong>${m.home}</strong> vs <strong>${m.away}</strong><div class="muted">${m.date} · ${m.league}</div></div><div class="pick-group" data-match="${m.id}"><button class="pick" data-pick="L" title="Local">L</button><button class="pick" data-pick="E" title="Empate">E</button><button class="pick" data-pick="V" title="Visitante">V</button></div></div>`).join('');
  list.addEventListener('click',e=>{
    if(!e.target.matches('.pick')) return;
    const group=e.target.closest('[data-match]');
    group.querySelectorAll('.pick').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    picks[group.dataset.match]=e.target.dataset.pick;
    document.querySelector('[data-picks-count]').textContent=Object.keys(picks).length;
  });
  document.querySelector('[data-confirm-premiumgol]').addEventListener('click',()=>{
    const total = program.matches.length;
    if(Object.keys(picks).length < total){ alert(`Completa los ${total} pronósticos antes de registrar tu jugada.`); return; }
    if(!PL.requireLogin('juegos/premiumgol.html')) return;
    if(!PL.canPay(ticketPrice)){ alert('Saldo insuficiente. Recarga tu cuenta antes de registrar este ticket.'); location.href='../saldo.html'; return; }
    const code=PL.makeCode('PLG');
    const selections = program.matches.map(m => ({ id:m.id, match:`${m.home} vs ${m.away}`, pick:picks[m.id] }));
    const result = PL.addTicket({
      code,
      game:'PremiumGol',
      mode:program.title || 'Programa semanal',
      amount:PL.money(ticketPrice),
      price:ticketPrice,
      status:'Registrado',
      prize:program.jackpotLabel,
      selections
    }, ticketPrice);
    if(!result.ok){ alert(result.reason || 'No se pudo registrar la jugada.'); return; }
    alert('Jugada registrada: '+code);
    location.href='../mis-jugadas.html';
  });
}
document.addEventListener('DOMContentLoaded',initPremiumGol);
