/* Cart & Checkout page */
(function () {
  var CC = window.CC, esc = CC.esc, icons = CC.art.icons;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var d, s, formStart = Date.now(), done = false, busy = false;
  var BANK = "Bank transfer / JazzCash";

  CC.boot($("cart-load"), function (data) {
    d = data; s = d.settings;
    $("cart-root").hidden = false;
    buildForm();
    bind();
    renderAll();
  }, "Opening your cart…");

  function method() { var r = document.querySelector('input[name="method"]:checked'); return r ? r.value : "Delivery"; }
  function payment() { var r = document.querySelector('input[name="payment"]:checked'); return r ? r.value : ""; }
  function lines() { return CC.cart.lines(); }

  /* ---------- form setup ---------- */
  function buildForm() {
    var areas = s.areas.slice();
    $("area").innerHTML = '<option value="">Choose your area</option>' + areas.map(function (a) { return "<option>" + esc(a) + "</option>"; }).join("") + "<option>Other (write it in the address)</option>";

    var pay = "";
    if (s.cod) pay += '<label class="choice stack"><input type="radio" name="payment" value="Cash on Delivery" checked><span>Cash on Delivery <small class="muted">(or pay when you pick up)</small></span></label>';
    pay += '<label class="choice stack"><input type="radio" name="payment" value="' + BANK + '"' + (s.cod ? "" : " checked") + "><span>" + BANK + "</span></label>";
    $("pay-choices").innerHTML = pay;

    $("pickup-fields").innerHTML = "<div><b>Pick up from:</b> " + esc(s.address) + "<br>" + s.hours.map(esc).join("<br>") + "</div>";
    var saved = CC.store.get("customer", null);
    if (saved) { $("name").value = saved.name || ""; $("phone").value = saved.phone || ""; }
    syncMethod(); syncPay(); setupDate();
  }

  function syncMethod() {
    var del = method() === "Delivery";
    $("delivery-fields").hidden = !del;
    $("pickup-fields").hidden = del;
    $("date-label").textContent = del ? "Delivery date" : "Pickup date";
  }

  function syncPay() {
    var box = $("paybox");
    if (payment() !== BANK) { box.hidden = true; return; }
    var t = CC.calc(lines(), method(), s).total, rows = "";
    function row(k, v) { return v ? "<dt>" + k + "</dt><dd>" + esc(v) + ' <button class="copy" type="button" data-copy="' + esc(v) + '">Copy</button></dd>' : ""; }
    rows += row("Bank", s.bank) + row("Account title", s.accountTitle) + row("Account no.", s.accountNo) + row("IBAN", s.iban) + row("JazzCash", s.jazz) + row("JazzCash name", s.jazzTitle);
    box.innerHTML = "<dl>" + rows + "</dl><div><b>Please send " + CC.fmt(t) + ".</b> " + esc(s.payNote) + " <b>The bakery confirms your payment</b> before your order is baked.</div>";
    box.hidden = false;
  }

  function minDate() { return CC.cart.hasCake() ? CC.addDays(CC.todayPK(), Math.max(0, s.noticeDays)) : CC.todayPK(); }

  function setupDate() {
    var el = $("date"), min = minDate();
    el.min = min; el.max = CC.addDays(CC.todayPK(), 90);
    if (!el.value) { var saved = CC.store.get("cakeDate", ""); if (saved && saved >= min) el.value = saved; }
    if (el.value && el.value < min) el.value = "";
    $("date-hint").textContent = CC.cart.hasCake() ? "Your cake needs at least " + s.noticeDays + " day" + (s.noticeDays === 1 ? "" : "s") + " notice. Earliest date: " + CC.fmtDate(min) + "." : "";
    renderSlots();
  }

  function slotStart(str) {
    var m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(str);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12 + (/pm/i.test(m[3]) ? 12 : 0);
    return h * 60 + (m[2] ? parseInt(m[2], 10) : 0);
  }
  function renderSlots() {
    var sel = $("slot"), cur = sel.value, today = $("date").value === CC.todayPK(), now = CC.nowPKMinutes(), any = false;
    var html = '<option value="Any time">Any time</option>';
    s.slots.forEach(function (sl) {
      var st = slotStart(sl), off = today && st != null && st < now + 60;
      if (!off) any = true;
      html += "<option" + (off ? " disabled" : "") + ">" + esc(sl) + (off ? " (passed)" : "") + "</option>";
    });
    sel.innerHTML = html;
    if (cur && s.slots.indexOf(cur) > -1) sel.value = cur;
    if (today && !any && s.slots.length) $("date-hint").textContent = "No time slots are left today. You can still choose Any time, or pick another day.";
  }

  /* ---------- rendering ---------- */
  function renderAll() {
    var ls = lines();
    if (done) return;
    var empty = !ls.length;
    $("empty-cart").hidden = !empty;
    $("cart-main").hidden = empty;
    if (empty) {
      $("empty-cart").innerHTML = CC.art.placeholder("Cakes", "empty cart").replace("<svg ", '<svg style="width:220px;height:165px;border-radius:24px;margin:0 auto 12px" ') +
        "<h2>Your cart is empty</h2><p class=\"muted\">Add something sweet and it will show up here.</p><a class=\"btn btn-rose\" href=\"menu.html\">Browse the menu</a>";
      var last = CC.store.last.get();
      if (last && last.items && last.items.length) $("empty-cart").insertAdjacentHTML("beforeend", '<p style="margin-top:14px"><button class="btn btn-ghost" data-act="reorder">Reorder your last order (' + esc(last.no) + ")</button></p>");
      return;
    }
    renderLines(); renderNotices(); renderSuggest(); renderSummary(); setupDate(); syncPay();
  }

  function renderLines() {
    $("lines").innerHTML = lines().map(function (l) {
      var thumb = l.kind === "cake" ? CC.art.cake({ pounds: l.cake.pounds || parseInt(l.cake.size, 10) || 1, flavour: l.cake.flavour, frosting: l.cake.frosting, message: l.cake.message }) : CC.imgHTML({ photo: l.photo, category: l.category, name: l.name });
      var flags = (l.soldOut ? ' <span class="tag out">Not available</span>' : "") + (l.delivery === false ? ' <span class="tag pickup">Pickup only</span>' : "");
      var sub = esc(l.unit || "") + " · " + CC.fmt(l.price) + " each" + (l.kind === "cake" && l.cake.message ? "<br>Message: “" + esc(l.cake.message) + "”" : "");
      return '<div class="cart-line" data-key="' + esc(l.key) + '"><div class="thumb">' + thumb + "</div><div><h4>" + esc(l.name) + flags + '</h4><div class="sub">' + sub + '</div><button class="remove" type="button" data-lact="remove">Remove</button></div>' +
        '<div class="lp">' + CC.fmt(l.price * l.qty) + '<div class="stepper" style="margin-top:6px"><button type="button" data-lact="dec" aria-label="One less">&minus;</button><span>' + l.qty + '</span><button type="button" data-lact="inc" aria-label="One more">+</button></div></div></div>';
    }).join("");
  }

  function blockers() {
    var ls = lines(), out = { soldOut: [], pickupOnly: [] };
    ls.forEach(function (l) {
      if (l.soldOut) out.soldOut.push(l);
      else if (l.delivery === false && method() === "Delivery") out.pickupOnly.push(l);
    });
    return out;
  }

  function renderNotices(extra) {
    var b = blockers(), h = extra || "", skipped = CC.store.get("reorderSkipped", 0);
    if (!s.accepting) h += '<div class="alert bad">We are not taking online orders right now. Please call us on ' + esc(s.phone) + ".</div>";
    if (d.demo) h += '<div class="alert info">Demo mode: this order will not be sent anywhere. It only lets you test the steps.</div>';
    if (skipped) h += '<div class="alert warn">' + skipped + " item" + (skipped === 1 ? " from your last order is" : "s from your last order are") + " not available today, so we left " + (skipped === 1 ? "it" : "them") + " out.</div>";
    if (b.soldOut.length) h += '<div class="alert bad"><div>' + esc(b.soldOut.map(function (l) { return l.name; }).join(", ")) + " is not available today. <button class=\"remove\" type=\"button\" data-lact=\"remove-sold\" style=\"font-weight:800\">Remove it from my cart</button></div></div>";
    if (b.pickupOnly.length) h += '<div class="alert warn"><div><b>Pickup only:</b> ' + esc(b.pickupOnly.map(function (l) { return l.name; }).join(", ")) + " cannot be delivered. Choose pickup, or remove " + (b.pickupOnly.length === 1 ? "it" : "them") + '.<br><button class="btn btn-sm btn-caramel" type="button" data-lact="to-pickup" style="margin:8px 8px 0 0">Switch to pickup</button><button class="btn btn-sm btn-ghost" type="button" data-lact="remove-pickup" style="margin-top:8px">Remove ' + (b.pickupOnly.length === 1 ? "it" : "them") + "</button></div></div>";
    $("notices").innerHTML = h;
    if (CC.store.get("reorderSkipped", 0)) CC.store.set("reorderSkipped", 0);
  }

  function renderSuggest() {
    var cats = []; lines().forEach(function (l) { if (cats.indexOf(l.category) === -1) cats.push(l.category); });
    var list = CC.suggest(cats, 3);
    $("suggest-panel").hidden = !list.length;
    $("suggest").innerHTML = list.map(CC.miniHTML).join("");
  }

  function renderSummary() {
    var ls = lines(), c = CC.calc(ls, method(), s), n = ls.reduce(function (a, l) { return a + l.qty; }, 0);
    var h = '<div class="sumrow"><span>Subtotal (' + n + " item" + (n === 1 ? "" : "s") + ")</span><span>" + CC.fmt(c.subtotal) + "</span></div>" +
      '<div class="sumrow"><span>' + (method() === "Delivery" ? "Delivery fee" : "Pickup") + "</span><span>" + (method() === "Delivery" ? CC.fmt(c.fee) : "Free") + "</span></div>";
    if (s.discountPct > 0) {
      h += '<div class="sumrow"><span>Bill before discount</span><span>' + CC.fmt(c.subtotal + c.fee) + "</span></div>" +
        '<div class="sumrow disc"><span>Online discount (' + s.discountPct + "% off the total bill)</span><span>&minus;" + CC.fmt(c.discount) + "</span></div>";
    }
    h += '<div class="sumrow total"><span>Total</span><span>' + CC.fmt(c.total) + "</span></div>";
    $("summary").innerHTML = h;
    var bp = $("bill-promo");
    if (c.discount > 0) { bp.innerHTML = icons.tag + "<div><b>You save " + CC.fmt(c.discount) + "</b> by ordering online</div>"; bp.classList.remove("hidden"); } else bp.classList.add("hidden");
  }

  /* ---------- events ---------- */
  function bind() {
    window.addEventListener("cc:cart", renderAll);
    document.querySelectorAll('input[name="method"]').forEach(function (r) { r.addEventListener("change", function () { syncMethod(); renderNotices(); renderSummary(); syncPay(); }); });
    $("pay-choices").addEventListener("change", syncPay);
    $("date").addEventListener("input", function () { renderSlots(); clearErr("f-date"); });
    $("slot").addEventListener("change", function () { clearErr("f-slot"); });
    $("phone").addEventListener("input", function () {
      var g = this.value.replace(/\D/g, "");
      if (/^92/.test(g) && g.length >= 12) g = "0" + g.slice(2);
      g = g.slice(0, 11);
      this.value = g.length > 4 ? g.slice(0, 4) + "-" + g.slice(4) : g;
      clearErr("phone");
    });
    ["name", "area", "address"].forEach(function (id) { $(id).addEventListener("input", function () { clearErr(id); }); });

    $("lines").addEventListener("click", function (e) {
      var b = e.target.closest("[data-lact]"); if (!b) return;
      var key = b.closest(".cart-line").getAttribute("data-key"), l = lines().filter(function (x) { return x.key === key; })[0];
      if (!l) return;
      var act = b.getAttribute("data-lact");
      if (act === "inc") CC.cart.setQty(key, l.qty + 1);
      else if (act === "dec") CC.cart.setQty(key, l.qty - 1);
      else if (act === "remove") CC.cart.remove(key);
    });
    $("notices").addEventListener("click", function (e) {
      var b = e.target.closest("[data-lact]"); if (!b) return;
      var act = b.getAttribute("data-lact");
      if (act === "to-pickup") { document.querySelector('input[name="method"][value="Pickup"]').checked = true; syncMethod(); renderNotices(); renderSummary(); syncPay(); }
      else if (act === "remove-pickup") { blockers().pickupOnly.forEach(function (l) { CC.cart.remove(l.key); }); }
      else if (act === "remove-sold") { blockers().soldOut.forEach(function (l) { CC.cart.remove(l.key); }); }
    });
    $("paybox").addEventListener("click", function (e) {
      var b = e.target.closest("[data-copy]"); if (!b) return;
      var t = b.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { CC.toast("Copied"); }, function () { CC.toast(t); });
      else CC.toast(t);
    });
    $("checkout").addEventListener("submit", submit);
  }

  function setErr(id, on, msg) {
    var f = $(id).closest(".field"); if (!f) return;
    f.classList.toggle("invalid", on);
    if (on && msg) { var er = f.querySelector(".err"); if (er) er.textContent = msg; }
  }
  function clearErr(id) { var el = $(id); var f = el && (el.closest ? el.closest(".field") : null); if (f) f.classList.remove("invalid"); }

  /* ---------- submit ---------- */
  function validate() {
    var bad = [], del = method() === "Delivery";
    var name = $("name").value.trim(), phone = $("phone").value.trim(), date = $("date").value;
    function chk(id, ok, msg) { setErr(id, !ok, msg); if (!ok) bad.push(id); }
    chk("name", name.length >= 2);
    chk("phone", /^03\d{2}-\d{7}$/.test(phone));
    if (del) { chk("area", !!$("area").value); chk("address", $("address").value.trim().length >= 8); }
    var min = minDate();
    chk("date", !!date && date >= min && date <= CC.addDays(CC.todayPK(), 90), !date ? "Please pick a date." : "Earliest date is " + CC.fmtDate(min) + ".");
    return bad;
  }

  function buildPayload() {
    var ls = lines(), del = method() === "Delivery";
    return {
      items: ls.map(function (l) { return l.kind === "cake" ? { cake: { size: l.cake.size, flavour: l.cake.flavour, frosting: l.cake.frosting, message: l.cake.message || "" }, qty: l.qty } : { name: l.name, qty: l.qty }; }),
      name: $("name").value.trim(), phone: $("phone").value.trim(), method: method(),
      area: del ? $("area").value : "", address: del ? $("address").value.trim() : "",
      date: $("date").value, slot: $("slot").value || "Any time", payment: payment(), notes: $("notes").value.trim(),
      expectedTotal: CC.calc(ls, method(), s).total,
      hp: $("hp").value, elapsed: Date.now() - formStart
    };
  }

  function fail(msg) {
    $("notices").insertAdjacentHTML("afterbegin", '<div class="alert bad" role="alert">' + esc(msg) + "</div>");
    $("notices").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  function submit(e) {
    e.preventDefault();
    if (busy) return;
    renderNotices();
    var bad = validate(), b = blockers();
    if (!s.accepting) return $("notices").scrollIntoView({ block: "center" });
    if (b.soldOut.length || b.pickupOnly.length) return $("notices").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (bad.length) { var el = $(bad[0]); el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); try { el.focus({ preventScroll: true }); } catch (x) { /* ignore */ } return; }

    var payload = buildPayload(), btn = $("place");
    busy = true; btn.disabled = true; btn.textContent = "Sending your order…";
    CC.placeOrder(payload).then(function (res) {
      busy = false; btn.disabled = false; btn.textContent = "Place my order";
      if (res && res.ok) success(res, payload);
      else fail((res && res.error) || "Sorry, we could not place your order. Please try again.");
    }).catch(function () {
      busy = false; btn.disabled = false; btn.textContent = "Place my order";
      fail("We could not reach the bakery just now. Your cart is safe, so please try again in a moment.");
    });
  }

  /* ---------- thank-you ---------- */
  function success(res, payload) {
    var ls = lines();
    CC.store.last.set({ no: res.orderNo, t: Date.now(), phone: payload.phone, method: payload.method, total: res.total, items: ls.map(function (l) { return l.kind === "cake" ? { cake: l.cake, qty: l.qty } : { name: l.name, qty: l.qty }; }) });
    CC.store.set("customer", { name: payload.name, phone: payload.phone });
    done = true;
    CC.cart.clear();

    var wa = ["Hello " + s.name + "! I placed order " + res.orderNo + ".", ""];
    (res.items || []).forEach(function (i) { wa.push(i.qty + " x " + i.label + " = " + CC.fmt(i.lineTotal)); });
    wa.push("", "Subtotal: " + CC.fmt(res.subtotal));
    if (res.deliveryFee) wa.push("Delivery fee: " + CC.fmt(res.deliveryFee));
    if (res.discount) wa.push("Online discount (on items + delivery): -" + CC.fmt(res.discount));
    wa.push("Total: " + CC.fmt(res.total), "");
    wa.push(payload.method === "Delivery" ? "Delivery to: " + payload.area + ", " + payload.address : "Pickup from the bakery");
    wa.push("Date: " + CC.fmtDate(payload.date) + ", " + payload.slot, "Payment: " + payload.payment, "Name: " + payload.name, "Phone: " + payload.phone);

    var items = (res.items || []).map(function (i) { return '<div class="sumrow"><span>' + i.qty + " &times; " + esc(i.label) + "</span><span>" + CC.fmt(i.lineTotal) + "</span></div>"; }).join("");
    var bill = items + '<div class="sumrow"><span>Subtotal</span><span>' + CC.fmt(res.subtotal) + "</span></div>" +
      '<div class="sumrow"><span>' + (payload.method === "Delivery" ? "Delivery fee" : "Pickup") + "</span><span>" + (res.deliveryFee ? CC.fmt(res.deliveryFee) : "Free") + "</span></div>" +
      (res.discount ? '<div class="sumrow"><span>Bill before discount</span><span>' + CC.fmt(res.subtotal + (res.deliveryFee || 0)) + "</span></div>" +
        '<div class="sumrow disc"><span>Online discount' + (s.discountPct > 0 ? " (" + s.discountPct + "% off the total bill)" : "") + "</span><span>&minus;" + CC.fmt(res.discount) + "</span></div>" : "") +
      '<div class="sumrow total"><span>Total</span><span>' + CC.fmt(res.total) + "</span></div>";

    var note = res.total !== payload.expectedTotal ? '<div class="alert warn">Some prices changed since you added your items. This is your final total.</div>' : "";
    var payNote = payload.payment === BANK ? '<div class="alert info" style="text-align:left">Please send <b>' + CC.fmt(res.total) + "</b> to the account shown at checkout (" + esc([s.bank, s.accountNo, s.jazz].filter(Boolean).join(" · ")) + "). Then send the screenshot on WhatsApp. <b>The bakery confirms your payment</b> before baking.</div>" : "";
    var demo = res.demo ? '<div class="alert info">This was a demo order. It was not saved anywhere.</div>' : "";

    $("cart-main").hidden = true; $("empty-cart").hidden = true; $("cart-head").hidden = true;
    var t = $("thanks");
    t.innerHTML = '<div class="confetti-wrap" id="confetti"></div><span class="hand">Thank you, ' + esc(payload.name.split(/\s+/)[0]) + "!</span><h1>Your order is in</h1><p>Your order number is</p>" +
      '<div class="order-no">' + esc(res.orderNo) + "</div><p>Please save this number. With your phone number, it lets you follow your order on the Track Order page.</p>" + demo + note +
      '<div class="panel" style="text-align:left">' + bill + "</div>" + payNote +
      '<div class="actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(CC.waLink(wa.join("\n"))) + '">Send this order on WhatsApp</a>' +
      '<a class="btn btn-caramel" href="track.html?no=' + encodeURIComponent(res.orderNo) + '">Track this order</a><a class="btn btn-ghost" href="menu.html">Order more treats</a></div>';
    t.hidden = false;
    document.title = "Order " + res.orderNo + " | Crumbs & Co.";
    window.scrollTo({ top: 0 });
    if (!reduceMotion && window.innerWidth > 0) {
      var cw = $("confetti"), cols = ["#e8788a", "#c98a4b", "#8cc9b5", "#f4a43a", "#4a2c1d"], n = window.innerWidth < 700 ? 18 : 36, h = "";
      for (var i = 0; i < n; i++) h += '<i class="conf" style="left:' + (10 + Math.random() * 80) + "%;background:" + cols[i % 5] + ";--dx:" + Math.round(Math.random() * 120 - 60) + "px;--rot:" + Math.round(Math.random() * 540) + "deg;animation-delay:" + (Math.random() * 0.3).toFixed(2) + 's"></i>';
      cw.innerHTML = h;
      setTimeout(function () { cw.remove(); }, 2500);
    }
  }
})();
