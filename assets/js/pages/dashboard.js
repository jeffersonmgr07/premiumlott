(function () {
  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    document.querySelector('[data-verify-banner]').hidden = user.emailVerified;

    var groupsRes = await Api.getMyGroups();
    document.querySelector('[data-group-count]').textContent = groupsRes.ok ? groupsRes.data.groups.length : '0';

    var host = document.querySelector('[data-groups-preview]');
    if (!groupsRes.ok || !groupsRes.data.groups.length) {
      host.innerHTML = '<div class="card compact"><p class="muted">Aún no perteneces a ningún grupo.</p><a class="btn btn-primary" style="margin-top:.6rem" href="grupos/crear.html">Crear mi primer grupo</a></div>';
      return;
    }
    host.innerHTML = groupsRes.data.groups.slice(0, 3).map(function (g) {
      return '<a class="card compact" href="grupos/detalle.html?id=' + g.id + '"><span class="pill">' + Formatters.prizeModeLabel(g.prizeMode) + '</span><h3>' + g.name + '</h3><p class="muted">' + g.memberCount + '/' + g.capacity + ' miembros</p></a>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
