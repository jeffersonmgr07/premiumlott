(function () {
  function renderGroupBlock(g) {
    var winnersTable = function (title, winners, poolLabel) {
      if (!winners.length) return '<p class="mini muted">' + title + ': sin ganadores en este cálculo. ' + poolLabel + '</p>';
      return '<h4 style="margin-top:.6rem">' + title + ' · ' + poolLabel + '</h4>' +
        '<div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Aciertos</th><th>Premio</th></tr></thead><tbody>' +
        winners.map(function (w) { return '<tr><td>' + w.code + '</td><td>' + w.hits + '/12</td><td><strong>' + w.prizeLabel + '</strong></td></tr>'; }).join('') +
        '</tbody></table></div>';
    };

    return '<article class="card" style="margin-bottom:1rem"><div class="section-head"><div><h3>' + g.groupName + '</h3><p class="muted">' + g.modeLabel + ' · ' + g.ticketCount + ' tickets · Máximo ' + g.maxHits + '/12 aciertos</p></div></div>' +
      (g.mode !== 'PERFECT_12' ? winnersTable('Pozo semanal', g.weeklyWinners, g.weeklyPoolLabel) : '') +
      (g.mode !== 'HIGHEST_SCORE' ? '<div style="margin-top:.6rem"><p class="mini muted">Acumulado previo: ' + g.progressiveCarryInLabel + ' + aporte de este programa = ' + g.progressivePoolLabel + '</p>' + winnersTable('Pozo progresivo 12/12', g.progressiveWinners, g.progressivePoolLabel) + '</div>' : '') +
      '</article>';
  }

  async function loadProgram(id) {
    var host = document.querySelector('[data-content]');
    var programRes = await Api.getProgram(id);
    if (!programRes.ok) { host.innerHTML = '<p class="muted">' + programRes.error.message + '</p>'; return; }
    var program = programRes.data.program;

    if (program.status === 'settled') {
      var settlement = programRes.data.settlement;
      host.innerHTML = '<article class="card"><span class="status ok">Liquidado</span><p class="muted" style="margin-top:.4rem">Liquidado el ' + Formatters.dateTimeLima(program.settledAt) + ' · Total distribuido: <strong>' + Formatters.money(settlement.totalPrizeCentsDistributed) + '</strong></p></article>' +
        (settlement.groups || []).map(function (g) {
          return renderGroupBlock(Object.assign({}, g, {
            weeklyPoolLabel: Formatters.money(g.weeklyPoolCents), progressivePoolLabel: Formatters.money(g.progressivePoolCents),
            progressiveCarryInLabel: Formatters.money(g.progressiveCarryInCents), modeLabel: Formatters.prizeModeLabel(g.mode),
            weeklyWinners: g.weeklyWinners.map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.money(w.prizeCents) }); }),
            progressiveWinners: g.progressiveWinners.map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.money(w.prizeCents) }); })
          }));
        }).join('');
      return;
    }

    var previewRes = await Api.previewSettlement(id);
    if (!previewRes.ok) { host.innerHTML = '<p class="muted">' + previewRes.error.message + '</p>'; return; }
    var preview = AdminService.formatSettlementPreview(previewRes.data);

    if (!preview.ready) {
      host.innerHTML = '<article class="card"><span class="status warn">Resultados incompletos</span><p class="muted" style="margin-top:.4rem">Completa los resultados de los 12 partidos en la sección Resultados antes de previsualizar la liquidación.</p><a class="btn btn-outline" style="margin-top:.6rem" href="resultados.html?id=' + id + '">Ir a Resultados</a></article>';
      return;
    }

    host.innerHTML = '<article class="card"><h3>Previsualización</h3><p class="muted">Revisa la distribución antes de confirmar. Esta acción es irreversible y solo puede ejecutarse una vez.</p><button class="btn btn-primary" style="margin-top:.6rem" data-settle-btn>Liquidar programa</button></article>' +
      preview.groups.map(renderGroupBlock).join('');

    document.querySelector('[data-settle-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({
        title: 'Confirmar liquidación', body: 'Se acreditarán los premios a los tickets ganadores y el programa quedará marcado como liquidado de forma permanente.',
        confirmText: 'Liquidar ahora'
      });
      if (!confirmed) return;
      var res = await AdminService.settleProgramOnce(id);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Programa liquidado correctamente.', 'success');
      loadProgram(id);
    });
  }

  async function init() {
    var admin = await AuthService.requireAdmin();
    if (!admin) return;

    var listRes = await Api.adminListPrograms();
    var select = document.querySelector('[data-program-select]');
    var candidates = listRes.ok ? listRes.data.programs.filter(function (p) { return ['closed', 'results_pending', 'settled'].indexOf(p.status) !== -1; }) : [];
    if (!candidates.length) {
      document.querySelector('[data-content]').innerHTML = '<p class="muted">No hay programas cerrados listos para liquidar.</p>';
      select.hidden = true;
      return;
    }
    select.innerHTML = candidates.map(function (p) { return '<option value="' + p.id + '">' + p.name + ' (' + Formatters.programStatusLabel(p.status) + ')</option>'; }).join('');
    var requested = RouterUtils.getQueryParam('id');
    if (requested && candidates.some(function (p) { return p.id === requested; })) select.value = requested;
    select.addEventListener('change', function () { loadProgram(select.value); });
    loadProgram(select.value);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
