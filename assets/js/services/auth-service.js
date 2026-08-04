/* PremiumLott — AuthService: guards de sesión reutilizados por las páginas */
(function (global) {
  function requireAuth(redirectPage) {
    return Api.getCurrentUser().then(function (res) {
      var user = res.ok ? res.data.user : null;
      if (!user) {
        RouterUtils.redirectWithReturn(redirectPage || 'login.html', RouterUtils.currentPageId());
        return null;
      }
      return user;
    });
  }

  function requireAdmin() {
    return Api.getCurrentUser().then(function (res) {
      var user = res.ok ? res.data.user : null;
      if (!user || user.role !== 'admin') {
        RouterUtils.redirectWithReturn('login.html', RouterUtils.currentPageId());
        return null;
      }
      return user;
    });
  }

  function logoutAndRedirect() {
    return Api.logout().then(function () {
      var prefix = RouterUtils.pathPrefix();
      location.href = prefix + 'index.html';
    });
  }

  function passwordPolicyHint() {
    return 'Mínimo 8 caracteres, con al menos una letra y un número.';
  }

  global.AuthService = {
    requireAuth: requireAuth,
    requireAdmin: requireAdmin,
    logoutAndRedirect: logoutAndRedirect,
    passwordPolicyHint: passwordPolicyHint
  };
})(window);
