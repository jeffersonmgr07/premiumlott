/* PremiumLott — MockApi
 * Simula el backend completo (autenticación, grupos, PremiumGol, billetera y
 * administración) operando sobre Store. Implementa el mismo contrato de
 * respuesta que usará AppsScriptApi en la siguiente fase: {ok,data,error,requestId,serverTime}.
 * El navegador NUNCA será la fuente autoritativa en producción: esto es solo
 * un simulador local para el prototipo frontend.
 */
(function (global) {
  function ok(data) { return { ok: true, data: data, error: null, requestId: Store.uuid(), serverTime: Store.nowIso() }; }
  function fail(code, message) { return { ok: false, data: null, error: { code: code, message: message }, requestId: Store.uuid(), serverTime: Store.nowIso() }; }

  var Validators = {
    normalizeEmail: function (email) { return String(email || '').trim().toLowerCase(); },
    isValidEmail: function (email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    isValidDni: function (dni) { return /^\d{8}$/.test(String(dni || '').trim()); },
    isValidPeruPhone: function (phone) {
      var clean = String(phone || '').replace(/[\s-]/g, '').replace(/^\+?51/, '');
      return /^9\d{8}$/.test(clean);
    },
    isAdult: function (birthDate) {
      if (!birthDate) return false;
      var b = new Date(birthDate);
      if (isNaN(b.getTime())) return false;
      var today = new Date();
      var age = today.getFullYear() - b.getFullYear();
      var m = today.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
      return age >= 18;
    },
    isValidPassword: function (pw) { return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(pw || '')); }
  };

  function sanitizeUser(user) {
    if (!user) return null;
    return {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      dni: user.dni, dniMasked: Formatters.maskDni(user.dni), phone: user.phone, birthDate: user.birthDate,
      country: user.country, role: user.role, emailVerified: user.emailVerified, marketingConsent: user.marketingConsent,
      authProvider: user.authProvider, status: user.status, createdAt: user.createdAt
    };
  }

  function findUserByEmail(state, email) {
    var norm = Validators.normalizeEmail(email);
    return state.users.find(function (u) { return u.email === norm; });
  }

  function getActiveSessionUser(state) {
    var session = state.sessions.slice().reverse().find(function (s) { return s.active; });
    if (!session) return null;
    return state.users.find(function (u) { return u.id === session.userId; }) || null;
  }

  function requireSession(state) {
    var user = getActiveSessionUser(state);
    if (!user) return { error: fail('SESSION_REQUIRED', 'Debes iniciar sesión para continuar.') };
    return { user: user };
  }

  function requireAdmin(state) {
    var r = requireSession(state);
    if (r.error) return r;
    if (r.user.role !== 'admin') return { error: fail('FORBIDDEN', 'Esta acción requiere una cuenta de administrador.') };
    return { user: r.user };
  }

  function genOtp(length) {
    var digits = '';
    for (var i = 0; i < (length || 6); i++) digits += Math.floor(Math.random() * 10);
    return digits;
  }

  // ------------------------------------------------------------------
  // Autenticación
  // ------------------------------------------------------------------
  function registerUser(payload) {
    payload = payload || {};
    var state = Store.get();
    var cfg = state.appConfig;
    var email = Validators.normalizeEmail(payload.email);

    if (!payload.firstName || !payload.lastName) return fail('MISSING_FIELDS', 'Ingresa tus nombres y apellidos.');
    if (!Validators.isValidEmail(email)) return fail('INVALID_EMAIL', 'Ingresa un correo electrónico válido.');
    if (!Validators.isValidDni(payload.dni)) return fail('INVALID_DNI', 'El DNI debe tener exactamente 8 dígitos.');
    if (!Validators.isValidPeruPhone(payload.phone)) return fail('INVALID_PHONE', 'Ingresa un celular peruano válido (9 dígitos, inicia con 9).');
    if (!Validators.isAdult(payload.birthDate)) return fail('UNDERAGE', 'Debes ser mayor de 18 años para registrarte.');
    if (!Validators.isValidPassword(payload.password)) return fail('WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres, con letras y números.');
    if (payload.password !== payload.confirmPassword) return fail('PASSWORD_MISMATCH', 'Las contraseñas no coinciden.');
    if (!payload.termsAccepted || !payload.privacyAccepted || !payload.ageDeclared) return fail('CONSENT_REQUIRED', 'Debes aceptar los términos, la política de privacidad y declarar mayoría de edad.');
    if (findUserByEmail(state, email)) return fail('EMAIL_ALREADY_EXISTS', 'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.');
    if (state.users.some(function (u) { return u.dni === payload.dni; })) {
      return fail('DNI_ALREADY_EXISTS', 'Este DNI ya está asociado a una cuenta. No crees un segundo registro; recupera el acceso a tu cuenta.');
    }

    var user = {
      id: Store.uuid(), email: email, firstName: payload.firstName.trim(), lastName: payload.lastName.trim(),
      dni: String(payload.dni).trim(), phone: payload.phone.trim(), birthDate: payload.birthDate, country: 'PE',
      passwordHash: Store.demoHash(payload.password), role: 'user', emailVerified: false,
      marketingConsent: !!payload.marketingConsent, termsAcceptedAt: Store.nowIso(), privacyAcceptedAt: Store.nowIso(),
      ageDeclaredAt: Store.nowIso(), authProvider: 'password', googleSub: null, status: 'active',
      failedLoginCount: 0, lockedUntil: null, createdAt: Store.nowIso()
    };

    var verification = {
      id: Store.uuid(), userId: user.id, email: email, code: genOtp(cfg.otpLength), attempts: 0,
      maxAttempts: cfg.otpMaxAttempts, verified: false, createdAt: Store.nowIso(),
      expiresAt: new Date(Date.now() + cfg.otpExpiryMinutes * 60000).toISOString(), lastSentAt: Store.nowIso()
    };

    Store.update(function (state) {
      state.users.push(user);
      Store.ensureWallet(state, user.id);
      Store.ledgerEntry(state, user.id, 'DEMO_TOPUP', 10000, { description: 'Saldo de bienvenida (demo)' });
      state.emailVerifications.push(verification);
      state.sessions.forEach(function (s) { s.active = false; });
      state.sessions.push({ id: Store.uuid(), userId: user.id, createdAt: Store.nowIso(), expiresAt: null, active: true });
      Store.pushAudit(state, { actorId: user.id, actorRole: 'user', action: 'USER_REGISTERED', entityType: 'user', entityId: user.id });
    });

    return ok({ user: sanitizeUser(user), verification: { userId: user.id, demoCode: verification.code, expiresAt: verification.expiresAt } });
  }

  function login(payload) {
    payload = payload || {};
    var state = Store.get();
    var email = Validators.normalizeEmail(payload.email);
    var user = findUserByEmail(state, email);

    if (!user) return fail('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return fail('ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente después de ' + Formatters.dateTimeLima(user.lockedUntil) + '.');
    }
    if (user.passwordHash !== Store.demoHash(payload.password)) {
      var lockedNow = null;
      Store.update(function (state) {
        var u = state.users.find(function (x) { return x.id === user.id; });
        u.failedLoginCount = (u.failedLoginCount || 0) + 1;
        if (u.failedLoginCount >= state.appConfig.loginMaxAttempts) {
          u.lockedUntil = new Date(Date.now() + state.appConfig.loginLockoutMinutes * 60000).toISOString();
          u.failedLoginCount = 0;
          lockedNow = u.lockedUntil;
        }
        Store.pushAudit(state, { actorId: u.id, actorRole: 'user', action: 'LOGIN_FAILED', entityType: 'user', entityId: u.id });
      });
      if (lockedNow) return fail('ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente después de ' + Formatters.dateTimeLima(lockedNow) + '.');
      return fail('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    }

    var sanitized = null;
    Store.update(function (state) {
      state.sessions.forEach(function (s) { if (s.userId === user.id) s.active = false; });
      state.sessions.push({ id: Store.uuid(), userId: user.id, createdAt: Store.nowIso(), expiresAt: null, active: true });
      var u = state.users.find(function (x) { return x.id === user.id; });
      u.failedLoginCount = 0; u.lockedUntil = null;
      Store.pushAudit(state, { actorId: u.id, actorRole: u.role, action: 'LOGIN_SUCCESS', entityType: 'user', entityId: u.id });
      sanitized = sanitizeUser(u);
    });
    return ok({ user: sanitized });
  }

  function logout() {
    Store.update(function (state) {
      var user = getActiveSessionUser(state);
      state.sessions.forEach(function (s) { s.active = false; });
      if (user) Store.pushAudit(state, { actorId: user.id, actorRole: user.role, action: 'LOGOUT', entityType: 'user', entityId: user.id });
    });
    return ok({});
  }

  function getCurrentUser() {
    var state = Store.get();
    var user = getActiveSessionUser(state);
    return ok({ user: sanitizeUser(user) });
  }

  // Acceso síncrono usado únicamente por el shim de compatibilidad legado (app.js)
  // que sostiene a Premium World Cup, cuyo código anterior espera respuestas inmediatas.
  function getCurrentUserSync() {
    return sanitizeUser(getActiveSessionUser(Store.get()));
  }

  function requestEmailVerification(payload) {
    var state = Store.get();
    var user = payload && payload.userId ? state.users.find(function (u) { return u.id === payload.userId; }) : findUserByEmail(state, payload && payload.email);
    if (!user) return fail('USER_NOT_FOUND', 'No se encontró la cuenta.');
    if (user.emailVerified) return fail('ALREADY_VERIFIED', 'Este correo ya está verificado.');
    var cfg = state.appConfig;
    var verification = { id: Store.uuid(), userId: user.id, email: user.email, code: genOtp(cfg.otpLength), attempts: 0, maxAttempts: cfg.otpMaxAttempts, verified: false, createdAt: Store.nowIso(), expiresAt: new Date(Date.now() + cfg.otpExpiryMinutes * 60000).toISOString(), lastSentAt: Store.nowIso() };
    Store.update(function (state) { state.emailVerifications.push(verification); });
    return ok({ userId: user.id, demoCode: verification.code, expiresAt: verification.expiresAt });
  }

  function resendEmailVerification(payload) {
    var state = Store.get();
    var user = payload && payload.userId ? state.users.find(function (u) { return u.id === payload.userId; }) : findUserByEmail(state, payload && payload.email);
    if (!user) return fail('USER_NOT_FOUND', 'No se encontró la cuenta.');
    var cfg = state.appConfig;
    var last = state.emailVerifications.filter(function (v) { return v.userId === user.id; }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0];
    if (last && (Date.now() - new Date(last.lastSentAt).getTime()) < cfg.otpResendCooldownSeconds * 1000) {
      var waitSec = Math.ceil((cfg.otpResendCooldownSeconds * 1000 - (Date.now() - new Date(last.lastSentAt).getTime())) / 1000);
      return fail('COOLDOWN_ACTIVE', 'Espera ' + waitSec + ' segundos antes de reenviar el código.');
    }
    return requestEmailVerification({ userId: user.id });
  }

  function verifyEmailCode(payload) {
    payload = payload || {};
    var state = Store.get();
    var user = payload.userId ? state.users.find(function (u) { return u.id === payload.userId; }) : findUserByEmail(state, payload.email);
    if (!user) return fail('USER_NOT_FOUND', 'No se encontró la cuenta.');
    var verification = state.emailVerifications.filter(function (v) { return v.userId === user.id && !v.verified; }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0];
    if (!verification) return fail('NO_PENDING_VERIFICATION', 'No hay una verificación pendiente. Solicita un nuevo código.');
    if (new Date(verification.expiresAt) < new Date()) return fail('CODE_EXPIRED', 'El código expiró. Solicita uno nuevo.');
    if (verification.attempts >= verification.maxAttempts) return fail('MAX_ATTEMPTS_REACHED', 'Superaste el número máximo de intentos. Solicita un nuevo código.');

    var result;
    Store.update(function (state) {
      var v = state.emailVerifications.find(function (x) { return x.id === verification.id; });
      v.attempts += 1;
      if (v.code !== String(payload.code || '').trim()) {
        result = fail('INVALID_CODE', 'El código ingresado no es correcto. Intento ' + v.attempts + ' de ' + v.maxAttempts + '.');
        return;
      }
      v.verified = true;
      var u = state.users.find(function (x) { return x.id === user.id; });
      u.emailVerified = true;
      Store.pushAudit(state, { actorId: u.id, actorRole: 'user', action: 'EMAIL_VERIFIED', entityType: 'user', entityId: u.id });
      result = ok({ user: sanitizeUser(u) });
    });
    return result;
  }

  function requestPasswordReset(payload) {
    var state = Store.get();
    var email = Validators.normalizeEmail(payload && payload.email);
    var user = findUserByEmail(state, email);
    if (!user) return ok({ requested: true, demoCode: null, message: 'Si el correo existe, se generó un código de prueba.' });
    var cfg = state.appConfig;
    var reset = { id: Store.uuid(), userId: user.id, email: email, code: genOtp(cfg.otpLength), attempts: 0, maxAttempts: cfg.otpMaxAttempts, used: false, createdAt: Store.nowIso(), expiresAt: new Date(Date.now() + cfg.otpExpiryMinutes * 60000).toISOString() };
    Store.update(function (state) { state.passwordResets.push(reset); });
    return ok({ requested: true, demoCode: reset.code, expiresAt: reset.expiresAt, message: 'Se generó un código de prueba para restablecer tu contraseña.' });
  }

  function resetPassword(payload) {
    payload = payload || {};
    var state = Store.get();
    var email = Validators.normalizeEmail(payload.email);
    var user = findUserByEmail(state, email);
    if (!user) return fail('USER_NOT_FOUND', 'No se encontró la cuenta.');
    var reset = state.passwordResets.filter(function (r) { return r.userId === user.id && !r.used; }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })[0];
    if (!reset) return fail('NO_PENDING_RESET', 'No hay una solicitud de recuperación activa.');
    if (new Date(reset.expiresAt) < new Date()) return fail('CODE_EXPIRED', 'El código expiró. Solicita uno nuevo.');
    if (reset.attempts >= reset.maxAttempts) return fail('MAX_ATTEMPTS_REACHED', 'Superaste el número máximo de intentos.');
    if (!Validators.isValidPassword(payload.newPassword)) return fail('WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres, con letras y números.');
    if (payload.newPassword !== payload.confirmPassword) return fail('PASSWORD_MISMATCH', 'Las contraseñas no coinciden.');

    var result;
    Store.update(function (state) {
      var r = state.passwordResets.find(function (x) { return x.id === reset.id; });
      r.attempts += 1;
      if (r.code !== String(payload.code || '').trim()) {
        result = fail('INVALID_CODE', 'El código ingresado no es correcto.');
        return;
      }
      r.used = true;
      var u = state.users.find(function (x) { return x.id === user.id; });
      u.passwordHash = Store.demoHash(payload.newPassword);
      u.failedLoginCount = 0; u.lockedUntil = null;
      Store.pushAudit(state, { actorId: u.id, actorRole: 'user', action: 'PASSWORD_RESET', entityType: 'user', entityId: u.id });
      result = ok({ reset: true });
    });
    return result;
  }

  function loginWithGoogle() {
    return fail('GOOGLE_NOT_IMPLEMENTED', 'El acceso con Google se activará cuando se conecte Google Identity Services en el backend. Por ahora, continúa con el registro demo.');
  }

  // ------------------------------------------------------------------
  // Grupos
  // ------------------------------------------------------------------
  function activeMembers(state, groupId) {
    return state.groupMembers.filter(function (m) { return m.groupId === groupId && m.status === 'ACTIVE'; });
  }

  function createGroup(payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var cfg = state.appConfig;
    if (!payload.name || !payload.name.trim()) return fail('MISSING_FIELDS', 'Ingresa un nombre para el grupo.');
    var capacity = Number(payload.capacity);
    if (!capacity || capacity < cfg.minGroupCapacity || capacity > cfg.maxGroupCapacity) return fail('INVALID_CAPACITY', 'La capacidad debe estar entre ' + cfg.minGroupCapacity + ' y ' + cfg.maxGroupCapacity + ' miembros.');
    if (['HIGHEST_SCORE', 'PERFECT_12', 'MIXED'].indexOf(payload.prizeMode) === -1) return fail('INVALID_PRIZE_MODE', 'Selecciona una modalidad de premiación válida.');
    if (!payload.rulesAccepted) return fail('RULES_NOT_ACCEPTED', 'Debes aceptar las reglas del grupo.');

    var group = {
      id: Store.uuid(), name: payload.name.trim(), description: (payload.description || '').trim(),
      avatarInitials: Formatters.initials(payload.name), capacity: capacity, prizeMode: payload.prizeMode,
      privacy: 'CODE', code: Store.shortCode(6), inviteLink: null, ownerId: session.user.id, status: 'ACTIVE',
      joinLocked: false, modeLockedAt: null, progressivePoolCents: 0, rulesAcceptedVersion: 1, createdAt: Store.nowIso()
    };
    group.inviteLink = 'grupos/unirse.html?code=' + group.code;

    Store.update(function (state) {
      state.groups.push(group);
      state.groupMembers.push({ id: Store.uuid(), groupId: group.id, userId: session.user.id, role: 'OWNER', status: 'ACTIVE', joinedAt: Store.nowIso(), removedAt: null });
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'GROUP_CREATED', entityType: 'group', entityId: group.id });
    });
    return ok({ group: group });
  }

  function decorateGroup(state, group, userId) {
    var members = activeMembers(state, group.id);
    var member = members.find(function (m) { return m.userId === userId; });
    return Object.assign({}, group, {
      memberCount: members.length,
      isOwner: group.ownerId === userId,
      myRole: member ? member.role : null
    });
  }

  function getMyGroups() {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var myMemberships = state.groupMembers.filter(function (m) { return m.userId === session.user.id && m.status === 'ACTIVE'; });
    var groups = myMemberships.map(function (m) {
      var group = state.groups.find(function (g) { return g.id === m.groupId; });
      return decorateGroup(state, group, session.user.id);
    }).filter(Boolean);
    return ok({ groups: groups });
  }

  function getGroup(groupId) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.id === groupId; });
    if (!group) return fail('GROUP_NOT_FOUND', 'El grupo no existe.');
    var membership = state.groupMembers.find(function (m) { return m.groupId === groupId && m.userId === session.user.id && m.status === 'ACTIVE'; });
    if (!membership) return fail('NOT_GROUP_MEMBER', 'No perteneces a este grupo.');
    var members = activeMembers(state, groupId).map(function (m) {
      var u = state.users.find(function (x) { return x.id === m.userId; });
      return { userId: m.userId, role: m.role, joinedAt: m.joinedAt, label: Formatters.maskUserLabel(u) };
    });
    var invitations = group.ownerId === session.user.id ? state.groupInvitations.filter(function (i) { return i.groupId === groupId; }) : [];
    return ok({ group: decorateGroup(state, group, session.user.id), members: members, invitations: invitations });
  }

  function previewGroupByCode(code) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.code === String(code || '').trim().toUpperCase(); });
    if (!group) return fail('GROUP_NOT_FOUND', 'No existe un grupo con ese código.');
    return ok({ group: decorateGroup(state, group, session.user.id) });
  }

  function joinGroupByCode(code) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.code === String(code || '').trim().toUpperCase(); });
    if (!group) return fail('GROUP_NOT_FOUND', 'No existe un grupo con ese código.');
    if (group.status !== 'ACTIVE') return fail('GROUP_INACTIVE', 'Este grupo ya no está activo.');
    if (group.joinLocked) return fail('GROUP_JOIN_LOCKED', 'El grupo cerró temporalmente el ingreso de nuevos miembros.');
    var existing = state.groupMembers.find(function (m) { return m.groupId === group.id && m.userId === session.user.id; });
    if (existing && existing.status === 'ACTIVE') return fail('ALREADY_MEMBER', 'Ya perteneces a este grupo.');
    if (activeMembers(state, group.id).length >= group.capacity) return fail('GROUP_FULL', 'El grupo alcanzó su capacidad máxima.');

    Store.update(function (state) {
      if (existing) { existing.status = 'ACTIVE'; existing.joinedAt = Store.nowIso(); }
      else state.groupMembers.push({ id: Store.uuid(), groupId: group.id, userId: session.user.id, role: 'MEMBER', status: 'ACTIVE', joinedAt: Store.nowIso(), removedAt: null });
      var invitation = state.groupInvitations.find(function (i) { return i.groupId === group.id && i.code === group.code && i.status === 'PENDING'; });
      if (invitation) { invitation.status = 'ACCEPTED'; invitation.acceptedBy = session.user.id; invitation.acceptedAt = Store.nowIso(); }
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'GROUP_JOINED', entityType: 'group', entityId: group.id });
    });
    return ok({ group: decorateGroup(Store.get(), group, session.user.id) });
  }

  function createInvitation(groupId) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.id === groupId; });
    if (!group) return fail('GROUP_NOT_FOUND', 'El grupo no existe.');
    if (group.ownerId !== session.user.id) return fail('FORBIDDEN', 'Solo el creador del grupo puede generar invitaciones.');
    var invitation = { id: Store.uuid(), groupId: groupId, code: Store.shortCode(6), link: null, status: 'PENDING', createdBy: session.user.id, createdAt: Store.nowIso(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), acceptedBy: null, acceptedAt: null, revokedAt: null };
    invitation.link = 'grupos/unirse.html?code=' + invitation.code;
    Store.update(function (state) { state.groupInvitations.push(invitation); });
    return ok({ invitation: invitation });
  }

  function revokeInvitation(invitationId) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var invitation = state.groupInvitations.find(function (i) { return i.id === invitationId; });
    if (!invitation) return fail('INVITATION_NOT_FOUND', 'La invitación no existe.');
    var group = state.groups.find(function (g) { return g.id === invitation.groupId; });
    if (!group || group.ownerId !== session.user.id) return fail('FORBIDDEN', 'Solo el creador del grupo puede revocar invitaciones.');
    Store.update(function (state) {
      var inv = state.groupInvitations.find(function (i) { return i.id === invitationId; });
      inv.status = 'REVOKED'; inv.revokedAt = Store.nowIso();
    });
    return ok({ invitation: invitation });
  }

  function removeMember(groupId, userId) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.id === groupId; });
    if (!group) return fail('GROUP_NOT_FOUND', 'El grupo no existe.');
    if (group.ownerId !== session.user.id) return fail('FORBIDDEN', 'Solo el creador del grupo puede retirar miembros.');
    if (userId === session.user.id) return fail('CANNOT_REMOVE_OWNER', 'Transfiere la administración antes de salir del grupo.');
    var openProgram = state.programs.find(function (p) { return p.status === 'open'; });
    if (openProgram) {
      var hasActiveTickets = state.tickets.some(function (t) { return t.groupId === groupId && t.userId === userId && t.programId === openProgram.id && t.status === 'ACTIVE'; });
      if (hasActiveTickets) return fail('MEMBER_HAS_ACTIVE_TICKETS', 'Este miembro tiene tickets activos en el programa actual y no puede ser retirado.');
    }
    Store.update(function (state) {
      var m = state.groupMembers.find(function (x) { return x.groupId === groupId && x.userId === userId && x.status === 'ACTIVE'; });
      if (m) { m.status = 'REMOVED'; m.removedAt = Store.nowIso(); }
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'MEMBER_REMOVED', entityType: 'group', entityId: groupId, metadata: { userId: userId } });
    });
    return ok({ removed: true });
  }

  function transferOwnership(groupId, userId) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.id === groupId; });
    if (!group) return fail('GROUP_NOT_FOUND', 'El grupo no existe.');
    if (group.ownerId !== session.user.id) return fail('FORBIDDEN', 'Solo el creador actual puede transferir la administración.');
    var target = state.groupMembers.find(function (m) { return m.groupId === groupId && m.userId === userId && m.status === 'ACTIVE'; });
    if (!target) return fail('MEMBER_NOT_FOUND', 'El miembro indicado no pertenece al grupo.');
    Store.update(function (state) {
      var g = state.groups.find(function (x) { return x.id === groupId; });
      var oldOwnerMembership = state.groupMembers.find(function (m) { return m.groupId === groupId && m.userId === g.ownerId; });
      var newOwnerMembership = state.groupMembers.find(function (m) { return m.groupId === groupId && m.userId === userId; });
      if (oldOwnerMembership) oldOwnerMembership.role = 'MEMBER';
      newOwnerMembership.role = 'OWNER';
      g.ownerId = userId;
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'GROUP_OWNERSHIP_TRANSFERRED', entityType: 'group', entityId: groupId, metadata: { newOwnerId: userId } });
    });
    return ok({ transferred: true });
  }

  function setGroupJoinLocked(groupId, locked) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var group = state.groups.find(function (g) { return g.id === groupId; });
    if (!group) return fail('GROUP_NOT_FOUND', 'El grupo no existe.');
    if (group.ownerId !== session.user.id) return fail('FORBIDDEN', 'Solo el creador del grupo puede cambiar esta opción.');
    Store.update(function (state) { state.groups.find(function (g) { return g.id === groupId; }).joinLocked = !!locked; });
    return ok({ joinLocked: !!locked });
  }

  // ------------------------------------------------------------------
  // PremiumGol
  // ------------------------------------------------------------------
  function decorateProgram(state, program) {
    var matches = state.matches.filter(function (m) { return m.programId === program.id; }).sort(function (a, b) { return a.number - b.number; });
    return Object.assign({}, program, { matches: matches });
  }

  function listPrograms() {
    var state = Store.get();
    var programs = state.programs.map(function (p) {
      return { id: p.id, code: p.code, name: p.name, status: p.status, closeAt: p.closeAt, settledAt: p.settledAt };
    }).sort(function (a, b) { return new Date(b.closeAt) - new Date(a.closeAt); });
    return ok({ programs: programs });
  }

  function getOpenProgram() {
    var state = Store.get();
    var program = state.programs.filter(function (p) { return p.status === 'open'; }).sort(function (a, b) { return new Date(a.closeAt) - new Date(b.closeAt); })[0];
    if (!program) return fail('NO_OPEN_PROGRAM', 'No hay un programa de PremiumGol abierto en este momento.');
    return ok({ program: decorateProgram(state, program) });
  }

  function getProgram(programId) {
    var state = Store.get();
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    var settlement = state.settlements.find(function (s) { return s.programId === programId; });
    return ok({ program: decorateProgram(state, program), settlement: settlement || null });
  }

  function validatePicks(program, picks) {
    var matchIds = state_matchIdsFor(program);
    var given = Object.keys(picks || {});
    if (given.length !== 12) return 'Debes completar los 12 pronósticos.';
    for (var i = 0; i < matchIds.length; i++) {
      var mid = matchIds[i];
      if (!picks[mid] || ['L', 'E', 'V'].indexOf(picks[mid]) === -1) return 'Falta un pronóstico válido para el partido ' + (i + 1) + '.';
    }
    return null;
  }
  function state_matchIdsFor(program) { return program.matches.map(function (m) { return m.id; }); }

  function createTicketDraft(payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var programResp = getProgram(payload.programId);
    if (!programResp.ok) return programResp;
    var program = programResp.data.program;
    if (program.status !== 'open') return fail('PROGRAM_CLOSED', 'El programa ya se encuentra cerrado.');
    var pickError = validatePicks(program, payload.picks);
    if (pickError) return fail('INCOMPLETE_PICKS', pickError);
    return ok({ draft: { programId: payload.programId, picks: payload.picks, priceCents: program.ticketPriceCents } });
  }

  function purchaseTickets(payload, idempotencyKey) {
    payload = payload || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    if (!session.user.emailVerified) return fail('EMAIL_NOT_VERIFIED', 'Verifica tu correo antes de registrar jugadas.');

    var existing = state.tickets.filter(function (t) { return t.idempotencyKey === idempotencyKey; });
    if (existing.length) return ok({ tickets: existing, alreadyProcessed: true });

    var program = state.programs.find(function (p) { return p.id === payload.programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (program.status !== 'open' || new Date(program.closeAt) <= new Date()) return fail('PROGRAM_CLOSED', 'El programa ya se encuentra cerrado.');

    var matches = state.matches.filter(function (m) { return m.programId === program.id; });
    var decorated = Object.assign({}, program, { matches: matches });
    var lines = payload.tickets || [];
    if (!lines.length) return fail('EMPTY_CART', 'Agrega al menos una jugada antes de confirmar.');
    for (var i = 0; i < lines.length; i++) {
      var err = validatePicks(decorated, lines[i].picks);
      if (err) return fail('INCOMPLETE_PICKS', 'Jugada ' + (i + 1) + ': ' + err);
    }

    var totalCost = lines.length * program.ticketPriceCents;
    var wallet = Store.ensureWallet(state, session.user.id);
    if (wallet.balanceCents < totalCost) return fail('INSUFFICIENT_BALANCE', 'Saldo insuficiente. Recarga tu billetera demo antes de continuar.');

    var createdTickets = [];
    Store.update(function (state) {
      lines.forEach(function (line) {
        var ticket = {
          id: Store.uuid(), code: Store.makeCode('PLG'), userId: session.user.id, programId: payload.programId,
          picks: line.picks, priceCents: program.ticketPriceCents, status: 'ACTIVE', purchasedAt: Store.nowIso(),
          idempotencyKey: idempotencyKey, hits: null, isWinner: false, prizeCents: 0, settledAt: null
        };
        state.tickets.push(ticket);
        Object.keys(line.picks).forEach(function (mid) { state.ticketPicks.push({ id: Store.uuid(), ticketId: ticket.id, matchId: mid, pick: line.picks[mid] }); });
        Store.ledgerEntry(state, session.user.id, 'TICKET_PURCHASE', -program.ticketPriceCents, { referenceType: 'ticket', referenceId: ticket.id, description: 'Compra de ticket ' + ticket.code });
        createdTickets.push(ticket);
      });
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'TICKETS_PURCHASED', entityType: 'program', entityId: program.id, metadata: { count: lines.length, idempotencyKey: idempotencyKey } });
    });

    return ok({ tickets: createdTickets });
  }

  function getMyTickets(filters) {
    filters = filters || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var tickets = state.tickets.filter(function (t) { return t.userId === session.user.id; });
    if (filters.programId) tickets = tickets.filter(function (t) { return t.programId === filters.programId; });
    if (filters.status) tickets = tickets.filter(function (t) { return t.status === filters.status; });
    tickets = tickets.map(function (t) {
      var program = state.programs.find(function (p) { return p.id === t.programId; });
      return Object.assign({}, t, { programName: program ? program.name : '—', programStatus: program ? program.status : null });
    }).sort(function (a, b) { return new Date(b.purchasedAt) - new Date(a.purchasedAt); });
    return ok({ tickets: tickets });
  }

  function getProgramLeaderboard(programId) {
    var state = Store.get();
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    var matches = state.matches.filter(function (m) { return m.programId === programId; });
    var tickets = state.tickets.filter(function (t) { return t.programId === programId && t.status === 'ACTIVE'; });
    var finishedCount = matches.filter(function (m) { return m.result != null; }).length;

    var rows = tickets.map(function (t) {
      var r = Settlement.computeHits(t.picks, matches, program.voidPolicy);
      var user = state.users.find(function (u) { return u.id === t.userId; });
      return {
        ticketId: t.id, code: t.code, userLabel: Formatters.maskUserLabel(user), hits: r.hits, complete: r.complete,
        isWinner: t.isWinner, prizeCents: t.prizeCents, status: program.status === 'settled' ? 'Liquidado' : (r.complete ? 'Resultados completos' : 'En progreso')
      };
    }).sort(function (a, b) { return b.hits - a.hits || a.code.localeCompare(b.code); })
      .map(function (row, idx) { return Object.assign({ position: idx + 1 }, row); });

    return ok({ program: decorateProgram(state, program), totalMatches: matches.length, finishedMatches: finishedCount, rows: rows });
  }

  function getProgramPool(programId) {
    var state = Store.get();
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    var ticketCount = state.tickets.filter(function (t) { return t.programId === programId && t.status === 'ACTIVE'; }).length;
    return ok({
      prizeMode: program.prizeMode, prizePoolCents: program.prizePoolCents,
      progressiveCarryInCents: program.progressiveCarryInCents || 0,
      totalIfProgressive: (program.progressiveCarryInCents || 0) + program.prizePoolCents,
      ticketCount: ticketCount, currency: program.currency || 'USD'
    });
  }

  // ------------------------------------------------------------------
  // Administración
  // ------------------------------------------------------------------
  function validateProgramMatches(matches) {
    if (!Array.isArray(matches) || matches.length !== 12) return 'El programa debe tener exactamente 12 partidos.';
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      if (!m.home || !m.away || !m.kickoffAt || !m.competition) return 'Completa todos los campos del partido ' + (i + 1) + '.';
    }
    return null;
  }

  function createProgram(payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    if (!payload.name) return fail('MISSING_FIELDS', 'Ingresa un nombre para el programa.');
    var matchError = validateProgramMatches(payload.matches);
    if (matchError) return fail('INVALID_MATCHES', matchError);
    if (!payload.openAt || !payload.closeAt || new Date(payload.closeAt) <= new Date(payload.openAt)) return fail('INVALID_DATES', 'La fecha de cierre debe ser posterior a la fecha de apertura.');
    if (['HIGHEST_SCORE', 'PERFECT_12', 'MIXED'].indexOf(payload.prizeMode) === -1) return fail('INVALID_PRIZE_MODE', 'Selecciona una modalidad de premiación válida.');
    var prizePoolCents = Number(payload.prizePoolCents);
    if (!prizePoolCents || prizePoolCents <= 0) return fail('INVALID_POOL', 'Ingresa un pozo válido mayor a cero.');

    var program = {
      id: Store.uuid(), code: payload.code || Store.makeCode('PG'), name: payload.name, status: 'draft',
      openAt: payload.openAt, closeAt: payload.closeAt, timezone: 'America/Lima',
      estimatedSettlementAt: payload.estimatedSettlementAt || new Date(new Date(payload.closeAt).getTime() + 3 * 3600000).toISOString(),
      ticketPriceCents: state.appConfig.premiumgol.ticketPriceCents, currency: state.appConfig.premiumgol.currency,
      voidPolicy: payload.voidPolicy || 'VOID_COUNTS_AS_HIT', prizeMode: payload.prizeMode, prizePoolCents: prizePoolCents,
      progressiveCarryInCents: state.premiumgolCarryCents || 0,
      settledAt: null, settlementIdempotencyKey: null, createdAt: Store.nowIso(), cancelledAt: null, cancelReason: null
    };

    Store.update(function (state) {
      state.programs.push(program);
      payload.matches.forEach(function (m, idx) {
        state.matches.push({ id: Store.uuid(), programId: program.id, number: idx + 1, competition: m.competition, home: m.home, away: m.away, kickoffAt: m.kickoffAt, status: 'SCHEDULED', result: null });
      });
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'PROGRAM_CREATED', entityType: 'program', entityId: program.id });
    });
    return ok({ program: program });
  }

  function updateDraftProgram(programId, payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (program.status !== 'draft') return fail('PROGRAM_NOT_DRAFT', 'Solo se puede editar un programa en estado borrador.');
    if (payload.matches) {
      var matchError = validateProgramMatches(payload.matches);
      if (matchError) return fail('INVALID_MATCHES', matchError);
    }
    if (payload.prizeMode && ['HIGHEST_SCORE', 'PERFECT_12', 'MIXED'].indexOf(payload.prizeMode) === -1) return fail('INVALID_PRIZE_MODE', 'Selecciona una modalidad de premiación válida.');

    Store.update(function (state) {
      var p = state.programs.find(function (x) { return x.id === programId; });
      if (payload.name) p.name = payload.name;
      if (payload.openAt) p.openAt = payload.openAt;
      if (payload.closeAt) p.closeAt = payload.closeAt;
      if (payload.voidPolicy) p.voidPolicy = payload.voidPolicy;
      if (payload.prizeMode) p.prizeMode = payload.prizeMode;
      if (payload.prizePoolCents) p.prizePoolCents = Number(payload.prizePoolCents);
      if (payload.matches) {
        state.matches = state.matches.filter(function (m) { return m.programId !== programId; });
        payload.matches.forEach(function (m, idx) {
          state.matches.push({ id: Store.uuid(), programId: programId, number: idx + 1, competition: m.competition, home: m.home, away: m.away, kickoffAt: m.kickoffAt, status: 'SCHEDULED', result: null });
        });
      }
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'PROGRAM_UPDATED', entityType: 'program', entityId: programId });
    });
    return ok({ program: state.programs.find(function (p) { return p.id === programId; }) });
  }

  function openProgram(programId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (program.status !== 'draft') return fail('PROGRAM_NOT_DRAFT', 'Solo se puede abrir un programa en estado borrador.');
    var matches = state.matches.filter(function (m) { return m.programId === programId; });
    if (matches.length !== 12) return fail('INVALID_MATCHES', 'El programa debe tener exactamente 12 partidos antes de abrir.');

    Store.update(function (state) {
      state.programs.find(function (p) { return p.id === programId; }).status = 'open';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'PROGRAM_OPENED', entityType: 'program', entityId: programId });
    });
    return ok({ program: state.programs.find(function (p) { return p.id === programId; }) });
  }

  function closeProgram(programId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (program.status !== 'open') return fail('PROGRAM_NOT_OPEN', 'Solo se puede cerrar un programa abierto.');

    Store.update(function (state) {
      state.programs.find(function (p) { return p.id === programId; }).status = 'closed';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'PROGRAM_CLOSED', entityType: 'program', entityId: programId });
    });
    return ok({ program: state.programs.find(function (p) { return p.id === programId; }) });
  }

  function setMatchResult(matchId, result) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    if (['L', 'E', 'V', 'VOID'].indexOf(result) === -1) return fail('INVALID_RESULT', 'El resultado debe ser L, E, V o VOID.');
    var match = state.matches.find(function (m) { return m.id === matchId; });
    if (!match) return fail('MATCH_NOT_FOUND', 'El partido no existe.');
    var program = state.programs.find(function (p) { return p.id === match.programId; });
    if (!program || ['closed', 'results_pending'].indexOf(program.status) === -1) return fail('PROGRAM_NOT_EDITABLE', 'Solo se pueden cargar resultados en un programa cerrado o con resultados pendientes.');

    Store.update(function (state) {
      var m = state.matches.find(function (x) { return x.id === matchId; });
      m.result = result; m.status = result === 'VOID' ? 'VOID' : 'FINISHED';
      var p = state.programs.find(function (x) { return x.id === match.programId; });
      if (p.status === 'closed') p.status = 'results_pending';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'MATCH_RESULT_SET', entityType: 'match', entityId: matchId, metadata: { result: result } });
    });
    return ok({ match: state.matches.find(function (m) { return m.id === matchId; }) });
  }

  function correctMatchResult(matchId, result, reason) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    if (['L', 'E', 'V', 'VOID'].indexOf(result) === -1) return fail('INVALID_RESULT', 'El resultado debe ser L, E, V o VOID.');
    if (!reason || !reason.trim()) return fail('REASON_REQUIRED', 'Debes indicar el motivo de la corrección para auditoría.');
    var match = state.matches.find(function (m) { return m.id === matchId; });
    if (!match) return fail('MATCH_NOT_FOUND', 'El partido no existe.');
    var previous = match.result;

    Store.update(function (state) {
      var m = state.matches.find(function (x) { return x.id === matchId; });
      m.result = result; m.status = result === 'VOID' ? 'VOID' : 'FINISHED';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'MATCH_RESULT_CORRECTED', entityType: 'match', entityId: matchId, metadata: { previous: previous, result: result, reason: reason } });
    });
    return ok({ match: state.matches.find(function (m) { return m.id === matchId; }), notice: 'Corrección registrada. Los pagos ya liquidados no se recalculan automáticamente en este prototipo; requiere revisión manual documentada.' });
  }

  function previewSettlement(programId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (program.settledAt) return fail('PROGRAM_ALREADY_SETTLED', 'El programa ya se encuentra liquidado.');
    var result = Settlement.previewSettlement(state, programId);
    return ok(result);
  }

  function settleProgram(programId, idempotencyKey) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var result = Store.update(function (state) {
      return Settlement.settleProgram(state, programId, { actorId: session.user.id, actorRole: 'admin', idempotencyKey: idempotencyKey });
    });
    if (!result || !result.ok) return result || fail('SETTLEMENT_FAILED', 'No se pudo liquidar el programa.');
    return ok(result.settlement);
  }

  function cancelProgram(programId, reason) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var program = state.programs.find(function (p) { return p.id === programId; });
    if (!program) return fail('PROGRAM_NOT_FOUND', 'El programa no existe.');
    if (['settled', 'cancelled'].indexOf(program.status) !== -1) return fail('PROGRAM_NOT_CANCELLABLE', 'Un programa liquidado o ya cancelado no puede cancelarse.');

    Store.update(function (state) {
      var tickets = state.tickets.filter(function (t) { return t.programId === programId && t.status === 'ACTIVE'; });
      tickets.forEach(function (t) {
        t.status = 'REFUNDED';
        Store.ledgerEntry(state, t.userId, 'REFUND', t.priceCents, { referenceType: 'ticket', referenceId: t.id, description: 'Reembolso por cancelación de programa · ticket ' + t.code });
      });
      var p = state.programs.find(function (x) { return x.id === programId; });
      p.status = 'cancelled'; p.cancelledAt = Store.nowIso(); p.cancelReason = reason || 'Cancelado por administración';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'PROGRAM_CANCELLED', entityType: 'program', entityId: programId, metadata: { reason: reason, refundedTickets: tickets.length } });
    });
    return ok({ cancelled: true });
  }

  function adminListPrograms() {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var programs = state.programs.map(function (p) {
      var tickets = state.tickets.filter(function (t) { return t.programId === p.id; });
      return Object.assign({}, p, { matchCount: state.matches.filter(function (m) { return m.programId === p.id; }).length, ticketCount: tickets.length });
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    return ok({ programs: programs });
  }

  function adminGetOverview() {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var activeGolTickets = state.tickets.filter(function (t) { return t.status === 'ACTIVE'; });
    var activeBallTickets = (state.ballTickets || []).filter(function (t) { return t.status === 'ACTIVE'; });
    var golRevenueCents = activeGolTickets.reduce(function (sum, t) { return sum + t.priceCents; }, 0);
    var ballRevenueCents = activeBallTickets.reduce(function (sum, t) { return sum + t.priceCents; }, 0);
    var golPrizesCents = state.settlements.reduce(function (sum, s) { return sum + s.totalPrizeCentsDistributed; }, 0);
    var ballPrizesCents = (state.ballSettlements || []).reduce(function (sum, s) { return sum + s.totalPrizeCentsDistributed; }, 0);
    return ok({
      userCount: state.users.filter(function (u) { return u.role === 'user'; }).length,
      programCount: state.programs.length,
      ticketCount: activeGolTickets.length,
      ballDrawCount: (state.ballDraws || []).length,
      ballTicketCount: activeBallTickets.length,
      ticketRevenueCents: golRevenueCents + ballRevenueCents,
      prizesDistributedCents: golPrizesCents + ballPrizesCents,
      openPrograms: state.programs.filter(function (p) { return p.status === 'open'; }).length,
      pendingSettlement: state.programs.filter(function (p) { return p.status === 'results_pending' || p.status === 'closed'; }).length
    });
  }

  function adminGetAuditLog(limit) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    return ok({ entries: state.auditLog.slice(0, limit || 100) });
  }

  // ------------------------------------------------------------------
  // Billetera
  // ------------------------------------------------------------------
  function getWallet() {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var wallet = Store.ensureWallet(state, session.user.id);
    return ok({ wallet: wallet, demoModeNotice: state.appConfig.demoModeNotice });
  }

  function getWalletLedger(limit) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var entries = state.walletLedger.filter(function (l) { return l.userId === session.user.id; }).slice(0, limit || 200);
    return ok({ entries: entries });
  }

  function topUpDemoBalance(amountCents) {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    if (!amountCents || amountCents < 500) return fail('INVALID_AMOUNT', 'Ingresa un monto mínimo de S/ 5.00.');
    var entry;
    Store.update(function (state) {
      entry = Store.ledgerEntry(state, session.user.id, 'DEMO_TOPUP', amountCents, { description: 'Recarga de saldo demo' });
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'DEMO_TOPUP', entityType: 'wallet', entityId: entry.walletId, metadata: { amountCents: amountCents } });
    });
    return ok({ entry: entry });
  }

  function resetDemoAccount() {
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    Store.resetUserDemoAccount(session.user.id);
    return ok({ reset: true });
  }

  // ------------------------------------------------------------------
  // PremiumBall — cartilla de números
  // ------------------------------------------------------------------
  function isValidBallNumberSet(numbers, min, max, count) {
    if (!Array.isArray(numbers) || numbers.length !== count) return false;
    var seen = {};
    for (var i = 0; i < numbers.length; i++) {
      var n = Number(numbers[i]);
      if (!Number.isInteger(n) || n < min || n > max) return false;
      if (seen[n]) return false;
      seen[n] = true;
    }
    return true;
  }

  function decorateBallDraw(draw) { return Object.assign({}, draw); }

  function listBallDraws() {
    var state = Store.get();
    var draws = state.ballDraws.map(function (d) {
      return { id: d.id, code: d.code, name: d.name, status: d.status, closeAt: d.closeAt, settledAt: d.settledAt };
    }).sort(function (a, b) { return new Date(b.closeAt) - new Date(a.closeAt); });
    return ok({ draws: draws });
  }

  function getBallLeaderboard(drawId) {
    var state = Store.get();
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    var hasResults = draw.drawnNumbers && draw.drawnNumbers.length === draw.picksCount;
    var tickets = state.ballTickets.filter(function (t) { return t.drawId === drawId && t.status === 'ACTIVE'; });

    var rows = tickets.map(function (t) {
      var user = state.users.find(function (u) { return u.id === t.userId; });
      var hits = hasResults ? t.numbers.filter(function (n) { return draw.drawnNumbers.indexOf(n) !== -1; }).length : null;
      var prizeType = t.isMainWinner ? 'Premio mayor' : (t.isSiOSiWinner ? 'Sí o Sí' : (t.isBolillapaWinner ? 'Bolillapa' : null));
      return {
        ticketId: t.id, code: t.code, userLabel: Formatters.maskUserLabel(user), numbers: t.numbers, bolillapaNumber: t.bolillapaNumber,
        hits: hits, isWinner: !!prizeType, prizeType: prizeType, prizeCents: t.prizeCents,
        status: draw.status === 'settled' ? 'Liquidado' : (hasResults ? 'Resultados cargados' : 'En espera del sorteo')
      };
    }).sort(function (a, b) { return (b.hits || 0) - (a.hits || 0) || a.code.localeCompare(b.code); })
      .map(function (row, idx) { return Object.assign({ position: idx + 1 }, row); });

    return ok({ draw: decorateBallDraw(draw), rows: rows });
  }

  function getOpenBallDraw() {
    var state = Store.get();
    var draw = state.ballDraws.filter(function (d) { return d.status === 'open'; }).sort(function (a, b) { return new Date(a.closeAt) - new Date(b.closeAt); })[0];
    if (!draw) return fail('NO_OPEN_DRAW', 'No hay un sorteo de PremiumBall abierto en este momento.');
    return ok({ draw: decorateBallDraw(draw) });
  }

  function getBallDraw(drawId) {
    var state = Store.get();
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    var settlement = state.ballSettlements.find(function (s) { return s.drawId === drawId; });
    return ok({ draw: decorateBallDraw(draw), settlement: settlement || null });
  }

  function purchaseBallTickets(payload, idempotencyKey) {
    payload = payload || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    if (!session.user.emailVerified) return fail('EMAIL_NOT_VERIFIED', 'Verifica tu correo antes de registrar jugadas.');

    var existing = state.ballTickets.filter(function (t) { return t.idempotencyKey === idempotencyKey; });
    if (existing.length) return ok({ tickets: existing, alreadyProcessed: true });

    var draw = state.ballDraws.find(function (d) { return d.id === payload.drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (draw.status !== 'open' || new Date(draw.closeAt) <= new Date()) return fail('DRAW_CLOSED', 'El sorteo ya se encuentra cerrado.');

    var lines = payload.tickets || [];
    if (!lines.length) return fail('EMPTY_CART', 'Agrega al menos una jugada antes de confirmar.');
    for (var i = 0; i < lines.length; i++) {
      if (!isValidBallNumberSet(lines[i].numbers, draw.numberMin, draw.numberMax, draw.picksCount)) {
        return fail('INVALID_NUMBERS', 'Jugada ' + (i + 1) + ': elige ' + draw.picksCount + ' números distintos entre ' + draw.numberMin + ' y ' + draw.numberMax + '.');
      }
      var bp = Number(lines[i].bolillapaNumber);
      if (!Number.isInteger(bp) || bp < draw.bolillapaMin || bp > draw.bolillapaMax) {
        return fail('INVALID_BOLILLAPA', 'Jugada ' + (i + 1) + ': elige una Bolillapa entre ' + draw.bolillapaMin + ' y ' + draw.bolillapaMax + '.');
      }
    }

    var totalCost = lines.length * draw.ticketPriceCents;
    var wallet = Store.ensureWallet(state, session.user.id);
    if (wallet.balanceCents < totalCost) return fail('INSUFFICIENT_BALANCE', 'Saldo insuficiente. Recarga tu billetera demo antes de continuar.');

    var createdTickets = [];
    Store.update(function (state) {
      lines.forEach(function (line) {
        var ticket = {
          id: Store.uuid(), code: Store.makeCode('PLB'), userId: session.user.id, drawId: payload.drawId,
          numbers: line.numbers.map(Number).sort(function (a, b) { return a - b; }), bolillapaNumber: Number(line.bolillapaNumber),
          priceCents: draw.ticketPriceCents, status: 'ACTIVE', purchasedAt: Store.nowIso(), idempotencyKey: idempotencyKey,
          hits: null, isMainWinner: false, isSiOSiWinner: false, isBolillapaWinner: false, prizeCents: 0, settledAt: null
        };
        state.ballTickets.push(ticket);
        Store.ledgerEntry(state, session.user.id, 'TICKET_PURCHASE', -draw.ticketPriceCents, { referenceType: 'ballTicket', referenceId: ticket.id, description: 'Compra de ticket ' + ticket.code });
        createdTickets.push(ticket);
      });
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'user', action: 'BALL_TICKETS_PURCHASED', entityType: 'ballDraw', entityId: draw.id, metadata: { count: lines.length, idempotencyKey: idempotencyKey } });
    });

    return ok({ tickets: createdTickets });
  }

  function getMyBallTickets(filters) {
    filters = filters || {};
    var state = Store.get();
    var session = requireSession(state); if (session.error) return session.error;
    var tickets = state.ballTickets.filter(function (t) { return t.userId === session.user.id; });
    if (filters.drawId) tickets = tickets.filter(function (t) { return t.drawId === filters.drawId; });
    if (filters.status) tickets = tickets.filter(function (t) { return t.status === filters.status; });
    tickets = tickets.map(function (t) {
      var draw = state.ballDraws.find(function (d) { return d.id === t.drawId; });
      return Object.assign({}, t, { drawName: draw ? draw.name : '—', drawStatus: draw ? draw.status : null });
    }).sort(function (a, b) { return new Date(b.purchasedAt) - new Date(a.purchasedAt); });
    return ok({ tickets: tickets });
  }

  function validateBallDrawPayload(payload, cfgBall) {
    if (!payload.name) return 'MISSING_FIELDS';
    if (!payload.closeAt) return 'INVALID_DATES';
    if (!payload.mainPrizeCents || !payload.siOSiPrizeCents || !payload.bolillapaPrizeCents) return 'INVALID_PRIZES';
    return null;
  }

  function createBallDraw(payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var cfgBall = state.appConfig.premiumball;
    var errCode = validateBallDrawPayload(payload, cfgBall);
    if (errCode === 'MISSING_FIELDS') return fail('MISSING_FIELDS', 'Ingresa un nombre para el sorteo.');
    if (errCode === 'INVALID_DATES') return fail('INVALID_DATES', 'Ingresa una fecha de cierre válida.');
    if (errCode === 'INVALID_PRIZES') return fail('INVALID_PRIZES', 'Ingresa los tres montos de premio.');

    var draw = {
      id: Store.uuid(), code: Store.makeCode('PB'), name: payload.name, status: 'draft',
      openAt: Store.nowIso(), closeAt: payload.closeAt, timezone: state.appConfig.timezone,
      ticketPriceCents: cfgBall.ticketPriceCents, currency: cfgBall.currency,
      numberMin: cfgBall.numberMin, numberMax: cfgBall.numberMax, picksCount: cfgBall.picksCount,
      bolillapaMin: cfgBall.bolillapaMin, bolillapaMax: cfgBall.bolillapaMax,
      mainPrizeCents: Number(payload.mainPrizeCents), siOSiPrizeCents: Number(payload.siOSiPrizeCents), bolillapaPrizeCents: Number(payload.bolillapaPrizeCents),
      drawnNumbers: [], siOSiExtraNumbers: [], bolillapaNumber: null,
      settledAt: null, settlementIdempotencyKey: null, createdAt: Store.nowIso(), cancelledAt: null, cancelReason: null
    };

    Store.update(function (state) {
      state.ballDraws.push(draw);
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_CREATED', entityType: 'ballDraw', entityId: draw.id });
    });
    return ok({ draw: draw });
  }

  function updateDraftBallDraw(drawId, payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (draw.status !== 'draft') return fail('DRAW_NOT_DRAFT', 'Solo se puede editar un sorteo en estado borrador.');

    Store.update(function (state) {
      var d = state.ballDraws.find(function (x) { return x.id === drawId; });
      if (payload.name) d.name = payload.name;
      if (payload.closeAt) d.closeAt = payload.closeAt;
      if (payload.mainPrizeCents) d.mainPrizeCents = Number(payload.mainPrizeCents);
      if (payload.siOSiPrizeCents) d.siOSiPrizeCents = Number(payload.siOSiPrizeCents);
      if (payload.bolillapaPrizeCents) d.bolillapaPrizeCents = Number(payload.bolillapaPrizeCents);
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_UPDATED', entityType: 'ballDraw', entityId: drawId });
    });
    return ok({ draw: state.ballDraws.find(function (d) { return d.id === drawId; }) });
  }

  function openBallDraw(drawId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (draw.status !== 'draft') return fail('DRAW_NOT_DRAFT', 'Solo se puede abrir un sorteo en estado borrador.');
    Store.update(function (state) {
      state.ballDraws.find(function (d) { return d.id === drawId; }).status = 'open';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_OPENED', entityType: 'ballDraw', entityId: drawId });
    });
    return ok({ draw: state.ballDraws.find(function (d) { return d.id === drawId; }) });
  }

  function closeBallDraw(drawId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (draw.status !== 'open') return fail('DRAW_NOT_OPEN', 'Solo se puede cerrar un sorteo abierto.');
    Store.update(function (state) {
      state.ballDraws.find(function (d) { return d.id === drawId; }).status = 'results_pending';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_CLOSED', entityType: 'ballDraw', entityId: drawId });
    });
    return ok({ draw: state.ballDraws.find(function (d) { return d.id === drawId; }) });
  }

  function setBallDrawNumbers(drawId, payload) {
    payload = payload || {};
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (['closed', 'results_pending'].indexOf(draw.status) === -1) return fail('DRAW_NOT_EDITABLE', 'Solo se pueden cargar resultados en un sorteo cerrado.');
    if (!isValidBallNumberSet(payload.drawnNumbers, draw.numberMin, draw.numberMax, draw.picksCount)) {
      return fail('INVALID_NUMBERS', 'Ingresa ' + draw.picksCount + ' números ganadores válidos y distintos.');
    }
    var bp = Number(payload.bolillapaNumber);
    if (!Number.isInteger(bp) || bp < draw.bolillapaMin || bp > draw.bolillapaMax) {
      return fail('INVALID_BOLILLAPA', 'Ingresa una Bolillapa válida entre ' + draw.bolillapaMin + ' y ' + draw.bolillapaMax + '.');
    }
    Store.update(function (state) {
      var d = state.ballDraws.find(function (x) { return x.id === drawId; });
      d.drawnNumbers = payload.drawnNumbers.map(Number).sort(function (a, b) { return a - b; });
      d.bolillapaNumber = bp;
      d.status = 'results_pending';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_RESULTS_SET', entityType: 'ballDraw', entityId: drawId, metadata: { drawnNumbers: d.drawnNumbers, bolillapaNumber: bp } });
    });
    return ok({ draw: state.ballDraws.find(function (d) { return d.id === drawId; }) });
  }

  function addSiOSiNumber(drawId, number) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (!draw.drawnNumbers || draw.drawnNumbers.length !== draw.picksCount) return fail('MAIN_NUMBERS_REQUIRED', 'Ingresa primero las bolillas principales.');
    var n = Number(number);
    if (!Number.isInteger(n) || n < draw.numberMin || n > draw.numberMax) return fail('INVALID_NUMBERS', 'Número fuera de rango.');
    if (draw.drawnNumbers.indexOf(n) !== -1 || (draw.siOSiExtraNumbers || []).indexOf(n) !== -1) return fail('DUPLICATE_NUMBER', 'Esa bolilla ya fue sorteada.');
    var maxExtra = state.appConfig.premiumball.siOSiMaxExtraNumbers;
    if ((draw.siOSiExtraNumbers || []).length >= maxExtra) return fail('MAX_EXTRA_REACHED', 'Se alcanzó el máximo de bolillas extra (' + maxExtra + ').');

    Store.update(function (state) {
      var d = state.ballDraws.find(function (x) { return x.id === drawId; });
      d.siOSiExtraNumbers = (d.siOSiExtraNumbers || []).concat([n]);
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_SIOSI_NUMBER_ADDED', entityType: 'ballDraw', entityId: drawId, metadata: { number: n } });
    });
    return ok({ draw: state.ballDraws.find(function (d) { return d.id === drawId; }) });
  }

  function previewBallSettlement(drawId) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (draw.settledAt) return fail('DRAW_ALREADY_SETTLED', 'El sorteo ya se encuentra liquidado.');
    return ok(Settlement.previewBallSettlement(state, drawId));
  }

  function settleBallDraw(drawId, idempotencyKey) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var result = Store.update(function (state) {
      return Settlement.settleBallDraw(state, drawId, { actorId: session.user.id, actorRole: 'admin', idempotencyKey: idempotencyKey });
    });
    if (!result || !result.ok) return result || fail('SETTLEMENT_FAILED', 'No se pudo liquidar el sorteo.');
    return ok(result.settlement);
  }

  function cancelBallDraw(drawId, reason) {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draw = state.ballDraws.find(function (d) { return d.id === drawId; });
    if (!draw) return fail('DRAW_NOT_FOUND', 'El sorteo no existe.');
    if (['settled', 'cancelled'].indexOf(draw.status) !== -1) return fail('DRAW_NOT_CANCELLABLE', 'Un sorteo liquidado o ya cancelado no puede cancelarse.');
    Store.update(function (state) {
      var tickets = state.ballTickets.filter(function (t) { return t.drawId === drawId && t.status === 'ACTIVE'; });
      tickets.forEach(function (t) {
        t.status = 'REFUNDED';
        Store.ledgerEntry(state, t.userId, 'REFUND', t.priceCents, { referenceType: 'ballTicket', referenceId: t.id, description: 'Reembolso por cancelación de sorteo · ticket ' + t.code });
      });
      var d = state.ballDraws.find(function (x) { return x.id === drawId; });
      d.status = 'cancelled'; d.cancelledAt = Store.nowIso(); d.cancelReason = reason || 'Cancelado por administración';
      Store.pushAudit(state, { actorId: session.user.id, actorRole: 'admin', action: 'BALL_DRAW_CANCELLED', entityType: 'ballDraw', entityId: drawId, metadata: { reason: reason, refundedTickets: tickets.length } });
    });
    return ok({ cancelled: true });
  }

  function adminListBallDraws() {
    var state = Store.get();
    var session = requireAdmin(state); if (session.error) return session.error;
    var draws = state.ballDraws.map(function (d) {
      var tickets = state.ballTickets.filter(function (t) { return t.drawId === d.id; });
      return Object.assign({}, d, { ticketCount: tickets.length });
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    return ok({ draws: draws });
  }

  global.MockApi = {
    registerUser: registerUser, login: login, logout: logout, getCurrentUser: getCurrentUser, getCurrentUserSync: getCurrentUserSync,
    requestEmailVerification: requestEmailVerification, verifyEmailCode: verifyEmailCode, resendEmailVerification: resendEmailVerification,
    requestPasswordReset: requestPasswordReset, resetPassword: resetPassword, loginWithGoogle: loginWithGoogle,

    createGroup: createGroup, getMyGroups: getMyGroups, getGroup: getGroup, previewGroupByCode: previewGroupByCode, joinGroupByCode: joinGroupByCode,
    createInvitation: createInvitation, revokeInvitation: revokeInvitation, removeMember: removeMember,
    transferOwnership: transferOwnership, setGroupJoinLocked: setGroupJoinLocked,

    listPrograms: listPrograms, getOpenProgram: getOpenProgram, getProgram: getProgram, createTicketDraft: createTicketDraft,
    purchaseTickets: purchaseTickets, getMyTickets: getMyTickets, getProgramLeaderboard: getProgramLeaderboard, getProgramPool: getProgramPool,

    createProgram: createProgram, updateDraftProgram: updateDraftProgram, openProgram: openProgram, closeProgram: closeProgram,
    setMatchResult: setMatchResult, correctMatchResult: correctMatchResult, previewSettlement: previewSettlement,
    settleProgram: settleProgram, cancelProgram: cancelProgram, adminListPrograms: adminListPrograms,
    adminGetOverview: adminGetOverview, adminGetAuditLog: adminGetAuditLog,

    getWallet: getWallet, getWalletLedger: getWalletLedger, topUpDemoBalance: topUpDemoBalance, resetDemoAccount: resetDemoAccount,

    listBallDraws: listBallDraws, getBallLeaderboard: getBallLeaderboard, getOpenBallDraw: getOpenBallDraw, getBallDraw: getBallDraw, purchaseBallTickets: purchaseBallTickets,
    getMyBallTickets: getMyBallTickets, createBallDraw: createBallDraw, updateDraftBallDraw: updateDraftBallDraw,
    openBallDraw: openBallDraw, closeBallDraw: closeBallDraw, setBallDrawNumbers: setBallDrawNumbers, addSiOSiNumber: addSiOSiNumber,
    previewBallSettlement: previewBallSettlement, settleBallDraw: settleBallDraw, cancelBallDraw: cancelBallDraw,
    adminListBallDraws: adminListBallDraws,

    sanitizeUser: sanitizeUser, Validators: Validators
  };
})(window);
