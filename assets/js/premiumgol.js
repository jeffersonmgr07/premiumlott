async function initPremiumGol(){
  const list=document.querySelector('[data-premiumgol-matches]'); if(!list) return;
  const data=await fetch('../assets/data/premiumgol-programs.json').then(r=>r.json()); const program=data.programs[0];
  document.querySelector('[data-program-title]').textContent=program.title; document.querySelector('[data-jackpot]').textContent=program.jackpotLabel; document.querySelector('[data-ticket-price]').textContent=program.ticketPriceLabel;
  const picks={}; list.innerHTML=program.matches.map(m=>`<div class="match"><div><strong>${m.home}</strong> vs <strong>${m.away}</strong><div class="muted">${m.date} · ${m.league}</div></div><div class="pick-group" data-match="${m.id}"><button class="pick" data-pick="L">L</button><button class="pick" data-pick="E">E</button><button class="pick" data-pick="V">V</button></div></div>`).join('');
  list.addEventListener('click',e=>{ if(!e.target.matches('.pick')) return; const group=e.target.closest('[data-match]'); group.querySelectorAll('.pick').forEach(b=>b.classList.remove('active')); e.target.classList.add('active'); picks[group.dataset.match]=e.target.dataset.pick; document.querySelector('[data-picks-count]').textContent=Object.keys(picks).length; });
  document.querySelector('[data-confirm-premiumgol]').addEventListener('click',()=>{ const code='PLG-'+new Date().getFullYear()+'-'+String(Date.now()).slice(-6); addTicket({code,game:'PremiumGol',date:new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}),amount:program.ticketPriceLabel,status:'Registrado',prize:program.jackpotLabel},program.ticketPrice); alert('Jugada registrada: '+code); location.href='../mis-jugadas.html'; });
}
document.addEventListener('DOMContentLoaded',initPremiumGol);
