/* PremiumLott — ApiClient
 * Fachada pública y estable que usan las páginas y los servicios de dominio.
 * Hoy delega en MockApi (localStorage). En la fase de backend, este archivo
 * cambiará su `backend` por AppsScriptApi (fetch a Google Apps Script) sin
 * que ninguna pantalla deba reescribirse, porque los nombres y firmas de
 * método se mantienen idénticos a los documentados en docs/APPS_SCRIPT_API_CONTRACT.md.
 * Se envuelve cada método en una Promesa con latencia simulada para que las
 * pantallas ya trabajen con async/await tal como lo harán contra el backend real.
 */
(function (global) {
  var SIMULATED_LATENCY_MS = 220;
  var backend = global.MockApi;

  function wrapAsync(fn) {
    return function () {
      var args = arguments;
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(fn.apply(null, args)); }, SIMULATED_LATENCY_MS);
      });
    };
  }

  var Api = {};
  Object.keys(backend).forEach(function (name) {
    Api[name] = typeof backend[name] === 'function' ? wrapAsync(backend[name]) : backend[name];
  });

  global.Api = Api;
})(window);
