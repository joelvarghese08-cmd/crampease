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
