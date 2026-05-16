async function initI18n(){
  const select=document.querySelector('[data-lang-select]');
  if(!select) return;
  const saved=localStorage.getItem('premiumlott_lang') || 'es'; select.value=saved;
  async function apply(lang){
    localStorage.setItem('premiumlott_lang',lang);
    try{ const prefix = location.pathname.includes('/juegos/') ? '../' : (location.pathname.includes('/pages/') ? '../../' : ''); const data=await fetch(prefix+'assets/data/ui-translations.json').then(r=>r.json());
      document.querySelectorAll('[data-i18n]').forEach(el=>{ const key=el.dataset.i18n; if(data[lang] && data[lang][key]) el.textContent=data[lang][key]; });
    }catch(e){}
  }
  select.addEventListener('change',e=>apply(e.target.value)); apply(saved);
}
document.addEventListener('DOMContentLoaded',initI18n);
