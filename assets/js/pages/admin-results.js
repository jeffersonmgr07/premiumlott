(function () {
  var RESULT_OPTIONS = ['L', 'E', 'V', 'VOID'];

  function renderRows(program) {
    var host = document.querySelector('[data-results-form]');
    var editable = ['closed', 'results_pending'].indexOf(program.status) !== -1;
    host.hidden = false;
    document.querySelector('[data-empty-state]').hidden = true;

    host.innerHTML = '<article class="card"><div class="section-head"><div><h3>' + program.name + '</h3><p class="muted">' + Formatters.programStatusLabel(program.status) + ' · Política: ' + (program.voidPolicy === 'VOID_COUNTS_AS_HIT' ? 'Anulado cuenta como acierto' : 'Anulado no cuenta') + '</p></div></div>' +
      program.matches.map(function (m) {
        return '<div class="match-result-row" data-match-id="' + m.id + '">' +
          '<div><strong>' + m.home + ' vs ' + m.away + '</strong><br><small class="muted">' + Formatters.dateTimeLima(m.kickoffAt) + '</small></div>' +
          '<div class="result-btn-row">' + RESULT_OPTIONS.map(function (r) {
            return '<button type="button" data-result="' + r + '" class="' + (m.result === r ? 'active' : '') + '"' + (editable ? '' : ' disabled') + '>' + r + '</button>';
          }).join('') + '</div></div>';
      }).join('') + '</article>';

    if (editable) {
      host.querySelectorAll('.match-result-row').forEach(function (row) {
        row.querySelectorAll('button').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            var res = await Api.setMatchResult(row.dataset.matchId, btn.dataset.result);
            if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
            row.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            UI.toast('Resultado registrado.', 'success');
          });
        });
      });
    }
  }

  async function loadProgram(id) {
    var res = await Api.getProgram(id);
    if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
    renderRows(res.data.program);
  }

  async function init() {
    var admin = await AuthService.requireAdmin();
    if (!admin) return;

    var listRes = await Api.adminListPrograms();
    var select = document.querySelector('[data-program-select]');
    var candidates = listRes.ok ? listRes.data.programs.filter(function (p) { return ['closed', 'results_pending', 'settled'].indexOf(p.status) !== -1; }) : [];
    if (!candidates.length) {
      document.querySelector('[data-empty-state]').innerHTML = '<p class="muted">No hay programas cerrados que necesiten resultados. Cierra un programa abierto desde "Programas".</p>';
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
