(function () {
  function init() {
    var btn = document.querySelector('[data-notify-btn]');
    if (!btn) return;
    var game = document.body.dataset.gameName || 'este juego';
    btn.addEventListener('click', function () {
      UI.toast('Te avisaremos cuando ' + game + ' esté disponible.', 'success');
      btn.disabled = true;
      btn.textContent = 'Listo, te avisaremos';
    });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
