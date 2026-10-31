/* Talks to the Google Apps Script web app: reads the menu, sends orders, tracks orders. */
(function () {
  var CC = (window.CC = window.CC || {});
  var cfg = window.CC_CONFIG || {};
  var CACHE_KEY = "cc_data_v1";
  var PREFERRED = ["Cakes", "Pastries & Patties", "Pizzas & Sandwiches", "Snacks", "Breads & Rusks", "Milk & Dairy", "Juices & Drinks", "Ice Cream", "Cookies & Biscuits", "Birthday Decor"];

  function fetchJson(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error("timeout")); }, ms || 15000);
      opts = opts || {};
      if (ctrl) opts.signal = ctrl.signal;
      fetch(url, opts)
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
        .then(function (t) {
          clearTimeout(timer);
          var j;
          try { j = JSON.parse(t); } catch (e) { return reject(new Error("bad json")); }
          resolve(j);
        })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }
  function withQuery(q) { return cfg.SCRIPT_URL + (cfg.SCRIPT_URL.indexOf("?") > -1 ? "&" : "?") + q; }

  /* ---------- settings ---------- */
  function normSettings(raw) {
    var m = {};
    Object.keys(raw || {}).forEach(function (k) { m[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = raw[k]; });
    function s(k, d) { var v = m[k]; return v === undefined || v === null || String(v).trim() === "" ? d : String(v).trim(); }
    function n(k, d) { var v = parseFloat(String(m[k]).replace(/[^0-9.]/g, "")); return isNaN(v) ? d : v; }
    function yes(v) { return ["yes", "y", "true", "1"].indexOf(String(v).toLowerCase()) > -1; }
    function list(v, sep) { return String(v || "").split(sep).map(function (x) { return x.trim(); }).filter(Boolean); }
    // "22:15" or "10:15 pm" -> minutes since midnight; "45-60" -> { min: 45, max: 60 }. Bad or missing values use the defaults.
    function clock(v, d) {
      var c = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(String(v == null ? "" : v));
      if (!c) return d;
      var h = parseInt(c[1], 10), mi = c[2] ? parseInt(c[2], 10) : 0, ap = (c[3] || "").toLowerCase();
      if (ap) { if (h < 1 || h > 12) return d; h = h % 12 + (ap === "pm" ? 12 : 0); }
      return h > 23 || mi > 59 ? d : h * 60 + mi;
    }
    function range(v, lo, hi) {
      var t = String(v == null ? "" : v), r = /^\s*(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*$/i.exec(t) || /^\s*(\d+)\s*$/.exec(t);
      if (!r) return { min: lo, max: hi };
      var a = parseInt(r[1], 10), b = r[2] === undefined ? a : parseInt(r[2], 10);
      if (b < a) { var x = a; a = b; b = x; }
      return b > 0 ? { min: a, max: b } : { min: lo, max: hi };
    }
    var wa = s("whatsappnumber", "923000000000").replace(/\D/g, "");
    if (wa.charAt(0) === "0") wa = "92" + wa.slice(1);
    return {
      name: s("bakeryname", "Crumbs & Co."),
      phone: s("phone", "0300 0000000"),
      whatsapp: wa,
      address: s("address", "Lahore, Pakistan"),
      deliveryFee: n("deliveryfee", 250),
      discountPct: n("onlinediscount", 5),
      hours: list(s("openinghours", "Every day: 9 am - 11 pm"), ";"),
      noticeDays: n("cakenoticedays", 2),
      accepting: yes(s("acceptingorders", "Yes")),
      cod: yes(s("cashondelivery", "Yes")),
      areas: list(s("deliveryareas", ""), ","),
      slots: list(s("timeslots", "10:00 am - 12:00 pm, 12:00 pm - 2:00 pm, 2:00 pm - 4:00 pm, 4:00 pm - 6:00 pm, 6:00 pm - 8:00 pm"), ","),
      bank: s("bankname", ""), accountTitle: s("accounttitle", ""), accountNo: s("accountnumber", ""), iban: s("iban", ""),
      jazz: s("jazzcashnumber", ""), jazzTitle: s("jazzcashtitle", ""),
      payNote: s("paymentnote", "We confirm your payment before we start baking."),
      asapStart: clock(s("asapstarttime", ""), 9 * 60), asapEnd: clock(s("asaplastordertime", ""), 22 * 60 + 15),
      asapDel: range(s("asapdeliveryminutes", ""), 45, 60), asapPick: range(s("asappickupminutes", ""), 20, 30)
    };
  }

  /* ---------- build the data used by every page ---------- */
  function build(raw, source) {
    var products = (raw.products || []).map(function (p, i) {
      return {
        name: String(p.name), category: String(p.category || "Other"), price: Number(p.price) || 0, unit: String(p.unit || ""),
        description: String(p.description || ""), photo: String(p.photo || ""), available: p.available !== false,
        featured: !!p.featured, delivery: p.delivery !== false, popularity: Number(p.popularity) || 0, order: p.order != null ? p.order : i
      };
    });
    var byName = {}, seen = {};
    products.forEach(function (p) { byName[p.name.toLowerCase()] = p; seen[p.category] = (seen[p.category] || 0) + 1; });
    var cats = PREFERRED.filter(function (c) { return seen[c]; });
    Object.keys(seen).forEach(function (c) { if (cats.indexOf(c) === -1) cats.push(c); });
    var o = raw.options || {};
    CC.data = {
      products: products, byName: byName, categories: cats, counts: seen,
      options: { sizes: o.sizes || [], flavours: o.flavours || [], frostings: o.frostings || [] },
      settings: normSettings(raw.settings), source: source, demo: source === "demo"
    };
    CC.cart.sync(CC.data);
    return CC.data;
  }

  /* ---------- load (with a short browser cache) ---------- */
  var loadPromise = null;
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; } }
  function writeCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) { /* ignore */ } }

  function doLoad() {
    if (!cfg.SCRIPT_URL) return Promise.resolve(build(window.CC_DEMO, "demo"));
    var cached = readCache(), mins = cfg.CACHE_MINUTES || 5;
    if (cached && cached.data && Date.now() - cached.t < mins * 60000) return Promise.resolve(build(cached.data, "cache"));
    return fetchJson(withQuery("action=all"), {}, 15000)
      .then(function (j) {
        if (!j || !j.ok || !j.products) throw new Error("bad data");
        writeCache(j);
        return build(j, "live");
      })
      .catch(function (err) {
        if (cached && cached.data) return build(cached.data, "stale");
        throw err;
      });
  }
  CC.load = function () { if (!loadPromise) loadPromise = doLoad(); return loadPromise; };
  CC.reload = function () { loadPromise = null; try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ } return CC.load(); };

  /* ---------- orders ---------- */
  function demoOrder(p) {
    var d = CC.data, items = [], subtotal = 0;
    p.items.forEach(function (it) {
      var price, label;
      if (it.cake) { price = CC.cakePrice(it.cake, d.options); label = "Custom cake: " + it.cake.size + ", " + it.cake.flavour + ", " + it.cake.frosting + (it.cake.message ? ' — "' + it.cake.message + '"' : ""); }
      else { var pr = d.byName[String(it.name).toLowerCase()]; price = pr ? pr.price : 0; label = it.name; }
      items.push({ label: label, qty: it.qty, lineTotal: price * it.qty });
      subtotal += price * it.qty;
    });
    var n = (CC.store.get("demoNo", 1000)) + 1;
    CC.store.set("demoNo", n);
    var fee = p.method === "Delivery" ? d.settings.deliveryFee : 0, disc = Math.round((subtotal + fee) * d.settings.discountPct / 100);
    var expectedBy = "";
    if (p.asap) { // order time + the longest wait, in Pakistan time (UTC+5)
      var mx = (p.method === "Delivery" ? d.settings.asapDel : d.settings.asapPick).max;
      expectedBy = CC.fmtClock(Math.floor(((Date.now() + 5 * 3600e3) % 86400000) / 60000) + mx);
    }
    return { ok: true, demo: true, orderNo: "DEMO-" + n, subtotal: subtotal, deliveryFee: fee, discount: disc, total: subtotal + fee - disc, items: items, asap: !!p.asap, expectedBy: expectedBy };
  }

  CC.placeOrder = function (payload) {
    if (!cfg.SCRIPT_URL) return new Promise(function (r) { setTimeout(function () { r(demoOrder(payload)); }, 700); });
    return fetchJson(cfg.SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }, 30000);
  };

  // The phone number is required. The order number is optional:
  //   phone only    -> { ok, mode: "list", orders: [{ no, status, orderTime }] }  (last 30 days, newest first)
  //   phone + order -> { ok, mode: "one", orderNo, status, orderTime, method, payment, expectedBy }  (payment = state only, never amounts; expectedBy = "10:50 pm" for ASAP orders, else "")
  // Tracking answers are never taken from the browser cache.
  CC.track = function (orderNo, phone) {
    orderNo = String(orderNo || "").trim();
    if (!cfg.SCRIPT_URL) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var l = CC.store.last.get(), tail = function (v) { return String(v || "").replace(/\D/g, "").slice(-10); };
          if (!l || tail(l.phone) !== tail(phone)) return resolve({ ok: false, error: orderNo ? "We could not find an order with these details. Please check the order number and phone number." : "We could not find any orders for this phone number in the last 30 days. Please check the number, or type your order number too." });
          var age = Date.now() - l.t, pickup = l.method === "Pickup";
          var status = age < 60000 ? "Received" : age < 180000 ? "Baking" : age < 300000 ? (pickup ? "Ready for pickup" : "Out for delivery") : (pickup ? "Collected" : "Delivered");
          if (orderNo) {
            if (String(l.no).toLowerCase() !== orderNo.toLowerCase()) return resolve({ ok: false, error: "We could not find an order with these details. Please check the order number and phone number." });
            return resolve({ ok: true, mode: "one", orderNo: l.no, status: status, orderTime: l.t, method: pickup ? "Pickup" : "Delivery", payment: l.payment === "Bank transfer / JazzCash" ? (age < 120000 ? "Waiting for payment" : "Paid") : pickup ? "Pay at pickup" : "Pay on delivery", expectedBy: l.asap ? l.expectedBy || "" : "", demo: true });
          }
          if (age > 30 * 86400000) return resolve({ ok: false, error: "We could not find any orders for this phone number in the last 30 days. Please check the number, or type your order number too." });
          resolve({ ok: true, mode: "list", orders: [{ no: l.no, status: status, orderTime: l.t }], demo: true });
        }, 600);
      });
    }
    var q = "action=track&phone=" + encodeURIComponent(phone) + (orderNo ? "&order=" + encodeURIComponent(orderNo) : "") + "&_=" + Date.now();
    return fetchJson(withQuery(q), { cache: "no-store" }, 20000);
  };

  CC.waLink = function (text) {
    var n = CC.data ? CC.data.settings.whatsapp : "923000000000";
    return "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "");
  };
})();
