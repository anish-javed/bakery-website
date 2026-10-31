/* Browser memory: cart, favourites, last order. Also the price maths shown on screen. */
(function () {
  var CC = (window.CC = window.CC || {});
  var mem = {};

  function get(key, fallback) {
    try {
      var v = localStorage.getItem("cc_" + key);
      if (v !== null) return JSON.parse(v);
    } catch (e) { /* storage blocked */ }
    return key in mem ? mem[key] : fallback;
  }
  function set(key, value) {
    mem[key] = value;
    try { localStorage.setItem("cc_" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  function changed(what) { window.dispatchEvent(new CustomEvent("cc:" + what)); }

  /* ---------- cart ---------- */
  // line: { key, kind: "item" | "cake", name, unit, price, qty, category, delivery, soldOut, photo, cake? }
  var cart = {
    lines: function () { return get("cart", []); },
    count: function () { return cart.lines().reduce(function (n, l) { return n + l.qty; }, 0); },
    qtyOf: function (name) {
      var key = "i:" + String(name).toLowerCase();
      var l = cart.lines().filter(function (x) { return x.key === key; })[0];
      return l ? l.qty : 0;
    },
    add: function (p, qty) {
      var lines = cart.lines(), key = "i:" + p.name.toLowerCase();
      var l = lines.filter(function (x) { return x.key === key; })[0];
      if (l) l.qty = Math.min(50, l.qty + (qty || 1));
      else lines.push({ key: key, kind: "item", name: p.name, unit: p.unit, price: p.price, qty: qty || 1, category: p.category, delivery: p.delivery !== false, photo: p.photo || "" });
      set("cart", lines); changed("cart");
    },
    addCake: function (cfg, price) {
      var lines = cart.lines();
      var key = "c:" + [cfg.size, cfg.flavour, cfg.frosting, cfg.message].join("|").toLowerCase();
      var l = lines.filter(function (x) { return x.key === key; })[0];
      if (l) l.qty = Math.min(50, l.qty + 1);
      else lines.push({ key: key, kind: "cake", name: "Custom cake (" + cfg.size + ")", unit: cfg.flavour + " · " + cfg.frosting, price: price, qty: 1, category: "Cakes", delivery: true, cake: cfg });
      set("cart", lines); changed("cart");
    },
    setQty: function (key, qty) {
      var lines = cart.lines();
      lines = lines.map(function (l) { if (l.key === key) l.qty = Math.max(0, Math.min(50, qty)); return l; }).filter(function (l) { return l.qty > 0; });
      set("cart", lines); changed("cart");
    },
    remove: function (key) { cart.setQty(key, 0); },
    clear: function () { set("cart", []); changed("cart"); },
    replace: function (lines) { set("cart", lines); changed("cart"); },
    hasCake: function () { return cart.lines().some(function (l) { return l.kind === "cake"; }); },
    // Refresh prices and stock from the freshly loaded sheet data.
    sync: function (data) {
      var lines = cart.lines(), by = data.byName, dirty = false;
      lines = lines.map(function (l) {
        if (l.kind === "cake") {
          var p = CC.cakePrice(l.cake, data.options);
          if (p == null) { if (!l.soldOut) { l.soldOut = true; dirty = true; } }
          else if (p !== l.price || l.soldOut) { l.price = p; l.soldOut = false; dirty = true; }
          return l;
        }
        var prod = by[l.name.toLowerCase()];
        if (!prod) { if (!l.soldOut) { l.soldOut = true; dirty = true; } return l; }
        var out = !prod.available;
        if (prod.price !== l.price || out !== !!l.soldOut || prod.delivery !== l.delivery || prod.unit !== l.unit || (prod.photo || "") !== (l.photo || "")) {
          l.price = prod.price; l.soldOut = out; l.delivery = prod.delivery; l.unit = prod.unit; l.photo = prod.photo || ""; dirty = true;
        }
        return l;
      });
      if (dirty) set("cart", lines);
    }
  };

  /* ---------- favourites ---------- */
  var favs = {
    all: function () { return get("favs", []); },
    has: function (name) { return favs.all().indexOf(name) > -1; },
    toggle: function (name) {
      var a = favs.all(), i = a.indexOf(name);
      if (i > -1) a.splice(i, 1); else a.push(name);
      set("favs", a); changed("favs");
      return i === -1;
    }
  };

  var last = {
    get: function () { return get("last", null); },
    set: function (o) { set("last", o); }
  };

  // The last 10 orders placed in this browser, newest first: { no, total, payment, method, expectedBy }.
  // Track Order uses them to show the amount to send. Orders from before this list existed are found through "last".
  var orders = {
    all: function () { return get("orders", []); },
    add: function (o) {
      var list = orders.all().filter(function (x) { return String(x.no).toLowerCase() !== String(o.no).toLowerCase(); });
      list.unshift(o);
      set("orders", list.slice(0, 10));
    },
    find: function (no) {
      no = String(no || "").toLowerCase();
      var hit = orders.all().filter(function (x) { return String(x.no).toLowerCase() === no; })[0];
      if (hit) return hit;
      var l = last.get();
      return l && String(l.no).toLowerCase() === no ? l : null;
    }
  };

  /* ---------- price maths (the website's estimate; the sheet script recalculates everything) ---------- */
  CC.cakePrice = function (cfg, options) {
    if (!cfg || !options) return null;
    function find(list, name) { return (list || []).filter(function (x) { return String(x.name).toLowerCase() === String(name).toLowerCase(); })[0]; }
    var s = find(options.sizes, cfg.size), f = find(options.flavours, cfg.flavour), fr = find(options.frostings, cfg.frosting);
    if (!s || !f || !fr) return null;
    return Math.round(s.price + (f.extra + fr.extra) * s.pounds);
  };

  CC.calc = function (lines, method, settings) {
    var subtotal = lines.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
    var fee = method === "Delivery" && lines.length ? settings.deliveryFee : 0;
    var discount = Math.round((subtotal + fee) * (settings.discountPct || 0) / 100); // the discount is taken off the whole bill: items + delivery fee
    return { subtotal: subtotal, fee: fee, discount: discount, total: subtotal + fee - discount };
  };

  CC.store = { get: get, set: set, cart: cart, favs: favs, last: last, orders: orders };
  CC.cart = cart;
  CC.favs = favs;

  window.addEventListener("storage", function (e) {
    if (e.key === "cc_cart") changed("cart");
    if (e.key === "cc_favs") changed("favs");
  });
})();
