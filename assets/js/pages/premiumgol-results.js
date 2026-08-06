(function () {
  var RESULT_LABEL = { L: 'Local', E: 'Empate', V: 'Visitante', VOID: 'Anulado' };

  async function loadProgram(programId) {
    var res = await Api.getProgram(programId);
    if (!res.ok) return;
    var program = res.data.program;
    document.querySelector('[data-status-label]').textContent = Formatters.programStatusLabel(program.status);
    document.querySelector('[data-close-label]').textContent = Formatters.dateTimeLima(program.closeAt);
    document.querySelector('[data-settled-label]').textContent = program.settledAt ? Formatters.dateTimeLima(program.settledAt) : 'Pendiente';

    document.querySelector('[data-results-list]').innerHTML = program.matches.map(function (m) {
      var badge = m.result ? '<span class="status ' + (m.result === 'VOID' ? 'warn' : 'ok') + '">' + RESULT_LABEL[m.result] + '</span>' : '<span class="status pending">Pendiente</span>';
      return '<div class="match"><div><strong>' + m.home + '</strong> vs <strong>' + m.away + '</strong><div class="muted">' + Formatters.dateTimeLima(m.kickoffAt) + ' · ' + m.competition + '</div></div>' + badge + '</div>';
    }).join('');

    var lbRes = await Api.getProgramLeaderboard(programId);
    var body = document.querySelector('[data-leaderboard-body]');
    if (!lbRes.ok || !lbRes.data.rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="muted">Aún no hay tickets registrados en este programa.</td></tr>';
      return;
    }
    body.innerHTML = lbRes.data.rows.map(function (row) {
      return '<tr class="leaderboard-row"><td><span class="leaderboard-position ' + (row.position <= 3 ? 'top' : '') + '">' + row.position + '</span></td>' +
        '<td>' + row.userLabel + '</td><td>' + row.code + '</td><td>' + row.hits + '/12</td>' +
        '<td><span class="status ' + (row.isWinner ? 'ok' : 'pending') + '">' + row.status + '</span></td>' +
        '<td>' + (row.isWinner ? '<strong style="color:var(--yellow)">' + Formatters.usd(row.prizeCents) + '</strong>' : '—') + '</td></tr>';
    }).join('');
  }

  async function init() {
    var res = await Api.listPrograms();
    var select = document.querySelector('[data-program-select]');
    if (!res.ok || !res.data.programs.length) {
      document.querySelector('[data-results-list]').innerHTML = '<div class="empty-state"><span class="pill">Sin programas</span><p class="muted">Todavía no hay programas de PremiumGol.</p></div>';
      return;
    }
    select.innerHTML = res.data.programs.map(function (p) { return '<option value="' + p.id + '">' + p.name + ' (' + Formatters.programStatusLabel(p.status) + ')</option>'; }).join('');
    var requested = RouterUtils.getQueryParam('programId');
    if (requested) select.value = requested;
    select.addEventListener('change', function () { loadProgram(select.value); });
    loadProgram(select.value);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
