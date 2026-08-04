/* PremiumLott — WalletService: saldo de cabecera, libro mayor y recargas demo */
(function (global) {
  function refreshHeaderBalance() {
    var targets = document.querySelectorAll('[data-balance]');
    if (!targets.length) return Promise.resolve();
    return Api.getWallet().then(function (res) {
      if (!res.ok) return;
      targets.forEach(function (el) { el.textContent = Formatters.money(res.data.wallet.balanceCents); });
    });
  }

  function listLedgerFormatted(limit) {
    return Api.getWalletLedger(limit).then(function (res) {
      if (!res.ok) return [];
      return res.data.entries.map(function (e) {
        return Object.assign({}, e, {
          dateLabel: Formatters.dateTimeLima(e.createdAt), amountLabel: Formatters.moneySigned(e.amountCents),
          typeLabel: Formatters.ledgerTypeLabel(e.type), balanceAfterLabel: Formatters.money(e.balanceAfterCents), isCredit: e.amountCents >= 0
        });
      });
    });
  }

  function topUp(amountCents) {
    return Api.topUpDemoBalance(amountCents).then(function (res) {
      if (res.ok) UI.toast('Recarga demo aplicada: ' + Formatters.money(amountCents), 'success');
      else UI.toast(res.error.message, 'error');
      return res;
    });
  }

  function resetAccount() {
    return UI.confirmModal({
      title: 'Reiniciar cuenta demo',
      body: 'Se restablecerá tu saldo ficticio y se eliminarán tus tickets registrados en este prototipo. Esta acción no afecta datos reales porque todo es de prueba.',
      confirmText: 'Reiniciar cuenta'
    }).then(function (confirmed) {
      if (!confirmed) return null;
      return Api.resetDemoAccount().then(function (res) {
        if (res.ok) { UI.toast('Cuenta demo reiniciada.', 'success'); }
        return res;
      });
    });
  }

  global.WalletService = {
    refreshHeaderBalance: refreshHeaderBalance,
    listLedgerFormatted: listLedgerFormatted,
    topUp: topUp,
    resetAccount: resetAccount
  };
})(window);
