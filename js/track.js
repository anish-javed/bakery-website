/* Track Order page.
   The phone number is required. The order number is optional.
   Only the order number, the date and the status are ever shown (never a name, address or items).
   While the page is open it checks again by itself every 30 seconds. */
(function () {
  var CC = window.CC, esc = CC.esc;
  var $ = function (id) { return document.getElementById(id); };
  var EVERY = 30000; // re-check every 30 seconds
  var PHONE_OK = /^03\d{2}-\d{7}$/, ORDER_OK = /^[A-Z]{2,6}-?\d{3,7}$/;
  var STEPS = {
    Delivery: [["Received", "📝"], ["Baking", "🧁"], ["Out for delivery", "🛵"], ["Delivered", "🏠"]],
    Pickup: [["Received", "📝"], ["Baking", "🧁"], ["Ready for pickup", "🛍️"], ["Collected", "🏠"]]
  };
  var RANK = { "Received": 0, "Baking": 1, "Out for delivery": 2, "Ready for pickup": 2, "Delivered": 3, "Collected": 3 };
  var FINAL = { "Delivered": 1, "Collected": 1, "Cancelled": 1 };
  var TEXT = {
    "Received": "We got your order and will start soon.",
    "Baking": "Your treats are in the oven right now!",
    "Out for delivery": "Your order is on its way. Please keep your phone close.",
    "Ready for pickup": "Your order is ready! Please come to the bakery to pick it up.",
    "Delivered": "Delivered. Enjoy every bite, and thank you!",
    "Collected": "Collected. Enjoy every bite, and thank you!",
    "Cancelled": "This order was cancelled. If this is a surprise, please call us."
  };
  var timer = null, seq = 0, current = null, shown = null, fromList = false, stale = false;

  var last = CC.store.last.get(), cust = CC.store.get("customer", null);
  var qs = new URLSearchParams(location.search);
  $("no").value = (qs.get("no") || (last && last.no) || "").toUpperCase().slice(0, 14);
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
    var no = $("no").value.trim().toUpperCase(), phone = $("phone").value.trim();
    var b1 = fieldBad("phone", !PHONE_OK.test(phone)), b2 = fieldBad("no", no !== "" && !ORDER_OK.test(no));
    if (b1 || b2) return;
    fromList = false;
    check(no, phone, false);
  });

  // Buttons inside the result: open one order from the list, go back to the list, refresh now.
  $("track-result").addEventListener("click", function (e) {
    var b = e.target.closest("[data-no],[data-t]");
    if (!b || !current) return;
    if (b.hasAttribute("data-no")) {
      var no = b.getAttribute("data-no");
      fromList = true; $("no").value = no;
      check(no, current.phone, false);
    } else if (b.getAttribute("data-t") === "back") {
      fromList = false; $("no").value = "";
      check("", current.phone, false);
    } else if (b.getAttribute("data-t") === "refresh") {
      check(current.no, current.phone, false);
    }
  });

  function ready() { var btn = $("go"); btn.disabled = false; btn.textContent = "Track my order"; }
  function say(html) { $("track-msg").innerHTML = html; }
  function bad(text) { say('<div class="alert bad" role="alert">' + esc(text) + "</div>"); }

  // silent = an automatic re-check: it does not touch the button and keeps what is on screen if the internet drops.
  function check(no, phone, silent) {
    var my = ++seq;
    clearTimeout(timer);
    if (!silent) { var btn = $("go"); btn.disabled = true; btn.textContent = "Looking…"; say(""); }
    CC.track(no, phone).then(function (res) {
      if (my !== seq) return; // a newer check has started
      ready();
      if (res && res.ok) {
        current = { no: no, phone: phone };
        say(res.demo ? '<div class="alert info">Demo mode: the status moves along by itself every minute or so so you can see the animation.</div>' : "");
        var watch = res.mode === "list" ? showList(res) : showOne(no, res);
        if (watch) schedule();
      } else {
        current = null; shown = null;
        $("track-result").hidden = true; $("track-result").innerHTML = "";
        bad((res && res.error) || "We could not find an order with these details.");
      }
    }).catch(function () {
      if (my !== seq) return;
      ready();
      if (silent && shown) { schedule(); return; } // keep showing the last status and try again soon
      bad("We could not reach the bakery just now. Please try again in a moment.");
    });
  }

  // Re-check every 30 seconds while the page is open (paused while the tab is hidden, then catches up).
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!current) return;
      if (document.hidden) { stale = true; return; }
      check(current.no, current.phone, true);
    }, EVERY);
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && stale && current) { stale = false; check(current.no, current.phone, true); }
  });

  function fmtDay(ms) {
    return ms ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }).format(new Date(ms)) : "";
  }
  var UPDATES = 'Updates by itself every 30 seconds · <button class="linkbtn" type="button" data-t="refresh">Refresh now</button>';

  /* ---------- phone only: the last 30 days of orders (number, date, status) ---------- */
  function showList(res) {
    var orders = res.orders || [], r = $("track-result"), key = "list|" + JSON.stringify(orders);
    if (!(shown && shown.key === key)) {
      var rows = orders.map(function (o) {
        var cls = o.status === "Cancelled" ? " cancelled" : FINAL[o.status] ? " final" : "";
        return '<li><button class="orow" type="button" data-no="' + esc(o.no) + '"><b>' + esc(o.no) + '</b><span class="od">' + esc(fmtDay(o.orderTime)) + '</span><span class="os' + cls + '">' + esc(o.status) + "</span></button></li>";
      }).join("");
      r.innerHTML = '<div class="panel"><div class="center"><span class="hand">Your orders</span><h2>Last 30 days</h2><p class="muted">Newest first. Tap an order to see its progress.</p></div>' +
        '<ul class="olist">' + rows + '</ul><p class="center muted" style="font-size:.88rem;margin:16px 0 0">' + UPDATES + "</p></div>";
    }
    r.hidden = false;
    shown = { key: key };
    return orders.some(function (o) { return !FINAL[o.status]; });
  }

  /* ---------- one order: the progress line ---------- */
  function showOne(no, res) {
    var method = res.method === "Pickup" ? "Pickup" : "Delivery", steps = STEPS[method];
    var st = res.status, cancelled = st === "Cancelled", idx = RANK[st] == null ? -1 : RANK[st];
    var orderNo = res.orderNo || no, key = "one|" + orderNo + "|" + method, r = $("track-result");
    var fresh = !(shown && shown.key === key && $("prog")), changed = !fresh && shown.status !== st;
    var s = CC.data ? CC.data.settings : null;

    if (fresh) {
      r.innerHTML = '<div class="panel"><div class="center"><span class="hand">Order ' + esc(orderNo) + '</span><h2 id="t-status" aria-live="polite"></h2><p class="muted" id="t-placed"></p></div>' +
        '<div class="progress" id="prog" style="--p:0"><div class="fill"></div>' +
        steps.map(function (x) { return '<div class="pstep"><div class="dot"></div>' + esc(x[0]) + "</div>"; }).join("") + "</div>" +
        '<p class="center" id="t-text" style="font-weight:700;margin:18px 0 8px"></p>' +
        '<p class="center muted" style="font-size:.88rem;margin:0">' + (fromList ? '<button class="linkbtn" type="button" data-t="back">&larr; All my orders</button><br>' : "") + UPDATES + "</p></div>";
      r.hidden = false;
    }
    $("t-status").textContent = cancelled ? "Order cancelled" : st;
    $("t-placed").textContent = res.orderTime ? "Placed on " + CC.fmtDateTime(res.orderTime) : "";
    $("t-text").textContent = (TEXT[st] || "") + (cancelled && s ? " Call " + s.phone + "." : "");

    var prog = $("prog");
    prog.classList.toggle("cancelled", cancelled);
    prog.querySelectorAll(".pstep").forEach(function (el, i) {
      var cls = cancelled ? "" : i < idx ? "done" : i === idx ? (idx === steps.length - 1 ? "done" : "now") : "";
      el.className = "pstep" + (cls ? " " + cls : "");
      el.querySelector(".dot").textContent = cls === "done" ? "✓" : steps[i][1];
      if (changed && i === idx) { el.classList.add("pop"); setTimeout(function () { el.classList.remove("pop"); }, 900); }
    });
    var p = idx < 0 || cancelled ? 0 : idx / (steps.length - 1);
    if (fresh) setTimeout(function () { var pg = $("prog"); if (pg) pg.style.setProperty("--p", p); }, 120);
    else prog.style.setProperty("--p", p); // the line slides to the new step
    if (changed) CC.toast(cancelled ? "Your order was cancelled" : "Your order is now: " + st);

    shown = { key: key, status: st };
    return !FINAL[st];
  }

  // The browser remembers an order / phone: show the status straight away, without pressing the button.
  // (This also covers "Track this order" after placing an order.)
  (function () {
    var no = $("no").value.trim().toUpperCase(), phone = $("phone").value.trim();
    if (PHONE_OK.test(phone) && (no === "" || ORDER_OK.test(no))) check(no, phone, false);
  })();
})();
