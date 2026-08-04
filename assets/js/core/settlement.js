/* PremiumLott — Motor de liquidación de PremiumGol
 * Cálculo de aciertos y distribución de pozos para las 3 modalidades.
 * Funciones puras sobre el estado; settleProgram es la única que persiste cambios.
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

  function computeProgramSettlement(state, programId) {
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return { ready: false, reason: 'PROGRAM_NOT_FOUND' };
    var matches = state.matches.filter(function (m) { return m.programId === programId; });
    var tickets = state.tickets.filter(function (t) { return t.programId === programId && t.status === 'ACTIVE'; });

    var working = tickets.map(function (t) {
      var r = computeHits(t.picks, matches, program.voidPolicy);
      return { id: t.id, code: t.code, userId: t.userId, groupId: t.groupId, hits: r.hits, complete: r.complete, pendingMatchIds: r.pendingMatchIds };
    });

    var anyIncomplete = working.some(function (t) { return !t.complete; });
    var groupIds = Array.from(new Set(working.map(function (t) { return t.groupId; })));

    var groupsResult = groupIds.map(function (groupId) {
      var group = state.groups.find(function (g) { return g.id === groupId; });
      var groupTickets = working.filter(function (t) { return t.groupId === groupId; });
      var pool = state.groupPools.find(function (p) { return p.groupId === groupId && p.programId === programId; }) ||
        { ticketCount: 0, contributionTotalCents: 0, weeklyPoolCents: 0, progressiveContributionCents: 0 };
      var maxHits = groupTickets.reduce(function (max, t) { return Math.max(max, t.hits); }, -1);
      var weeklyWinnerTickets = groupTickets.filter(function (t) { return t.hits === maxHits; });

      var result = {
        groupId: groupId, groupName: group ? group.name : '(grupo eliminado)', mode: group ? group.prizeMode : null,
        ticketCount: groupTickets.length, maxHits: maxHits,
        weeklyPoolCents: 0, weeklyWinners: [],
        progressiveCarryInCents: 0, progressiveContributionCents: 0, progressivePoolCents: 0,
        progressiveWinners: [], progressiveCarryOutCents: 0
      };

      if (group && group.prizeMode === 'HIGHEST_SCORE') {
        result.weeklyPoolCents = pool.weeklyPoolCents;
        result.weeklyWinners = distributeEven(pool.weeklyPoolCents, weeklyWinnerTickets);
      } else if (group && group.prizeMode === 'PERFECT_12') {
        var carryIn = group.progressivePoolCents - pool.progressiveContributionCents;
        var total = group.progressivePoolCents;
        var perfectTickets = groupTickets.filter(function (t) { return t.hits === 12; });
        result.progressiveCarryInCents = carryIn;
        result.progressiveContributionCents = pool.progressiveContributionCents;
        result.progressivePoolCents = total;
        if (perfectTickets.length > 0) {
          result.progressiveWinners = distributeEven(total, perfectTickets);
          result.progressiveCarryOutCents = 0;
        } else {
          result.progressiveCarryOutCents = total;
        }
      } else if (group && group.prizeMode === 'MIXED') {
        result.weeklyPoolCents = pool.weeklyPoolCents;
        result.weeklyWinners = distributeEven(pool.weeklyPoolCents, weeklyWinnerTickets);
        var carryIn2 = group.progressivePoolCents - pool.progressiveContributionCents;
        var total2 = group.progressivePoolCents;
        var perfectTickets2 = groupTickets.filter(function (t) { return t.hits === 12; });
        result.progressiveCarryInCents = carryIn2;
        result.progressiveContributionCents = pool.progressiveContributionCents;
        result.progressivePoolCents = total2;
        if (perfectTickets2.length > 0) {
          result.progressiveWinners = distributeEven(total2, perfectTickets2);
          result.progressiveCarryOutCents = 0;
        } else {
          result.progressiveCarryOutCents = total2;
        }
      }
      return result;
    });

    return { ready: !anyIncomplete, program: program, tickets: working, groups: groupsResult };
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

    compute.groups.forEach(function (g) {
      var group = state.groups.find(function (x) { return x.id === g.groupId; });
      g.weeklyWinners.forEach(function (w) {
        applyPayout(state, settlementId, programId, g.groupId, w, 'WEEKLY', now);
        totalDistributed += w.prizeCents;
      });
      g.progressiveWinners.forEach(function (w) {
        applyPayout(state, settlementId, programId, g.groupId, w, 'PROGRESSIVE', now);
        totalDistributed += w.prizeCents;
      });
      if (group) group.progressivePoolCents = g.progressiveCarryOutCents;
    });

    var hitsByTicket = {};
    compute.tickets.forEach(function (t) { hitsByTicket[t.id] = t.hits; });
    state.tickets.forEach(function (t) {
      if (t.programId !== programId || t.status !== 'ACTIVE') return;
      t.hits = hitsByTicket[t.id] != null ? hitsByTicket[t.id] : t.hits;
      t.settledAt = now;
      if (!state.payouts.some(function (p) { return p.ticketId === t.id; })) {
        t.isWinner = false; t.prizeCents = 0;
      }
    });

    var settlement = {
      id: settlementId, programId: programId, idempotencyKey: opts.idempotencyKey || Store.uuid(),
      settledBy: opts.actorId || null, settledAt: now, createdAt: now,
      groups: compute.groups, totalPrizeCentsDistributed: totalDistributed
    };
    state.settlements.push(settlement);

    program.status = 'settled';
    program.settledAt = now;
    program.settlementIdempotencyKey = settlement.idempotencyKey;

    Store.pushAudit(state, { actorId: opts.actorId, actorRole: opts.actorRole || 'admin', action: 'PROGRAM_SETTLED', entityType: 'program', entityId: programId, metadata: { totalDistributed: totalDistributed } });

    return { ok: true, settlement: settlement };
  }

  function applyPayout(state, settlementId, programId, groupId, winner, poolType, now) {
    var ticket = state.tickets.find(function (t) { return t.id === winner.ticketId; });
    if (!ticket) return;
    var payout = {
      id: Store.uuid(), settlementId: settlementId, programId: programId, groupId: groupId, ticketId: ticket.id,
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

  global.Settlement = {
    computeHits: computeHits,
    distributeEven: distributeEven,
    computeProgramSettlement: computeProgramSettlement,
    previewSettlement: computeProgramSettlement,
    settleProgram: settleProgram
  };
})(window);
