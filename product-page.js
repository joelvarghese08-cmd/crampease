// Shared by the product pages (belt.html, pads.html, heatbag.html). Runs after script.js.
// Photo gallery: swipe the photos on a phone, or tap a thumbnail.
// A photo with data-color belongs to that colour, so picking the photo and picking the colour stay in step.
(function () {
  var track = document.getElementById("gallery");
  var thumbs = [].slice.call(document.querySelectorAll("#thumbs button"));
  var photos = [].slice.call(track.querySelectorAll("img"));

  function show(i) {
    track.scrollTo({ left: track.clientWidth * i, behavior: "smooth" });
  }

  thumbs.forEach(function (b, i) {
    b.addEventListener("click", function () {
      show(i);
      if (photos[i].dataset.color) chooseColor(sel.id, photos[i].dataset.color);
    });
  });

  track.addEventListener("scroll", function () {
    var i = Math.round(track.scrollLeft / track.clientWidth);
    thumbs.forEach(function (b, n) {
      if (n === i) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }, { passive: true });

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".swatches button");
    if (!b) return;
    var i = photos.findIndex(function (p) { return p.dataset.color === b.dataset.color; });
    if (i >= 0) show(i);
  });

  // phone buy bar: only shows once the buy buttons have scrolled out of view
  var bar = document.getElementById("buy-bar");
  new IntersectionObserver(function (entries) {
    bar.classList.toggle("show", !entries[0].isIntersecting);
  }).observe(document.getElementById("buy"));
})();

// Reviews live in script.js (REVIEWS). The WhatsApp number for sending one:
var REVIEW_WHATSAPP = "916282377040";

(function () {
  var list = REVIEWS[sel.id] || [];
  var box = document.getElementById("review-list");

  if (list.length) {
    var avg = list.reduce(function (s, r) { return s + r.rating; }, 0) / list.length;
    var label = avg.toFixed(1) + " (" + list.length + (list.length === 1 ? " review)" : " reviews)");
    var summary = document.getElementById("review-summary");
    summary.textContent = reviewStars(avg) + "  " + label;
    summary.hidden = false;
    var link = document.getElementById("rating-link");
    link.textContent = reviewStars(avg) + " " + label;
    link.hidden = false;
    document.getElementById("review-empty").hidden = true;
    renderReviewStrip(box, list);
  }

  var form = document.getElementById("review-form");
  var open = document.getElementById("review-open");
  var err = document.getElementById("review-error");
  open.addEventListener("click", function () {
    form.hidden = false;
    open.hidden = true;
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var name = (d.get("name") || "").trim();
    var city = (d.get("city") || "").trim();
    var text = (d.get("text") || "").trim();
    var bad = !d.get("rating") ? "Please choose a star rating." :
      !name ? "Please enter your first name." :
      !city ? "Please enter your city." :
      text.length < 5 ? "Please write a few words about the product." :
      !d.get("consent") ? "Please tick the box so we can show your review." : "";
    if (bad) {
      err.textContent = bad;
      return;
    }
    err.textContent = "";
    var msg = "CrampEase review\nProduct: " + sel.short + "\nRating: " + d.get("rating") + "/5\nName: " + name +
      "\nCity: " + city + "\nReview: " + text +
      "\n\nI bought this from CrampEase, and you can show this review with my first name and city.";
    var url = "https://wa.me/" + REVIEW_WHATSAPP + "?text=" + encodeURIComponent(msg);
    form.hidden = true;
    document.getElementById("review-thanks").hidden = false;
    if (!window.open(url, "_blank", "noopener")) location.href = url;
  });
})();

