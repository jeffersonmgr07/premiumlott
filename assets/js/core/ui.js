/* PremiumLott — Toasts, modales y confirmaciones sin alert() nativo */
(function (global) {
  var toastHost = null;
  var modalHost = null;

  function ensureToastHost() {
    if (toastHost) return toastHost;
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    toastHost.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastHost);
    return toastHost;
  }

  function toast(message, type) {
    var host = ensureToastHost();
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 250);
    }, 4200);
  }

  function ensureModalHost() {
    if (modalHost) return modalHost;
    modalHost = document.createElement('div');
    modalHost.className = 'modal-overlay';
    modalHost.hidden = true;
    modalHost.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true"><button class="modal-close" type="button" aria-label="Cerrar">×</button><div class="modal-body"></div></div>';
    document.body.appendChild(modalHost);
    modalHost.addEventListener('click', function (e) { if (e.target === modalHost) closeModal(); });
    modalHost.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalHost.hidden) closeModal(); });
    return modalHost;
  }

  function openModal(html) {
    var host = ensureModalHost();
    host.querySelector('.modal-body').innerHTML = html;
    host.hidden = false;
    var focusable = host.querySelector('button, input, select, textarea, a[href]');
    if (focusable) focusable.focus();
    return host;
  }

  function closeModal() {
    if (modalHost) modalHost.hidden = true;
  }

  function alertModal(title, message) {
    return new Promise(function (resolve) {
      var host = openModal(
        '<h3>' + title + '</h3><p class="muted" style="margin-top:.5rem">' + message + '</p>' +
        '<div class="modal-actions"><button class="btn btn-primary" data-ok>Entendido</button></div>'
      );
      host.querySelector('[data-ok]').addEventListener('click', function () { closeModal(); resolve(true); });
    });
  }

  function confirmModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var host = openModal(
        '<h3>' + (opts.title || '¿Confirmar acción?') + '</h3>' +
        '<p class="muted" style="margin-top:.5rem">' + (opts.body || '') + '</p>' +
        '<div class="modal-actions"><button class="btn btn-ghost" data-cancel>' + (opts.cancelText || 'Cancelar') + '</button>' +
        '<button class="btn btn-primary" data-confirm>' + (opts.confirmText || 'Confirmar') + '</button></div>'
      );
      host.querySelector('[data-cancel]').addEventListener('click', function () { closeModal(); resolve(false); });
      host.querySelector('[data-confirm]').addEventListener('click', function () { closeModal(); resolve(true); });
    });
  }

  function skeletonRows(count, colspan) {
    var rows = '';
    for (var i = 0; i < count; i++) {
      rows += '<tr class="skeleton-row"><td colspan="' + colspan + '"><span class="skeleton-bar"></span></td></tr>';
    }
    return rows;
  }

  global.UI = {
    toast: toast, openModal: openModal, closeModal: closeModal, alertModal: alertModal,
    confirmModal: confirmModal, skeletonRows: skeletonRows
  };
})(window);
