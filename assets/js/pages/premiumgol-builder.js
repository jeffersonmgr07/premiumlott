(function () {
  var program, group, currentUser, groupId = null, currentPicks = {}, editingLocalId = null, countdownTimer = null;

  var MODE_DESCRIPTIONS = {
    HIGHEST_SCORE: 'Todo el pozo se reparte entre los tickets con más aciertos. Sin acumulación.',
    PERFECT_12: 'Solo ganan los tickets con 12/12. Si nadie acierta, el pozo se acumula.',
    MIXED: '50% premia el mayor puntaje semanal y 50% se acumula hasta un 12/12.'
  };

  function renderMatches() {
    var host = document.querySelector('[data-match-list]');
    host.innerHTML = program.matches.map(function (m, idx) {
      var pick = currentPicks[m.id];
      return '<div class="match-card' + (pick ? ' is-complete' : '') + '" role="listitem">' +
        '<div class="match-card-head"><span class="match-number">Partido ' + (idx + 1) + '</span><span class="match-meta">' + m.competition + '</span></div>' +
        '<div class="match-teams">' + m.home + ' vs ' + m.away + '</div>' +
        '<div class="match-meta">' + Formatters.dateTimeLima(m.kickoffAt) + '</div>' +
        '<div class="pick-row" data-match-id="' + m.id + '">' +
        ['L', 'E', 'V'].map(function (opt) {
          var label = opt === 'L' ? m.home : (opt === 'E' ? 'Empate' : m.away);
          return '<button type="button" class="pick-btn' + (pick === opt ? ' active' : '') + '" data-pick="' + opt + '" aria-pressed="' + (pick === opt) + '" aria-label="' + label + '">' + opt + '</button>';
        }).join('') + '</div></div>';
    }).join('');

    host.querySelectorAll('.pick-row').forEach(function (row) {
      row.addEventListener('click', function (e) {
        var btn = e.target.closest('.pick-btn');
        if (!btn) return;
        currentPicks[row.dataset.matchId] = btn.dataset.pick;
        renderMatches();
        updateProgress();
      });
    });
  }

  function updateProgress() {
    var count = Object.keys(currentPicks).length;
    document.querySelector('[data-picks-count]').textContent = count;
    document.querySelector('[data-progress-bar]').style.width = Math.round((count / 12) * 100) + '%';
  }

  async function renderCart() {
    var cart = groupId ? PremiumGolService.getCart(groupId, program.id) : [];
    var host = document.querySelector('[data-cart-list]');
    if (!groupId) {
      host.innerHTML = '<p class="muted mini">Elige un grupo para empezar tu carrito.</p>';
    } else if (!cart.length) {
      host.innerHTML = '<p class="muted mini">Aún no agregaste jugadas.</p>';
    } else {
      host.innerHTML = cart.map(function (line, idx) {
        return '<div class="cart-line"><div><strong>Jugada ' + (idx + 1) + '</strong><br><small class="muted">' + Object.keys(line.picks).length + '/12 completos</small></div>' +
          '<div class="cart-line-actions">' +
          '<button data-edit="' + line.localId + '">Editar</button>' +
          '<button data-duplicate="' + line.localId + '">Duplicar</button>' +
          '<button data-remove="' + line.localId + '">Eliminar</button>' +
          '</div></div>';
      }).join('');
      host.querySelectorAll('[data-edit]').forEach(function (btn) { btn.addEventListener('click', function () { editLine(btn.dataset.edit); }); });
      host.querySelectorAll('[data-duplicate]').forEach(function (btn) {
        btn.addEventListener('click', function () { PremiumGolService.duplicateInCart(groupId, program.id, btn.dataset.duplicate); renderCart(); UI.toast('Jugada duplicada.', 'info'); });
      });
      host.querySelectorAll('[data-remove]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var confirmed = await UI.confirmModal({ title: 'Eliminar jugada', body: 'Se quitará esta jugada del carrito.', confirmText: 'Eliminar' });
          if (!confirmed) return;
          PremiumGolService.removeFromCart(groupId, program.id, btn.dataset.remove);
          renderCart();
        });
      });
    }

    var totals = PremiumGolService.cartTotals(cart, program);
    document.querySelector('[data-cart-count]').textContent = totals.count;
    document.querySelector('[data-cart-subtotal]').textContent = Formatters.money(totals.subtotalCents);
    document.querySelector('[data-cart-pool]').textContent = Formatters.money(totals.poolCents);
    document.querySelector('[data-cart-fee]').textContent = Formatters.money(totals.feeCents);
    document.querySelector('[data-mobile-count]').textContent = totals.count;
    document.querySelector('[data-mobile-total]').textContent = Formatters.money(totals.subtotalCents);

    var confirmEnabled = totals.count > 0 && new Date(program.closeAt) > new Date();
    document.querySelector('[data-confirm-btn]').disabled = !confirmEnabled;
    document.querySelector('[data-mobile-confirm]').disabled = !confirmEnabled;
    document.querySelector('[data-mobile-bar]').hidden = totals.count === 0;
  }

  function editLine(localId) {
    var cart = PremiumGolService.getCart(groupId, program.id);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (!line) return;
    currentPicks = Object.assign({}, line.picks);
    editingLocalId = localId;
    document.querySelector('[data-edit-hint]').hidden = false;
    renderMatches();
    updateProgress();
    document.querySelector('[data-match-list]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBuilder() {
    currentPicks = {};
    editingLocalId = null;
    document.querySelector('[data-edit-hint]').hidden = true;
    renderMatches();
    updateProgress();
  }

  function startCountdown() {
    function tick() {
      var diff = new Date(program.closeAt).getTime() - Date.now();
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

  // ------------------------------------------------------------------
  // Selector de grupo (no bloquea la vista del constructor)
  // ------------------------------------------------------------------
  function renderGroupPickerLoggedOut() {
    var actions = document.querySelector('[data-group-picker-actions]');
    var select = document.querySelector('[data-group-select]');
    select.innerHTML = '<option value="">Inicia sesión para elegir tu grupo</option>';
    select.disabled = true;
    actions.innerHTML = '<a class="btn btn-outline" href="../login.html?redirect=' + encodeURIComponent(RouterUtils.currentPageId() + location.search) + '">Iniciar sesión</a>';
    document.querySelector('[data-group-hint]').textContent = 'Arma tus 12 pronósticos libremente; para guardarlos necesitas iniciar sesión y elegir un grupo.';
  }

  function renderGroupPickerNoGroups() {
    var actions = document.querySelector('[data-group-picker-actions]');
    var select = document.querySelector('[data-group-select]');
    select.innerHTML = '<option value="">Aún no tienes grupos</option>';
    select.disabled = true;
    actions.innerHTML = '<a class="btn btn-outline" href="../grupos/unirse.html">Unirme con código</a><a class="btn btn-primary" href="../grupos/crear.html">Crear grupo</a>';
    document.querySelector('[data-group-hint]').textContent = 'Crea un grupo privado o únete con un código para registrar tu jugada.';
  }

  async function renderGroupPickerWithGroups(groups) {
    var select = document.querySelector('[data-group-select]');
    var actions = document.querySelector('[data-group-picker-actions]');
    actions.innerHTML = '<a class="btn btn-outline" href="../grupos/crear.html">Crear otro grupo</a>';
    select.disabled = false;
    select.innerHTML = '<option value="">Selecciona un grupo…</option>' + groups.map(function (g) {
      return '<option value="' + g.id + '">' + g.name + ' · ' + Formatters.prizeModeLabel(g.prizeMode) + '</option>';
    }).join('');
    document.querySelector('[data-group-hint]').textContent = 'Cada ticket se suma al pozo del grupo que elijas aquí.';

    var preselect = groupId || (groups.length === 1 ? groups[0].id : '');
    if (preselect && groups.some(function (g) { return g.id === preselect; })) {
      select.value = preselect;
      await selectGroup(preselect);
    }

    select.addEventListener('change', function () { selectGroup(select.value); });
  }

  async function selectGroup(newGroupId) {
    groupId = newGroupId || null;
    if (!groupId) {
      group = null;
      document.querySelector('[data-pool-label]').textContent = '—';
      document.querySelector('[data-mode-label]').textContent = '—';
      document.querySelector('[data-mode-desc]').textContent = '';
      renderCart();
      return;
    }
    var groupRes = await Api.getGroup(groupId);
    if (!groupRes.ok) { UI.toast(groupRes.error.message, 'error'); groupId = null; return; }
    group = groupRes.data.group;

    document.querySelector('[data-mode-label]').textContent = Formatters.prizeModeLabel(group.prizeMode);
    document.querySelector('[data-mode-desc]').textContent = MODE_DESCRIPTIONS[group.prizeMode] || '';

    var poolRes = await Api.getGroupPool(groupId, program.id);
    if (poolRes.ok) {
      var poolLabel = group.prizeMode === 'HIGHEST_SCORE' ? Formatters.money(poolRes.data.pool.weeklyPoolCents) : Formatters.money(poolRes.data.progressivePoolCents);
      document.querySelector('[data-pool-label]').textContent = poolLabel;
    }
    renderCart();
  }

  async function setupGroupPicker() {
    if (!currentUser) { renderGroupPickerLoggedOut(); return; }
    var groupsRes = await Api.getMyGroups();
    var groups = groupsRes.ok ? groupsRes.data.groups : [];
    if (!groups.length) { renderGroupPickerNoGroups(); return; }
    await renderGroupPickerWithGroups(groups);
  }

  async function requireGroupOrPrompt() {
    if (groupId) return true;
    if (!currentUser) {
      UI.toast('Inicia sesión para elegir tu grupo y guardar tu jugada.', 'info');
    } else {
      UI.toast('Selecciona un grupo antes de agregar la jugada al carrito.', 'error');
    }
    document.querySelector('[data-group-select]').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  async function confirmPurchase() {
    if (!(await requireGroupOrPrompt())) return;
    var cart = PremiumGolService.getCart(groupId, program.id);
    var totals = PremiumGolService.cartTotals(cart, program);
    if (!totals.isComplete) { UI.toast('Hay jugadas incompletas en el carrito.', 'error'); return; }

    var confirmed = await UI.confirmModal({
      title: 'Confirmar registro de jugadas',
      body: 'Vas a registrar ' + totals.count + ' ticket(s) por un total de ' + Formatters.money(totals.subtotalCents) + '. Esta acción descuenta tu saldo demo y no se puede deshacer.',
      confirmText: 'Confirmar y registrar'
    });
    if (!confirmed) return;

    document.querySelector('[data-confirm-btn]').disabled = true;
    document.querySelector('[data-mobile-confirm]').disabled = true;
    var res = await PremiumGolService.checkout(groupId, program.id);
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

    var requestedProgramId = RouterUtils.getQueryParam('programId');
    groupId = RouterUtils.getQueryParam('groupId');

    var programRes = requestedProgramId ? await Api.getProgram(requestedProgramId) : await Api.getOpenProgram();
    if (!programRes.ok) {
      document.querySelector('[data-loading]').innerHTML = '<div class="empty-state"><span class="pill">Sin programa</span><p class="muted">No hay un programa de PremiumGol abierto en este momento.</p></div>';
      return;
    }
    program = programRes.data.program;

    document.querySelector('[data-loading]').hidden = true;
    document.querySelector('[data-content]').hidden = false;
    document.querySelector('[data-program-name]').textContent = program.name;
    document.querySelector('[data-ticket-price]').textContent = Formatters.money(program.ticketPriceCents);

    renderMatches();
    updateProgress();
    startCountdown();
    await setupGroupPicker();
    await renderCart();

    document.querySelector('[data-random-btn]').addEventListener('click', function () { currentPicks = PremiumGolService.randomPicks(program); renderMatches(); updateProgress(); });
    document.querySelector('[data-clear-btn]').addEventListener('click', function () { currentPicks = {}; renderMatches(); updateProgress(); });

    document.querySelector('[data-add-cart-btn]').addEventListener('click', async function () {
      if (Object.keys(currentPicks).length < 12) { UI.toast('Completa los 12 pronósticos antes de agregar la jugada.', 'error'); return; }
      if (!(await requireGroupOrPrompt())) return;
      if (editingLocalId) { PremiumGolService.updateInCart(groupId, program.id, editingLocalId, currentPicks); UI.toast('Jugada actualizada.', 'success'); }
      else { PremiumGolService.addToCart(groupId, program.id, currentPicks); UI.toast('Jugada agregada al carrito.', 'success'); }
      resetBuilder();
      renderCart();
    });

    document.querySelector('[data-confirm-btn]').addEventListener('click', confirmPurchase);
    document.querySelector('[data-mobile-confirm]').addEventListener('click', confirmPurchase);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
