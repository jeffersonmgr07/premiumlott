(function () {
  function statusBadge(status) {
    var map = { ACTIVE: 'ok', REFUNDED: 'warn', settled: 'ok', open: 'info' };
    return map[status] || 'pending';
  }

  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    var body = document.querySelector('[data-tickets-body]');
    body.innerHTML = UI.skeletonRows(3, 7);

    var golRes = await Api.getMyTickets({});
    var ballRes = await Api.getMyBallTickets({});
    var state = Store.get();
    var legacy = state.legacyTickets.filter(function (t) { return t.userId === user.id; });

    var golRows = golRes.ok ? golRes.data.tickets.map(function (t) {
      var hitsLabel = t.hits == null ? '—' : (t.hits + '/12');
      return '<tr><td><strong>' + t.code + '</strong></td>' +
        '<td>PremiumGol<br><small class="muted">' + t.programName + '</small></td>' +
        '<td>' + Formatters.dateLima(t.purchasedAt) + '</td>' +
        '<td>' + Formatters.usd(t.priceCents) + '</td>' +
        '<td>' + hitsLabel + '</td>' +
        '<td><span class="status ' + statusBadge(t.status) + '">' + (t.status === 'ACTIVE' ? 'Activo' : 'Reembolsado') + '</span></td>' +
        '<td>' + (t.isWinner ? '<strong style="color:var(--yellow)">' + Formatters.usd(t.prizeCents) + '</strong>' : (t.programStatus === 'settled' ? 'No ganador' : 'Por definir')) + '</td></tr>';
    }) : [];

    var ballRows = ballRes.ok ? ballRes.data.tickets.map(function (t) {
      var hitsLabel = t.hits == null ? '—' : (t.hits + '/6');
      var prizeLabel = t.isMainWinner || t.isSiOSiWinner || t.isBolillapaWinner
        ? '<strong style="color:var(--yellow)">' + Formatters.usd(t.prizeCents) + '</strong>'
        : (t.drawStatus === 'settled' ? 'No ganador' : 'Por definir');
      return '<tr><td><strong>' + t.code + '</strong></td>' +
        '<td>PremiumBall<br><small class="muted">' + t.drawName + '</small></td>' +
        '<td>' + Formatters.dateLima(t.purchasedAt) + '</td>' +
        '<td>' + Formatters.usd(t.priceCents) + '</td>' +
        '<td>' + hitsLabel + '</td>' +
        '<td><span class="status ' + statusBadge(t.status) + '">' + (t.status === 'ACTIVE' ? 'Activo' : 'Reembolsado') + '</span></td>' +
        '<td>' + prizeLabel + '</td></tr>';
    }) : [];

    var legacyRows = legacy.map(function (t) {
      return '<tr><td><strong>' + t.code + '</strong><br><small class="muted">' + (t.hash || '') + '</small></td>' +
        '<td>' + t.game + (t.mode ? '<br><small class="muted">' + t.mode + '</small>' : '') + '</td>' +
        '<td>' + (t.date || Formatters.dateLima(t.createdAt)) + '</td>' +
        '<td>' + Formatters.money(t.amountCents) + '</td><td>—</td>' +
        '<td><span class="status ok">' + (t.status || 'Registrado') + '</span></td>' +
        '<td>' + (t.prize || 'Por definir') + '</td></tr>';
    });

    var allRows = golRows.concat(ballRows, legacyRows);
    body.innerHTML = allRows.length ? allRows.join('') : '<tr><td colspan="7" class="muted">Aún no tienes jugadas registradas.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
