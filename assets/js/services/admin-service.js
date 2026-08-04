/* PremiumLott — AdminService: helpers de formato y liquidación idempotente para el panel */
(function (global) {
  var inFlightSettlements = {};

  function formatSettlementPreview(preview) {
    return {
      ready: preview.ready,
      groups: (preview.groups || []).map(function (g) {
        return Object.assign({}, g, {
          weeklyPoolLabel: Formatters.money(g.weeklyPoolCents),
          progressivePoolLabel: Formatters.money(g.progressivePoolCents),
          progressiveCarryInLabel: Formatters.money(g.progressiveCarryInCents),
          modeLabel: Formatters.prizeModeLabel(g.mode),
          weeklyWinners: g.weeklyWinners.map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.money(w.prizeCents) }); }),
          progressiveWinners: g.progressiveWinners.map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.money(w.prizeCents) }); })
        });
      })
    };
  }

  function settleProgramOnce(programId) {
    if (inFlightSettlements[programId]) return inFlightSettlements[programId];
    var idempotencyKey = 'settle-' + programId;
    var promise = Api.settleProgram(programId, idempotencyKey).then(function (res) {
      delete inFlightSettlements[programId];
      return res;
    });
    inFlightSettlements[programId] = promise;
    return promise;
  }

  global.AdminService = {
    formatSettlementPreview: formatSettlementPreview,
    settleProgramOnce: settleProgramOnce
  };
})(window);
