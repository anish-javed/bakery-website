/* Build Your Cake page */
(function () {
  var CC = window.CC, esc = CC.esc;
  var $ = function (id) { return document.getElementById(id); };

  CC.boot($("cake-load"), function (d) {
    var o = d.options, s = d.settings;
    if (!o.sizes.length || !o.flavours.length || !o.frostings.length) {
      $("cake-load").innerHTML = '<div class="errbox"><h3>The cake builder is resting</h3><p>Our cake options are not available right now. Please call us on ' + esc(s.phone) + ' to order a cake.</p></div>';
      return;
    }

    $("cake-app").hidden = false;

    function radios(name, items, label) {
      return items.map(function (it, i) { return label(it, '<input type="radio" name="' + name + '" value="' + esc(it.name) + '"' + (i === 0 ? " checked" : "") + ">"); }).join("");
    }
    $("o-size").innerHTML = radios("size", o.sizes, function (it, inp) {
      return '<label class="opt">' + inp + "<span>" + esc(it.name) + "<small>" + CC.fmt(it.price) + " · serves " + it.pounds * 4 + "-" + it.pounds * 5 + "</small></span></label>";
    });
    $("o-flavour").innerHTML = radios("flavour", o.flavours, function (it, inp) {
      return '<label class="opt">' + inp + '<span><i class="swatch" style="background:' + CC.art.spongeColor(it.name) + '"></i>' + esc(it.name) + "<small>" + (it.extra ? "+" + CC.fmt(it.extra) + " per lb" : "Included") + "</small></span></label>";
    });
    $("o-frosting").innerHTML = radios("frosting", o.frostings, function (it, inp) {
      return '<label class="opt">' + inp + '<span><i class="swatch" style="background:' + CC.art.frostInfo(it.name).c + '"></i>' + esc(it.name) + "<small>" + (it.extra ? "+" + CC.fmt(it.extra) + " per lb" : "Included") + "</small></span></label>";
    });

    var notice = Math.max(0, s.noticeDays), min = CC.addDays(CC.todayPK(), notice), dateEl = $("date");
    dateEl.min = min; dateEl.max = CC.addDays(CC.todayPK(), 90);
    var saved = CC.store.get("cakeDate", "");
    if (saved >= min) dateEl.value = saved;
    $("date-hint").textContent = "We need at least " + notice + " day" + (notice === 1 ? "" : "s") + " to bake your cake. Earliest date: " + CC.fmtDate(min) + ".";

    var promo = CC.promoText();
    if (promo) { var pc = $("cake-promo"); pc.innerHTML = CC.art.icons.tag + "<div><b>" + esc(promo) + "</b></div>"; pc.classList.remove("hidden"); }

    function pick(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
    function find(list, name) { return list.filter(function (x) { return x.name === name; })[0]; }
    function config() { return { size: pick("size"), flavour: pick("flavour"), frosting: pick("frosting"), message: $("msg").value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 30) }; }

    var first = true;
    function update() {
      var c = config(), size = find(o.sizes, c.size), price = CC.cakePrice(c, o);
      $("cake-svg").innerHTML = CC.art.cake({ pounds: size ? size.pounds : 1, flavour: c.flavour, frosting: c.frosting, message: c.message });
      if (!first) { var sv = $("cake-svg").firstChild; sv.classList.add("wob"); }
      first = false;
      $("live-price").textContent = CC.fmt(price || 0);
      $("live-detail").textContent = c.size + " · " + c.flavour + " · " + c.frosting;
      $("msg-left").textContent = 30 - $("msg").value.length;
    }
    document.querySelector(".cake-layout").addEventListener("change", update);
    $("msg").addEventListener("input", update);
    update();

    $("add-cake").addEventListener("click", function () {
      var c = config(), price = CC.cakePrice(c, o);
      if (price == null) return CC.toast("Please choose all the options.");
      var v = dateEl.value;
      if (!v || v < min) { $("date-field").classList.add("invalid"); $("date-err").textContent = v ? "We need at least " + notice + " days. Earliest date: " + CC.fmtDate(min) + "." : "Please pick the date you need the cake."; dateEl.focus(); return; }
      $("date-field").classList.remove("invalid");
      CC.store.set("cakeDate", v);
      CC.fly($("add-cake"));
      CC.cart.addCake(c, price);
      CC.toast("Your cake is in the cart");
      CC.showSheet(["Cakes"]);
    });
    dateEl.addEventListener("input", function () { $("date-field").classList.remove("invalid"); });
  }, "Getting the sprinkles ready…");
})();
