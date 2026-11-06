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

  // "Usually delivered by": 4 to 7 working days from today, skipping Sundays (matches the shipping policy)
  function addWorkingDays(n) {
    var d = new Date();
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) n--;
    }
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
  }
  document.getElementById("delivery-dates").textContent = addWorkingDays(4) + " – " + addWorkingDays(7);

  // phone buy bar: only shows once the buy buttons have scrolled out of view
  var bar = document.getElementById("buy-bar");
  new IntersectionObserver(function (entries) {
    bar.classList.toggle("show", !entries[0].isIntersecting);
  }).observe(document.getElementById("buy"));
})();

// ------------------------------------------------------
//  Customer reviews. Add ONLY real reviews from real buyers who agreed to be shown.
//  Example: { name: "Priya", city: "Kochi", rating: 5, text: "Their words", photo: "images/reviews/priya.jpg", date: "12 Nov 2026" }
// ------------------------------------------------------
var REVIEWS = {
  belt: [],
  pads: [],
  heatbag: [],
};
var REVIEW_WHATSAPP = "916282377040";

(function () {
  var list = REVIEWS[sel.id] || [];
  var box = document.getElementById("review-list");

  function stars(n) {
    var full = Math.round(n);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }

  if (list.length) {
    var avg = list.reduce(function (s, r) { return s + r.rating; }, 0) / list.length;
    var label = avg.toFixed(1) + " (" + list.length + (list.length === 1 ? " review)" : " reviews)");
    var summary = document.getElementById("review-summary");
    summary.textContent = stars(avg) + "  " + label;
    summary.hidden = false;
    var link = document.getElementById("rating-link");
    link.textContent = stars(avg) + " " + label;
    link.hidden = false;
    document.getElementById("review-empty").hidden = true;
    list.forEach(function (r) {
      var card = document.createElement("article");
      card.className = "review-card";
      var st = document.createElement("div");
      st.className = "review-card-stars";
      st.textContent = stars(r.rating);
      st.setAttribute("aria-label", r.rating + " out of 5");
      var body = document.createElement("p");
      body.textContent = r.text;
      var who = document.createElement("small");
      who.textContent = r.name + ", " + r.city + (r.date ? " · " + r.date : "");
      card.appendChild(st);
      card.appendChild(body);
      if (r.photo) {
        var img = document.createElement("img");
        img.src = r.photo;
        img.alt = "Photo from " + r.name;
        img.loading = "lazy";
        card.appendChild(img);
      }
      card.appendChild(who);
      box.appendChild(card);
    });
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

