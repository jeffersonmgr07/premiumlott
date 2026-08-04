/* PremiumLott — app.js
 * Arranque general de página + capa de compatibilidad PL para Premium World Cup
 * (assets/js/mundial.js), que sigue funcionando exactamente igual que antes
 * pero ahora respaldado por el Store v3 en lugar del antiguo premiumlott_state_v2.
 */
(function (global) {
  function effectiveUserId() {
    var user = MockApi.getCurrentUserSync();
    return user ? user.id : Store.GUEST_ID;
  }

  var PL = {
    load: function () {
      var state = Store.get();
      var userId = effectiveUserId();
      var user = state.users.find(function (u) { return u.id === userId; });
      var wallet = Store.ensureWallet(state, userId);
      return {
        user: { name: user ? (user.firstName + ' ' + user.lastName).trim() : 'Invitado Premium', email: user ? user.email : '' },
        wallet: { balance: wallet.balanceCents / 100, currency: 'S/' },
        session: { active: !!user, at: null },
        tickets: state.legacyTickets.filter(function (t) { return t.userId === userId; }),
        movements: state.legacyMovements.filter(function (m) { return m.userId === userId; })
      };
    },
    isLoggedIn: function () { return !!MockApi.getCurrentUserSync(); },
    requireLogin: function (redirect) {
      if (this.isLoggedIn()) return true;
      var next = redirect || RouterUtils.currentPageId();
      UI.alertModal('Inicia sesión', 'Para registrar una jugada debes iniciar sesión o crear una cuenta.').then(function () {
        RouterUtils.redirectWithReturn('login.html', next);
      });
      return false;
    },
    canPay: function (cost) {
      var state = Store.get();
      var wallet = Store.ensureWallet(state, effectiveUserId());
      return wallet.balanceCents >= Math.round(Number(cost || 0) * 100);
    },
    addTicket: function (ticket, cost) {
      var userId = effectiveUserId();
      var priceCents = Math.round(Number(cost || ticket.price || 0) * 100);
      var state = Store.get();
      var wallet = Store.ensureWallet(state, userId);
      if (priceCents > 0 && wallet.balanceCents < priceCents) return { ok: false, reason: 'Saldo insuficiente', state: state };

      var normalizedTicket = {
        id: Store.uuid(), userId: userId, code: ticket.code || Store.makeCode('PL'), game: ticket.game || 'PremiumLott',
        mode: ticket.mode || 'General', date: ticket.date || PL.today(), amountCents: priceCents, status: ticket.status || 'Registrado',
        prize: ticket.prize || 'Por definir', selections: ticket.selections || null, hash: ticket.hash || Store.demoHash(JSON.stringify(ticket) + Date.now()),
        createdAt: Store.nowIso()
      };

      Store.update(function (state) {
        state.legacyTickets.unshift(normalizedTicket);
        if (priceCents > 0) {
          Store.ledgerEntry(state, userId, 'TICKET_PURCHASE', -priceCents, {
            referenceType: 'legacyTicket', referenceId: normalizedTicket.id,
            description: 'Ticket ' + normalizedTicket.game + (normalizedTicket.mode ? ' · ' + normalizedTicket.mode : '')
          });
        }
      });
      return { ok: true, ticket: normalizedTicket, state: Store.get() };
    },
    addMovement: function (movement) {
      var userId = effectiveUserId();
      return Store.update(function (state) {
        state.legacyMovements.unshift(Object.assign({ id: Store.uuid(), userId: userId, date: PL.today(), createdAt: Store.nowIso() }, movement));
      });
    },
    makeCode: function (prefix) { return Store.makeCode(prefix); },
    money: function (value) { return 'S/ ' + Number(value || 0).toFixed(2); },
    today: function () { return new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }); },
    hash: function (text) { return Store.demoHash(text); }
  };

  function initHeaderState() {
    var state = Store.get();
    var userId = effectiveUserId();
    var user = state.users.find(function (u) { return u.id === userId; });
    var wallet = Store.ensureWallet(state, userId);
    document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = user ? (user.firstName + ' ' + user.lastName).trim() : 'Invitado Premium'; });
    document.querySelectorAll('[data-balance]').forEach(function (el) { el.textContent = Formatters.money(wallet.balanceCents); });
    var legacyCount = state.legacyTickets.filter(function (t) { return t.userId === userId; }).length;
    var newCount = state.tickets.filter(function (t) { return t.userId === userId; }).length;
    document.querySelectorAll('[data-ticket-count]').forEach(function (el) { el.textContent = legacyCount + newCount; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Store.get();
    initHeaderState();
  });

  global.PL = PL;
})(window);
