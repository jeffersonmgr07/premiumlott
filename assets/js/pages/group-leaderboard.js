(function () {
  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    var groupId = RouterUtils.getQueryParam('groupId');
    var programId = RouterUtils.getQueryParam('programId');
    if (!groupId || !programId) { location.href = 'index.html'; return; }

    var groupRes = await Api.getGroup(groupId);
    if (groupRes.ok) {
      document.querySelector('[data-group-name]').textContent = groupRes.data.group.name;
      document.querySelector('[data-mode-label]').textContent = Formatters.prizeModeLabel(groupRes.data.group.prizeMode);
    }

    var res = await Api.getGroupLeaderboard(groupId, programId);
    var body = document.querySelector('[data-leaderboard-body]');
    if (!res.ok) { body.innerHTML = '<tr><td colspan="6" class="muted">' + res.error.message + '</td></tr>'; return; }

    document.querySelector('[data-program-name]').textContent = res.data.program.name;
    document.querySelector('[data-finished-count]').textContent = res.data.finishedMatches + '/' + res.data.totalMatches;
    document.querySelector('[data-program-status]').textContent = Formatters.programStatusLabel(res.data.program.status);

    if (!res.data.rows.length) { body.innerHTML = '<tr><td colspan="6" class="muted">Aún no hay tickets registrados en este grupo para el programa.</td></tr>'; return; }

    body.innerHTML = res.data.rows.map(function (row) {
      return '<tr class="leaderboard-row"><td><span class="leaderboard-position ' + (row.position <= 3 ? 'top' : '') + '">' + row.position + '</span></td>' +
        '<td>' + row.userLabel + '</td><td>' + row.code + '</td><td>' + row.hits + '/12</td>' +
        '<td><span class="status ' + (row.isWinner ? 'ok' : 'pending') + '">' + row.status + '</span></td>' +
        '<td>' + (row.isWinner ? '<strong style="color:var(--yellow)">' + Formatters.money(row.prizeCents) + '</strong>' : '—') + '</td></tr>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
