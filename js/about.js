/* About & Contact page */
(function () {
  var CC = window.CC, esc = CC.esc;
  var $ = function (id) { return document.getElementById(id); };

  $("about-art").innerHTML = CC.art.placeholder("Breads & Rusks", "about").replace("<svg ", '<svg style="width:100%;height:auto;aspect-ratio:4/3" ');

  CC.load().then(function (d) {
    var s = d.settings;
    $("a-addr").textContent = s.address;
    $("a-hours").innerHTML = s.hours.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("");
    var call = $("a-call"); call.href = "tel:" + s.phone.replace(/\s+/g, ""); call.textContent = "Call " + s.phone;
    $("a-wa").href = CC.waLink("Hello " + s.name + "!");
    $("a-areas").textContent = s.areas.length ? s.areas.join(", ") + "." : "All around Lahore. Ask us about your area.";
    $("a-fee").textContent = "A flat " + CC.fmt(s.deliveryFee) + " for delivery. Pickup from the bakery is free.";
    $("a-notice").textContent = "Custom cakes need at least " + s.noticeDays + " day" + (s.noticeDays === 1 ? "" : "s") + " notice, so we can bake them just right.";
    $("a-disc").textContent = s.discountPct > 0 ? "Order online and save " + s.discountPct + "% on your total bill. It is taken off at checkout." : "Ask us about our latest offers.";

    $("msg-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var text = $("m-text").value.trim(), name = $("m-name").value.trim();
      var field = $("m-text").closest(".field");
      field.classList.toggle("invalid", !text);
      if (!text) return;
      window.open(CC.waLink((name ? "Hello, I am " + name + ". " : "Hello! ") + text), "_blank", "noopener");
    });
  }).catch(function () {
    ["a-areas", "a-fee", "a-notice", "a-disc"].forEach(function (id) { $(id).textContent = "Please call us for details."; });
    $("msg-form").addEventListener("submit", function (e) { e.preventDefault(); CC.toast("Please try again in a moment."); });
  });
})();
