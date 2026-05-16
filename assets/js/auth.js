document.addEventListener('DOMContentLoaded',()=>{
  const register=document.querySelector('[data-register-form]');
  if(register) register.addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(register); const state=PL.load(); state.user={name:fd.get('name')||'Cliente Premium',email:fd.get('email')||'',document:fd.get('document')||'',phone:fd.get('phone')||'',country:fd.get('country')||'PE'}; state.session={active:true,at:new Date().toISOString()}; PL.save(state); const redirect=new URLSearchParams(location.search).get('redirect')||'dashboard.html'; location.href=redirect;});
  const login=document.querySelector('[data-login-form]');
  if(login) login.addEventListener('submit',e=>{e.preventDefault(); const state=PL.load(); const email=new FormData(login).get('email'); if(email) state.user.email=email; state.session={active:true,at:new Date().toISOString()}; PL.save(state); const redirect=new URLSearchParams(location.search).get('redirect')||'dashboard.html'; location.href=redirect;});
});
