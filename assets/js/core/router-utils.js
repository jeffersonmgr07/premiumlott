/* PremiumLott — Utilidades de rutas relativas compatibles con GitHub Pages */
(function (global) {
  var ONE_LEVEL = ['/juegos/', '/premiumgol/', '/admin/', '/premiumball/', '/bingopremium/', '/raspaditaspremium/', '/megalott/'];

  function pathPrefix() {
    var path = location.pathname;
    if (path.indexOf('/pages/') !== -1) return '../../';
    for (var i = 0; i < ONE_LEVEL.length; i++) {
      if (path.indexOf(ONE_LEVEL[i]) !== -1) return '../';
    }
    return '';
  }

  function getQueryParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function redirectWithReturn(loginPathFromRoot, currentPageRelativeToRoot) {
    var prefix = pathPrefix();
    var current = currentPageRelativeToRoot || (location.pathname.split('/').pop() || 'index.html');
    location.href = prefix + loginPathFromRoot + '?redirect=' + encodeURIComponent(current);
  }

  function currentPageId() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  global.RouterUtils = {
    pathPrefix: pathPrefix,
    getQueryParam: getQueryParam,
    redirectWithReturn: redirectWithReturn,
    currentPageId: currentPageId
  };
})(window);
