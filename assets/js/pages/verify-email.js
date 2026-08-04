(function () {
  var COOLDOWN_SECONDS = 30;
  var cooldownInterval = null;

  function startCooldown(seconds) {
    var btn = document.querySelector('[data-resend-btn]');
    var timerEl = document.querySelector('[data-resend-timer]');
    var remaining = seconds;
    btn.disabled = true;
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(function () {
      remaining--;
      timerEl.textContent = remaining > 0 ? '(' + remaining + 's)' : '';
      if (remaining <= 0) { clearInterval(cooldownInterval); btn.disabled = false; }
    }, 1000);
  }

  function showDemoCode(code) {
    document.querySelector('[data-demo-code-box]').hidden = false;
    document.querySelector('[data-demo-code]').textContent = code;
  }

  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;
    if (user.emailVerified) { UI.toast('Tu correo ya está verificado.', 'info'); location.href = 'dashboard.html'; return; }

    var res = await Api.requestEmailVerification({ userId: user.id });
    if (res.ok) showDemoCode(res.data.demoCode);
    startCooldown(COOLDOWN_SECONDS);

    document.querySelector('[data-otp-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
      var code = new FormData(form).get('code');
      var submitBtn = form.querySelector('[data-submit-btn]');
      submitBtn.disabled = true;
      Api.verifyEmailCode({ userId: user.id, code: code }).then(function (res) {
        submitBtn.disabled = false;
        if (!res.ok) {
          form.querySelector('[data-error-for="code"]').textContent = res.error.message;
          return;
        }
        UI.toast('Correo verificado correctamente.', 'success');
        setTimeout(function () { location.href = 'dashboard.html'; }, 500);
      });
    });

    document.querySelector('[data-resend-btn]').addEventListener('click', function () {
      Api.resendEmailVerification({ userId: user.id }).then(function (res) {
        if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
        showDemoCode(res.data.demoCode);
        startCooldown(COOLDOWN_SECONDS);
        UI.toast('Nuevo código de prueba generado.', 'success');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
