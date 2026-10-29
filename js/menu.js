/* Menu page: categories, instant search, filters, sorting, favourites, lazy loading of 100+ items. */
(function () {
  var CC = window.CC, esc = CC.esc;
  var $ = function (id) { return document.getElementById(id); };
  var PAGE = 24;
  var state = { cat: "All", q: "", min: null, max: null, sort: "popular", stock: false, fav: false };
  var d, list = [], shown = 0, re = null, tokens = [];

  $("search-icon").innerHTML = CC.art.icons.search;

  CC.boot($("menu-load"), function (data) {
    d = data;
    var params = new URLSearchParams(location.search);
    var cat = params.get("cat");
    if (cat && d.categories.indexOf(cat) > -1) state.cat = cat;
    if (params.get("q")) state.q = params.get("q").slice(0, 60);
    if (params.get("fav") === "1") state.fav = true;
    if (/^(popular|low|high|new)$/.test(params.get("sort") || "")) state.sort = params.get("sort");

    var promo = CC.promoText();
    if (promo) { var pc = $("menu-promo"); pc.innerHTML = CC.art.icons.tag + "<div><b>" + esc(promo) + "</b></div>"; pc.classList.remove("hidden"); }

    buildCatBar();
    buildSpecials();
    $("q").value = state.q; $("sort").value = state.sort; $("stock").checked = state.stock;
    $("catbar-wrap").hidden = false;
    markCat(true); // scroll the bar to the chosen category now that it is visible
    $("menu-app").hidden = false;
    updateFavUI();
    refresh();
    bind();
  }, "Fetching today's menu…");

  /* ---------- category bar ---------- */
  function buildCatBar() {
    var bar = $("catbar");
    var html = '<button class="cat-btn" data-cat="All" role="tab">All<small>' + d.products.length + "</small></button>";
    d.categories.forEach(function (c) { html += '<button class="cat-btn" data-cat="' + esc(c) + '" role="tab">' + esc(c) + "<small>" + d.counts[c] + "</small></button>"; });
    bar.innerHTML = html;
    markCat(true);
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".cat-btn"); if (!b) return;
      state.cat = b.getAttribute("data-cat");
      markCat(false); refresh(true);
    });
  }
  function markCat(instant) {
    var active = null;
    $("catbar").querySelectorAll(".cat-btn").forEach(function (b) {
      var on = b.getAttribute("data-cat") === state.cat;
      b.classList.toggle("active", on); b.setAttribute("aria-selected", on);
      if (on) active = b;
    });
    if (active && active.scrollIntoView) {
      var bar = $("catbar"), target = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
      bar.scrollTo ? bar.scrollTo({ left: Math.max(0, target), behavior: instant ? "auto" : "smooth" }) : (bar.scrollLeft = target);
    }
  }

  function buildSpecials() {
    var sp = d.products.filter(function (p) { return p.featured && p.available; }).sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 12);
    if (!sp.length) return;
    $("specials-row").innerHTML = sp.map(function (p) { return CC.card(p); }).join("");
    $("specials").hidden = false;
  }

  /* ---------- filtering ---------- */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function hl(name) {
    if (!re) return esc(name);
    return name.split(re).map(function (part, i) { return i % 2 ? "<mark>" + esc(part) + "</mark>" : esc(part); }).join("");
  }

  function compute() {
    tokens = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    re = tokens.length ? new RegExp("(" + tokens.map(escRe).join("|") + ")", "ig") : null;
    var favs = CC.favs.all(), out = [];
    d.products.forEach(function (p) {
      if (state.fav && favs.indexOf(p.name) === -1) return;
      if (state.cat !== "All" && p.category !== state.cat) return;
      if (state.stock && !p.available) return;
      if (state.min != null && p.price < state.min) return;
      if (state.max != null && p.price > state.max) return;
      var score = 0;
      if (tokens.length) {
        var n = p.name.toLowerCase(), hay = n + " " + p.category.toLowerCase() + " " + p.unit.toLowerCase() + " " + p.description.toLowerCase();
        for (var i = 0; i < tokens.length; i++) {
          if (hay.indexOf(tokens[i]) === -1) return;
          var at = n.indexOf(tokens[i]);
          score += at === 0 ? 3 : at > -1 ? 2 : 1;
        }
      }
      out.push({ p: p, score: score });
    });
    out.sort(function (a, b) {
      if (state.sort === "low") return a.p.price - b.p.price || a.p.name.localeCompare(b.p.name);
      if (state.sort === "high") return b.p.price - a.p.price || a.p.name.localeCompare(b.p.name);
      if (a.p.available !== b.p.available) return a.p.available ? -1 : 1;
      if (state.sort === "new") return b.p.order - a.p.order;
      return b.score - a.score || b.p.popularity - a.p.popularity || a.p.name.localeCompare(b.p.name);
    });
    return out;
  }

  function filtersActive() { return !!(state.q || state.min != null || state.max != null || state.stock); }

  function refresh(scrollUp) {
    list = compute(); shown = 0;
    $("grid").innerHTML = "";
    $("empty").classList.add("hidden");
    renderMore();
    updateCount();
    $("specials").style.display = (state.cat === "All" && !state.q && !state.fav && $("specials-row").children.length) ? "" : "none";
    if (!list.length) showEmpty();
    $("clear").classList.toggle("hidden", !filtersActive() && !state.fav);
    syncUrl();
    if (scrollUp) {
      var top = $("grid").getBoundingClientRect().top + window.scrollY - 150;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    setTimeout(fill, 50);
  }

  function renderMore() {
    var next = list.slice(shown, shown + PAGE);
    if (next.length) {
      $("grid").insertAdjacentHTML("beforeend", next.map(function (x) { return CC.card(x.p, hl); }).join(""));
      shown += next.length;
    }
    $("more-wrap").classList.toggle("hidden", shown >= list.length);
  }
  function fill() { // keep loading while the end of the list is close to the screen
    var guard = 0;
    while (shown < list.length && guard++ < 6 && $("sentinel").getBoundingClientRect().top < window.innerHeight + 700) renderMore();
  }

  function updateCount() {
    var n = list.length, t = n + " item" + (n === 1 ? "" : "s");
    if (state.q) t += " for “" + state.q + "”";
    if (state.cat !== "All") t += " in " + state.cat;
    if (state.fav) t += " in your favourites";
    $("count").textContent = t;
  }
  function showEmpty() {
    var e = $("empty");
    e.innerHTML = CC.art.placeholder("default", "empty").replace("<svg ", '<svg style="width:140px;height:105px;border-radius:20px;margin:0 auto 10px" ') +
      (state.fav && !filtersActive() && state.cat === "All"
        ? "<h3>No favourites yet</h3><p class=\"muted\">Tap the heart on any item and it will wait for you here.</p>"
        : "<h3>Nothing matches that</h3><p class=\"muted\">Try another word, a wider price range, or clear the filters.</p>");
    e.classList.remove("hidden");
  }

  function syncUrl() {
    try {
      var p = new URLSearchParams();
      if (state.cat !== "All") p.set("cat", state.cat);
      if (state.q) p.set("q", state.q);
      if (state.fav) p.set("fav", "1");
      if (state.sort !== "popular") p.set("sort", state.sort);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    } catch (e) { /* file:// or blocked */ }
  }

  function updateFavUI() {
    var n = CC.favs.all().length;
    $("fav-count").textContent = n;
    $("fav-toggle").classList.toggle("on", state.fav);
    $("fav-toggle").setAttribute("aria-pressed", state.fav);
  }

  /* ---------- events ---------- */
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function num(v) { var n = parseFloat(v); return isNaN(n) || n < 0 ? null : n; }

  function bind() {
    $("q").addEventListener("input", debounce(function () { state.q = $("q").value.trim().slice(0, 60); refresh(); }, 80));
    var price = debounce(function () { state.min = num($("pmin").value); state.max = num($("pmax").value); refresh(); }, 250);
    $("pmin").addEventListener("input", price); $("pmax").addEventListener("input", price);
    $("sort").addEventListener("change", function () { state.sort = $("sort").value; refresh(); });
    $("stock").addEventListener("change", function () { state.stock = $("stock").checked; $("stock-toggle").classList.toggle("on", state.stock); refresh(); });
    $("fav-toggle").addEventListener("click", function () { state.fav = !state.fav; updateFavUI(); refresh(true); });
    $("more").addEventListener("click", function () { renderMore(); });
    $("clear").addEventListener("click", function () {
      state.q = ""; state.min = state.max = null; state.stock = false; state.fav = false; state.cat = "All";
      $("q").value = ""; $("pmin").value = ""; $("pmax").value = ""; $("stock").checked = false; $("stock-toggle").classList.remove("on");
      markCat(false); updateFavUI(); refresh(true);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) fill(); }, { rootMargin: "700px" }).observe($("sentinel"));
    }
    window.addEventListener("scroll", debounce(fill, 120), { passive: true });

    window.addEventListener("cc:favs", function () {
      var favs = CC.favs.all();
      updateFavUI();
      document.querySelectorAll(".pcard").forEach(function (c) {
        var h = c.querySelector(".heart"), on = favs.indexOf(c.getAttribute("data-name")) > -1;
        if (h) { h.classList.toggle("on", on); h.setAttribute("aria-pressed", on); }
      });
      if (state.fav) { // un-hearted items leave the favourites view
        $("grid").querySelectorAll(".pcard").forEach(function (c) { if (favs.indexOf(c.getAttribute("data-name")) === -1) c.remove(); });
        list = list.filter(function (x) { return favs.indexOf(x.p.name) > -1; });
        shown = $("grid").children.length;
        updateCount();
        if (!list.length) showEmpty();
      }
    });
  }
})();
