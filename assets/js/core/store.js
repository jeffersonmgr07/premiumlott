/* PremiumLott — Store v3
 * Fuente única de datos en localStorage. Sustituye premiumlott_state_v2.
 * Todo monto se guarda en céntimos (enteros). Formatear solo al mostrar.
 */
(function (global) {
  var KEY = 'premiumlott_state_v3';
  var OLD_KEY_V2 = 'premiumlott_state_v2';
  var OLD_KEY_V1 = 'premiumlott_state_v1';
  var OLD_WORLD_TICKETS_KEY = 'premiumlott_tickets';
  var GUEST_ID = 'guest';
  var DEMO_MODE_NOTICE = 'MODO DE PRUEBA — El saldo, las jugadas y los premios son ficticios. No se procesan depósitos, retiros ni premios reales.';

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowIso() { return new Date().toISOString(); }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  // Hash NO criptográfico solo para el prototipo. La autenticación real y el
  // hashing seguro de contraseñas se implementarán en el backend (Apps Script).
  function demoHash(text) {
    var str = String(text || '');
    var h1 = 0xdeadbeef ^ str.length;
    var h2 = 0x41c6ce57 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0;
    return 'D' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }

  function makeCode(prefix) {
    return prefix + '-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-7) + Math.floor(Math.random() * 90 + 10);
  }

  function shortCode(len) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < (len || 6); i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function appConfig() {
    return {
      demoAdminEmail: 'admin@premiumlott.demo',
      demoAdminPassword: 'PremiumDemo2026!',
      otpDemoMode: true,
      otpLength: 6,
      otpResendCooldownSeconds: 30,
      otpMaxAttempts: 5,
      otpExpiryMinutes: 10,
      loginMaxAttempts: 5,
      loginLockoutMinutes: 15,
      ticketPriceCents: 500,
      groupPoolContributionCents: 400,
      houseFeeCents: 100,
      minGroupCapacity: 2,
      maxGroupCapacity: 50,
      suggestedCapacities: [5, 10, 20, 50],
      timezone: 'America/Lima',
      demoModeNotice: DEMO_MODE_NOTICE
    };
  }

  function defaultState() {
    return {
      version: 3,
      appConfig: appConfig(),
      users: [],
      sessions: [],
      emailVerifications: [],
      passwordResets: [],
      wallets: [],
      walletLedger: [],
      groups: [],
      groupMembers: [],
      groupInvitations: [],
      programs: [],
      matches: [],
      tickets: [],
      ticketPicks: [],
      groupPools: [],
      settlements: [],
      payouts: [],
      auditLog: [],
      legacyTickets: [],
      legacyMovements: []
    };
  }

  // ---------- Auditoría ----------
  function pushAudit(state, entry) {
    state.auditLog.unshift({
      id: uuid(),
      actorId: entry.actorId || null,
      actorRole: entry.actorRole || 'system',
      action: entry.action,
      entityType: entry.entityType || null,
      entityId: entry.entityId || null,
      metadata: entry.metadata || null,
      createdAt: nowIso()
    });
  }

  // ---------- Billetera / libro mayor ----------
  function ensureWallet(state, userId) {
    var wallet = state.wallets.find(function (w) { return w.userId === userId; });
    if (!wallet) {
      // El saldo siempre nace en cero: cualquier saldo inicial se acredita
      // explícitamente vía ledgerEntry para que el libro mayor cuadre siempre.
      wallet = { id: uuid(), userId: userId, balanceCents: 0, currency: 'PEN', createdAt: nowIso() };
      state.wallets.push(wallet);
    }
    return wallet;
  }

  function ledgerEntry(state, userId, type, amountCents, opts) {
    opts = opts || {};
    var wallet = ensureWallet(state, userId);
    var before = wallet.balanceCents;
    var after = before + amountCents;
    wallet.balanceCents = after;
    var entry = {
      id: uuid(),
      walletId: wallet.id,
      userId: userId,
      type: type,
      amountCents: amountCents,
      balanceBeforeCents: before,
      balanceAfterCents: after,
      referenceType: opts.referenceType || null,
      referenceId: opts.referenceId || null,
      description: opts.description || type,
      createdAt: nowIso()
    };
    state.walletLedger.unshift(entry);
    return entry;
  }

  // ---------- Migración v2 -> v3 ----------
  function parseLegacyAmountToCents(amountStr) {
    if (typeof amountStr === 'number') return Math.round(amountStr * 100);
    var num = Number(String(amountStr || '0').replace(/[^0-9.-]/g, ''));
    return Math.round((isNaN(num) ? 0 : num) * 100);
  }

  function migrateFromV2(v2State) {
    var state = defaultState();
    var v2 = v2State && typeof v2State === 'object' ? v2State : {};
    var v2User = v2.user || {};
    var v2Wallet = v2.wallet || {};
    var v2Session = v2.session || {};

    var migratedUserId = null;
    if (v2User.email || v2Session.active) {
      var uid = uuid();
      migratedUserId = uid;
      state.users.push({
        id: uid,
        email: (v2User.email || '').toLowerCase() || ('cliente' + Date.now() + '@premiumlott.demo'),
        firstName: v2User.name || 'Cliente Premium',
        lastName: '',
        dni: v2User.document || '',
        phone: v2User.phone || '',
        birthDate: null,
        country: v2User.country || 'PE',
        passwordHash: demoHash('migrated'),
        role: 'user',
        emailVerified: true,
        marketingConsent: false,
        termsAcceptedAt: nowIso(),
        privacyAcceptedAt: nowIso(),
        ageDeclaredAt: nowIso(),
        authProvider: 'password',
        googleSub: null,
        status: 'active',
        failedLoginCount: 0,
        lockedUntil: null,
        migratedFromV2: true,
        createdAt: nowIso()
      });
      ensureWallet(state, uid);
      var migratedBalanceCents = Math.round(Number(v2Wallet.balance || 0) * 100);
      if (migratedBalanceCents > 0) {
        ledgerEntry(state, uid, 'ADMIN_ADJUSTMENT', migratedBalanceCents, { description: 'Saldo importado desde premiumlott_state_v2' });
      }
      if (v2Session.active) {
        state.sessions.push({ id: uuid(), userId: uid, createdAt: nowIso(), expiresAt: null, active: true });
      }
    }

    (v2.movements || []).forEach(function (m) {
      state.legacyMovements.push({
        id: uuid(),
        userId: migratedUserId,
        date: m.date,
        detail: m.detail,
        amountCents: parseLegacyAmountToCents(m.amount),
        type: m.type === 'credit' ? 'DEMO_TOPUP' : 'TICKET_PURCHASE',
        createdAt: nowIso()
      });
    });

    (v2.tickets || []).forEach(function (t) {
      state.legacyTickets.push({
        id: uuid(),
        userId: migratedUserId,
        code: t.code,
        game: t.game,
        mode: t.mode,
        date: t.date,
        amountCents: parseLegacyAmountToCents(t.amount != null ? t.amount : t.price),
        status: t.status,
        prize: t.prize,
        selections: t.selections || null,
        hash: t.hash || null,
        createdAt: nowIso()
      });
    });

    var oldWorldTickets = [];
    try { oldWorldTickets = JSON.parse(localStorage.getItem(OLD_WORLD_TICKETS_KEY) || '[]'); } catch (e) { oldWorldTickets = []; }
    if (Array.isArray(oldWorldTickets) && oldWorldTickets.length) {
      oldWorldTickets.forEach(function (t) {
        state.legacyTickets.push({
          id: uuid(),
          userId: migratedUserId,
          code: t.code || makeCode('PWC'),
          game: 'Premium World Cup',
          mode: t.mode || 'World Cup',
          date: t.date || null,
          amountCents: parseLegacyAmountToCents(t.price || 0),
          status: t.status === 'Pendiente de pago' ? 'Registrado' : (t.status || 'Registrado'),
          prize: 'Pozo mayor',
          selections: { groups: t.groups, bestThirds: t.bestThirds, winners: t.winners, champion: t.champion },
          hash: null,
          createdAt: nowIso()
        });
      });
    }

    pushAudit(state, { action: 'STATE_MIGRATED_V2_TO_V3', entityType: 'system', metadata: { migratedUserId: migratedUserId } });
    return state;
  }

  // ---------- Datos de demostración ----------
  function seedDemoData(state) {
    var cfg = state.appConfig;

    ensureWallet(state, GUEST_ID);
    ledgerEntry(state, GUEST_ID, 'DEMO_TOPUP', 12500, { description: 'Saldo de bienvenida (demo, invitado)' });

    var admin = {
      id: uuid(), email: cfg.demoAdminEmail, firstName: 'Admin', lastName: 'PremiumLott', dni: '00000000',
      phone: '+51900000000', birthDate: '1990-01-01', country: 'PE', passwordHash: demoHash(cfg.demoAdminPassword),
      role: 'admin', emailVerified: true, marketingConsent: false, termsAcceptedAt: nowIso(), privacyAcceptedAt: nowIso(),
      ageDeclaredAt: nowIso(), authProvider: 'password', googleSub: null, status: 'active', failedLoginCount: 0,
      lockedUntil: null, createdAt: nowIso()
    };
    state.users.push(admin);
    ensureWallet(state, admin.id);

    function demoUser(email, first, last, dni) {
      var u = {
        id: uuid(), email: email, firstName: first, lastName: last, dni: dni, phone: '+5199912340' + Math.floor(Math.random() * 9),
        birthDate: '1995-06-12', country: 'PE', passwordHash: demoHash('Demo2026!'), role: 'user', emailVerified: true,
        marketingConsent: false, termsAcceptedAt: nowIso(), privacyAcceptedAt: nowIso(), ageDeclaredAt: nowIso(),
        authProvider: 'password', googleSub: null, status: 'active', failedLoginCount: 0, lockedUntil: null, createdAt: nowIso()
      };
      state.users.push(u);
      ensureWallet(state, u.id);
      ledgerEntry(state, u.id, 'DEMO_TOPUP', 15000, { description: 'Saldo de bienvenida (demo)' });
      return u;
    }

    var u1 = demoUser('carlos.demo@premiumlott.demo', 'Carlos', 'Rodríguez', '71234561');
    var u2 = demoUser('maria.demo@premiumlott.demo', 'María', 'Fernández', '71234562');
    var u3 = demoUser('jose.demo@premiumlott.demo', 'José', 'Torres', '71234563');
    var u4 = demoUser('lucia.demo@premiumlott.demo', 'Lucía', 'Vargas', '71234564');
    var u5 = demoUser('ana.demo@premiumlott.demo', 'Ana', 'Quispe', '71234565');

    function buildProgram(code, name, status, offsetDaysOpen, offsetDaysClose, resultsPattern) {
      var programId = uuid();
      var openAt = new Date(Date.now() + offsetDaysOpen * 86400000);
      var closeAt = new Date(Date.now() + offsetDaysClose * 86400000);
      var program = {
        id: programId, code: code, name: name, status: status, openAt: openAt.toISOString(), closeAt: closeAt.toISOString(),
        timezone: cfg.timezone, estimatedSettlementAt: new Date(closeAt.getTime() + 3 * 3600000).toISOString(),
        ticketPriceCents: cfg.ticketPriceCents, voidPolicy: 'VOID_COUNTS_AS_HIT', settledAt: null, settlementIdempotencyKey: null,
        createdAt: nowIso(), cancelledAt: null, cancelReason: null
      };
      state.programs.push(program);
      var fixtures = [
        ['Liga 1 Perú', 'Universitario', 'Alianza Lima'], ['Liga 1 Perú', 'Sporting Cristal', 'Melgar'],
        ['LaLiga', 'Real Madrid', 'Barcelona'], ['LaLiga', 'Atlético Madrid', 'Sevilla'],
        ['Premier League', 'Manchester City', 'Liverpool'], ['Premier League', 'Arsenal', 'Chelsea'],
        ['Serie A', 'Inter de Milán', 'Juventus'], ['Serie A', 'AC Milan', 'Napoli'],
        ['Bundesliga', 'Bayern Múnich', 'Borussia Dortmund'], ['Bundesliga', 'RB Leipzig', 'Bayer Leverkusen'],
        ['Ligue 1', 'PSG', 'Marsella'], ['Brasileirão', 'Flamengo', 'Palmeiras']
      ];
      var matchIds = [];
      fixtures.forEach(function (f, idx) {
        var matchId = uuid();
        matchIds.push(matchId);
        var kickoff = new Date(openAt.getTime() + idx * 3 * 3600000);
        var result = resultsPattern ? resultsPattern[idx] : null;
        state.matches.push({
          id: matchId, programId: programId, number: idx + 1, competition: f[0], home: f[1], away: f[2],
          kickoffAt: kickoff.toISOString(), status: result ? 'FINISHED' : 'SCHEDULED', result: result || null
        });
      });
      return { program: program, matchIds: matchIds };
    }

    // Programa abierto (jugable en el demo)
    var openProgram = buildProgram('PG-2026-W' + String(new Date().getWeek ? new Date().getWeek() : 32) + '-A', 'PremiumGol · Programa semanal', 'open', -1, 3, null);

    // Programa liquidado (para mostrar historial, empate y caso 12/12)
    var settledResults = ['L', 'E', 'V', 'L', 'L', 'E', 'V', 'L', 'E', 'V', 'L', 'V'];
    // Se crea en results_pending (no 'settled') para que la liquidación real
    // más abajo sea la que genere el registro de settlement, los payouts y
    // los créditos de premio; si quedara marcado 'settled' de entrada,
    // Settlement.settleProgram lo rechazaría por PROGRAM_ALREADY_SETTLED.
    var settledProgram = buildProgram('PG-2026-W' + (new Date().getWeek ? new Date().getWeek() - 1 : 31) + '-A', 'PremiumGol · Programa anterior', 'results_pending', -10, -7, settledResults);

    function createGroup(name, description, capacity, prizeMode, ownerId) {
      var groupId = uuid();
      var group = {
        id: groupId, name: name, description: description, avatarInitials: name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(),
        capacity: capacity, prizeMode: prizeMode, privacy: 'CODE', code: shortCode(6), inviteLink: null, ownerId: ownerId,
        status: 'ACTIVE', joinLocked: false, modeLockedAt: null, progressivePoolCents: 0, rulesAcceptedVersion: 1, createdAt: nowIso()
      };
      group.inviteLink = 'grupos/unirse.html?code=' + group.code;
      state.groups.push(group);
      state.groupMembers.push({ id: uuid(), groupId: groupId, userId: ownerId, role: 'OWNER', status: 'ACTIVE', joinedAt: nowIso(), removedAt: null });
      return group;
    }

    function addMember(group, userId) {
      state.groupMembers.push({ id: uuid(), groupId: group.id, userId: userId, role: 'MEMBER', status: 'ACTIVE', joinedAt: nowIso(), removedAt: null });
    }

    var groupA = createGroup('Amigos del Barrio', 'Grupo clásico de pronósticos entre amigos.', 10, 'HIGHEST_SCORE', u1.id);
    addMember(groupA, u2.id); addMember(groupA, u3.id);

    var groupB = createGroup('Los Acumuladores', 'Vamos por el pozo progresivo de los 12 aciertos.', 20, 'PERFECT_12', u2.id);
    addMember(groupB, u1.id); addMember(groupB, u4.id); addMember(groupB, u5.id);

    var groupC = createGroup('Oficina Premium', 'Grupo mixto: premio semanal + acumulado.', 50, 'MIXED', u3.id);
    addMember(groupC, u1.id); addMember(groupC, u2.id); addMember(groupC, u4.id);

    function purchaseDemoTicket(user, group, programInfo, pickPattern, idemKey) {
      var cfg2 = state.appConfig;
      var picks = {};
      programInfo.matchIds.forEach(function (mid, idx) { picks[mid] = pickPattern[idx]; });
      var ticket = {
        id: uuid(), code: makeCode('PLG'), userId: user.id, groupId: group.id, programId: programInfo.program.id,
        picks: picks, priceCents: cfg2.ticketPriceCents, poolContributionCents: cfg2.groupPoolContributionCents,
        houseFeeCents: cfg2.houseFeeCents, status: 'ACTIVE', purchasedAt: nowIso(), idempotencyKey: idemKey || uuid(),
        hits: null, isWinner: false, prizeCents: 0, settledAt: null
      };
      state.tickets.push(ticket);
      Object.keys(picks).forEach(function (mid) {
        state.ticketPicks.push({ id: uuid(), ticketId: ticket.id, matchId: mid, pick: picks[mid] });
      });
      ledgerEntry(state, user.id, 'TICKET_PURCHASE', -cfg2.ticketPriceCents, { referenceType: 'ticket', referenceId: ticket.id, description: 'Compra de ticket ' + ticket.code });
      applyPoolContribution(state, group, programInfo.program, ticket);
      return ticket;
    }

    // Tickets del programa liquidado (para caso de empate y caso 12/12)
    var perfect = settledResults.slice();
    var near1 = settledResults.slice(); near1[11] = near1[11] === 'V' ? 'L' : 'V';
    var near2 = settledResults.slice(); near2[10] = near2[10] === 'L' ? 'E' : 'L';
    var mid = settledResults.slice(); mid[3] = 'E'; mid[5] = 'V'; mid[8] = 'L';

    purchaseDemoTicket(u1, groupA, settledProgram, near1, 'seed-a-1');
    purchaseDemoTicket(u2, groupA, settledProgram, near1, 'seed-a-2');
    purchaseDemoTicket(u3, groupA, settledProgram, mid, 'seed-a-3');

    purchaseDemoTicket(u1, groupB, settledProgram, near2, 'seed-b-1');
    purchaseDemoTicket(u4, groupB, settledProgram, perfect, 'seed-b-2');
    purchaseDemoTicket(u5, groupB, settledProgram, mid, 'seed-b-3');

    purchaseDemoTicket(u1, groupC, settledProgram, near1, 'seed-c-1');
    purchaseDemoTicket(u2, groupC, settledProgram, perfect, 'seed-c-2');
    purchaseDemoTicket(u4, groupC, settledProgram, mid, 'seed-c-3');

    // Un par de tickets abiertos para poder ver "Mis jugadas" antes del cierre
    purchaseDemoTicket(u1, groupA, openProgram, near1, 'seed-open-1');

    var seedSettlement = global.Settlement.settleProgram(state, settledProgram.program.id, { actorId: admin.id, actorRole: 'admin' });
    if (!seedSettlement.ok) {
      throw new Error('No se pudo liquidar el programa de demostración: ' + seedSettlement.error.message);
    }

    pushAudit(state, { action: 'DEMO_DATA_SEEDED', actorRole: 'system' });
    return state;
  }

  function applyPoolContribution(state, group, program, ticket) {
    var pool = state.groupPools.find(function (p) { return p.groupId === group.id && p.programId === program.id; });
    if (!pool) {
      pool = { id: uuid(), groupId: group.id, programId: program.id, ticketCount: 0, contributionTotalCents: 0, weeklyPoolCents: 0, progressiveContributionCents: 0 };
      state.groupPools.push(pool);
    }
    pool.ticketCount += 1;
    pool.contributionTotalCents += ticket.poolContributionCents;
    if (group.prizeMode === 'HIGHEST_SCORE') {
      pool.weeklyPoolCents += ticket.poolContributionCents;
    } else if (group.prizeMode === 'PERFECT_12') {
      pool.progressiveContributionCents += ticket.poolContributionCents;
      group.progressivePoolCents += ticket.poolContributionCents;
    } else if (group.prizeMode === 'MIXED') {
      var half = Math.round(ticket.poolContributionCents / 2);
      pool.weeklyPoolCents += half;
      pool.progressiveContributionCents += (ticket.poolContributionCents - half);
      group.progressivePoolCents += (ticket.poolContributionCents - half);
    }
    if (!group.modeLockedAt) group.modeLockedAt = nowIso();
    return pool;
  }

  // ---------- API pública del Store ----------
  var _cache = null;

  function loadRaw() {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { return null; }
    }
    return null;
  }

  function persist(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    _cache = state;
  }

  function get() {
    if (_cache) return _cache;
    var existing = loadRaw();
    if (existing && existing.version === 3) {
      _cache = existing;
      return _cache;
    }
    var v2Raw = localStorage.getItem(OLD_KEY_V2);
    var v1Raw = localStorage.getItem(OLD_KEY_V1);
    var state;
    if (v2Raw || v1Raw) {
      var v2Parsed = null;
      try { v2Parsed = JSON.parse(v2Raw || v1Raw); } catch (e) { v2Parsed = null; }
      state = migrateFromV2(v2Parsed);
      state = seedProgramsIfMissing(state);
    } else {
      state = defaultState();
      state = seedDemoData(state);
    }
    persist(state);
    return state;
  }

  function seedProgramsIfMissing(state) {
    if (state.programs.length) return state;
    // Un usuario migrado no trae programas de PremiumGol nuevos; se agregan igualmente
    // para que la experiencia de esta fase esté completa.
    var seeded = seedDemoData(defaultState());
    state.appConfig = seeded.appConfig;
    state.groups = seeded.groups;
    state.groupMembers = seeded.groupMembers;
    state.groupInvitations = seeded.groupInvitations;
    state.programs = seeded.programs;
    state.matches = seeded.matches;
    state.tickets = seeded.tickets;
    state.ticketPicks = seeded.ticketPicks;
    state.groupPools = seeded.groupPools;
    state.settlements = seeded.settlements;
    state.payouts = seeded.payouts;
    seeded.users.forEach(function (u) { if (!state.users.find(function (x) { return x.email === u.email; })) state.users.push(u); });
    seeded.wallets.forEach(function (w) {
      if (!state.wallets.find(function (x) { return x.userId === w.userId; })) state.wallets.push(w);
    });
    seeded.walletLedger.forEach(function (l) { if (!state.walletLedger.find(function (x) { return x.id === l.id; })) state.walletLedger.push(l); });
    return state;
  }

  function save(state) { persist(state); }

  function update(mutator) {
    var state = get();
    mutator(state);
    persist(state);
    return state;
  }

  function resetAllDemoData() {
    localStorage.removeItem(KEY);
    _cache = null;
    return get();
  }

  function resetUserDemoAccount(userId) {
    return update(function (state) {
      var wallet = ensureWallet(state, userId);
      wallet.balanceCents = 0;
      state.walletLedger = state.walletLedger.filter(function (l) { return l.userId !== userId; });
      state.tickets = state.tickets.filter(function (t) { return t.userId !== userId; });
      state.ticketPicks = state.ticketPicks.filter(function (p) {
        return state.tickets.some(function (t) { return t.id === p.ticketId; });
      });
      var resetBalance = userId === GUEST_ID ? 12500 : 10000;
      ledgerEntry(state, userId, 'DEMO_TOPUP', resetBalance, { description: 'Reinicio de cuenta demo' });
      pushAudit(state, { actorId: userId, actorRole: 'user', action: 'DEMO_ACCOUNT_RESET', entityType: 'user', entityId: userId });
    });
  }

  global.Store = {
    KEY: KEY, GUEST_ID: GUEST_ID, DEMO_MODE_NOTICE: DEMO_MODE_NOTICE,
    uuid: uuid, nowIso: nowIso, clone: clone, demoHash: demoHash, makeCode: makeCode, shortCode: shortCode,
    get: get, save: save, update: update, ensureWallet: ensureWallet, ledgerEntry: ledgerEntry, pushAudit: pushAudit,
    applyPoolContribution: applyPoolContribution, resetAllDemoData: resetAllDemoData, resetUserDemoAccount: resetUserDemoAccount,
    appConfig: appConfig
  };
})(window);
