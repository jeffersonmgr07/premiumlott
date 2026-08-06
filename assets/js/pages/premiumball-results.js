(function () {
  async function loadDraw(drawId) {
    var res = await Api.getBallDraw(drawId);
    if (!res.ok) return;
    var draw = res.data.draw;
    document.querySelector('[data-status-label]').textContent = Formatters.programStatusLabel(draw.status);
    document.querySelector('[data-close-label]').textContent = Formatters.dateTimeLima(draw.closeAt);
    document.querySelector('[data-settled-label]').textContent = draw.settledAt ? Formatters.dateTimeLima(draw.settledAt) : 'Pendiente';

    var hasResults = draw.drawnNumbers && draw.drawnNumbers.length === draw.picksCount;
    document.querySelector('[data-draw-numbers-card]').hidden = !hasResults;
    document.querySelector('[data-empty-numbers-card]').hidden = hasResults;
    if (hasResults) {
      document.querySelector('[data-main-numbers]').innerHTML = draw.drawnNumbers.map(function (n) { return '<span class="chip gold">' + n + '</span>'; }).join('');
      document.querySelector('[data-bolillapa-number]').innerHTML = '<span class="chip outline">' + draw.bolillapaNumber + '</span>';
      var extra = draw.siOSiExtraNumbers || [];
      document.querySelector('[data-siosi-block]').hidden = extra.length === 0;
      document.querySelector('[data-siosi-numbers]').innerHTML = extra.map(function (n) { return '<span class="chip">' + n + '</span>'; }).join('');
    }

    var lbRes = await Api.getBallLeaderboard(drawId);
    var body = document.querySelector('[data-leaderboard-body]');
    if (!lbRes.ok || !lbRes.data.rows.length) {
      body.innerHTML = '<tr><td colspan="5" class="muted">Aún no hay tickets registrados en este sorteo.</td></tr>';
      return;
    }
    body.innerHTML = lbRes.data.rows.map(function (row) {
      var hitsLabel = row.hits == null ? '—' : (row.hits + '/6');
      var prizeLabel = row.isWinner ? '<strong style="color:var(--yellow)">' + Formatters.usd(row.prizeCents) + ' · ' + row.prizeType + '</strong>' : '—';
      return '<tr class="leaderboard-row"><td><span class="leaderboard-position ' + (row.position <= 3 ? 'top' : '') + '">' + row.position + '</span></td>' +
        '<td>' + row.userLabel + '</td><td>' + row.code + '</td><td>' + hitsLabel + '</td><td>' + prizeLabel + '</td></tr>';
    }).join('');
  }

  async function init() {
    var res = await Api.listBallDraws();
    var select = document.querySelector('[data-draw-select]');
    if (!res.ok || !res.data.draws.length) {
      document.querySelector('[data-empty-numbers-card]').querySelector('p').textContent = 'Todavía no hay sorteos de PremiumBall.';
      return;
    }
    select.innerHTML = res.data.draws.map(function (d) { return '<option value="' + d.id + '">' + d.name + ' (' + Formatters.programStatusLabel(d.status) + ')</option>'; }).join('');
    var requested = RouterUtils.getQueryParam('drawId');
    if (requested) select.value = requested;
    select.addEventListener('change', function () { loadDraw(select.value); });
    loadDraw(select.value);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
