/* Drawn illustrations: category placeholders, the cake preview and small icons. */
(function () {
  var CC = (window.CC = window.CC || {});

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function hash(s) {
    var x = 7; s = String(s || "");
    for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(x);
  }
  function pick(arr, h, off) { return arr[(h + (off || 0)) % arr.length]; }
  function shadow(rx) { return '<ellipse cx="200" cy="254" rx="' + (rx || 120) + '" ry="15" fill="#4a2c1d" opacity=".13"/>'; }

  var BGS = ["#fbe3c4", "#fde3e6", "#f3e3c8", "#fff0cf", "#f5dcc5", "#fbe8d5"];

  /* ---------- category drawings (400 x 300) ---------- */
  var drawers = {
    "Cakes": function (h) {
      var c = pick([["#6b3f2a", "#f7dfe3"], ["#b83a44", "#fff4e0"], ["#f2d58b", "#fffdf8"], ["#8a5a3a", "#4a2c1d"], ["#f6e2b0", "#f5a3b5"]], h);
      return shadow(135) +
        '<rect x="96" y="176" width="208" height="68" rx="16" fill="' + c[0] + '"/><rect x="96" y="203" width="208" height="10" fill="#fffdf8" opacity=".85"/>' +
        '<rect x="122" y="126" width="156" height="58" rx="14" fill="' + c[0] + '"/><rect x="122" y="152" width="156" height="9" fill="#fffdf8" opacity=".85"/>' +
        '<rect x="112" y="112" width="176" height="28" rx="14" fill="' + c[1] + '"/>' +
        '<rect x="128" y="128" width="16" height="30" rx="8" fill="' + c[1] + '"/><rect x="184" y="128" width="16" height="22" rx="8" fill="' + c[1] + '"/><rect x="246" y="128" width="16" height="34" rx="8" fill="' + c[1] + '"/>' +
        '<circle cx="200" cy="100" r="12" fill="#d63e57"/><path d="M200 90 q6 -14 16 -16" stroke="#4e8b5a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<circle cx="150" cy="120" r="3" fill="#e8788a"/><circle cx="240" cy="122" r="3" fill="#f6d35e"/><circle cx="268" cy="118" r="3" fill="#8cc9b5"/>';
    },
    "Pastries & Patties": function (h) {
      var gold = pick(["#e3a24f", "#d9923d", "#e8b05a"], h), dark = "#b9772a";
      function seg(cx, cy, rx, ry, rot) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')" fill="' + gold + '"/>'; }
      return shadow(130) + seg(112, 206, 28, 22, -55) + seg(288, 206, 28, 22, 55) + seg(152, 184, 38, 30, -30) + seg(248, 184, 38, 30, 30) + seg(200, 168, 48, 40, 0) +
        '<path d="M158 150 q-8 26 -4 48 M242 150 q8 26 4 48 M200 130 q-6 38 0 76" stroke="' + dark + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>' +
        '<ellipse cx="190" cy="148" rx="20" ry="8" fill="#fff" opacity=".28"/>';
    },
    "Pizzas & Sandwiches": function (h) {
      var top = pick(["#c23b32", "#d6652f", "#a8412f"], h);
      var pos = [[160, 118], [236, 116], [200, 168], [148, 192], [250, 188], [200, 120]];
      var s = shadow(125) + '<circle cx="200" cy="156" r="106" fill="#d79a4a"/><circle cx="200" cy="156" r="92" fill="#e8b45f"/><circle cx="200" cy="156" r="84" fill="#d9503a" opacity=".9"/><circle cx="200" cy="156" r="78" fill="#f6cf6a"/>';
      pos.forEach(function (p, i) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="' + top + '"/><circle cx="' + (p[0] - 4) + '" cy="' + (p[1] - 4) + '" r="3" fill="#e9756c"/>'; });
      s += '<path d="M176 144 l8 -6 l6 8 z M222 150 l9 -4 l3 9 z M178 200 l8 3 l-3 8 z M232 120 l8 4 l-6 7 z" fill="#4e8b5a"/>';
      s += '<path d="M200 156 L200 74 M200 156 L271 197 M200 156 L129 197" stroke="#d79a4a" stroke-width="3" opacity=".7"/>';
      return s;
    },
    "Snacks": function (h) {
      var a = pick(["#d9923d", "#cf8430", "#e0a04a"], h);
      return shadow(135) +
        '<polygon points="170,110 250,236 90,236" fill="' + a + '" stroke="' + a + '" stroke-width="16" stroke-linejoin="round"/>' +
        '<polygon points="170,132 226,224 114,224" fill="#e8ad5e"/><path d="M170 132 L170 224" stroke="#b9772a" stroke-width="3" stroke-dasharray="6 6"/>' +
        '<polygon points="256,142 322,244 190,244" fill="#cf8430" stroke="#cf8430" stroke-width="14" stroke-linejoin="round"/>' +
        '<polygon points="256,162 304,236 208,236" fill="#e8ad5e"/>' +
        '<ellipse cx="322" cy="250" rx="36" ry="12" fill="#fffdf8"/><ellipse cx="322" cy="246" rx="28" ry="8" fill="#5aa469"/>';
    },
    "Breads & Rusks": function (h) {
      var crust = pick(["#c98a4b", "#b97a3b", "#d29a58"], h);
      return shadow(125) +
        '<rect x="92" y="150" width="216" height="94" rx="34" fill="' + crust + '"/>' +
        '<path d="M92 170 Q92 106 200 106 Q308 106 308 170 Z" fill="#dba35d"/>' +
        '<path d="M148 126 l14 34 M194 118 l14 40 M240 126 l14 34" stroke="#f2d19b" stroke-width="9" stroke-linecap="round"/>' +
        '<ellipse cx="156" cy="176" rx="30" ry="8" fill="#fff" opacity=".18"/>';
    },
    "Milk & Dairy": function (h) {
      var lab = pick(["#fde3e6", "#fff0cf", "#e6f0e0"], h);
      return shadow(95) +
        '<rect x="180" y="58" width="40" height="18" rx="7" fill="#c98a4b"/>' +
        '<rect x="182" y="74" width="36" height="46" rx="6" fill="#fffdf8" stroke="#d8c7ae" stroke-width="3"/>' +
        '<rect x="142" y="108" width="116" height="140" rx="36" fill="#fffdf8" stroke="#d8c7ae" stroke-width="3"/>' +
        '<rect x="150" y="150" width="100" height="90" rx="30" fill="#f4ecdc"/>' +
        '<rect x="164" y="156" width="72" height="56" rx="12" fill="' + lab + '"/>' +
        '<path d="M200 200 c-16 -10 -22 -20 -14 -28 c6 -5 12 -2 14 3 c2 -5 8 -8 14 -3 c8 8 2 18 -14 28z" fill="#e8788a"/>';
    },
    "Juices & Drinks": function (h) {
      var col = pick(["#f4a43a", "#f7c548", "#ef6f86", "#8fbf62", "#c94a5c"], h);
      return shadow(100) +
        '<rect x="214" y="36" width="11" height="140" rx="5" fill="#e8788a" transform="rotate(10 219 100)"/>' +
        '<path d="M142 90 L258 90 L240 250 Q238 262 226 262 L174 262 Q160 262 158 250 Z" fill="#fffdf8" opacity=".75" stroke="#d8c7ae" stroke-width="3"/>' +
        '<path d="M148 128 L252 128 L238 250 Q236 260 226 260 L174 260 Q164 260 162 250 Z" fill="' + col + '"/>' +
        '<circle cx="190" cy="180" r="7" fill="#fff" opacity=".35"/><circle cx="214" cy="216" r="5" fill="#fff" opacity=".35"/><circle cx="178" cy="226" r="4" fill="#fff" opacity=".35"/>' +
        '<circle cx="262" cy="92" r="28" fill="#f4a43a"/><circle cx="262" cy="92" r="22" fill="#ffd27a"/><path d="M262 70 V114 M240 92 H284 M246 76 L278 108 M278 76 L246 108" stroke="#f4a43a" stroke-width="2.5"/>';
    },
    "Ice Cream": function (h) {
      var s1 = pick(["#f8c6d0", "#fbe3a8", "#c9e4c5"], h), s2 = pick(["#6b3f2a", "#e8788a", "#c98a4b"], h, 1);
      return shadow(80) +
        '<polygon points="148,168 252,168 200,268" fill="#e0a85a"/>' +
        '<path d="M160 188 L240 188 M172 208 L228 208 M186 228 L214 228 M168 172 L206 262 M232 172 L194 262" stroke="#b9772a" stroke-width="3" opacity=".6"/>' +
        '<circle cx="200" cy="146" r="56" fill="' + s2 + '"/><circle cx="200" cy="100" r="50" fill="' + s1 + '"/>' +
        '<path d="M150 150 q10 18 24 8 q10 18 26 6 q12 16 26 4 q12 12 24 -6" stroke="#fffdf8" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>' +
        '<circle cx="200" cy="56" r="11" fill="#d63e57"/><path d="M200 46 q4 -12 14 -14" stroke="#4e8b5a" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    "Cookies & Biscuits": function (h) {
      var bg = pick(BGS, hash("c" + h));
      var chips = [[170, 130], [226, 120], [200, 168], [150, 184], [248, 180], [182, 214], [232, 222]];
      var s = shadow(125) +
        '<circle cx="150" cy="170" r="66" fill="#c98a4b" opacity=".85"/>' +
        '<circle cx="232" cy="158" r="84" fill="#d9a05b"/><circle cx="232" cy="158" r="70" fill="#e2b06c"/>';
      chips.forEach(function (c, i) { s += '<rect x="' + (c[0] + 20) + '" y="' + (c[1] + 4) + '" width="18" height="13" rx="4" fill="#4a2c1d" transform="rotate(' + (i * 37 % 90) + ' ' + (c[0] + 29) + ' ' + (c[1] + 10) + ')"/>'; });
      s += '<rect x="106" y="150" width="14" height="10" rx="3" fill="#4a2c1d"/><rect x="150" y="188" width="14" height="10" rx="3" fill="#4a2c1d" transform="rotate(30 157 193)"/><rect x="132" y="190" width="12" height="9" rx="3" fill="#4a2c1d"/>';
      s += '<circle cx="288" cy="100" r="20" fill="' + bg + '"/><circle cx="306" cy="130" r="14" fill="' + bg + '"/>';
      return s;
    },
    "Birthday Decor": function (h) {
      var cols = ["#e8788a", "#f4a43a", "#8cc9b5", "#c98a4b"];
      function balloon(cx, cy, c, rot) {
        return '<g transform="rotate(' + rot + ' ' + cx + ' ' + (cy + 52) + ')"><path d="M' + cx + ' ' + (cy + 52) + ' q-8 40 6 80" stroke="#8a6e5c" stroke-width="2" fill="none"/>' +
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="38" ry="48" fill="' + c + '"/><path d="M' + (cx - 6) + ' ' + (cy + 56) + ' l6 -6 l6 6z" fill="' + c + '"/><ellipse cx="' + (cx - 12) + '" cy="' + (cy - 18) + '" rx="8" ry="14" fill="#fff" opacity=".35"/></g>';
      }
      var s = '<path d="M20 40 Q200 100 380 40" stroke="#8a6e5c" stroke-width="2.5" fill="none"/>';
      for (var i = 0; i < 7; i++) { var x = 40 + i * 51, y = 40 + Math.sin((i / 6) * Math.PI) * 38 + 6; s += '<polygon points="' + (x - 14) + ',' + y + ' ' + (x + 14) + ',' + y + ' ' + x + ',' + (y + 30) + '" fill="' + cols[(i + h) % 4] + '"/>'; }
      return s + balloon(130, 160, cols[h % 4], -8) + balloon(210, 140, cols[(h + 1) % 4], 4) + balloon(285, 170, cols[(h + 2) % 4], 10);
    },
    "default": function (h) {
      return shadow(80) +
        '<path d="M130 160 h140 l-14 80 h-112 z" fill="#c98a4b"/><path d="M146 160 l8 80 M170 160 l4 80 M200 160 v80 M230 160 l-4 80 M254 160 l-8 80" stroke="#a76a30" stroke-width="3" opacity=".6"/>' +
        '<circle cx="168" cy="140" r="36" fill="#f5a3b5"/><circle cx="232" cy="140" r="36" fill="#f5a3b5"/><circle cx="200" cy="112" r="40" fill="#fde3e6"/><circle cx="200" cy="72" r="11" fill="#d63e57"/>';
    }
  };

  function dots(h) {
    var s = "", cols = ["#e8788a", "#c98a4b", "#fffdf8", "#8cc9b5"];
    for (var i = 0; i < 7; i++) {
      var x = (h * (i + 3) * 37) % 380 + 10, y = (h * (i + 5) * 53) % 270 + 10;
      s += '<rect x="' + x + '" y="' + y + '" width="12" height="5" rx="2.5" fill="' + cols[(h + i) % 4] + '" opacity=".45" transform="rotate(' + ((h + i * 40) % 180) + ' ' + x + ' ' + y + ')"/>';
    }
    return s;
  }

  function placeholder(cat, name) {
    var h = hash(name || cat), bg = pick(BGS, h), d = drawers[cat] || drawers["default"];
    return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(cat || "Bakery item") + '" preserveAspectRatio="xMidYMid slice">' +
      '<rect width="400" height="300" fill="' + bg + '"/>' + dots(h) + '<g transform="rotate(' + ((h % 7) - 3) + ' 200 160)">' + d(h) + "</g></svg>";
  }

  /* ---------- cake preview ---------- */
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  var SPONGE = [[/black\s*forest/i, "#4b2a1f"], [/choco|truffle|fudge|brownie/i, "#6b3f2a"], [/red\s*velvet/i, "#b83a44"], [/strawberry|berry/i, "#f08aa0"], [/pineapple/i, "#f6d35e"], [/butterscotch/i, "#e0a23d"], [/lotus|biscoff|caramel/i, "#c98a4b"], [/mango/i, "#f7b04a"], [/coffee|mocha/i, "#a9754f"], [/lemon/i, "#f7e27a"], [/vanilla/i, "#f6e2b0"]];
  var FROST = [[/ganache|chocolate|choco/i, "#4a2c1d", "drip"], [/cream\s*cheese/i, "#fff1d6", "scallop"], [/butter\s*cream/i, "#fbe3a8", "scallop"], [/fondant/i, "#f6b6c4", "smooth"], [/strawberry|pink/i, "#f5a3b5", "scallop"], [/caramel/i, "#c98a4b", "drip"], [/cream|whipped/i, "#fffdf8", "scallop"]];
  var SPONGE_FALLBACK = ["#d9a05b", "#f2cf8a", "#c98a4b", "#e9b98a"], FROST_FALLBACK = ["#fffdf8", "#fbe3a8", "#f5a3b5", "#fff1d6"];

  function spongeColor(name) {
    for (var i = 0; i < SPONGE.length; i++) if (SPONGE[i][0].test(name || "")) return SPONGE[i][1];
    return pick(SPONGE_FALLBACK, hash(name));
  }
  function frostInfo(name) {
    for (var i = 0; i < FROST.length; i++) if (FROST[i][0].test(name || "")) return { c: FROST[i][1], style: FROST[i][2] };
    return { c: pick(FROST_FALLBACK, hash(name)), style: "scallop" };
  }

  function cake(o) {
    o = o || {};
    var lbs = o.pounds || 1, sponge = spongeColor(o.flavour), fr = frostInfo(o.frosting), msg = String(o.message || "").slice(0, 30);
    var tiers = lbs >= 3 ? [{ w: lbs >= 4 ? 290 : 250, h: 92 }, { w: lbs >= 4 ? 196 : 166, h: 78 }] : [{ w: lbs >= 2 ? 240 : 180, h: 108 }];
    var w0 = tiers[0].w, cx = 240 - (22 + 60) / 2 - 8, base = 296, y = base;
    var out = '<svg viewBox="0 0 480 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Preview of your cake">';
    out += '<ellipse cx="240" cy="318" rx="226" ry="26" fill="#fffdf8" stroke="#ecdac0" stroke-width="3"/><ellipse cx="240" cy="311" rx="196" ry="17" fill="#f6ead6"/>';

    var topY = y, topW = w0;
    tiers.forEach(function (t, ti) {
      var x = cx - t.w / 2, top = y - t.h, n, i;
      out += '<rect x="' + x + '" y="' + top + '" width="' + t.w + '" height="' + t.h + '" rx="16" fill="' + sponge + '"/>';
      out += '<rect x="' + x + '" y="' + (top + t.h * 0.5) + '" width="' + t.w + '" height="10" fill="#fffdf8" opacity=".85"/>';
      if (fr.style === "smooth") {
        out += '<rect x="' + (x - 3) + '" y="' + (top - 3) + '" width="' + (t.w + 6) + '" height="' + (t.h + 6) + '" rx="18" fill="' + fr.c + '"/>';
        out += '<rect x="' + (x + 14) + '" y="' + (top + 10) + '" width="9" height="' + (t.h - 20) + '" rx="4.5" fill="#fff" opacity=".35"/>';
        out += '<rect x="' + (x - 3) + '" y="' + (top + t.h * 0.5 - 2) + '" width="' + (t.w + 6) + '" height="3" fill="#000" opacity=".06"/>';
      } else if (fr.style === "drip") {
        out += '<rect x="' + (x - 5) + '" y="' + (top - 8) + '" width="' + (t.w + 10) + '" height="28" rx="14" fill="' + fr.c + '"/>';
        n = Math.max(4, Math.round(t.w / 36));
        for (i = 0; i < n; i++) {
          var dx = x + 10 + i * ((t.w - 36) / (n - 1)), dh = 24 + ((i * 37 + lbs * 11) % 34);
          out += '<rect x="' + dx + '" y="' + (top + 6) + '" width="17" height="' + dh + '" rx="8.5" fill="' + fr.c + '"/>';
        }
        out += '<ellipse cx="' + (x + 30) + '" cy="' + (top + 2) + '" rx="16" ry="3.5" fill="#fff" opacity=".28"/>';
      } else {
        out += '<rect x="' + (x - 4) + '" y="' + (top - 8) + '" width="' + (t.w + 8) + '" height="26" rx="13" fill="' + fr.c + '"/>';
        n = Math.floor((t.w + 4) / 22);
        for (i = 0; i < n; i++) out += '<circle cx="' + (x + 11 + i * ((t.w - 22) / (n - 1))) + '" cy="' + (top + 20) + '" r="11.5" fill="' + fr.c + '"/>';
        for (i = 0; i < n; i++) out += '<circle cx="' + (x + 11 + i * ((t.w - 22) / (n - 1))) + '" cy="' + (top + t.h - 4) + '" r="9" fill="' + fr.c + '"/>';
        out += '<ellipse cx="' + (x + 36) + '" cy="' + (top + 1) + '" rx="18" ry="3.5" fill="#fff" opacity=".4"/>';
      }
      if (ti === tiers.length - 1) { topY = top; topW = t.w; }
      y = top;
    });

    /* message plaque on the top tier */
    if (msg) {
      var t0 = tiers[tiers.length - 1], fs = Math.max(11, Math.min(20, (t0.w - 34) / (msg.length * 0.5)));
      var pw = Math.min(t0.w - 14, msg.length * fs * 0.52 + 26), py = topY + t0.h * 0.5 - 4;
      out += '<rect x="' + (cx - pw / 2) + '" y="' + (py - 16) + '" width="' + pw + '" height="32" rx="16" fill="#fffdf8" opacity=".94" stroke="#ecdac0" stroke-width="2"/>';
      out += '<text x="' + cx + '" y="' + (py + 6) + '" text-anchor="middle" font-family="Caveat, Segoe Script, cursive" font-weight="700" font-size="' + fs + '" fill="#4a2c1d">' + esc(msg) + "</text>";
    }

    /* candles and cherries */
    [-1, 0, 1].forEach(function (k, i) {
      var px = cx + k * Math.min(40, topW / 4), cols = ["#e8788a", "#8cc9b5", "#f4a43a"];
      out += '<rect x="' + (px - 4) + '" y="' + (topY - 56) + '" width="8" height="46" rx="3" fill="' + cols[i] + '"/><path d="M' + (px - 4) + ' ' + (topY - 44) + ' l8 8 M' + (px - 4) + ' ' + (topY - 32) + ' l8 8" stroke="#fff" stroke-width="2.5" opacity=".7"/>';
      out += '<path d="M' + px + ' ' + (topY - 58) + ' c-7 -9 0 -14 0 -20 c7 5 7 12 0 20z" fill="#ffb02e"/><path d="M' + px + ' ' + (topY - 60) + ' c-3 -5 0 -8 0 -11 c3 3 3 7 0 11z" fill="#fff3b0"/>';
    });

    /* a slice on the plate shows the flavour inside */
    var sx = cx + w0 / 2 + 24;
    out += '<rect x="' + sx + '" y="' + (base - 62) + '" width="58" height="62" rx="7" fill="' + sponge + '"/><rect x="' + sx + '" y="' + (base - 36) + '" width="58" height="8" fill="#fffdf8" opacity=".85"/>';
    out += '<rect x="' + (sx - 3) + '" y="' + (base - 72) + '" width="64" height="18" rx="9" fill="' + fr.c + '"/><circle cx="' + (sx + 29) + '" cy="' + (base - 80) + '" r="8" fill="#d63e57"/>';
    out += "</svg>";
    return out;
  }

  /* ---------- small icons ---------- */
  var icons = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20.5" r="1.4"/><circle cx="17" cy="20.5" r="1.4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round"><path d="M12 21s-7.5-4.6-9.5-9.4C1.2 8 3.2 4.5 6.7 4.5c2 0 3.6 1.1 5.3 3.2 1.7-2.1 3.3-3.2 5.3-3.2 3.5 0 5.5 3.5 4.2 7.1C19.5 16.4 12 21 12 21z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100-.2.200-.6.800-.8 1-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300c-.2.300-.9.900-.9 2.200s.9 2.500 1.100 2.700c.1.200 1.800 2.800 4.400 3.900 1.600.7 2.300.7 3.100.6.500-.1 1.500-.6 1.700-1.200.2-.6.200-1.100.2-1.200-.1-.2-.3-.2-.5-.3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="#c95a6e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.500"/></svg>'
  };

  var logo = '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 21h22l-3 14H12z" fill="#c98a4b"/><path d="M14 21l2 14M20 21v14M26 21l-2 14" stroke="#a76a30" stroke-width="1.6"/><circle cx="14" cy="18" r="6.500" fill="#f5a3b5"/><circle cx="26" cy="18" r="6.500" fill="#f5a3b5"/><circle cx="20" cy="13" r="8" fill="#fde3e6"/><circle cx="20" cy="5.500" r="2.800" fill="#d63e57"/></svg>';
  var bun = '<svg class="bun" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="36" cy="62" rx="20" ry="4" fill="#4a2c1d" opacity=".15"/><path d="M8 40a28 22 0 0 1 56 0c0 10-12 16-28 16S8 50 8 40z" fill="#d9923d"/><path d="M16 36q8-10 20-10t20 10" stroke="#f2cf8a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="26" cy="34" r="2" fill="#fff" opacity=".7"/><circle cx="40" cy="30" r="2" fill="#fff" opacity=".7"/><circle cx="48" cy="38" r="2" fill="#fff" opacity=".7"/><circle cx="29" cy="64" r="0" /></svg>';

  CC.esc = esc;
  CC.hash = hash;
  CC.art = { placeholder: placeholder, cake: cake, icons: icons, logo: logo, bun: bun, spongeColor: spongeColor, frostInfo: frostInfo };
})();
