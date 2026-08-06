/* PremiumLott — AdminService: helpers de formato y liquidación idempotente para el panel */
(function (global) {
  var inFlightSettlements = {};
  var inFlightBallSettlements = {};

  function formatSettlementPreview(preview) {
    return Object.assign({}, preview, {
      weeklyPoolLabel: Formatters.usd(preview.weeklyPoolCents),
      progressivePoolLabel: Formatters.usd(preview.progressivePoolCents),
      progressiveCarryInLabel: Formatters.usd(preview.progressiveCarryInCents),
      modeLabel: preview.program ? Formatters.prizeModeLabel(preview.program.prizeMode) : '',
      weeklyWinners: (preview.weeklyWinners || []).map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.usd(w.prizeCents) }); }),
      progressiveWinners: (preview.progressiveWinners || []).map(function (w) { return Object.assign({}, w, { prizeLabel: Formatters.usd(w.prizeCents) }); })
    });
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

  function settleBallDrawOnce(drawId) {
    if (inFlightBallSettlements[drawId]) return inFlightBallSettlements[drawId];
    var idempotencyKey = 'settle-ball-' + drawId;
    var promise = Api.settleBallDraw(drawId, idempotencyKey).then(function (res) {
      delete inFlightBallSettlements[drawId];
      return res;
    });
    inFlightBallSettlements[drawId] = promise;
    return promise;
  }

  global.AdminService = {
    formatSettlementPreview: formatSettlementPreview,
    settleProgramOnce: settleProgramOnce,
    settleBallDrawOnce: settleBallDrawOnce
  };
})(window);
