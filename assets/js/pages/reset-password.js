(function () {
  function init() {
    var requestForm = document.querySelector('[data-request-form]');
    var resetForm = document.querySelector('[data-reset-form]');
    var email = null;

    requestForm.addEventListener('submit', function (e) {
      e.preventDefault();
      email = new FormData(requestForm).get('email');
      Api.requestPasswordReset({ email: email }).then(function (res) {
        if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
        if (res.data.demoCode) {
          document.querySelector('[data-demo-code-box]').hidden = false;
          document.querySelector('[data-demo-code]').textContent = res.data.demoCode;
        }
        UI.toast(res.data.message, 'info');
        resetForm.hidden = false;
      });
    });

    resetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      resetForm.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
      var fd = new FormData(resetForm);
      var submitBtn = resetForm.querySelector('[data-submit-btn]');
      submitBtn.disabled = true;
      Api.resetPassword({ email: email, code: fd.get('code'), newPassword: fd.get('newPassword'), confirmPassword: fd.get('confirmPassword') }).then(function (res) {
        submitBtn.disabled = false;
        if (!res.ok) {
          var map = { INVALID_CODE: 'code', CODE_EXPIRED: 'code', WEAK_PASSWORD: 'newPassword', PASSWORD_MISMATCH: 'confirmPassword' };
          var field = map[res.error.code];
          if (field) resetForm.querySelector('[data-error-for="' + field + '"]').textContent = res.error.message;
          else UI.toast(res.error.message, 'error');
          return;
        }
        UI.toast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
        setTimeout(function () { location.href = 'login.html'; }, 600);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
