(function () {
  var FIELD_ERROR_MAP = {
    MISSING_FIELDS: 'firstName', INVALID_EMAIL: 'email', EMAIL_ALREADY_EXISTS: 'email', INVALID_DNI: 'dni',
    DNI_ALREADY_EXISTS: 'dni', INVALID_PHONE: 'phone', UNDERAGE: 'birthDate', WEAK_PASSWORD: 'password',
    PASSWORD_MISMATCH: 'confirmPassword'
  };

  function clearErrors(form) { form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; }); }

  function init() {
    var form = document.querySelector('[data-register-form]');
    if (RouterUtils.getQueryParam('google') === '1') {
      UI.toast('Completa tus datos para vincular tu cuenta demo de Google.', 'info');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(form);
      var submitBtn = form.querySelector('[data-submit-btn]');
      submitBtn.disabled = true;
      var fd = new FormData(form);
      var payload = {
        firstName: fd.get('firstName'), lastName: fd.get('lastName'), dni: fd.get('dni'), phone: fd.get('phone'),
        email: fd.get('email'), birthDate: fd.get('birthDate'), password: fd.get('password'), confirmPassword: fd.get('confirmPassword'),
        termsAccepted: fd.get('termsAccepted') === 'on', privacyAccepted: fd.get('privacyAccepted') === 'on',
        ageDeclared: fd.get('ageDeclared') === 'on', marketingConsent: fd.get('marketingConsent') === 'on'
      };

      Api.registerUser(payload).then(function (res) {
        submitBtn.disabled = false;
        if (!res.ok) {
          var fieldKey = FIELD_ERROR_MAP[res.error.code];
          var target = fieldKey ? form.querySelector('[data-error-for="' + fieldKey + '"]') : null;
          if (target) target.textContent = res.error.message; else UI.toast(res.error.message, 'error');
          return;
        }
        sessionStorage.setItem('premiumlott_pending_verification_user', res.data.user.id);
        UI.toast('Cuenta creada. Verifica tu correo para continuar.', 'success');
        setTimeout(function () { location.href = 'verificar-correo.html'; }, 500);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
