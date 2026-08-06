(function () {
  var draw, currentUser, currentNumbers = [], currentBolillapa = null, editingLocalId = null, countdownTimer = null;

  function renderNumberGrid() {
    var host = document.querySelector('[data-number-grid]');
    var html = '';
    for (var n = draw.numberMin; n <= draw.numberMax; n++) {
      var active = currentNumbers.indexOf(n) !== -1;
      var disabled = !active && currentNumbers.length >= draw.picksCount;
      html += '<button type="button" class="number-ball' + (active ? ' active' : '') + '" data-number="' + n + '"' + (disabled ? ' disabled' : '') + ' aria-pressed="' + active + '">' + n + '</button>';
    }
    host.innerHTML = html;

    host.querySelectorAll('.number-ball').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = Number(btn.dataset.number);
        var idx = currentNumbers.indexOf(n);
        if (idx !== -1) currentNumbers.splice(idx, 1);
        else if (currentNumbers.length < draw.picksCount) currentNumbers.push(n);
        renderNumberGrid();
        updateProgress();
      });
    });
  }

  function renderBolillapaGrid() {
    var host = document.querySelector('[data-bolillapa-grid]');
    var html = '';
    for (var n = draw.bolillapaMin; n <= draw.bolillapaMax; n++) {
      var active = currentBolillapa === n;
      html += '<button type="button" class="bolillapa-ball' + (active ? ' active' : '') + '" data-bolillapa="' + n + '" aria-pressed="' + active + '">' + n + '</button>';
    }
    host.innerHTML = html;

    host.querySelectorAll('.bolillapa-ball').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentBolillapa = Number(btn.dataset.bolillapa);
        renderBolillapaGrid();
        updateProgress();
      });
    });
  }

  function updateProgress() {
    document.querySelector('[data-picks-count]').textContent = currentNumbers.length;
    document.querySelector('[data-bolillapa-picked]').textContent = currentBolillapa != null ? currentBolillapa : '—';
    document.querySelector('[data-progress-bar]').style.width = Math.round((currentNumbers.length / draw.picksCount) * 100) + '%';
    setStep(currentNumbers.length === draw.picksCount && currentBolillapa != null ? 2 : 1);
  }

  function setStep(n) {
    document.querySelectorAll('.wizard-steps span').forEach(function (el) {
      el.classList.toggle('active', Number(el.dataset.step) === n);
    });
  }

  function renderTicketTabs() {
    var host = document.querySelector('[data-ticket-tabs]');
    var cart = PremiumBallService.getCart(draw.id);
    var tabsHtml = cart.map(function (line, idx) {
      var active = editingLocalId === line.localId;
      return '<button type="button" class="ticket-tab is-complete' + (active ? ' active' : '') + '" data-tab-id="' + line.localId + '">' +
        String(idx + 1).padStart(2, '0') + '<span class="ticket-tab-remove" data-remove-tab="' + line.localId + '" title="Eliminar jugada">×</span></button>';
    }).join('');
    tabsHtml += '<button type="button" class="ticket-tab ticket-tab-add' + (!editingLocalId ? ' active' : '') + '" data-tab-id="">+</button>';
    host.innerHTML = tabsHtml;

    host.querySelectorAll('[data-remove-tab]').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        var confirmed = await UI.confirmModal({ title: 'Eliminar jugada', body: 'Se quitará esta jugada de tu compra.', confirmText: 'Eliminar' });
        if (!confirmed) return;
        var id = btn.dataset.removeTab;
        PremiumBallService.removeFromCart(draw.id, id);
        if (editingLocalId === id) resetBuilder();
        renderTicketTabs();
        renderCart();
      });
    });
    host.querySelectorAll('.ticket-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.tabId;
        if (!id) { resetBuilder(); renderTicketTabs(); return; }
        loadTicketIntoBuilder(id);
      });
    });
  }

  function loadTicketIntoBuilder(localId) {
    var cart = PremiumBallService.getCart(draw.id);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (!line) return;
    currentNumbers = line.numbers.slice();
    currentBolillapa = line.bolillapaNumber;
    editingLocalId = localId;
    renderNumberGrid();
    renderBolillapaGrid();
    updateProgress();
    renderTicketTabs();
  }

  function resetBuilder() {
    currentNumbers = [];
    currentBolillapa = null;
    editingLocalId = null;
    renderNumberGrid();
    renderBolillapaGrid();
    updateProgress();
  }

  async function renderCart() {
    var cart = PremiumBallService.getCart(draw.id);
    var totals = PremiumBallService.cartTotals(cart, draw);
    document.querySelector('[data-cart-count]').textContent = totals.count;
    document.querySelector('[data-cart-subtotal]').textContent = Formatters.usd(totals.subtotalCents);
    document.querySelector('[data-mobile-count]').textContent = totals.count;
    document.querySelector('[data-mobile-total]').textContent = Formatters.usd(totals.subtotalCents);

    var confirmEnabled = totals.count > 0 && new Date(draw.closeAt) > new Date();
    document.querySelector('[data-confirm-btn]').disabled = !confirmEnabled;
    document.querySelector('[data-mobile-confirm]').disabled = !confirmEnabled;
    document.querySelector('[data-mobile-bar]').hidden = totals.count === 0;
  }

  function startCountdown() {
    function tick() {
      var diff = new Date(draw.closeAt).getTime() - Date.now();
      var el = document.querySelector('[data-countdown]');
      if (diff <= 0) {
        el.textContent = 'Cerrado';
        clearInterval(countdownTimer);
        renderCart();
        return;
      }
      var h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      var d = Math.floor(h / 24); h = h % 24;
      el.textContent = (d > 0 ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  async function requireLoginOrPrompt() {
    if (currentUser) return true;
    UI.toast('Inicia sesión para guardar y registrar tu jugada.', 'info');
    setTimeout(function () { location.href = '../login.html?redirect=' + encodeURIComponent(RouterUtils.currentPageId() + location.search); }, 900);
    return false;
  }

  async function confirmPurchase() {
    if (!(await requireLoginOrPrompt())) return;
    var cart = PremiumBallService.getCart(draw.id);
    var totals = PremiumBallService.cartTotals(cart, draw);
    if (!totals.isComplete) { UI.toast('Hay jugadas incompletas en el carrito.', 'error'); return; }

    var confirmed = await UI.confirmModal({
      title: 'Confirmar registro de jugadas',
      body: 'Vas a registrar ' + totals.count + ' ticket(s) por un total de ' + Formatters.usd(totals.subtotalCents) + '. Esta acción descuenta tu saldo demo y no se puede deshacer.',
      confirmText: 'Confirmar y registrar'
    });
    if (!confirmed) return;

    document.querySelector('[data-confirm-btn]').disabled = true;
    document.querySelector('[data-mobile-confirm]').disabled = true;
    var res = await PremiumBallService.checkout(draw.id);
    if (!res.ok) {
      UI.toast(res.error.message, 'error');
      if (res.error.code === 'INSUFFICIENT_BALANCE') setTimeout(function () { location.href = '../saldo.html'; }, 900);
      else renderCart();
      return;
    }
    UI.toast(res.data.tickets.length + ' ticket(s) registrados correctamente.', 'success');
    setTimeout(function () { location.href = '../mis-jugadas.html'; }, 700);
  }

  async function init() {
    var userRes = await Api.getCurrentUser();
    currentUser = userRes.ok ? userRes.data.user : null;

    var drawRes = await Api.getOpenBallDraw();
    if (!drawRes.ok) {
      document.querySelector('[data-loading]').innerHTML = '<div class="empty-state"><span class="pill">Sin sorteo</span><p class="muted">No hay un sorteo de PremiumBall abierto en este momento.</p></div>';
      return;
    }
    draw = drawRes.data.draw;

    document.querySelector('[data-loading]').hidden = true;
    document.querySelector('[data-content]').hidden = false;
    document.querySelector('[data-draw-name]').textContent = draw.name;
    document.querySelector('[data-ticket-price]').textContent = Formatters.usd(draw.ticketPriceCents);
    document.querySelector('[data-number-range]').textContent = draw.numberMin + ' al ' + draw.numberMax;
    document.querySelector('[data-bolillapa-range]').textContent = draw.bolillapaMin + ' al ' + draw.bolillapaMax;
    document.querySelector('[data-pool-label]').textContent = Formatters.usd(draw.mainPrizeCents);

    resetBuilder();
    startCountdown();
    renderTicketTabs();
    await renderCart();

    document.querySelector('[data-random-btn]').addEventListener('click', function () {
      var picks = PremiumBallService.randomPicks(draw);
      currentNumbers = picks.numbers;
      currentBolillapa = picks.bolillapaNumber;
      renderNumberGrid();
      renderBolillapaGrid();
      updateProgress();
    });
    document.querySelector('[data-clear-btn]').addEventListener('click', function () { resetBuilder(); });

    document.querySelector('[data-add-cart-btn]').addEventListener('click', async function () {
      if (currentNumbers.length < draw.picksCount) { UI.toast('Elige ' + draw.picksCount + ' números antes de guardar la jugada.', 'error'); return; }
      if (currentBolillapa == null) { UI.toast('Elige tu número Bolillapa antes de guardar la jugada.', 'error'); return; }
      if (!(await requireLoginOrPrompt())) return;
      if (editingLocalId) { PremiumBallService.updateInCart(draw.id, editingLocalId, currentNumbers, currentBolillapa); UI.toast('Jugada actualizada.', 'success'); }
      else { PremiumBallService.addToCart(draw.id, currentNumbers, currentBolillapa); UI.toast('Jugada guardada.', 'success'); }
      resetBuilder();
      renderTicketTabs();
      renderCart();
    });

    document.querySelector('[data-confirm-btn]').addEventListener('click', confirmPurchase);
    document.querySelector('[data-mobile-confirm]').addEventListener('click', confirmPurchase);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
