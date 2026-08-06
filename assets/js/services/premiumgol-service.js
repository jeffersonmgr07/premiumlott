/* PremiumLott — PremiumGolService: carrito de jugadas y checkout idempotente
 * Un solo programa global compartido por todos los jugadores: el carrito se
 * identifica únicamente por programId (ya no requiere grupo).
 */
(function (global) {
  var CART_PREFIX = 'premiumlott_cart_';
  var inFlightCheckouts = {};

  function cartKey(programId) { return CART_PREFIX + programId; }

  function getCart(programId) {
    try { return JSON.parse(sessionStorage.getItem(cartKey(programId)) || '[]'); }
    catch (e) { return []; }
  }

  function saveCart(programId, cart) {
    sessionStorage.setItem(cartKey(programId), JSON.stringify(cart));
    return cart;
  }

  function addToCart(programId, picks) {
    var cart = getCart(programId);
    cart.push({ localId: Store.uuid(), picks: Object.assign({}, picks) });
    return saveCart(programId, cart);
  }

  function updateInCart(programId, localId, picks) {
    var cart = getCart(programId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) line.picks = Object.assign({}, picks);
    return saveCart(programId, cart);
  }

  function duplicateInCart(programId, localId) {
    var cart = getCart(programId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) cart.push({ localId: Store.uuid(), picks: Object.assign({}, line.picks) });
    return saveCart(programId, cart);
  }

  function removeFromCart(programId, localId) {
    var cart = getCart(programId).filter(function (c) { return c.localId !== localId; });
    return saveCart(programId, cart);
  }

  function clearCart(programId) {
    sessionStorage.removeItem(cartKey(programId));
  }

  function randomPicks(program) {
    var options = ['L', 'E', 'V'];
    var picks = {};
    program.matches.forEach(function (m) { picks[m.id] = options[Math.floor(Math.random() * 3)]; });
    return picks;
  }

  function cartTotals(cart, program) {
    var count = cart.length;
    return {
      count: count,
      subtotalCents: count * program.ticketPriceCents,
      isComplete: cart.every(function (c) { return program.matches.every(function (m) { return !!c.picks[m.id]; }); })
    };
  }

  function checkout(programId) {
    if (inFlightCheckouts[programId]) return inFlightCheckouts[programId];

    var cart = getCart(programId);
    var idemStorageKey = 'premiumlott_idem_' + programId;
    var idempotencyKey = sessionStorage.getItem(idemStorageKey) || Store.uuid();
    sessionStorage.setItem(idemStorageKey, idempotencyKey);

    var promise = Api.purchaseTickets({ programId: programId, tickets: cart.map(function (c) { return { picks: c.picks }; }) }, idempotencyKey)
      .then(function (res) {
        delete inFlightCheckouts[programId];
        if (res.ok) {
          clearCart(programId);
          sessionStorage.removeItem(idemStorageKey);
        }
        return res;
      });
    inFlightCheckouts[programId] = promise;
    return promise;
  }

  global.PremiumGolService = {
    getCart: getCart, addToCart: addToCart, updateInCart: updateInCart, duplicateInCart: duplicateInCart,
    removeFromCart: removeFromCart, clearCart: clearCart, randomPicks: randomPicks, cartTotals: cartTotals, checkout: checkout
  };
})(window);
