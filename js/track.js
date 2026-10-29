/* Track Order page: shows ONLY the status and the order date. */
(function () {
  var CC = window.CC, esc = CC.esc;
  var $ = function (id) { return document.getElementById(id); };
  var STEPS = [["Received", "📝"], ["Baking", "🧁"], ["Out for delivery", "🛵"], ["Delivered", "🏠"]];
  var TEXT = {
    "Received": "We got your order and will start soon.",
    "Baking": "Your treats are in the oven right now!",
    "Out for delivery": "Your order is on its way. Please keep your phone close.",
    "Delivered": "Delivered. Enjoy every bite, and thank you!",
    "Cancelled": "This order was cancelled. If this is a surprise, please call us."
  };
  var timer = null, current = null, busy = false;

  var last = CC.store.last.get(), cust = CC.store.get("customer", null);
  var qs = new URLSearchParams(location.search);
  $("no").value = (qs.get("no") || (last && last.no) || "").slice(0, 14);
  $("phone").value = (last && last.phone) || (cust && cust.phone) || "";

  $("phone").addEventListener("input", function () {
    var g = this.value.replace(/\D/g, "");
    if (/^92/.test(g) && g.length >= 12) g = "0" + g.slice(2);
    g = g.slice(0, 11);
    this.value = g.length > 4 ? g.slice(0, 4) + "-" + g.slice(4) : g;
    this.closest(".field").classList.remove("invalid");
  });
  $("no").addEventListener("input", function () { this.closest(".field").classList.remove("invalid"); });

  function fieldBad(id, bad) { $(id).closest(".field").classList.toggle("invalid", bad); return bad; }

  $("track-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var no = $("no").value.trim().toUpperCase(), phone = $("phone").value.trim();
    var b1 = fieldBad("no", !/^[A-Z]{2,6}-?\d{3,7}$/.test(no)), b2 = fieldBad("phone", !/^03\d{2}-\d{7}$/.test(phone));
    if (b1 || b2) return;
    check(no, phone, true);
  });

  function check(no, phone, first) {
    busy = true; clearTimeout(timer);
    var btn = $("go"); btn.disabled = true; btn.textContent = "Looking…";
    if (first) { $("track-msg").innerHTML = ""; }
    CC.track(no, phone).then(function (res) {
      busy = false; btn.disabled = false; btn.textContent = "Track my order";
      if (res && res.ok) { current = { no: no, phone: phone }; show(no, res); }
      else { $("track-result").hidden = true; $("track-msg").innerHTML = '<div class="alert bad" role="alert">' + esc((res && res.error) || "We could not find an order with these details.") + "</div>"; }
    }).catch(function () {
      busy = false; btn.disabled = false; btn.textContent = "Track my order";
      $("track-msg").innerHTML = '<div class="alert bad" role="alert">We could not reach the bakery just now. Please try again in a moment.</div>';
    });
  }

  function show(no, res) {
    var st = res.status, idx = STEPS.map(function (x) { return x[0]; }).indexOf(st), cancelled = st === "Cancelled";
    $("track-msg").innerHTML = res.demo ? '<div class="alert info">Demo mode: the status moves along by itself every minute or so so you can see the animation.</div>' : "";
    var steps = STEPS.map(function (x, i) {
      var cls = cancelled ? "" : i < idx ? "done" : i === idx ? (idx === STEPS.length - 1 ? "done" : "now") : "";
      return '<div class="pstep ' + cls + '"><div class="dot">' + (cls === "done" ? "✓" : x[1]) + "</div>" + esc(x[0]) + "</div>";
    }).join("");
    var s = CC.data ? CC.data.settings : null;
    var r = $("track-result");
    r.innerHTML = '<div class="panel"><div class="center"><span class="hand">Order ' + esc(no) + "</span><h2>" + (cancelled ? "Order cancelled" : esc(st)) + "</h2>" +
      '<p class="muted">' + (res.orderTime ? "Placed on " + esc(CC.fmtDateTime(res.orderTime)) : "") + '</p></div><div class="progress' + (cancelled ? " cancelled" : "") + '" id="prog" style="--p:0"><div class="fill"></div>' + steps + "</div>" +
      '<p class="center" style="font-weight:700;margin:18px 0 8px">' + esc(TEXT[st] || "") + (cancelled && s ? " Call " + esc(s.phone) + "." : "") + "</p>" +
      '<div class="center"><button class="btn btn-ghost btn-sm" id="again" type="button">Check again</button></div></div>';
    r.hidden = false;
    var p = idx < 0 || cancelled ? 0 : idx / (STEPS.length - 1);
    setTimeout(function () { var pg = $("prog"); if (pg) pg.style.setProperty("--p", p); }, 120);
    $("again").addEventListener("click", function () { if (current) check(current.no, current.phone, false); });
    if (!cancelled && st !== "Delivered") schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!current) return;
      if (document.hidden) schedule(); else check(current.no, current.phone, false);
    }, 60000);
  }

  // Coming from the thank-you page: check straight away.
  if (qs.get("no") && $("phone").value.length === 12 && $("track-form").requestSubmit) $("track-form").requestSubmit();
})();
