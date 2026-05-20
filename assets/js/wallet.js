document.addEventListener('DOMContentLoaded',()=>{
  const form=document.querySelector('[data-wallet-form]');
  const body=document.querySelector('[data-movements-body]');
  function render(){
    const state=PL.load();
    if(body) body.innerHTML=state.movements.map(m=>`<tr><td>${m.date}</td><td>${m.detail}</td><td><strong>${m.amount}</strong></td></tr>`).join('');
    document.querySelectorAll('[data-balance]').forEach(el=>el.textContent=PL.money(state.wallet.balance));
  }
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault();
    const amount=Number(new FormData(form).get('amount')||0);
    if(amount<5){ alert('Ingresa un monto mínimo de S/ 5.00.'); return; }
    const state=PL.load();
    state.wallet.balance = Number((Number(state.wallet.balance || 0) + amount).toFixed(2));
    state.movements.unshift({date:PL.today(),detail:'Recarga de saldo',amount:'+ '+PL.money(amount), type:'credit'});
    PL.save(state);
    form.reset();
    render();
  });
  render();
});
