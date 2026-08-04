/* PremiumLott — Layout: encabezado, pie de página y aviso de modo de prueba
 * compartidos por todas las páginas. Se inyectan en tiempo de ejecución en
 * los contenedores <header data-site-header> y <footer data-site-footer>
 * para evitar duplicar el mismo HTML en más de veinte páginas.
 */
(function (global) {
  var SOCIAL_ICONS =
    '<a href="#" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8.2V6.6c0-.7.2-1.1 1.2-1.1H17V2.3c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v1.8H7.5v3.6h2.8V22H14V11.8h2.8l.4-3.6H14z"/></svg></a>' +
    '<a href="#" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8zm4.2 3.4A4.6 4.6 0 1 1 7.4 12 4.6 4.6 0 0 1 12 7.4zm0 2A2.6 2.6 0 1 0 14.6 12 2.6 2.6 0 0 0 12 9.4zm5.1-2.5a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z"/></svg></a>' +
    '<a href="#" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.7 2c.3 2.3 1.6 3.8 3.8 4v3.4a7 7 0 0 1-3.8-1.2v6.5c0 4.1-2.5 7.3-6.8 7.3a6.1 6.1 0 0 1-6.4-6.1c0-3.8 2.9-6.2 6.5-6.2.5 0 .9 0 1.3.1v3.6a4.1 4.1 0 0 0-1.3-.2 2.6 2.6 0 1 0 2.7 2.6V2h4z"/></svg></a>' +
    '<a href="#" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.1a3 3 0 0 0-2.1-2.1C17.6 4.5 12 4.5 12 4.5s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1A31.2 31.2 0 0 0 2 12a31.2 31.2 0 0 0 .4 4.9 3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 22 12a31.2 31.2 0 0 0-.4-4.9zM10 15.5v-7l6 3.5-6 3.5z"/></svg></a>';

  function renderDemoBanner() {
    var el = document.querySelector('[data-demo-banner]');
    if (!el) return;
    el.innerHTML = '<span class="demo-banner-dot" aria-hidden="true"></span><span><strong>Modo de prueba</strong> — saldo, jugadas y premios ficticios. Sin depósitos, retiros ni pagos reales.</span>';
  }

  function renderHeader() {
    var host = document.querySelector('[data-site-header]');
    if (!host) return;
    var p = RouterUtils.pathPrefix();
    host.className = 'site-header';
    host.innerHTML =
      '<a class="brand" href="' + p + 'index.html"><img src="' + p + 'assets/img/logos/Logo PremiumLott.png" alt="PremiumLott"></a>' +
      '<button class="btn btn-ghost mobile-toggle" data-mobile-toggle>Menú</button>' +
      '<nav class="nav">' +
      '<a href="' + p + 'index.html" data-i18n="nav.home">Inicio</a>' +
      '<a href="' + p + 'index.html#juegos" data-i18n="nav.games">Juegos</a>' +
      '<a href="' + p + 'grupos/index.html">Mis grupos</a>' +
      '<a href="' + p + 'transparencia.html">Transparencia</a>' +
      '</nav>' +
      '<div class="header-actions">' +
      '<select class="lang-select" data-lang-select><option value="es">ES</option><option value="en">EN</option><option value="pt">PT</option><option value="fr">FR</option><option value="de">DE</option><option value="it">IT</option><option value="zh">中文</option><option value="ja">日本語</option></select>' +
      '<a class="btn btn-primary" href="' + p + 'login.html" data-i18n="nav.login" data-account-link>Iniciar sesión</a>' +
      '</div>';

    var toggle = host.querySelector('[data-mobile-toggle]');
    var nav = host.querySelector('.nav');
    if (toggle && nav) toggle.addEventListener('click', function () { nav.classList.toggle('open'); });

    MockApi.getCurrentUserSync && applyAccountLink(host, p);
  }

  function applyAccountLink(host, prefix) {
    var user = MockApi.getCurrentUserSync();
    var link = host.querySelector('[data-account-link]');
    if (!link) return;
    if (user) {
      // Se retira el data-i18n para que i18n.js no revierta el texto a
      // "Iniciar sesión" al aplicar traducciones o cambiar de idioma.
      link.removeAttribute('data-i18n');
      link.textContent = 'Mi cuenta';
      link.setAttribute('href', prefix + 'dashboard.html');
    }
  }

  function renderFooter() {
    var host = document.querySelector('[data-site-footer]');
    if (!host) return;
    var p = RouterUtils.pathPrefix();
    host.className = 'site-footer';
    host.innerHTML =
      '<span>© <span data-year></span> PremiumLott. Todos los derechos reservados. Prototipo de demostración — sin dinero real.</span>' +
      '<div class="footer-links"><a href="' + p + 'pages/legales/terminos-condiciones.html">Términos</a>' +
      '<a href="' + p + 'pages/legales/politica-privacidad.html">Privacidad</a>' +
      '<a href="' + p + 'pages/legales/juego-responsable.html">Juego responsable</a></div>' +
      '<div class="social-icons">' + SOCIAL_ICONS + '</div>';
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function mountLayout() {
    renderHeader();
    renderFooter();
    renderDemoBanner();
  }

  global.Layout = { mountLayout: mountLayout, renderHeader: renderHeader, renderFooter: renderFooter };
  document.addEventListener('DOMContentLoaded', mountLayout);
})(window);
