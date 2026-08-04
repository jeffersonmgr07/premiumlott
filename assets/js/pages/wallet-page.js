(function () {
  async function renderLedger() {
    var body = document.querySelector('[data-ledger-body]');
    body.innerHTML = UI.skeletonRows(4, 5);
    var rows = await WalletService.listLedgerFormatted(100);
    if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="muted">Aún no tienes movimientos.</td></tr>'; return; }
    body.innerHTML = rows.map(function (r) {
      return '<tr><td>' + r.dateLabel + '</td><td><span class="status ' + (r.isCredit ? 'ok' : 'pending') + '">' + r.typeLabel + '</span></td><td>' + r.description + '</td><td><strong>' + r.amountLabel + '</strong></td><td>' + r.balanceAfterLabel + '</td></tr>';
    }).join('');
  }

  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    await WalletService.refreshHeaderBalance();
    await renderLedger();

    var selectedAmount = 1000;
    var amountButtons = document.querySelectorAll('[data-amount-options] button');
    amountButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        amountButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedAmount = Number(btn.dataset.amount);
      });
    });
    amountButtons[0].classList.add('active');

    document.querySelector('[data-topup-form]').addEventListener('submit', async function (e) {
      e.preventDefault();
      await WalletService.topUp(selectedAmount);
      await WalletService.refreshHeaderBalance();
      await renderLedger();
    });

    document.querySelector('[data-reset-btn]').addEventListener('click', async function () {
      var res = await WalletService.resetAccount();
      if (res && res.ok) {
        await WalletService.refreshHeaderBalance();
        await renderLedger();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
