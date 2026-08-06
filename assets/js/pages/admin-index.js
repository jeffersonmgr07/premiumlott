(function () {
  var STATUS_BADGE = { draft: 'pending', open: 'ok', closed: 'warn', results_pending: 'warn', settled: 'info', cancelled: 'danger' };

  async function init() {
    var admin = await AuthService.requireAdmin();
    if (!admin) return;

    var overview = await Api.adminGetOverview();
    if (overview.ok) {
      document.querySelector('[data-stat-users]').textContent = overview.data.userCount;
      document.querySelector('[data-stat-tickets]').textContent = overview.data.ticketCount + overview.data.ballTicketCount;
      document.querySelector('[data-stat-revenue]').textContent = Formatters.usd(overview.data.ticketRevenueCents);
      document.querySelector('[data-stat-prizes]').textContent = Formatters.usd(overview.data.prizesDistributedCents);
    }

    var programsRes = await Api.adminListPrograms();
    var body = document.querySelector('[data-programs-body]');
    if (programsRes.ok && programsRes.data.programs.length) {
      body.innerHTML = programsRes.data.programs.map(function (p) {
        return '<tr><td>' + p.name + '<br><small class="muted">' + p.code + '</small></td>' +
          '<td><span class="status ' + STATUS_BADGE[p.status] + '">' + Formatters.programStatusLabel(p.status) + '</span></td>' +
          '<td>' + p.matchCount + '/12</td><td>' + p.ticketCount + '</td>' +
          '<td>' + Formatters.dateTimeLima(p.closeAt) + '</td>' +
          '<td><a class="btn btn-outline" style="padding:.4rem .7rem;font-size:.78rem" href="programas.html?id=' + p.id + '">Gestionar</a></td></tr>';
      }).join('');
    } else {
      body.innerHTML = '<tr><td colspan="6" class="muted">Sin programas creados todavía.</td></tr>';
    }

    var auditRes = await Api.adminGetAuditLog(20);
    var auditBody = document.querySelector('[data-audit-body]');
    if (auditRes.ok && auditRes.data.entries.length) {
      auditBody.innerHTML = auditRes.data.entries.map(function (e) {
        return '<tr><td>' + Formatters.dateTimeLima(e.createdAt) + '</td><td>' + e.action + '</td><td>' + (e.entityType || '—') + '</td><td>' + e.actorRole + '</td></tr>';
      }).join('');
    } else {
      auditBody.innerHTML = '<tr><td colspan="4" class="muted">Sin actividad registrada.</td></tr>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
