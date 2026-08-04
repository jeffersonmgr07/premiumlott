(function () {
  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    var capacityInput = document.querySelector('[data-capacity-input]');
    var capacityButtons = document.querySelectorAll('[data-capacity-options] button');
    capacityButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        capacityButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        capacityInput.value = btn.dataset.cap;
      });
    });

    var modeOptions = document.querySelectorAll('[data-mode-options] .mode-option');
    modeOptions.forEach(function (opt) {
      opt.addEventListener('click', function () {
        modeOptions.forEach(function (o) { o.classList.remove('active'); });
        opt.classList.add('active');
        opt.querySelector('input').checked = true;
      });
    });

    var form = document.querySelector('[data-create-group-form]');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      form.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
      var fd = new FormData(form);
      var submitBtn = form.querySelector('[data-submit-btn]');
      submitBtn.disabled = true;
      var res = await Api.createGroup({
        name: fd.get('name'), description: fd.get('description'), capacity: Number(fd.get('capacity')),
        prizeMode: fd.get('prizeMode'), rulesAccepted: fd.get('rulesAccepted') === 'on'
      });
      submitBtn.disabled = false;
      if (!res.ok) {
        var map = { MISSING_FIELDS: 'name', INVALID_CAPACITY: 'capacity', INVALID_PRIZE_MODE: 'prizeMode' };
        var field = map[res.error.code];
        if (field) form.querySelector('[data-error-for="' + field + '"]').textContent = res.error.message;
        else UI.toast(res.error.message, 'error');
        return;
      }
      UI.toast('Grupo creado con éxito.', 'success');
      setTimeout(function () { location.href = 'detalle.html?id=' + res.data.group.id; }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
