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

    var userRes = await Api.getCurrentUser();
    var groupsCard = document.querySelector('[data-my-groups-card]');
    if (userRes.ok && userRes.data.user) {
      var groupsRes = await Api.getMyGroups();
      var ticketsRes = await Api.getMyTickets({ programId: programId });
      if (groupsRes.ok && ticketsRes.ok) {
        var groupIdsWithTickets = Array.from(new Set(ticketsRes.data.tickets.map(function (t) { return t.groupId; })));
        var relevantGroups = groupsRes.data.groups.filter(function (g) { return groupIdsWithTickets.indexOf(g.id) !== -1; });
        if (relevantGroups.length) {
          groupsCard.hidden = false;
          document.querySelector('[data-my-groups-list]').innerHTML = relevantGroups.map(function (g) {
            return '<div class="member-row"><span>' + g.name + '</span><a class="btn btn-outline" style="padding:.4rem .8rem;font-size:.78rem" href="../grupos/clasificacion.html?groupId=' + g.id + '&programId=' + programId + '">Ver clasificación</a></div>';
          }).join('');
        } else groupsCard.hidden = true;
      }
    } else groupsCard.hidden = true;
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
