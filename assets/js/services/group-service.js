/* PremiumLott — GroupService: utilidades compartidas por las pantallas de grupos */
(function (global) {
  function capacityQuickOptions() {
    return Store.get().appConfig.suggestedCapacities;
  }

  function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        UI.toast(successMessage || 'Copiado al portapapeles.', 'success');
      }).catch(function () { UI.toast('No se pudo copiar. Cópialo manualmente: ' + text, 'error'); });
    }
    UI.toast('Copia manualmente: ' + text, 'info');
    return Promise.resolve();
  }

  function absoluteInviteLink(group) {
    var prefix = RouterUtils.pathPrefix();
    var basePath = location.href.split(prefix)[0].split('#')[0];
    var root = prefix ? location.origin + location.pathname.split(prefix)[0] : location.origin + location.pathname.replace(/[^/]*$/, '');
    return root + '/' + group.inviteLink;
  }

  function formatGroupSummary(group) {
    return group.memberCount + '/' + group.capacity + ' miembros · ' + Formatters.prizeModeLabel(group.prizeMode);
  }

  global.GroupService = {
    capacityQuickOptions: capacityQuickOptions,
    copyToClipboard: copyToClipboard,
    absoluteInviteLink: absoluteInviteLink,
    formatGroupSummary: formatGroupSummary
  };
})(window);
