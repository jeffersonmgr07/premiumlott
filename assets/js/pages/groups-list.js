(function () {
  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;
    var res = await Api.getMyGroups();
    var host = document.querySelector('[data-groups-host]');
    if (!res.ok || !res.data.groups.length) {
      host.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><span class="pill">Sin grupos aún</span><h3>Crea tu primer grupo</h3><p class="muted">Invita a tus amigos y compitan juntos en PremiumGol.</p><a class="btn btn-primary" href="crear.html">Crear grupo</a></div>';
      return;
    }
    host.innerHTML = res.data.groups.map(function (g) {
      return '<a class="card group-card" href="detalle.html?id=' + g.id + '">' +
        '<div class="group-card-head"><div class="group-avatar">' + g.avatarInitials + '</div><div><span class="pill">' + Formatters.prizeModeLabel(g.prizeMode) + '</span><h3>' + g.name + '</h3></div></div>' +
        '<p class="muted">' + (g.description || 'Sin descripción') + '</p>' +
        '<div class="metric"><span>Miembros</span><strong>' + g.memberCount + '/' + g.capacity + '</strong></div>' +
        (g.isOwner ? '<span class="owner-tag">Eres el creador</span>' : '') +
        '</a>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
