(function () {
  var programId = null;
  var currentProgram = null;

  function toLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fromLocalInput(value) { return value ? new Date(value).toISOString() : null; }

  function renderMatchRows(matches) {
    var host = document.querySelector('[data-matches-form]');
    var rows = matches && matches.length === 12 ? matches : Array.from({ length: 12 }, function (_, i) { return { number: i + 1, competition: '', home: '', away: '', kickoffAt: '' }; });
    host.innerHTML = rows.map(function (m, idx) {
      return '<div class="grid grid-4" style="margin-bottom:.5rem" data-match-row="' + idx + '">' +
        '<input name="competition" placeholder="Competición" value="' + (m.competition || '') + '" required>' +
        '<input name="home" placeholder="Local" value="' + (m.home || '') + '" required>' +
        '<input name="away" placeholder="Visitante" value="' + (m.away || '') + '" required>' +
        '<input name="kickoffAt" type="datetime-local" value="' + toLocalInput(m.kickoffAt) + '" required>' +
        '</div>';
    }).join('');
  }

  function collectMatches() {
    var rows = document.querySelectorAll('[data-match-row]');
    return Array.from(rows).map(function (row) {
      return {
        competition: row.querySelector('[name="competition"]').value.trim(),
        home: row.querySelector('[name="home"]').value.trim(),
        away: row.querySelector('[name="away"]').value.trim(),
        kickoffAt: fromLocalInput(row.querySelector('[name="kickoffAt"]').value)
      };
    });
  }

  function renderStatusCard(program) {
    var card = document.querySelector('[data-status-card]');
    card.hidden = false;
    document.querySelector('[data-program-code]').textContent = program.code;
    document.querySelector('[data-program-name]').textContent = program.name;
    var statusEl = document.querySelector('[data-program-status]');
    statusEl.textContent = Formatters.programStatusLabel(program.status);
    statusEl.className = 'status ' + ({ draft: 'pending', open: 'ok', closed: 'warn', results_pending: 'warn', settled: 'info', cancelled: 'danger' }[program.status]);

    document.querySelector('[data-open-btn]').hidden = program.status !== 'draft';
    document.querySelector('[data-close-btn]').hidden = program.status !== 'open';
    document.querySelector('[data-results-link]').hidden = ['closed', 'results_pending'].indexOf(program.status) === -1;
    document.querySelector('[data-results-link]').href = 'resultados.html?id=' + program.id;
    document.querySelector('[data-settlement-link]').hidden = ['closed', 'results_pending', 'settled'].indexOf(program.status) === -1;
    document.querySelector('[data-settlement-link]').href = 'liquidacion.html?id=' + program.id;
    document.querySelector('[data-cancel-btn]').hidden = ['settled', 'cancelled'].indexOf(program.status) !== -1;

    var form = document.querySelector('[data-program-form]');
    var isDraft = program.status === 'draft';
    form.querySelectorAll('input, select').forEach(function (el) { el.disabled = !isDraft; });
    document.querySelector('[data-submit-btn]').hidden = !isDraft;
    document.querySelector('[data-form-title]').textContent = isDraft ? 'Editar borrador' : 'Partidos del programa (solo lectura)';
  }

  async function load() {
    var res = await Api.getProgram(programId);
    if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
    currentProgram = res.data.program;
    document.querySelector('#name').value = currentProgram.name;
    document.querySelector('#openAt').value = toLocalInput(currentProgram.openAt);
    document.querySelector('#closeAt').value = toLocalInput(currentProgram.closeAt);
    document.querySelector('#voidPolicy').value = currentProgram.voidPolicy;
    renderMatchRows(currentProgram.matches);
    renderStatusCard(currentProgram);
  }

  async function init() {
    var admin = await AuthService.requireAdmin();
    if (!admin) return;

    programId = RouterUtils.getQueryParam('id');
    if (programId) {
      await load();
    } else {
      var now = new Date();
      document.querySelector('#openAt').value = toLocalInput(now.toISOString());
      document.querySelector('#closeAt').value = toLocalInput(new Date(now.getTime() + 3 * 86400000).toISOString());
      renderMatchRows(null);
    }

    document.querySelector('[data-program-form]').addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var payload = {
        name: fd.get('name'), openAt: fromLocalInput(fd.get('openAt')), closeAt: fromLocalInput(fd.get('closeAt')),
        voidPolicy: fd.get('voidPolicy'), matches: collectMatches()
      };
      var res = programId ? await Api.updateDraftProgram(programId, payload) : await Api.createProgram(payload);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Programa guardado.', 'success');
      if (!programId) { location.href = 'programas.html?id=' + res.data.program.id; return; }
      load();
    });

    document.querySelector('[data-open-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Abrir programa', body: 'Los usuarios podrán comenzar a comprar tickets inmediatamente.', confirmText: 'Abrir programa' });
      if (!confirmed) return;
      var res = await Api.openProgram(programId);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Programa abierto.', 'success');
      load();
    });

    document.querySelector('[data-close-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Cerrar programa', body: 'Se bloquearán nuevas compras de tickets para este programa.', confirmText: 'Cerrar programa' });
      if (!confirmed) return;
      var res = await Api.closeProgram(programId);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Programa cerrado.', 'success');
      load();
    });

    document.querySelector('[data-cancel-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Cancelar programa', body: 'Se reembolsarán todos los tickets activos de este programa. Esta acción no se puede deshacer.', confirmText: 'Cancelar y reembolsar' });
      if (!confirmed) return;
      var res = await Api.cancelProgram(programId, 'Cancelado manualmente desde el panel administrativo');
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Programa cancelado y tickets reembolsados.', 'success');
      load();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
