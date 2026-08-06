(function () {
  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;
    document.querySelector('[data-verify-banner]').hidden = user.emailVerified;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
