/* Home page */
(function () {
  var CC = window.CC, esc = CC.esc;

  // Hero drawing and the cake teaser (no data needed)
  var hero = document.getElementById("hero-art");
  if (hero) {
    var cols = ["#e8788a", "#fffdf8", "#8cc9b5", "#4a2c1d"], sp = "";
    for (var i = 0; i < 10; i++) {
      sp += '<span class="sprinkle" style="left:' + ((i * 37 + 8) % 92) + "%;top:" + ((i * 53 + 6) % 88) + "%;background:" + cols[i % 4] + ";transform:rotate(" + (i * 41 % 180) + 'deg)"></span>';
    }
    hero.insertAdjacentHTML("beforeend",
      sp +
      '<div class="float" style="position:absolute;inset:8%;z-index:2">' + CC.art.cake({ pounds: 3, flavour: "Chocolate", frosting: "Fresh Cream", message: "Crumbs & Co." }).replace("<svg ", '<svg style="width:100%;height:100%" ') + "</div>" +
      '<div class="float d2" style="position:absolute;left:0;top:4%;width:22%;z-index:3">' + CC.art.logo + "</div>" +
      '<div class="float d3" style="position:absolute;right:0;bottom:2%;width:30%;z-index:3;border-radius:22px;overflow:hidden;box-shadow:0 6px 18px rgba(74,44,29,.18)">' + CC.art.placeholder("Pastries & Patties", "croissant") + "</div>");
  }
  var hc = document.getElementById("home-cake");
  if (hc) hc.innerHTML = CC.art.cake({ pounds: 2, flavour: "Red Velvet", frosting: "Cream Cheese", message: "Happy Birthday!" });

  var body = document.getElementById("home-body");
  CC.boot(body, function (d) {
    var s = d.settings, html = "";

    var promo = CC.promoText(), pc = document.getElementById("promo-card");
    if (promo && pc) { pc.innerHTML = CC.art.icons.tag + "<div><b>" + esc(promo) + '</b><br><span class="muted">The discount is taken off automatically at checkout.</span></div>'; pc.classList.remove("hidden"); }

    var last = CC.store.last.get(), slot = document.getElementById("reorder-slot");
    if (last && last.items && last.items.length && slot) {
      var n = last.items.reduce(function (a, i) { return a + i.qty; }, 0);
      slot.innerHTML = '<div class="panel reveal" style="margin-top:16px;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><span class="hand">Welcome back!</span><h3 style="margin:0">Reorder your last order</h3><p class="muted" style="margin:0">' +
        esc(last.no) + " · " + n + " item" + (n === 1 ? "" : "s") + (last.total ? " · " + CC.fmt(last.total) : "") + '</p></div><button class="btn btn-rose" data-act="reorder">Reorder in one tap</button></div>';
    }

    var specials = d.products.filter(function (p) { return p.featured && p.available; }).sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 10);
    if (specials.length) {
      html += '<section class="section"><div class="container"><div class="section-head reveal"><div><span class="hand">Hot out of the oven</span><h2>Today\'s specials</h2></div><a href="menu.html">See the full menu &rarr;</a></div><div class="hscroll reveal">' +
        specials.map(function (p) { return CC.card(p); }).join("") + "</div></div></section>";
    }

    html += '<section class="band section"><div class="container"><div class="section-head reveal"><div><span class="hand">Something for everyone</span><h2>Shop by category</h2></div></div><div class="tiles">' +
      d.categories.map(function (c) {
        return '<a class="tile reveal" href="menu.html?cat=' + encodeURIComponent(c) + '"><div class="pimg">' + CC.art.placeholder(c, c) + "</div><b>" + esc(c) + "</b><small>" + d.counts[c] + " items</small></a>";
      }).join("") + "</div></div></section>";

    var popular = d.products.filter(function (p) { return p.available; }).sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 8);
    html += '<section class="section"><div class="container"><div class="section-head reveal"><div><span class="hand">Lahore\'s favourites</span><h2>Most loved</h2></div><a href="menu.html">Browse everything &rarr;</a></div><div class="grid reveal">' +
      popular.map(function (p) { return CC.card(p); }).join("") + "</div></div></section>";

    body.innerHTML = html;

    var set = function (id, v) { var e = document.getElementById(id); if (e) e.innerHTML = v; };
    set("home-addr", esc(s.address));
    set("home-hours", s.hours.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join(""));
    var wa = document.getElementById("home-wa"); if (wa) wa.href = CC.waLink("Hello " + s.name + "!");
    var ph = document.getElementById("home-phone"); if (ph) { ph.textContent = s.phone; ph.href = "tel:" + s.phone.replace(/\s+/g, ""); }
  }, "Warming up the oven…");

  // fill contact bits even if the menu fails
  CC.load().then(function (d) {
    var s = d.settings, set = function (id, v) { var e = document.getElementById(id); if (e) e.innerHTML = v; };
    set("home-addr", esc(s.address));
    set("home-hours", s.hours.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join(""));
  }).catch(function () {});
})();
