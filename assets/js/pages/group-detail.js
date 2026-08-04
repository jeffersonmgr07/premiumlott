(function () {
  var groupId = null;

  async function loadPool(group) {
    var openRes = await Api.getOpenProgram();
    if (!openRes.ok) {
      document.querySelector('[data-pool-open]').textContent = 'Sin programa abierto';
      document.querySelector('[data-play-link]').setAttribute('href', '#');
      document.querySelector('[data-leaderboard-link]').hidden = true;
      return;
    }
    var program = openRes.data.program;
    var poolRes = await Api.getGroupPool(groupId, program.id);
    var openPoolCents = poolRes.ok ? (group.prizeMode === 'PERFECT_12' ? 0 : poolRes.data.pool.weeklyPoolCents) : 0;
    document.querySelector('[data-pool-open]').textContent = Formatters.money(openPoolCents);
    document.querySelector('[data-pool-progressive]').textContent = Formatters.money(group.progressivePoolCents);
    document.querySelector('[data-play-link]').setAttribute('href', '../premiumgol/jugar.html?groupId=' + groupId + '&programId=' + program.id);
    document.querySelector('[data-leaderboard-link]').setAttribute('href', 'clasificacion.html?groupId=' + groupId + '&programId=' + program.id);
  }

  function renderInvitations(invitations) {
    var host = document.querySelector('[data-invitations-list]');
    if (!invitations.length) { host.innerHTML = '<p class="mini muted">Sin invitaciones generadas todavía.</p>'; return; }
    host.innerHTML = invitations.map(function (inv) {
      var badge = { PENDING: 'info', ACCEPTED: 'ok', EXPIRED: 'pending', REVOKED: 'danger' }[inv.status];
      return '<div class="member-row"><span>' + inv.code + '</span><span class="status ' + badge + '">' + Formatters.invitationStatusLabel(inv.status) + '</span>' +
        (inv.status === 'PENDING' ? '<button class="btn btn-ghost" data-revoke="' + inv.id + '" style="padding:.3rem .7rem;font-size:.72rem">Revocar</button>' : '<span></span>') + '</div>';
    }).join('');
    host.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var res = await Api.revokeInvitation(btn.dataset.revoke);
        if (res.ok) { UI.toast('Invitación revocada.', 'info'); load(); } else UI.toast(res.error.message, 'error');
      });
    });
  }

  async function load() {
    var res = await Api.getGroup(groupId);
    if (!res.ok) {
      document.querySelector('[data-loading]').innerHTML = '<div class="empty-state"><span class="pill">No disponible</span><p class="muted">' + res.error.message + '</p><a class="btn btn-primary" href="index.html">Volver a mis grupos</a></div>';
      return;
    }
    document.querySelector('[data-loading]').hidden = true;
    var content = document.querySelector('[data-content]');
    content.hidden = false;
    var group = res.data.group;

    document.querySelector('[data-avatar]').textContent = group.avatarInitials;
    document.querySelector('[data-name]').textContent = group.name;
    document.querySelector('[data-mode-label]').textContent = Formatters.prizeModeLabel(group.prizeMode);
    document.querySelector('[data-description]').textContent = group.description || 'Sin descripción.';
    document.querySelector('[data-member-count]').textContent = group.memberCount + '/' + group.capacity;

    document.querySelector('[data-members-list]').innerHTML = res.data.members.map(function (m) {
      return '<div class="member-row"><span>' + m.label + '</span>' + (m.role === 'OWNER' ? '<span class="owner-tag">Creador</span>' : '<span class="muted">Miembro</span>') + '</div>';
    }).join('');

    if (group.isOwner) {
      var panel = document.querySelector('[data-owner-panel]');
      panel.hidden = false;
      document.querySelector('[data-group-code]').textContent = group.code;
      document.querySelector('[data-lock-join]').checked = group.joinLocked;
      renderInvitations(res.data.invitations);

      panel.querySelector('[data-copy-code]').onclick = function () { GroupService.copyToClipboard(group.code, 'Código copiado.'); };
      panel.querySelector('[data-copy-link]').onclick = function () { GroupService.copyToClipboard(GroupService.absoluteInviteLink(group), 'Enlace copiado.'); };
      panel.querySelector('[data-new-invite]').onclick = async function () {
        var r = await Api.createInvitation(groupId);
        if (r.ok) { UI.toast('Nueva invitación generada.', 'success'); load(); } else UI.toast(r.error.message, 'error');
      };
      panel.querySelector('[data-lock-join]').onchange = async function (e) {
        var r = await Api.setGroupJoinLocked(groupId, e.target.checked);
        if (r.ok) UI.toast(e.target.checked ? 'Ingreso de nuevos miembros cerrado.' : 'Ingreso de nuevos miembros abierto.', 'info');
      };
    }

    await loadPool(group);
  }

  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;
    groupId = RouterUtils.getQueryParam('id');
    if (!groupId) { location.href = 'index.html'; return; }
    load();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
