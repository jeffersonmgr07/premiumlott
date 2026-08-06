/* PremiumLott — Store v3
 * Fuente única de datos en localStorage. Sustituye premiumlott_state_v2.
 * Todo monto se guarda en céntimos (enteros). Formatear solo al mostrar.
 *
 * V3.1 — PremiumGol pasó de pozos por grupo a un pozo único global por
 * programa (prizeMode y prizePoolCents ahora viven en Program). Las páginas
 * de Grupos se retiraron de la interfaz; los métodos CRUD de grupos siguen
 * en mock-api.js (dormidos, sin UI) por si se retoma la idea en otro juego.
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
      timezone: 'America/Lima',
      demoModeNotice: DEMO_MODE_NOTICE,
      // PremiumGol — pozo único global, jugadores internacionales, USD
      premiumgol: {
        currency: 'USD',
        ticketPriceCents: 100,
        defaultPrizePoolCents: 100000,
        defaultPrizeMode: 'HIGHEST_SCORE'
      },
      // PremiumBall — cartilla estilo lotería clásica, USD
      premiumball: {
        currency: 'USD',
        ticketPriceCents: 100,
        numberMin: 1,
        numberMax: 53,
        picksCount: 6,
        bolillapaMin: 1,
        bolillapaMax: 10,
        mainPrizeCents: 500000,
        siOSiPrizeCents: 50000,
        bolillapaPrizeCents: 50000,
        siOSiMaxExtraNumbers: 10
      }
    };
  }

  function defaultState() {
    return {
      version: 3,
      appConfig: appConfig(),
      premiumgolCarryCents: 0,
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
      ballDraws: [],
      ballTickets: [],
      ballSettlements: [],
      ballPayouts: [],
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
      // La billetera demo es agnóstica de moneda (un solo balance en céntimos);
      // el resto del sitio la muestra en soles (S/) y PremiumGol/PremiumBall en
      // dólares (US$), ya que en esta fase no hay pasarela de pago real ni
      // conversión real entre monedas.
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
    var demoPlayers = [u1, u2, u3, u4, u5];

    function buildProgram(code, name, status, offsetDaysOpen, offsetDaysClose, resultsPattern, prizeMode, prizePoolCents) {
      var programId = uuid();
      var openAt = new Date(Date.now() + offsetDaysOpen * 86400000);
      var closeAt = new Date(Date.now() + offsetDaysClose * 86400000);
      var program = {
        id: programId, code: code, name: name, status: status, openAt: openAt.toISOString(), closeAt: closeAt.toISOString(),
        timezone: cfg.timezone, estimatedSettlementAt: new Date(closeAt.getTime() + 3 * 3600000).toISOString(),
        ticketPriceCents: cfg.premiumgol.ticketPriceCents, currency: cfg.premiumgol.currency, voidPolicy: 'VOID_COUNTS_AS_HIT',
        prizeMode: prizeMode || cfg.premiumgol.defaultPrizeMode, prizePoolCents: prizePoolCents != null ? prizePoolCents : cfg.premiumgol.defaultPrizePoolCents,
        progressiveCarryInCents: 0, settledAt: null, settlementIdempotencyKey: null,
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

    // Programa abierto (jugable en el demo) — pozo fijo de US$ 1,000
    var openProgram = buildProgram('PG-2026-W' + String(new Date().getWeek ? new Date().getWeek() : 32) + '-A', 'PremiumGol · Programa semanal', 'open', -1, 3, null, 'HIGHEST_SCORE', 100000);

    // Programa liquidado (para mostrar historial, empate y caso 12/12)
    var settledResults = ['L', 'E', 'V', 'L', 'L', 'E', 'V', 'L', 'E', 'V', 'L', 'V'];
    // Se crea en results_pending (no 'settled') para que la liquidación real
    // más abajo sea la que genere el registro de settlement, los payouts y
    // los créditos de premio; si quedara marcado 'settled' de entrada,
    // Settlement.settleProgram lo rechazaría por PROGRAM_ALREADY_SETTLED.
    var settledProgram = buildProgram('PG-2026-W' + (new Date().getWeek ? new Date().getWeek() - 1 : 31) + '-A', 'PremiumGol · Programa anterior', 'results_pending', -10, -7, settledResults, 'HIGHEST_SCORE', 100000);

    function purchaseDemoTicket(user, programInfo, pickPattern, idemKey) {
      var picks = {};
      programInfo.matchIds.forEach(function (mid, idx) { picks[mid] = pickPattern[idx]; });
      var ticket = {
        id: uuid(), code: makeCode('PLG'), userId: user.id, programId: programInfo.program.id,
        picks: picks, priceCents: programInfo.program.ticketPriceCents, status: 'ACTIVE', purchasedAt: nowIso(),
        idempotencyKey: idemKey || uuid(), hits: null, isWinner: false, prizeCents: 0, settledAt: null
      };
      state.tickets.push(ticket);
      Object.keys(picks).forEach(function (mid) {
        state.ticketPicks.push({ id: uuid(), ticketId: ticket.id, matchId: mid, pick: picks[mid] });
      });
      ledgerEntry(state, user.id, 'TICKET_PURCHASE', -ticket.priceCents, { referenceType: 'ticket', referenceId: ticket.id, description: 'Compra de ticket ' + ticket.code });
      return ticket;
    }

    // Tickets del programa liquidado (caso de empate + caso 12/12)
    var perfect = settledResults.slice();
    var near1 = settledResults.slice(); near1[11] = near1[11] === 'V' ? 'L' : 'V';
    var near2 = settledResults.slice(); near2[10] = near2[10] === 'L' ? 'E' : 'L';
    var mid = settledResults.slice(); mid[3] = 'E'; mid[5] = 'V'; mid[8] = 'L';

    purchaseDemoTicket(u1, settledProgram, near1, 'seed-a-1');
    purchaseDemoTicket(u2, settledProgram, near1, 'seed-a-2');
    purchaseDemoTicket(u3, settledProgram, mid, 'seed-a-3');
    purchaseDemoTicket(u4, settledProgram, perfect, 'seed-a-4');
    purchaseDemoTicket(u5, settledProgram, mid, 'seed-a-5');

    // Un ticket abierto para poder ver "Mis jugadas" antes del cierre
    purchaseDemoTicket(u1, openProgram, near1, 'seed-open-1');

    var seedSettlement = global.Settlement.settleProgram(state, settledProgram.program.id, { actorId: admin.id, actorRole: 'admin' });
    if (!seedSettlement.ok) {
      throw new Error('No se pudo liquidar el programa de demostración: ' + seedSettlement.error.message);
    }

    seedBallDemoData(state, admin, demoPlayers);

    pushAudit(state, { action: 'DEMO_DATA_SEEDED', actorRole: 'system' });
    return state;
  }

  function seedBallDemoData(state, admin, players) {
    var cfg = state.appConfig.premiumball;

    function buildDraw(name, status, offsetDaysClose, drawnNumbers, siOSiExtra, bolillapaNumber) {
      var draw = {
        id: uuid(), code: makeCode('PB'), name: name, status: status,
        openAt: nowIso(), closeAt: new Date(Date.now() + offsetDaysClose * 86400000).toISOString(),
        timezone: state.appConfig.timezone, ticketPriceCents: cfg.ticketPriceCents, currency: cfg.currency,
        numberMin: cfg.numberMin, numberMax: cfg.numberMax, picksCount: cfg.picksCount,
        bolillapaMin: cfg.bolillapaMin, bolillapaMax: cfg.bolillapaMax,
        mainPrizeCents: cfg.mainPrizeCents, siOSiPrizeCents: cfg.siOSiPrizeCents, bolillapaPrizeCents: cfg.bolillapaPrizeCents,
        drawnNumbers: drawnNumbers || [], siOSiExtraNumbers: siOSiExtra || [], bolillapaNumber: bolillapaNumber != null ? bolillapaNumber : null,
        settledAt: null, settlementIdempotencyKey: null, createdAt: nowIso(), cancelledAt: null, cancelReason: null
      };
      state.ballDraws.push(draw);
      return draw;
    }

    var openDraw = buildDraw('PremiumBall · Sorteo semanal', 'open', 4, [], [], null);

    var settledDraw = buildDraw('PremiumBall · Sorteo anterior', 'results_pending', -3, [4, 12, 19, 27, 33, 48], [], 7);

    function purchaseBallTicket(user, draw, numbers, bolillapaNumber, idemKey) {
      var ticket = {
        id: uuid(), code: makeCode('PLB'), userId: user.id, drawId: draw.id, numbers: numbers.slice().sort(function (a, b) { return a - b; }),
        bolillapaNumber: bolillapaNumber != null ? bolillapaNumber : null, priceCents: draw.ticketPriceCents, status: 'ACTIVE',
        purchasedAt: nowIso(), idempotencyKey: idemKey || uuid(), hits: null, isMainWinner: false, isSiOSiWinner: false,
        isBolillapaWinner: false, prizeCents: 0, settledAt: null
      };
      state.ballTickets.push(ticket);
      ledgerEntry(state, user.id, 'TICKET_PURCHASE', -ticket.priceCents, { referenceType: 'ballTicket', referenceId: ticket.id, description: 'Compra de ticket ' + ticket.code });
      return ticket;
    }

    // Ticket ganador exacto (6/6) para demostrar el premio mayor
    purchaseBallTicket(players[0], settledDraw, [4, 12, 19, 27, 33, 48], 7, 'seed-ball-1');
    // Ticket con 5/6 + bolillapa correcta
    purchaseBallTicket(players[1], settledDraw, [4, 12, 19, 27, 33, 50], 7, 'seed-ball-2');
    // Ticket con pocos aciertos
    purchaseBallTicket(players[2], settledDraw, [1, 2, 3, 4, 5, 6], 9, 'seed-ball-3');
    // Ticket abierto para ver en "Mis jugadas"
    purchaseBallTicket(players[0], openDraw, [5, 10, 15, 20, 25, 30], 3, 'seed-ball-open-1');

    var ballSettlement = global.Settlement.settleBallDraw(state, settledDraw.id, { actorId: admin.id, actorRole: 'admin' });
    if (!ballSettlement.ok) {
      throw new Error('No se pudo liquidar el sorteo de PremiumBall de demostración: ' + ballSettlement.error.message);
    }
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
      // Un estado v3 guardado por una versión anterior de esta fase puede no
      // traer todavía las colecciones/campos de PremiumBall ni el pozo
      // progresivo de PremiumGol (se agregaron sin subir el número de
      // versión). seedProgramsIfMissing rellena lo que falte sin tocar
      // usuarios, billeteras ni sesiones ya existentes.
      existing = seedProgramsIfMissing(existing);
      if (existing.premiumgolCarryCents == null) existing.premiumgolCarryCents = 0;
      persist(existing);
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
    if (state.programs.length && state.ballDraws && state.ballDraws.length) return state;
    // Un usuario migrado no trae programas de PremiumGol/PremiumBall nuevos;
    // se agregan igualmente para que la experiencia de esta fase esté completa.
    var seeded = seedDemoData(defaultState());

    // Si un jugador de muestra (mismo email) ya existía en este navegador,
    // los tickets/programas recién generados se reasignan a su id real en
    // vez de quedar huérfanos con el id nuevo que generó este seed.
    var idRemap = {};
    seeded.users.forEach(function (u) {
      var existingUser = state.users.find(function (x) { return x.email === u.email; });
      if (existingUser) idRemap[u.id] = existingUser.id;
    });
    var remappedOldIds = Object.keys(idRemap);
    if (remappedOldIds.length) {
      var seededJson = JSON.stringify(seeded);
      remappedOldIds.forEach(function (oldId) { seededJson = seededJson.split(oldId).join(idRemap[oldId]); });
      seeded = JSON.parse(seededJson);
    }

    state.appConfig = seeded.appConfig;
    state.programs = seeded.programs;
    state.matches = seeded.matches;
    state.tickets = seeded.tickets;
    state.ticketPicks = seeded.ticketPicks;
    state.settlements = seeded.settlements;
    state.payouts = seeded.payouts;
    state.ballDraws = seeded.ballDraws;
    state.ballTickets = seeded.ballTickets;
    state.ballSettlements = seeded.ballSettlements;
    state.ballPayouts = seeded.ballPayouts;
    seeded.users.forEach(function (u) { if (!state.users.find(function (x) { return x.email === u.email; })) state.users.push(u); });
    seeded.wallets.forEach(function (w) {
      if (!state.wallets.find(function (x) { return x.userId === w.userId; })) state.wallets.push(w);
    });
    // Los movimientos de muestra (recarga de bienvenida, compras de tickets)
    // solo se agregan para billeteras nuevas: a un usuario que ya existía no
    // se le insertan movimientos ficticios que no cuadrarían con su saldo real.
    var remappedUserIds = {};
    remappedOldIds.forEach(function (oldId) { remappedUserIds[idRemap[oldId]] = true; });
    seeded.walletLedger.forEach(function (l) {
      if (remappedUserIds[l.userId]) return;
      if (!state.walletLedger.find(function (x) { return x.id === l.id; })) state.walletLedger.push(l);
    });
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
      state.ballTickets = state.ballTickets.filter(function (t) { return t.userId !== userId; });
      var resetBalance = userId === GUEST_ID ? 12500 : 10000;
      ledgerEntry(state, userId, 'DEMO_TOPUP', resetBalance, { description: 'Reinicio de cuenta demo' });
      pushAudit(state, { actorId: userId, actorRole: 'user', action: 'DEMO_ACCOUNT_RESET', entityType: 'user', entityId: userId });
    });
  }

  global.Store = {
    KEY: KEY, GUEST_ID: GUEST_ID, DEMO_MODE_NOTICE: DEMO_MODE_NOTICE,
    uuid: uuid, nowIso: nowIso, clone: clone, demoHash: demoHash, makeCode: makeCode, shortCode: shortCode,
    get: get, save: save, update: update, ensureWallet: ensureWallet, ledgerEntry: ledgerEntry, pushAudit: pushAudit,
    resetAllDemoData: resetAllDemoData, resetUserDemoAccount: resetUserDemoAccount,
    appConfig: appConfig
  };
})(window);
