(function () {
  var previewedGroup = null;

  async function init() {
    var user = await AuthService.requireAuth('login.html');
    if (!user) return;

    var prefillCode = RouterUtils.getQueryParam('code');
    if (prefillCode) document.querySelector('#code').value = prefillCode.toUpperCase();

    document.querySelector('[data-join-form]').addEventListener('submit', async function (e) {
      e.preventDefault();
      var form = e.target;
      form.querySelector('[data-error-for="code"]').textContent = '';
      var code = new FormData(form).get('code');
      var res = await Api.previewGroupByCode(code);
      if (!res.ok) { form.querySelector('[data-error-for="code"]').textContent = res.error.message; return; }
      previewedGroup = res.data.group;
      document.querySelector('[data-preview]').hidden = false;
      document.querySelector('[data-preview-avatar]').textContent = previewedGroup.avatarInitials;
      document.querySelector('[data-preview-name]').textContent = previewedGroup.name;
      document.querySelector('[data-preview-desc]').textContent = previewedGroup.description || 'Sin descripción';
      document.querySelector('[data-preview-members]').textContent = previewedGroup.memberCount + '/' + previewedGroup.capacity;
      document.querySelector('[data-preview-mode]').textContent = Formatters.prizeModeLabel(previewedGroup.prizeMode);
    });

    document.querySelector('[data-confirm-join]').addEventListener('click', async function () {
      if (!previewedGroup) return;
      var res = await Api.joinGroupByCode(previewedGroup.code);
      if (!res.ok) { UI.toast(res.error.message, 'error'); return; }
      UI.toast('Te uniste al grupo ' + previewedGroup.name + '.', 'success');
      setTimeout(function () { location.href = 'detalle.html?id=' + previewedGroup.id; }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
