/* PremiumLott — PremiumBallService: carrito de cartillas de números y checkout idempotente */
(function (global) {
  var CART_PREFIX = 'premiumlott_ballcart_';
  var inFlightCheckouts = {};

  function cartKey(drawId) { return CART_PREFIX + drawId; }

  function getCart(drawId) {
    try { return JSON.parse(sessionStorage.getItem(cartKey(drawId)) || '[]'); }
    catch (e) { return []; }
  }

  function saveCart(drawId, cart) {
    sessionStorage.setItem(cartKey(drawId), JSON.stringify(cart));
    return cart;
  }

  function addToCart(drawId, numbers, bolillapaNumber) {
    var cart = getCart(drawId);
    cart.push({ localId: Store.uuid(), numbers: numbers.slice(), bolillapaNumber: bolillapaNumber });
    return saveCart(drawId, cart);
  }

  function updateInCart(drawId, localId, numbers, bolillapaNumber) {
    var cart = getCart(drawId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) { line.numbers = numbers.slice(); line.bolillapaNumber = bolillapaNumber; }
    return saveCart(drawId, cart);
  }

  function duplicateInCart(drawId, localId) {
    var cart = getCart(drawId);
    var line = cart.find(function (c) { return c.localId === localId; });
    if (line) cart.push({ localId: Store.uuid(), numbers: line.numbers.slice(), bolillapaNumber: line.bolillapaNumber });
    return saveCart(drawId, cart);
  }

  function removeFromCart(drawId, localId) {
    var cart = getCart(drawId).filter(function (c) { return c.localId !== localId; });
    return saveCart(drawId, cart);
  }

  function clearCart(drawId) {
    sessionStorage.removeItem(cartKey(drawId));
  }

  function randomPicks(draw) {
    var pool = [];
    for (var n = draw.numberMin; n <= draw.numberMax; n++) pool.push(n);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var numbers = pool.slice(0, draw.picksCount).sort(function (a, b) { return a - b; });
    var bolillapaNumber = draw.bolillapaMin + Math.floor(Math.random() * (draw.bolillapaMax - draw.bolillapaMin + 1));
    return { numbers: numbers, bolillapaNumber: bolillapaNumber };
  }

  function cartTotals(cart, draw) {
    var count = cart.length;
    return {
      count: count,
      subtotalCents: count * draw.ticketPriceCents,
      isComplete: cart.every(function (c) { return c.numbers.length === draw.picksCount && c.bolillapaNumber != null; })
    };
  }

  function checkout(drawId) {
    if (inFlightCheckouts[drawId]) return inFlightCheckouts[drawId];

    var cart = getCart(drawId);
    var idemStorageKey = 'premiumlott_ballidem_' + drawId;
    var idempotencyKey = sessionStorage.getItem(idemStorageKey) || Store.uuid();
    sessionStorage.setItem(idemStorageKey, idempotencyKey);

    var promise = Api.purchaseBallTickets({ drawId: drawId, tickets: cart.map(function (c) { return { numbers: c.numbers, bolillapaNumber: c.bolillapaNumber }; }) }, idempotencyKey)
      .then(function (res) {
        delete inFlightCheckouts[drawId];
        if (res.ok) {
          clearCart(drawId);
          sessionStorage.removeItem(idemStorageKey);
        }
        return res;
      });
    inFlightCheckouts[drawId] = promise;
    return promise;
  }

  global.PremiumBallService = {
    getCart: getCart, addToCart: addToCart, updateInCart: updateInCart, duplicateInCart: duplicateInCart,
    removeFromCart: removeFromCart, clearCart: clearCart, randomPicks: randomPicks, cartTotals: cartTotals, checkout: checkout
  };
})(window);
