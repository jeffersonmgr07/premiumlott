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

    var newTicketsRes = await Api.getMyTickets({});
    var state = Store.get();
    var legacy = state.legacyTickets.filter(function (t) { return t.userId === user.id; });

    var newRows = newTicketsRes.ok ? newTicketsRes.data.tickets.map(function (t) {
      var hitsLabel = t.hits == null ? '—' : (t.hits + '/12');
      return '<tr><td><strong>' + t.code + '</strong><br><small class="muted">' + t.groupName + '</small></td>' +
        '<td>PremiumGol<br><small class="muted">' + t.programName + '</small></td>' +
        '<td>' + Formatters.dateLima(t.purchasedAt) + '</td>' +
        '<td>' + Formatters.money(t.priceCents) + '</td>' +
        '<td>' + hitsLabel + '</td>' +
        '<td><span class="status ' + statusBadge(t.status) + '">' + (t.status === 'ACTIVE' ? 'Activo' : 'Reembolsado') + '</span></td>' +
        '<td>' + (t.isWinner ? '<strong style="color:var(--yellow)">' + Formatters.money(t.prizeCents) + '</strong>' : (t.programStatus === 'settled' ? 'No ganador' : 'Por definir')) + '</td></tr>';
    }) : [];

    var legacyRows = legacy.map(function (t) {
      return '<tr><td><strong>' + t.code + '</strong><br><small class="muted">' + (t.hash || '') + '</small></td>' +
        '<td>' + t.game + (t.mode ? '<br><small class="muted">' + t.mode + '</small>' : '') + '</td>' +
        '<td>' + (t.date || Formatters.dateLima(t.createdAt)) + '</td>' +
        '<td>' + Formatters.money(t.amountCents) + '</td><td>—</td>' +
        '<td><span class="status ok">' + (t.status || 'Registrado') + '</span></td>' +
        '<td>' + (t.prize || 'Por definir') + '</td></tr>';
    });

    var allRows = newRows.concat(legacyRows);
    body.innerHTML = allRows.length ? allRows.join('') : '<tr><td colspan="7" class="muted">Aún no tienes jugadas registradas.</td></tr>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
