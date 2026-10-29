/* Shared page pieces: header, footer, WhatsApp button, product cards, cart buttons, animations. */
(function () {
  var CC = (window.CC = window.CC || {});
  var esc = CC.esc, icons = CC.art.icons;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- small helpers ---------- */
  CC.fmt = function (n) { return "Rs " + Math.round(n || 0).toLocaleString("en-US"); };
  CC.todayPK = function () { return new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); }; // Pakistan is UTC+5, no daylight saving
  CC.nowPKMinutes = function () { var d = new Date(Date.now() + 5 * 3600e3); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
  CC.addDays = function (ymd, n) { var d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  CC.fmtDate = function (ymd) { return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(ymd + "T00:00:00Z")); };
  CC.fmtDateTime = function (ms) {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(ms)) + " (Pakistan time)";
  };
  CC.photoUrl = function (u) {
    u = String(u || "").trim();
    if (!/^https?:\/\//i.test(u)) return "";
    var m = u.match(/drive\.google\.com\/file\/d\/([^\/?#]+)/) || u.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([^&#]+)/);
    return m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w800" : u;
  };
  CC.imgHTML = function (p) {
    var u = CC.photoUrl(p.photo);
    if (!u) return CC.art.placeholder(p.category, p.name);
    return '<img src="' + esc(u) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-cat="' + esc(p.category) + '" data-nm="' + esc(p.name) + '" onerror="CC.imgFail(this)">';
  };
  CC.imgFail = function (img) {
    var d = document.createElement("div");
    d.style.cssText = "width:100%;height:100%";
    d.innerHTML = CC.art.placeholder(img.getAttribute("data-cat"), img.getAttribute("data-nm"));
    if (img.parentNode) img.parentNode.replaceChild(d, img);
  };

  /* ---------- toast ---------- */
  CC.toast = function (msg) {
    var old = document.querySelector(".toast"); if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2200);
    setTimeout(function () { t.remove(); }, 2600);
  };

  /* ---------- loader / error ---------- */
  CC.loaderHTML = function (msg) { return '<div class="loader" role="status">' + CC.art.bun + "<div>" + esc(msg || "Warming up the oven…") + "</div></div>"; };
  CC.errorHTML = function () {
    return '<div class="errbox" role="alert">' + CC.art.placeholder("default", "oops") + "<h3>Our oven is taking a short break</h3>" +
      "<p>We could not reach our menu just now. Please check your internet and try again in a moment.</p>" +
      '<button class="btn btn-rose" data-act="retry">Try again</button></div>';
  };
  // Runs render(data) once the menu is loaded. Shows the loader meanwhile and a friendly message on failure.
  CC.boot = function (el, render, msg) {
    el.innerHTML = CC.loaderHTML(msg);
    return CC.load().then(function (data) { el.innerHTML = ""; render(data); CC.reveal(); }).catch(function (e) {
      if (window.console) console.warn("Could not load the menu:", e);
      el.innerHTML = CC.errorHTML();
    });
  };

  /* ---------- reveal on scroll ---------- */
  CC.reveal = function (root) {
    var els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add("in"); }); }, 2500); // safety net
  };

  /* ---------- header, footer, WhatsApp ---------- */
  var LINKS = [["index.html", "Home", "home"], ["menu.html", "Menu", "menu"], ["build-cake.html", "Build Your Cake", "cake"], ["track.html", "Track Order", "track"], ["about.html", "About & Contact", "about"]];

  function shell() {
    var page = document.body.getAttribute("data-page") || "";
    var nav = LINKS.map(function (l) { return '<a class="nav-link' + (l[2] === page ? " active" : "") + '" href="' + l[0] + '">' + esc(l[1]) + "</a>"; }).join("");
    var top =
      '<div class="promo hidden" id="promo"><span id="promo-text"></span></div>' +
      '<header class="site-header"><div class="container header-inner">' +
      '<a class="brand" href="index.html" aria-label="Crumbs and Co. home">' + CC.art.logo + 'Crumbs <small>&amp; Co.</small></a>' +
      '<nav class="nav" id="nav" aria-label="Main">' + nav + "</nav>" +
      '<div class="header-actions">' +
      '<a class="icon-btn" href="menu.html?fav=1" aria-label="My favourites">' + icons.heart + '<span class="badge" id="fav-badge" hidden>0</span></a>' +
      '<a class="icon-btn" id="cart-btn" href="cart.html" aria-label="Cart and checkout">' + icons.cart + '<span class="badge" id="cart-badge" hidden>0</span></a>' +
      "</div>" +
      '<button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false">' + icons.menu + "</button>" +
      "</div></header>";
    document.body.insertAdjacentHTML("afterbegin", top);

    var foot =
      '<footer class="site-footer"><div class="container"><div class="foot-grid">' +
      '<div><a class="brand" href="index.html">' + CC.art.logo + 'Crumbs <small>&amp; Co.</small></a><p style="margin-top:10px">Fresh bakes, cakes and treats from the heart of Lahore. Baked with butter, love and a pinch of mischief.</p></div>' +
      '<div><h4>Visit and call</h4><ul><li id="f-addr"></li><li id="f-phone"></li><li id="f-hours"></li></ul></div>' +
      "<div><h4>Quick links</h4><ul>" + LINKS.map(function (l) { return '<li><a href="' + l[0] + '">' + esc(l[1]) + "</a></li>"; }).join("") + '<li><a href="cart.html">Cart &amp; Checkout</a></li></ul></div>' +
      '<div><h4>Order online</h4><p id="f-promo">Order online and save on your total bill.</p><a class="btn btn-rose btn-sm" href="menu.html">See the menu</a></div>' +
      '</div><div class="demo-note">' + esc((window.CC_CONFIG || {}).DEMO_LINE || "This is a demo website.") + "</div></div></footer>" +
      '<a class="wa-float" id="wa-float" href="https://wa.me/923000000000" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">' + icons.wa + "<span>Chat with us</span></a>";
    document.body.insertAdjacentHTML("beforeend", foot);

    var toggle = document.getElementById("menu-toggle"), navEl = document.getElementById("nav");
    toggle.addEventListener("click", function () {
      var open = navEl.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navEl.addEventListener("click", function (e) { if (e.target.closest("a")) navEl.classList.remove("open"); });
  }

  function updateBadges() {
    var c = CC.cart.count(), f = CC.favs.all().length, cb = document.getElementById("cart-badge"), fb = document.getElementById("fav-badge");
    if (cb) { var was = cb.textContent; cb.textContent = c; cb.hidden = c === 0; if (was !== String(c) && c > 0 && !reduceMotion) { cb.classList.remove("bump"); void cb.offsetWidth; cb.classList.add("bump"); } }
    if (fb) { fb.textContent = f; fb.hidden = f === 0; }
  }

  function updateShell(data) {
    var s = data.settings;
    var wa = document.getElementById("wa-float"); if (wa) wa.href = CC.waLink("Hello " + s.name + "! I have a question.");
    var set = function (id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; };
    set("f-addr", esc(s.address));
    set("f-phone", 'Phone: <a href="tel:' + esc(s.phone.replace(/\s+/g, "")) + '">' + esc(s.phone) + "</a>");
    set("f-hours", s.hours.map(esc).join("<br>"));
    var promo = CC.promoText();
    var p = document.getElementById("promo");
    if (promo && p) { document.getElementById("promo-text").textContent = promo; p.classList.remove("hidden"); }
    set("f-promo", promo ? esc(promo) + "." : "Fresh bakes, ready when you are.");
    if (data.demo) {
      document.body.insertAdjacentHTML("afterbegin", '<div class="demo-bar">Showing the built-in sample menu. To go live, paste your Google Apps Script link into <b>js/config.js</b>.</div>');
    }
  }

  CC.promoText = function () {
    var pct = CC.data && CC.data.settings.discountPct;
    return pct > 0 ? "Order online, save " + pct + "% on your total bill" : "";
  };

  /* ---------- product card ---------- */
  function actionsHTML(p) {
    if (!p.available) return '<button class="btn add-btn" disabled>Sold out today</button>';
    var q = CC.cart.qtyOf(p.name);
    if (q > 0) return '<div class="stepper"><button data-act="dec" aria-label="One less">&minus;</button><span aria-live="polite">' + q + '</span><button data-act="inc" aria-label="One more">+</button></div>';
    return '<button class="btn add-btn" data-act="add">Add</button>';
  }
  CC.card = function (p, hl) {
    var fav = CC.favs.has(p.name);
    return '<article class="pcard' + (p.available ? "" : " soldout") + '" data-name="' + esc(p.name) + '">' +
      '<div class="pimg">' + CC.imgHTML(p) + '<div class="tags">' +
      (p.featured && p.available ? '<span class="tag special">Today\'s special</span>' : "") +
      (!p.available ? '<span class="tag out">Sold out today</span>' : "") +
      (!p.delivery ? '<span class="tag pickup">Pickup only</span>' : "") + "</div>" +
      '<button class="heart' + (fav ? " on" : "") + '" data-act="fav" aria-pressed="' + fav + '" aria-label="Favourite: ' + esc(p.name) + '">' + icons.heart + "</button></div>" +
      '<div class="pbody"><span class="pcat">' + esc(p.category) + '</span><h3 class="pname">' + (hl ? hl(p.name) : esc(p.name)) + "</h3>" +
      '<p class="pdesc">' + esc(p.description) + "</p>" +
      '<div class="pfoot"><div class="price">' + CC.fmt(p.price) + "<small>" + esc(p.unit) + '</small></div><div class="pact">' + actionsHTML(p) + "</div></div></div></article>";
  };

  /* ---------- "Goes well with" ---------- */
  var PAIRS = {
    "Cakes": ["Birthday Decor", "Ice Cream", "Juices & Drinks"],
    "Pastries & Patties": ["Juices & Drinks", "Milk & Dairy"],
    "Pizzas & Sandwiches": ["Juices & Drinks", "Snacks"],
    "Snacks": ["Juices & Drinks"],
    "Breads & Rusks": ["Milk & Dairy", "Cookies & Biscuits"],
    "Milk & Dairy": ["Breads & Rusks", "Cookies & Biscuits"],
    "Juices & Drinks": ["Pastries & Patties", "Snacks"],
    "Ice Cream": ["Cookies & Biscuits", "Cakes"],
    "Cookies & Biscuits": ["Milk & Dairy", "Juices & Drinks"],
    "Birthday Decor": ["Cakes"]
  };
  CC.suggest = function (cats, n) {
    var inCart = {}; CC.cart.lines().forEach(function (l) { inCart[l.name.toLowerCase()] = 1; });
    var want = [];
    cats.forEach(function (c) { (PAIRS[c] || []).forEach(function (x) { if (want.indexOf(x) === -1 && cats.indexOf(x) === -1) want.push(x); }); });
    var buckets = want.map(function (cat) {
      return CC.data.products.filter(function (p) { return p.category === cat && p.available && !inCart[p.name.toLowerCase()]; }).map(function (p) {
        var bonus = cats.indexOf("Cakes") > -1 && /candle|topper|sparkler/i.test(p.name) ? 200 : 0;
        return { p: p, s: p.popularity + bonus };
      }).sort(function (a, b) { return b.s - a.s; });
    });
    var out = [], i = 0, guard = 0;
    while (out.length < n && guard++ < 50) {
      var added = false;
      buckets.forEach(function (b) { if (out.length < n && b[i]) { out.push(b[i].p); added = true; } });
      if (!added) break;
      i++;
    }
    return out;
  };
  CC.miniHTML = function (p) {
    return '<div class="mini" data-name="' + esc(p.name) + '"><div class="thumb">' + CC.imgHTML(p) + "</div><div><b>" + esc(p.name) + "</b><small>" + CC.fmt(p.price) + " · " + esc(p.unit) + '</small></div><button class="btn btn-sm btn-caramel" data-act="sadd">Add</button></div>';
  };
  var sheetTimer;
  CC.showSheet = function (cats) {
    var old = document.getElementById("sheet"); if (old) old.remove();
    clearTimeout(sheetTimer);
    var list = CC.suggest(cats, 3);
    if (!list.length) return;
    var el = document.createElement("div");
    el.className = "sheet"; el.id = "sheet"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "Goes well with");
    el.innerHTML = '<h4>Goes well with <button class="x" data-act="close-sheet" aria-label="Close">&times;</button></h4><div class="minis">' + list.map(CC.miniHTML).join("") + "</div>";
    document.body.appendChild(el);
    sheetTimer = setTimeout(function () { var s = document.getElementById("sheet"); if (s) s.remove(); }, 12000);
  };

  /* ---------- add to cart with a fly animation ---------- */
  CC.fly = function (fromEl) {
    var target = document.getElementById("cart-btn");
    if (!fromEl || !target || reduceMotion || !fromEl.animate) return;
    var a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    var x0 = a.left + a.width / 2 - 18, y0 = a.top + a.height / 2 - 18, x1 = b.left + b.width / 2 - 18, y1 = b.top + b.height / 2 - 18;
    var dot = document.createElement("div");
    dot.className = "fly"; dot.textContent = "+1"; dot.style.left = "0"; dot.style.top = "0";
    document.body.appendChild(dot);
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 70;
    var anim = dot.animate([
      { transform: "translate(" + x0 + "px," + y0 + "px) scale(1)", opacity: 1 },
      { transform: "translate(" + mx + "px," + my + "px) scale(1.15)", opacity: 1, offset: 0.5 },
      { transform: "translate(" + x1 + "px," + y1 + "px) scale(.3)", opacity: 0.6 }
    ], { duration: window.innerWidth < 700 ? 550 : 750, easing: "ease-in-out" });
    anim.onfinish = function () { dot.remove(); };
  };

  CC.addToCart = function (p, srcEl, showSheet) {
    if (!p || !p.available) return;
    CC.fly(srcEl);
    CC.cart.add(p, 1);
    if (showSheet !== false) CC.showSheet([p.category]);
  };

  CC.reorder = function () {
    var last = CC.store.last.get();
    if (!last || !last.items || !last.items.length) return CC.toast("No earlier order found on this device.");
    CC.load().then(function (d) {
      var lines = [], skipped = 0;
      last.items.forEach(function (it) {
        if (it.cake) {
          var price = CC.cakePrice(it.cake, d.options);
          if (price == null) { skipped++; return; }
          lines.push({ key: "c:" + [it.cake.size, it.cake.flavour, it.cake.frosting, it.cake.message].join("|").toLowerCase(), kind: "cake", name: "Custom cake (" + it.cake.size + ")", unit: it.cake.flavour + " · " + it.cake.frosting, price: price, qty: it.qty, category: "Cakes", delivery: true, cake: it.cake });
        } else {
          var p = d.byName[String(it.name).toLowerCase()];
          if (!p || !p.available) { skipped++; return; }
          lines.push({ key: "i:" + p.name.toLowerCase(), kind: "item", name: p.name, unit: p.unit, price: p.price, qty: it.qty, category: p.category, delivery: p.delivery, photo: p.photo });
        }
      });
      if (!lines.length) return CC.toast("Sorry, those items are not available right now.");
      CC.cart.replace(lines);
      CC.store.set("reorderSkipped", skipped);
      location.href = "cart.html";
    }).catch(function () { CC.toast("We could not reach the menu. Please try again."); });
  };

  /* ---------- clicks (work on every page) ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act"), host = b.closest("[data-name]"), p = host && CC.data ? CC.data.byName[host.getAttribute("data-name").toLowerCase()] : null;
    if (act === "add" && p) { CC.addToCart(p, b, true); }
    else if (act === "sadd" && p) { CC.addToCart(p, b, false); b.textContent = "Added ✓"; b.disabled = true; }
    else if (act === "inc" && p) { CC.cart.add(p, 1); }
    else if (act === "dec" && p) { CC.cart.setQty("i:" + p.name.toLowerCase(), CC.cart.qtyOf(p.name) - 1); }
    else if (act === "fav" && host) {
      var name = host.getAttribute("data-name"), on = CC.favs.toggle(name);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      CC.toast(on ? "Saved to your favourites" : "Removed from favourites");
    }
    else if (act === "close-sheet") { var s = document.getElementById("sheet"); if (s) s.remove(); }
    else if (act === "retry") { try { localStorage.removeItem("cc_data_v1"); } catch (x) { /* ignore */ } location.reload(); }
    else if (act === "reorder") { CC.reorder(); }
  });

  window.addEventListener("cc:cart", function () {
    updateBadges();
    if (!CC.data) return;
    document.querySelectorAll(".pcard").forEach(function (card) {
      var p = CC.data.byName[card.getAttribute("data-name").toLowerCase()], act = card.querySelector(".pact");
      if (p && act) act.innerHTML = actionsHTML(p);
    });
  });
  window.addEventListener("cc:favs", updateBadges);

  /* ---------- start ---------- */
  shell();
  updateBadges();
  CC.load().then(function (d) { updateShell(d); updateBadges(); }).catch(function () { /* pages show their own message */ });
  CC.reveal();
})();
