/* PremiumLott — Motor de liquidación
 * PremiumGol: cálculo de aciertos y distribución de un pozo único global por
 * programa (ya no por grupo). PremiumBall: liquidación de las 3 modalidades
 * de premio (premio mayor, Sí o Sí, Bolillapa) de un sorteo de números.
 * Funciones puras sobre el estado; settleProgram/settleBallDraw son las
 * únicas que persisten cambios.
 */
(function (global) {
  function computeHits(picks, matches, voidPolicy) {
    var hits = 0;
    var complete = true;
    var pendingMatchIds = [];
    matches.forEach(function (m) {
      if (m.result == null) { complete = false; pendingMatchIds.push(m.id); return; }
      if (m.result === 'VOID') {
        if (voidPolicy !== 'VOID_EXCLUDED') hits++;
      } else if (picks[m.id] === m.result) {
        hits++;
      }
    });
    return { hits: hits, complete: complete, pendingMatchIds: pendingMatchIds };
  }

  function distributeEven(poolCents, ticketList) {
    var n = ticketList.length;
    if (n === 0 || poolCents <= 0) return [];
    var base = Math.floor(poolCents / n);
    var remainder = poolCents - base * n;
    var sorted = ticketList.slice().sort(function (a, b) { return a.code < b.code ? -1 : (a.code > b.code ? 1 : 0); });
    return sorted.map(function (t, idx) {
      var prize = base + (idx < remainder ? 1 : 0);
      return { ticketId: t.id, userId: t.userId, hits: t.hits, prizeCents: prize, code: t.code };
    });
  }

  // ------------------------------------------------------------------
  // PremiumGol — pozo único global por programa
  // ------------------------------------------------------------------
  function computeProgramSettlement(state, programId) {
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return { ready: false, reason: 'PROGRAM_NOT_FOUND' };
    var matches = state.matches.filter(function (m) { return m.programId === programId; });
    var tickets = state.tickets.filter(function (t) { return t.programId === programId && t.status === 'ACTIVE'; });

    var working = tickets.map(function (t) {
      var r = computeHits(t.picks, matches, program.voidPolicy);
      return { id: t.id, code: t.code, userId: t.userId, hits: r.hits, complete: r.complete, pendingMatchIds: r.pendingMatchIds };
    });

    var anyIncomplete = working.some(function (t) { return !t.complete; });
    var maxHits = working.reduce(function (max, t) { return Math.max(max, t.hits); }, -1);
    var weeklyWinnerTickets = working.filter(function (t) { return t.hits === maxHits; });

    var result = {
      ready: !anyIncomplete, program: program, tickets: working, ticketCount: working.length, maxHits: maxHits,
      weeklyPoolCents: 0, weeklyWinners: [],
      progressiveCarryInCents: program.progressiveCarryInCents || 0, progressiveContributionCents: 0,
      progressivePoolCents: 0, progressiveWinners: [], progressiveCarryOutCents: 0
    };

    if (program.prizeMode === 'HIGHEST_SCORE') {
      result.weeklyPoolCents = program.prizePoolCents;
      result.weeklyWinners = distributeEven(program.prizePoolCents, weeklyWinnerTickets);
    } else if (program.prizeMode === 'PERFECT_12') {
      var total = result.progressiveCarryInCents + program.prizePoolCents;
      var perfectTickets = working.filter(function (t) { return t.hits === 12; });
      result.progressiveContributionCents = program.prizePoolCents;
      result.progressivePoolCents = total;
      if (perfectTickets.length > 0) { result.progressiveWinners = distributeEven(total, perfectTickets); result.progressiveCarryOutCents = 0; }
      else { result.progressiveCarryOutCents = total; }
    } else if (program.prizeMode === 'MIXED') {
      var weekly = Math.round(program.prizePoolCents / 2);
      var progressiveContribution = program.prizePoolCents - weekly;
      result.weeklyPoolCents = weekly;
      result.weeklyWinners = distributeEven(weekly, weeklyWinnerTickets);
      var total2 = result.progressiveCarryInCents + progressiveContribution;
      var perfectTickets2 = working.filter(function (t) { return t.hits === 12; });
      result.progressiveContributionCents = progressiveContribution;
      result.progressivePoolCents = total2;
      if (perfectTickets2.length > 0) { result.progressiveWinners = distributeEven(total2, perfectTickets2); result.progressiveCarryOutCents = 0; }
      else { result.progressiveCarryOutCents = total2; }
    }

    return result;
  }

  function settleProgram(state, programId, opts) {
    opts = opts || {};
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return { ok: false, error: { code: 'PROGRAM_NOT_FOUND', message: 'El programa no existe.' } };
    if (program.settledAt) return { ok: false, error: { code: 'PROGRAM_ALREADY_SETTLED', message: 'El programa ya fue liquidado.' } };

    var compute = computeProgramSettlement(state, programId);
    if (!compute.ready) return { ok: false, error: { code: 'RESULTS_INCOMPLETE', message: 'Faltan resultados por registrar antes de liquidar.' } };

    var settlementId = Store.uuid();
    var now = Store.nowIso();
    var totalDistributed = 0;

    compute.weeklyWinners.forEach(function (w) { applyPayout(state, settlementId, programId, w, 'WEEKLY', now); totalDistributed += w.prizeCents; });
    compute.progressiveWinners.forEach(function (w) { applyPayout(state, settlementId, programId, w, 'PROGRESSIVE', now); totalDistributed += w.prizeCents; });

    var hitsByTicket = {};
    compute.tickets.forEach(function (t) { hitsByTicket[t.id] = t.hits; });
    state.tickets.forEach(function (t) {
      if (t.programId !== programId || t.status !== 'ACTIVE') return;
      t.hits = hitsByTicket[t.id] != null ? hitsByTicket[t.id] : t.hits;
      t.settledAt = now;
    });

    var settlement = {
      id: settlementId, programId: programId, idempotencyKey: opts.idempotencyKey || Store.uuid(),
      settledBy: opts.actorId || null, settledAt: now, createdAt: now,
      prizeMode: program.prizeMode, weeklyPoolCents: compute.weeklyPoolCents, weeklyWinners: compute.weeklyWinners,
      progressiveCarryInCents: compute.progressiveCarryInCents, progressiveContributionCents: compute.progressiveContributionCents,
      progressivePoolCents: compute.progressivePoolCents, progressiveWinners: compute.progressiveWinners,
      progressiveCarryOutCents: compute.progressiveCarryOutCents, totalPrizeCentsDistributed: totalDistributed
    };
    state.settlements.push(settlement);

    program.status = 'settled';
    program.settledAt = now;
    program.settlementIdempotencyKey = settlement.idempotencyKey;
    state.premiumgolCarryCents = compute.progressiveCarryOutCents;

    Store.pushAudit(state, { actorId: opts.actorId, actorRole: opts.actorRole || 'admin', action: 'PROGRAM_SETTLED', entityType: 'program', entityId: programId, metadata: { totalDistributed: totalDistributed } });

    return { ok: true, settlement: settlement };
  }

  function applyPayout(state, settlementId, programId, winner, poolType, now) {
    var ticket = state.tickets.find(function (t) { return t.id === winner.ticketId; });
    if (!ticket) return;
    var payout = {
      id: Store.uuid(), settlementId: settlementId, programId: programId, ticketId: ticket.id,
      userId: winner.userId, poolType: poolType, prizeCents: winner.prizeCents, createdAt: now
    };
    state.payouts.push(payout);
    ticket.isWinner = true;
    ticket.prizeCents = (ticket.prizeCents || 0) + winner.prizeCents;
    Store.ledgerEntry(state, winner.userId, 'PRIZE_CREDIT', winner.prizeCents, {
      referenceType: 'ticket', referenceId: ticket.id,
      description: 'Premio ' + (poolType === 'WEEKLY' ? 'semanal' : 'progresivo 12/12') + ' · ticket ' + ticket.code
    });
  }

  // ------------------------------------------------------------------
  // PremiumBall — cartilla de números, 3 modalidades de premio
  // ------------------------------------------------------------------
  function intersectionCount(a, b) {
    var setB = {};
    b.forEach(function (n) { setB[n] = true; });
    return a.reduce(function (count, n) { return count + (setB[n] ? 1 : 0); }, 0);
  }

  function isSubsetOf(subset, superset) {
    var setSuper = {};
    superset.forEach(function (n) { setSuper[n] = true; });
    return subset.every(function (n) { return setSuper[n]; });
  }

  function computeBallDrawSettlement(state, drawId) {
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return { ready: false, reason: 'DRAW_NOT_FOUND' };
    if (!draw.drawnNumbers || draw.drawnNumbers.length !== draw.picksCount || draw.bolillapaNumber == null) {
      return { ready: false, reason: 'RESULTS_INCOMPLETE', draw: draw };
    }
    var tickets = state.ballTickets.filter(function (t) { return t.drawId === drawId && t.status === 'ACTIVE'; });

    var working = tickets.map(function (t) {
      var hits = intersectionCount(t.numbers, draw.drawnNumbers);
      return { id: t.id, code: t.code, userId: t.userId, numbers: t.numbers, bolillapaNumber: t.bolillapaNumber, hits: hits };
    });

    var mainWinnerTickets = working.filter(function (t) { return t.hits === draw.picksCount; });

    var cumulative = draw.drawnNumbers.concat(draw.siOSiExtraNumbers || []);
    var siOSiWinnerTickets = mainWinnerTickets.length === 0
      ? working.filter(function (t) { return isSubsetOf(t.numbers, cumulative); })
      : [];

    var bolillapaWinnerTickets = working.filter(function (t) {
      return t.hits === draw.picksCount - 1 && t.bolillapaNumber === draw.bolillapaNumber;
    });

    return {
      ready: true, draw: draw, tickets: working,
      mainWinners: distributeEven(draw.mainPrizeCents, mainWinnerTickets),
      siOSiWinners: distributeEven(draw.siOSiPrizeCents, siOSiWinnerTickets),
      bolillapaWinners: distributeEven(draw.bolillapaPrizeCents, bolillapaWinnerTickets)
    };
  }

  function settleBallDraw(state, drawId, opts) {
    opts = opts || {};
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return { ok: false, error: { code: 'DRAW_NOT_FOUND', message: 'El sorteo no existe.' } };
    if (draw.settledAt) return { ok: false, error: { code: 'DRAW_ALREADY_SETTLED', message: 'El sorteo ya fue liquidado.' } };

    var compute = computeBallDrawSettlement(state, drawId);
    if (!compute.ready) return { ok: false, error: { code: 'RESULTS_INCOMPLETE', message: 'Ingresa las bolillas ganadoras y la Bolillapa antes de liquidar.' } };

    var settlementId = Store.uuid();
    var now = Store.nowIso();
    var totalDistributed = 0;

    function applyBallPayout(winner, prizeType) {
      var ticket = state.ballTickets.find(function (t) { return t.id === winner.ticketId; });
      if (!ticket) return;
      var payout = { id: Store.uuid(), settlementId: settlementId, drawId: drawId, ticketId: ticket.id, userId: winner.userId, prizeType: prizeType, prizeCents: winner.prizeCents, createdAt: now };
      state.ballPayouts.push(payout);
      if (prizeType === 'MAIN') ticket.isMainWinner = true;
      if (prizeType === 'SI_O_SI') ticket.isSiOSiWinner = true;
      if (prizeType === 'BOLILLAPA') ticket.isBolillapaWinner = true;
      ticket.prizeCents = (ticket.prizeCents || 0) + winner.prizeCents;
      Store.ledgerEntry(state, winner.userId, 'PRIZE_CREDIT', winner.prizeCents, {
        referenceType: 'ballTicket', referenceId: ticket.id,
        description: 'Premio ' + (prizeType === 'MAIN' ? 'mayor' : prizeType === 'SI_O_SI' ? 'Sí o Sí' : 'Bolillapa') + ' · ticket ' + ticket.code
      });
      totalDistributed += winner.prizeCents;
    }

    compute.mainWinners.forEach(function (w) { applyBallPayout(w, 'MAIN'); });
    compute.siOSiWinners.forEach(function (w) { applyBallPayout(w, 'SI_O_SI'); });
    compute.bolillapaWinners.forEach(function (w) { applyBallPayout(w, 'BOLILLAPA'); });

    var hitsByTicket = {};
    compute.tickets.forEach(function (t) { hitsByTicket[t.id] = t.hits; });
    state.ballTickets.forEach(function (t) {
      if (t.drawId !== drawId || t.status !== 'ACTIVE') return;
      t.hits = hitsByTicket[t.id] != null ? hitsByTicket[t.id] : t.hits;
      t.settledAt = now;
    });

    var settlement = {
      id: settlementId, drawId: drawId, idempotencyKey: opts.idempotencyKey || Store.uuid(), settledBy: opts.actorId || null,
      settledAt: now, createdAt: now, mainWinners: compute.mainWinners, siOSiWinners: compute.siOSiWinners,
      bolillapaWinners: compute.bolillapaWinners, totalPrizeCentsDistributed: totalDistributed
    };
    state.ballSettlements.push(settlement);

    draw.status = 'settled';
    draw.settledAt = now;
    draw.settlementIdempotencyKey = settlement.idempotencyKey;

    Store.pushAudit(state, { actorId: opts.actorId, actorRole: opts.actorRole || 'admin', action: 'BALL_DRAW_SETTLED', entityType: 'ballDraw', entityId: drawId, metadata: { totalDistributed: totalDistributed } });

    return { ok: true, settlement: settlement };
  }

  global.Settlement = {
    computeHits: computeHits,
    distributeEven: distributeEven,
    computeProgramSettlement: computeProgramSettlement,
    previewSettlement: computeProgramSettlement,
    settleProgram: settleProgram,
    computeBallDrawSettlement: computeBallDrawSettlement,
    previewBallSettlement: computeBallDrawSettlement,
    settleBallDraw: settleBallDraw
  };
})(window);
