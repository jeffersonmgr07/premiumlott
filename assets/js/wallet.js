document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('[data-wallet-form]'); if(!form) return;
  form.addEventListener('submit',e=>{e.preventDefault(); const amount=Number(new FormData(form).get('amount')||0); if(amount<=0) return; const state=PL.load(); state.wallet.balance+=amount; state.movements.unshift({date:new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'}),detail:'Recarga de saldo',amount:'+ '+PL.money(amount)}); PL.save(state); location.reload();});
  const body=document.querySelector('[data-movements-body]'); const state=PL.load(); if(body) body.innerHTML=state.movements.map(m=>`<tr><td>${m.date}</td><td>${m.detail}</td><td><strong>${m.amount}</strong></td></tr>`).join('');
});
