/* PremiumLott — PremiumGolService: carrito de jugadas y checkout idempotente */
(function (global) {
  var CART_PREFIX = 'premiumlott_cart_';
  var inFlightCheckouts = {};

  function cartKey(groupId, programId) { return CART_PREFIX + groupId + '_' + programId; }

  function getCart(groupId, programId) {
    try { return JSON.parse(sessionStorage.getItem(cartKey(groupId, programId)) || '[]'); }
    catch (e) { return []; }
  }

  function saveCart(groupId, programId, cart) {
    sessionStorage.setItem(cartKey(groupId, programId), JSON.stringify(cart));
    return cart;
  }

  function addToCart(groupId, programId, picks) {
    var cart = getCart(groupId, programId);
    cart.push({ localId: Store.uuid(), picks: Object.assign({}, picks) });
    return saveCart(groupId, programId, cart);
  }

  function updateInCart(groupId, programId, localId, picks) {
    var cart = getCart(groupId, programId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) line.picks = Object.assign({}, picks);
    return saveCart(groupId, programId, cart);
  }

  function duplicateInCart(groupId, programId, localId) {
    var cart = getCart(groupId, programId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) cart.push({ localId: Store.uuid(), picks: Object.assign({}, line.picks) });
    return saveCart(groupId, programId, cart);
  }

  function removeFromCart(groupId, programId, localId) {
    var cart = getCart(groupId, programId).filter(function (c) { return c.localId !== localId; });
    return saveCart(groupId, programId, cart);
  }

  function clearCart(groupId, programId) {
    sessionStorage.removeItem(cartKey(groupId, programId));
  }

  function randomPicks(program) {
    var options = ['L', 'E', 'V'];
    var picks = {};
    program.matches.forEach(function (m) { picks[m.id] = options[Math.floor(Math.random() * 3)]; });
    return picks;
  }

  function cartTotals(cart, program) {
    var cfg = Store.get().appConfig;
    var count = cart.length;
    return {
      count: count,
      subtotalCents: count * cfg.ticketPriceCents,
      poolCents: count * cfg.groupPoolContributionCents,
      feeCents: count * cfg.houseFeeCents,
      isComplete: cart.every(function (c) { return program.matches.every(function (m) { return !!c.picks[m.id]; }); })
    };
  }

  function checkout(groupId, programId) {
    var key = groupId + '_' + programId;
    if (inFlightCheckouts[key]) return inFlightCheckouts[key];

    var cart = getCart(groupId, programId);
    var idempotencyKey = sessionStorage.getItem('premiumlott_idem_' + key) || Store.uuid();
    sessionStorage.setItem('premiumlott_idem_' + key, idempotencyKey);

    var promise = Api.purchaseTickets({ groupId: groupId, programId: programId, tickets: cart.map(function (c) { return { picks: c.picks }; }) }, idempotencyKey)
      .then(function (res) {
        delete inFlightCheckouts[key];
        if (res.ok) {
          clearCart(groupId, programId);
          sessionStorage.removeItem('premiumlott_idem_' + key);
        }
        return res;
      });
    inFlightCheckouts[key] = promise;
    return promise;
  }

  global.PremiumGolService = {
    getCart: getCart, addToCart: addToCart, updateInCart: updateInCart, duplicateInCart: duplicateInCart,
    removeFromCart: removeFromCart, clearCart: clearCart, randomPicks: randomPicks, cartTotals: cartTotals, checkout: checkout
  };
})(window);
