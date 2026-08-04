/* PremiumLott — Formateadores de moneda, fecha y datos sensibles */
(function (global) {
  function money(cents) {
    var value = Number(cents || 0) / 100;
    return 'S/ ' + value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function moneySigned(cents) {
    var n = Number(cents || 0);
    return (n >= 0 ? '+ ' : '- ') + money(Math.abs(n));
  }

  function dateLima(iso, opts) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var options = Object.assign({ timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric' }, opts || {});
    return d.toLocaleDateString('es-PE', options);
  }

  function dateTimeLima(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var datePart = d.toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric' });
    var timePart = d.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });
    return datePart + ' · ' + timePart + ' (Lima)';
  }

  function maskDni(dni) {
    if (!dni || dni.length < 2) return '********';
    return '******' + dni.slice(-2);
  }

  function maskEmail(email) {
    if (!email || email.indexOf('@') === -1) return '***';
    var parts = email.split('@');
    var local = parts[0];
    var visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
    return visible + '***@' + parts[1];
  }

  function maskUserLabel(user) {
    if (!user) return 'Usuario';
    var first = (user.firstName || '').trim();
    var lastInitial = (user.lastName || '').trim().charAt(0);
    return (first || 'Jugador') + (lastInitial ? ' ' + lastInitial + '.' : '');
  }

  function initials(name) {
    if (!name) return 'PL';
    return name.trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  }

  function programStatusLabel(status) {
    var map = {
      draft: 'Borrador', open: 'Abierto', closed: 'Cerrado', results_pending: 'Resultados pendientes',
      settled: 'Liquidado', cancelled: 'Cancelado'
    };
    return map[status] || status;
  }

  function prizeModeLabel(mode) {
    var map = {
      HIGHEST_SCORE: 'Mayor cantidad de aciertos', PERFECT_12: '12 aciertos o pozo acumulado', MIXED: 'Mixta (semanal + acumulado)'
    };
    return map[mode] || mode;
  }

  function pickLabel(pick) {
    var map = { L: 'Local', E: 'Empate', V: 'Visitante' };
    return map[pick] || '—';
  }

  function invitationStatusLabel(status) {
    var map = { PENDING: 'Pendiente', ACCEPTED: 'Aceptada', EXPIRED: 'Expirada', REVOKED: 'Revocada' };
    return map[status] || status;
  }

  function ledgerTypeLabel(type) {
    var map = {
      DEMO_TOPUP: 'Recarga demo', TICKET_PURCHASE: 'Compra de ticket', PRIZE_CREDIT: 'Premio acreditado',
      REFUND: 'Reembolso', ADMIN_ADJUSTMENT: 'Ajuste administrativo'
    };
    return map[type] || type;
  }

  global.Formatters = {
    money: money, moneySigned: moneySigned, dateLima: dateLima, dateTimeLima: dateTimeLima,
    maskDni: maskDni, maskEmail: maskEmail, maskUserLabel: maskUserLabel, initials: initials,
    programStatusLabel: programStatusLabel, prizeModeLabel: prizeModeLabel, pickLabel: pickLabel,
    invitationStatusLabel: invitationStatusLabel, ledgerTypeLabel: ledgerTypeLabel
  };
})(window);
