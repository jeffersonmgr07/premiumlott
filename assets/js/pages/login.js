(function () {
  function clearErrors(form) {
    form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
  }

  function init() {
    var form = document.querySelector('[data-login-form]');
    var googleBtn = document.querySelector('[data-google-btn]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(form);
      var submitBtn = form.querySelector('[data-submit-btn]');
      submitBtn.disabled = true;
      var fd = new FormData(form);
      Api.login({ email: fd.get('email'), password: fd.get('password') }).then(function (res) {
        submitBtn.disabled = false;
        if (!res.ok) {
          var target = form.querySelector('[data-error-for="password"]');
          if (target) target.textContent = res.error.message;
          UI.toast(res.error.message, 'error');
          return;
        }
        UI.toast('Bienvenido, ' + res.data.user.firstName + '.', 'success');
        var redirect = RouterUtils.getQueryParam('redirect') || 'dashboard.html';
        setTimeout(function () { location.href = redirect; }, 400);
      });
    });

    googleBtn.addEventListener('click', function () {
      UI.alertModal('Continuar con Google', 'En esta fase demo, el acceso con Google solo simula el flujo de onboarding. Te llevaremos al registro para completar tus datos como lo haría un usuario nuevo de Google.').then(function () {
        location.href = 'registro.html?google=1';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
