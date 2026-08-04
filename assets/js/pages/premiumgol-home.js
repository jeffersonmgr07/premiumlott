(function () {
  var openProgram = null;

  function renderMatches(program) {
    var host = document.querySelector('[data-preview-matches]');
    host.innerHTML = program.matches.map(function (m) {
      return '<div class="match"><div><strong>' + m.home + '</strong> vs <strong>' + m.away + '</strong><div class="muted">' + Formatters.dateTimeLima(m.kickoffAt) + ' · ' + m.competition + '</div></div></div>';
    }).join('');
  }

  async function goPlay() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;
    if (!openProgram) { UI.toast('No hay un programa abierto en este momento.', 'error'); return; }

    var groupsRes = await Api.getMyGroups();
    var groups = groupsRes.ok ? groupsRes.data.groups : [];
    if (!groups.length) {
      UI.openModal('<h3>Necesitas un grupo para jugar</h3><p class="muted" style="margin-top:.5rem">Crea un grupo privado o únete con un código de invitación antes de registrar tu jugada.</p>' +
        '<div class="modal-actions"><a class="btn btn-outline" href="../grupos/unirse.html">Unirme con código</a><a class="btn btn-primary" href="../grupos/crear.html">Crear grupo</a></div>');
      return;
    }
    if (groups.length === 1) { location.href = '../premiumgol/jugar.html?groupId=' + groups[0].id + '&programId=' + openProgram.id; return; }

    UI.openModal('<h3>Elige el grupo con el que vas a jugar</h3><div class="grid" style="margin-top:.8rem;gap:.6rem">' +
      groups.map(function (g) { return '<a class="card compact" href="../premiumgol/jugar.html?groupId=' + g.id + '&programId=' + openProgram.id + '"><strong>' + g.name + '</strong><br><small class="muted">' + Formatters.prizeModeLabel(g.prizeMode) + '</small></a>'; }).join('') + '</div>');
  }

  async function init() {
    var res = await Api.getOpenProgram();
    if (!res.ok) {
      document.querySelector('[data-program-title]').textContent = 'Sin programa abierto';
      document.querySelector('[data-preview-matches]').innerHTML = '<div class="empty-state"><span class="pill">Próximamente</span><p class="muted">No hay un programa de PremiumGol disponible en este momento. Vuelve pronto.</p></div>';
      return;
    }
    openProgram = res.data.program;
    document.querySelector('[data-program-title]').textContent = openProgram.name;
    document.querySelector('[data-close-label]').textContent = Formatters.dateTimeLima(openProgram.closeAt);
    document.querySelector('[data-ticket-price]').textContent = Formatters.money(openProgram.ticketPriceCents);
    renderMatches(openProgram);
    document.querySelector('[data-play-btn]').addEventListener('click', function (e) { e.preventDefault(); goPlay(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
