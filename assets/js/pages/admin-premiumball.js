(function () {
  var STATUS_CLASS = { draft: 'pending', open: 'ok', results_pending: 'warn', settled: 'info', cancelled: 'danger' };
  var currentDraw = null;
  var resultNumbers = [];
  var resultBolillapa = null;

  function toLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function fromLocalInput(value) { return value ? new Date(value).toISOString() : null; }

  function winnersTable(title, winners, prizeCents) {
    var poolLabel = Formatters.usd(prizeCents);
    if (!winners.length) return '<p class="mini muted">' + title + ': sin ganadores en este cálculo. Pozo: ' + poolLabel + '</p>';
    return '<h4 style="margin-top:.6rem">' + title + ' · ' + poolLabel + '</h4>' +
      '<div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Premio</th></tr></thead><tbody>' +
      winners.map(function (w) { return '<tr><td>' + w.code + '</td><td><strong>' + Formatters.usd(w.prizeCents) + '</strong></td></tr>'; }).join('') +
      '</tbody></table></div>';
  }

  function renderStatusCard(draw) {
    document.querySelector('[data-status-card]').hidden = false;
    document.querySelector('[data-draw-code]').textContent = draw.code;
    document.querySelector('[data-draw-name]').textContent = draw.name;
    var statusEl = document.querySelector('[data-draw-status]');
    statusEl.textContent = Formatters.programStatusLabel(draw.status);
    statusEl.className = 'status ' + STATUS_CLASS[draw.status];

    document.querySelector('[data-open-btn]').hidden = draw.status !== 'draft';
    document.querySelector('[data-close-btn]').hidden = draw.status !== 'open';
    document.querySelector('[data-cancel-btn]').hidden = ['settled', 'cancelled'].indexOf(draw.status) !== -1;

    var isDraft = draw.status === 'draft';
    var form = document.querySelector('[data-draw-form]');
    form.querySelectorAll('input').forEach(function (el) { el.disabled = !isDraft; });
    document.querySelector('[data-submit-btn]').hidden = !isDraft;
    document.querySelector('[data-form-title]').textContent = isDraft ? 'Editar borrador' : draw.name;

    document.querySelector('#name').value = draw.name;
    document.querySelector('#closeAt').value = toLocalInput(draw.closeAt);
    document.querySelector('#mainPrizeCents').value = Math.round(draw.mainPrizeCents / 100);
    document.querySelector('#siOSiPrizeCents').value = Math.round(draw.siOSiPrizeCents / 100);
    document.querySelector('#bolillapaPrizeCents').value = Math.round(draw.bolillapaPrizeCents / 100);
  }

  function renderResultsGrid() {
    var host = document.querySelector('[data-results-number-grid]');
    var editable = currentDraw.status === 'results_pending';
    var html = '';
    for (var n = currentDraw.numberMin; n <= currentDraw.numberMax; n++) {
      var active = resultNumbers.indexOf(n) !== -1;
      var disabled = !editable || (!active && resultNumbers.length >= currentDraw.picksCount);
      html += '<button type="button" class="number-ball' + (active ? ' active' : '') + '" data-number="' + n + '"' + (disabled ? ' disabled' : '') + '>' + n + '</button>';
    }
    host.innerHTML = html;
    document.querySelector('[data-results-picked]').textContent = resultNumbers.length + '/' + currentDraw.picksCount;

    if (editable) {
      host.querySelectorAll('.number-ball').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var n = Number(btn.dataset.number);
          var idx = resultNumbers.indexOf(n);
          if (idx !== -1) resultNumbers.splice(idx, 1);
          else if (resultNumbers.length < currentDraw.picksCount) resultNumbers.push(n);
          renderResultsGrid();
        });
      });
    }

    var bHost = document.querySelector('[data-results-bolillapa-grid]');
    var bHtml = '';
    for (var b = currentDraw.bolillapaMin; b <= currentDraw.bolillapaMax; b++) {
      var bActive = resultBolillapa === b;
      bHtml += '<button type="button" class="bolillapa-ball' + (bActive ? ' active' : '') + '" data-bolillapa="' + b + '"' + (!editable ? ' disabled' : '') + '>' + b + '</button>';
    }
    bHost.innerHTML = bHtml;
    if (editable) {
      bHost.querySelectorAll('.bolillapa-ball').forEach(function (btn) {
        btn.addEventListener('click', function () {
          resultBolillapa = Number(btn.dataset.bolillapa);
          renderResultsGrid();
        });
      });
    }
    document.querySelector('[data-save-results-btn]').hidden = !editable;
  }

  function renderSiOSiCard(draw) {
    var hasMainNumbers = draw.drawnNumbers && draw.drawnNumbers.length === draw.picksCount;
    var extra = draw.siOSiExtraNumbers || [];
    var visible = (draw.status === 'results_pending' && hasMainNumbers) || (draw.status === 'settled' && extra.length > 0);
    document.querySelector('[data-siosi-card]').hidden = !visible;
    if (!visible) return;

    document.querySelector('[data-siosi-chips]').innerHTML = extra.length
      ? extra.map(function (n) { return '<span class="chip">' + n + '</span>'; }).join('')
      : '<span class="mini muted">Sin bolillas extra todavía.</span>';

    var editable = draw.status === 'results_pending';
    document.querySelector('[data-siosi-input]').hidden = !editable;
    document.querySelector('[data-add-siosi-btn]').hidden = !editable;
  }

  async function renderSettlementCard(draw) {
    var card = document.querySelector('[data-settlement-card]');
    var hasMainNumbers = draw.drawnNumbers && draw.drawnNumbers.length === draw.picksCount;

    if (draw.status === 'settled') {
      card.hidden = false;
      document.querySelector('[data-settlement-title]').textContent = 'Liquidación confirmada';
      var drawRes = await Api.getBallDraw(draw.id);
      var settlement = drawRes.ok ? drawRes.data.settlement : null;
      if (settlement) {
        document.querySelector('[data-settlement-body]').innerHTML =
          '<p class="muted">Liquidado el ' + Formatters.dateTimeLima(settlement.settledAt) + ' · Total distribuido: <strong style="color:var(--yellow)">' + Formatters.usd(settlement.totalPrizeCentsDistributed) + '</strong></p>' +
          winnersTable('Premio mayor', settlement.mainWinners, draw.mainPrizeCents) +
          winnersTable('Sí o Sí', settlement.siOSiWinners, draw.siOSiPrizeCents) +
          winnersTable('Bolillapa', settlement.bolillapaWinners, draw.bolillapaPrizeCents);
      }
      document.querySelector('[data-settle-btn]').hidden = true;
      return;
    }

    if (draw.status !== 'results_pending' || !hasMainNumbers) {
      card.hidden = true;
      return;
    }

    card.hidden = false;
    document.querySelector('[data-settlement-title]').textContent = 'Previsualización de liquidación';
    var previewRes = await Api.previewBallSettlement(draw.id);
    if (!previewRes.ok) {
      document.querySelector('[data-settlement-body]').innerHTML = '<p class="muted">' + previewRes.error.message + '</p>';
      document.querySelector('[data-settle-btn]').hidden = true;
      return;
    }
    var preview = previewRes.data;
    document.querySelector('[data-settlement-body]').innerHTML =
      winnersTable('Premio mayor', preview.mainWinners, draw.mainPrizeCents) +
      winnersTable('Sí o Sí', preview.siOSiWinners, draw.siOSiPrizeCents) +
      winnersTable('Bolillapa', preview.bolillapaWinners, draw.bolillapaPrizeCents);
    document.querySelector('[data-settle-btn]').hidden = false;
  }

  async function loadDraw(id) {
    var res = await Api.getBallDraw(id);
    if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
    currentDraw = res.data.draw;
    resultNumbers = (currentDraw.drawnNumbers || []).slice();
    resultBolillapa = currentDraw.bolillapaNumber != null ? currentDraw.bolillapaNumber : null;

    document.querySelector('[data-draw-form-card]').hidden = false;
    renderStatusCard(currentDraw);

    var showResults = ['results_pending', 'settled'].indexOf(currentDraw.status) !== -1;
    document.querySelector('[data-results-card]').hidden = !showResults;
    if (showResults) renderResultsGrid();

    renderSiOSiCard(currentDraw);
    await renderSettlementCard(currentDraw);
  }

  function showBlankForm() {
    currentDraw = null;
    document.querySelector('[data-status-card]').hidden = true;
    document.querySelector('[data-results-card]').hidden = true;
    document.querySelector('[data-siosi-card]').hidden = true;
    document.querySelector('[data-settlement-card]').hidden = true;
    document.querySelector('[data-form-title]').textContent = 'Nuevo sorteo';
    var form = document.querySelector('[data-draw-form]');
    form.reset();
    form.querySelectorAll('input').forEach(function (el) { el.disabled = false; });
    document.querySelector('[data-submit-btn]').hidden = false;
    document.querySelector('#mainPrizeCents').value = 5000;
    document.querySelector('#siOSiPrizeCents').value = 500;
    document.querySelector('#bolillapaPrizeCents').value = 500;
    document.querySelector('#closeAt').value = toLocalInput(new Date(Date.now() + 4 * 86400000).toISOString());
    document.querySelector('[data-draw-select]').value = '';
  }

  async function refreshSelect(selectId) {
    var listRes = await Api.adminListBallDraws();
    var select = document.querySelector('[data-draw-select]');
    var draws = listRes.ok ? listRes.data.draws : [];
    select.innerHTML = '<option value="">— Nuevo sorteo —</option>' + draws.map(function (d) {
      return '<option value="' + d.id + '">' + d.name + ' (' + Formatters.programStatusLabel(d.status) + ')</option>';
    }).join('');
    if (selectId) select.value = selectId;
    return draws;
  }

  async function init() {
    var admin = await AuthService.requireAdmin();
    if (!admin) return;

    var requested = RouterUtils.getQueryParam('id');
    var draws = await refreshSelect(requested);

    if (requested && draws.some(function (d) { return d.id === requested; })) {
      await loadDraw(requested);
    } else if (draws.length) {
      document.querySelector('[data-draw-select]').value = draws[0].id;
      await loadDraw(draws[0].id);
    } else {
      showBlankForm();
    }

    document.querySelector('[data-draw-select]').addEventListener('change', async function (e) {
      var id = e.target.value;
      if (!id) { showBlankForm(); return; }
      await loadDraw(id);
    });

    document.querySelector('[data-new-btn]').addEventListener('click', showBlankForm);

    document.querySelector('[data-draw-form]').addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var payload = {
        name: fd.get('name'), closeAt: fromLocalInput(fd.get('closeAt')),
        mainPrizeCents: Math.round(Number(fd.get('mainPrizeDollars')) * 100),
        siOSiPrizeCents: Math.round(Number(fd.get('siOSiPrizeDollars')) * 100),
        bolillapaPrizeCents: Math.round(Number(fd.get('bolillapaPrizeDollars')) * 100)
      };
      var res = currentDraw ? await Api.updateDraftBallDraw(currentDraw.id, payload) : await Api.createBallDraw(payload);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Sorteo guardado.', 'success');
      await refreshSelect(res.data.draw.id);
      await loadDraw(res.data.draw.id);
    });

    document.querySelector('[data-open-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Abrir sorteo', body: 'Los jugadores podrán comenzar a comprar tickets inmediatamente.', confirmText: 'Abrir sorteo' });
      if (!confirmed) return;
      var res = await Api.openBallDraw(currentDraw.id);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Sorteo abierto.', 'success');
      await refreshSelect(currentDraw.id);
      await loadDraw(currentDraw.id);
    });

    document.querySelector('[data-close-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Cerrar sorteo', body: 'Se bloquearán nuevas compras de tickets para este sorteo.', confirmText: 'Cerrar sorteo' });
      if (!confirmed) return;
      var res = await Api.closeBallDraw(currentDraw.id);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Sorteo cerrado.', 'success');
      await refreshSelect(currentDraw.id);
      await loadDraw(currentDraw.id);
    });

    document.querySelector('[data-cancel-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({ title: 'Cancelar sorteo', body: 'Se reembolsarán todos los tickets activos de este sorteo. Esta acción no se puede deshacer.', confirmText: 'Cancelar y reembolsar' });
      if (!confirmed) return;
      var res = await Api.cancelBallDraw(currentDraw.id, 'Cancelado manualmente desde el panel administrativo');
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Sorteo cancelado y tickets reembolsados.', 'success');
      await refreshSelect(currentDraw.id);
      await loadDraw(currentDraw.id);
    });

    document.querySelector('[data-save-results-btn]').addEventListener('click', async function () {
      if (resultNumbers.length !== currentDraw.picksCount || resultBolillapa == null) {
        UI.toast('Elige ' + currentDraw.picksCount + ' números y la Bolillapa antes de guardar.', 'error');
        return;
      }
      var res = await Api.setBallDrawNumbers(currentDraw.id, { drawnNumbers: resultNumbers, bolillapaNumber: resultBolillapa });
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Resultados guardados.', 'success');
      await loadDraw(currentDraw.id);
    });

    document.querySelector('[data-add-siosi-btn]').addEventListener('click', async function () {
      var input = document.querySelector('[data-siosi-input]');
      var n = Number(input.value);
      if (!n) { UI.toast('Ingresa un número válido.', 'error'); return; }
      var res = await Api.addSiOSiNumber(currentDraw.id, n);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      input.value = '';
      UI.toast('Bolilla extra agregada.', 'success');
      await loadDraw(currentDraw.id);
    });

    document.querySelector('[data-settle-btn]').addEventListener('click', async function () {
      var confirmed = await UI.confirmModal({
        title: 'Confirmar liquidación', body: 'Se acreditarán los premios a los tickets ganadores y el sorteo quedará marcado como liquidado de forma permanente.',
        confirmText: 'Liquidar ahora'
      });
      if (!confirmed) return;
      var res = await AdminService.settleBallDrawOnce(currentDraw.id);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Sorteo liquidado correctamente.', 'success');
      await refreshSelect(currentDraw.id);
      await loadDraw(currentDraw.id);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
