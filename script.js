// ======================================================
//  EDIT HERE — payment links, COD rules and your products
// ======================================================

// Each product has its own Razorpay Payment Page (razorpay.com → Payment Pages) for paying online.
// The old ₹99 COD-advance page (https://rzp.io/rzp/crampease-cod) is no longer linked from the site.
const COD_EXTRA = 50;   // COD costs this much more than paying online

// COD orders need no payment: the order form posts to this Google Apps Script web app
// (it saves each order to the "CrampEase COD orders" Google Sheet; the order bot alerts on Telegram).
const COD_FORM_URL =
  "https://script.google.com/macros/s/AKfycbwQ7ZneGRMl_8QEkYPREiLBJeEs8tnnosgES52BEJ3w47vwuH3gNg-WRqc79yv2tVS62A/exec";

// Put product photos in the /images folder and write the file name below.
// id = short code (also sent to the order bot), short = name on the order picker,
// price = your selling price, mrp = crossed-out price (optional), badge = small tag (optional),
// features = bullet points (optional), link = its Razorpay Payment Page.
// Add more products by copying a { ... } block.
const PRODUCTS = [
  {
    id: "belt",
    short: "Warm Hug Belt",
    link: "https://rzp.io/rzp/crampease-online",
    name: "CrampEase Warm Hug Belt",
    desc: "Cordless, rechargeable heating belt with a soft plush cover. Wear it at home, college or work — and feel the warmth in seconds.",
    features: [
      "🌡️ 3 heat levels — 45°C / 55°C / 65°C",
      "💆‍♀️ Soothing vibration massage",
      "🔋 Cordless & rechargeable, long battery life",
      "📏 Adjustable strap — fits all sizes",
      "☁️ Soft, skin-friendly plush cover",
      "🎀 Comes in a pretty gift box",
    ],
    price: 599,
    mrp: 1499,
    image: "images/product1.jpg",
    badge: "Bestseller",
    icon: "🔥",
  },
  {
    id: "pads",
    short: "Reusable Pads",
    link: "https://rzp.io/rzp/crampease-pads",
    name: "CrampEase Reusable Cloth Pads · Set of 5",
    desc: "Soft, washable cloth pads you can use again and again — comfy all day, with less waste every month.",
    features: [
      "🌿 Reusable — just wash, dry & use again",
      "☁️ Ultra-soft cloth, gentle on skin",
      "💧 Leak-proof layer with secure wings",
      "🌬️ Breathable fabric",
      "📦 Set of 5 · free size",
    ],
    price: 399,
    image: "images/pads-red.jpg",
    // colours = optional choices; each has a swatch colour and its own photo. The chosen colour
    // goes with COD orders to the bot; the Razorpay page asks for it again for online orders.
    colors: [
      { id: "red", label: "Red", swatch: "#d62828", image: "images/pads-red.jpg" },
      { id: "navy", label: "Navy Blue", swatch: "#1f3a6b", image: "images/pads-navy.jpg" },
      { id: "sky", label: "Sky Blue", swatch: "#a7d8f0", image: "images/pads-sky.jpg" },
      { id: "grey", label: "Grey", swatch: "#6b6e74", image: "images/pads-grey.jpg" },
    ],
    badge: "New · Eco-friendly",
    icon: "🌸",
  },
  {
    id: "heatbag",
    short: "Electric Heat Bag",
    link: "https://rzp.io/rzp/crampease-heatbag",
    name: "CrampEase Electric Heat Bag · 1000 ml",
    desc: "A soft velvet heat bag you warm up by plugging in — no kettle, no boiling water. Unplug before use; never use while charging.",
    features: [
      "🔌 Electric — warms up in minutes, no boiling water",
      "🧸 Soft velvet cover with plush edges",
      "♨️ Gel-filled for lasting warmth",
      "📦 Big 1000 ml size",
      "🎨 Pick your design below",
    ],
    price: 499,
    image: "images/heatbag-grey.jpg",
    // each design is its own Meesho listing: grey 76k7cw, brown dots 76k7cv, hearts 76k7cy, red 76k7cz
    colors: [
      { id: "grey", label: "Grey Dots", swatch: "#9a9ca0", image: "images/heatbag-grey.jpg" },
      { id: "browndots", label: "Brown Dots", swatch: "#7a4a24", image: "images/heatbag-browndots.jpg" },
      { id: "hearts", label: "Brown Hearts", swatch: "linear-gradient(135deg,#7a4a24 50%,#ffffff 50%)", image: "images/heatbag-hearts.jpg" },
      { id: "red", label: "Red Dots", swatch: "#d62828", image: "images/heatbag-red.jpg" },
    ],
    badge: "New",
    icon: "♨️",
  },
];

// ======================================================

// The order section works on one product at a time; the picker (and each card's Buy now) switches it.
let sel = PRODUCTS[0];
const chosen = {}; // product id -> chosen colour id (products with colours start on the first one)
PRODUCTS.forEach((p) => p.colors && (chosen[p.id] = p.colors[0].id));
const colorOf = (p) => p.colors && p.colors.find((c) => c.id === chosen[p.id]);
const fill = (key, value) =>
  document.querySelectorAll(`[data-fill="${key}"]`).forEach((el) => (el.textContent = value));

const swatchesHtml = (p) =>
  p.colors
    ? `<div class="swatches" role="radiogroup" aria-label="Colour" data-for="${p.id}">${p.colors
        .map(
          (c) => `<button type="button" role="radio" data-color="${c.id}" aria-label="${c.label}" title="${c.label}"
                   style="--sw:${c.swatch}" aria-checked="${c.id === chosen[p.id]}"></button>`
        )
        .join("")}<span class="swatch-name">${colorOf(p).label}</span></div>`
    : "";

// one colour choice per product, kept in sync on its card and in the order section
function chooseColor(pid, cid) {
  const p = PRODUCTS.find((x) => x.id === pid);
  chosen[pid] = cid;
  document.querySelectorAll(`.swatches[data-for="${pid}"]`).forEach((g) => {
    g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", b.dataset.color === cid));
    g.querySelector(".swatch-name").textContent = colorOf(p).label;
  });
  const img = document.querySelector(`.card[data-id="${pid}"] .card-img img`);
  if (img) img.src = colorOf(p).image;
  if (sel.id === pid) fill("product", `${p.short} · ${colorOf(p).label}`);
}
document.addEventListener("click", (e) => {
  const b = e.target.closest(".swatches button");
  if (b) chooseColor(b.closest(".swatches").dataset.for, b.dataset.color);
});

function selectProduct(id) {
  sel = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
  fill("product", sel.colors ? `${sel.short} · ${colorOf(sel).label}` : sel.short);
  const pc = document.getElementById("pick-color");
  if (pc) pc.innerHTML = swatchesHtml(sel);
  fill("online", `₹${sel.price}`);
  fill("cod", `₹${sel.price + COD_EXTRA}`);
  fill("extra", `₹${COD_EXTRA}`);
  document.querySelectorAll("[data-pay=online]").forEach((a) => {
    a.href = sel.link;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll("#pick button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.id === sel.id));
}

const pick = document.getElementById("pick");
if (pick) {
  pick.innerHTML = PRODUCTS.map(
    (p) => `<button type="button" data-id="${p.id}" aria-pressed="false">${p.icon} ${p.short} · ₹${p.price}</button>`
  ).join("");
  pick.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) selectProduct(b.dataset.id);
  });
}
// ad links like crampease.in/#order-pads open the order section with that product picked
const hashPick = (location.hash.match(/^#order-(\w+)/) || [])[1];
selectProduct(hashPick);
if (hashPick) addEventListener("load", () => document.getElementById("order").scrollIntoView());

document.querySelectorAll("[data-pay=cod]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    codForm();
  })
);

// Facebook/Instagram open links in their own in-app browser, where UPI apps (GPay, PhonePe, Paytm)
// often fail to open and payments time out. Steer those visitors to a real browser before paying.
const ua = navigator.userAgent || "";
const forced = (location.search.match(/[?&]inapp=(android|ios)/) || [])[1]; // ?inapp=ios to preview
const inApp = !!forced || /FBAN|FBAV|FB_IAB|FBIOS|Instagram/i.test(ua);
const isAndroid = forced ? forced === "android" : /Android/i.test(ua);
const inChrome = (url) =>
  `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;` +
  `S.browser_fallback_url=${encodeURIComponent(url)};end`;

if (inApp) {
  const bar = document.createElement("div");
  bar.className = "inapp-bar";
  bar.innerHTML = isAndroid
    ? `💳 Paying by UPI? <a href="${inChrome(location.href)}">Open in Chrome</a> · or choose Cash on Delivery`
    : `💳 Paying by UPI? Tap <b>•••</b> → <b>Open in browser</b> · or choose Cash on Delivery`;
  document.body.prepend(bar);

  // only online payment needs a real browser; the COD form works fine in the in-app browser
  document.querySelectorAll("[data-pay=online]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const link = sel.link;
      if (!link) return;
      e.preventDefault();
      if (isAndroid) {
        location.href = inChrome(link); // opens the Razorpay page straight in Chrome
      } else {
        payTip(link);
      }
    })
  );
}

function payTip(link) {
  const m = document.createElement("div");
  m.className = "pay-tip";
  m.innerHTML = `
    <div class="pay-tip-card">
      <h3>One quick step 💗</h3>
      <p>UPI apps can't open inside Instagram/Facebook. Tap <b>•••</b> at the top right,
         choose <b>Open in browser</b>, then tap Pay again.</p>
      <a class="btn" href="${link}" target="_blank" rel="noopener">Continue here anyway</a>
      <button class="btn btn-ghost" type="button">Close</button>
    </div>`;
  m.querySelector("button").onclick = () => m.remove();
  // block body: an onclick that returns false (e.target !== m) would cancel every click inside the card
  m.onclick = (e) => {
    if (e.target === m) m.remove();
  };
  document.body.appendChild(m);
}

// Cash on delivery order form: no payment, we call to confirm. On success -> thank-you page (fires Purchase).
function codForm() {
  const p = sel;
  const total = p.price + COD_EXTRA;
  const colorField = p.colors
    ? `<label>Colour<select name="color">${p.colors
        .map((c) => `<option value="${c.id}"${c.id === chosen[p.id] ? " selected" : ""}>${c.label}</option>`)
        .join("")}</select></label>`
    : "";
  const m = document.createElement("div");
  m.className = "pay-tip cod-form";
  m.innerHTML = `
    <form class="pay-tip-card" novalidate>
      <h3>Cash on delivery 💗</h3>
      <p><b>${p.short}</b> — nothing to pay now, pay <b>₹${total}</b> in cash when it arrives. We'll call to confirm.</p>
      ${colorField}
      <label>Full name<input name="name" autocomplete="name" required maxlength="80" /></label>
      <label>Phone (10 digits)<input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" required maxlength="14" /></label>
      <label>Full address (house, street, landmark)<textarea name="address" rows="2" autocomplete="street-address" required maxlength="300"></textarea></label>
      <div class="cod-row">
        <label>Pincode<input name="pincode" inputmode="numeric" autocomplete="postal-code" required maxlength="6" /></label>
        <label>City &amp; state<input name="city_state" autocomplete="address-level2" required maxlength="80" /></label>
      </div>
      <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true" />
      <p class="cod-error" role="alert"></p>
      <button class="btn" type="submit">Place COD order · ₹${total}</button>
      <button class="btn btn-ghost" type="button" data-close>Close</button>
    </form>`;
  const form = m.querySelector("form");
  const err = m.querySelector(".cod-error");
  m.querySelector("[data-close]").onclick = () => m.remove();
  m.onclick = (e) => {
    if (e.target === m) m.remove();
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    d.phone = d.phone.replace(/\D/g, "").slice(-10);
    const bad =
      !d.name.trim() ? "Please enter your name." :
      d.phone.length !== 10 ? "Please enter a 10-digit phone number." :
      d.address.trim().length < 10 ? "Please enter your full address." :
      !/^\d{6}$/.test(d.pincode.trim()) ? "Please enter a 6-digit pincode." :
      !d.city_state.trim() ? "Please enter your city and state." : "";
    if (bad) return (err.textContent = bad);
    if (!COD_FORM_URL) return (err.textContent = "COD orders open very soon 💗 Please pay online for now.");
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    btn.textContent = "Placing your order…";
    err.textContent = "";
    d.page = location.href.slice(0, 200);
    // the sheet's "note" column carries the product code (and colour, "pads:navy") for the order bot
    d.note = d.color ? `${p.id}:${d.color}` : p.id;
    delete d.color;
    try {
      const r = await fetch(COD_FORM_URL, { method: "POST", body: new URLSearchParams(d) });
      const res = await r.json();
      if (!res.ok) throw new Error(res.error || "not saved");
      location.href = `thank-you.html?type=codfull&product=${p.id}&order_id=${encodeURIComponent(res.id)}`;
    } catch (_) {
      btn.disabled = false;
      btn.textContent = `Place COD order · ₹${total}`;
      err.innerHTML = `Couldn't place the order. Please try again, or WhatsApp us on <a href="https://wa.me/916282377040">+91 62823 77040</a>.`;
    }
  };
  document.body.appendChild(m);
  form.querySelector("input").focus();
}

// Meta Pixel events (the base PageView is in index.html)
const track = (event, data) => window.fbq && fbq("track", event, data);
const productData = (p, value) => ({
  content_name: p.name,
  content_ids: [p.id],
  content_type: "product",
  value,
  currency: "INR",
});
track("ViewContent", productData(PRODUCTS[0], PRODUCTS[0].price));
document.querySelectorAll("[data-pay=online]").forEach((a) =>
  a.addEventListener("click", () => track("InitiateCheckout", productData(sel, sel.price)))
);
document.querySelectorAll("[data-pay=cod]").forEach((a) =>
  a.addEventListener("click", () => track("InitiateCheckout", productData(sel, sel.price + COD_EXTRA)))
);

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// cute placeholder when an image hasn't been uploaded yet
function placeholder(icon, label) {
  const d = document.createElement("div");
  d.className = "ph";
  d.innerHTML = `<div><b>${icon}</b>${label}</div>`;
  return d;
}

// if "product1.jpg" is missing, also try .jpeg / .png / .webp before showing a placeholder
function useFallback(img, icon, label) {
  const base = img.getAttribute("src").replace(/\.\w+$/, "");
  const tries = [".jpeg", ".png", ".webp"].map((ext) => base + ext);
  const next = () => {
    if (tries.length) img.src = tries.shift();
    else {
      img.removeEventListener("error", next);
      img.replaceWith(placeholder(icon, label));
    }
  };
  img.addEventListener("error", next);
  // the image may have already failed before this script ran
  if (img.complete && img.naturalWidth === 0) next();
}

const heroImg = document.querySelector('[data-fallback="hero"]');
if (heroImg) useFallback(heroImg, "🌷", "Your product photo here");

// render product cards
const grid = document.getElementById("products");
PRODUCTS.forEach((p, i) => {
  const off = p.mrp ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const card = document.createElement("article");
  card.className = "card reveal";
  card.dataset.id = p.id;
  card.style.transitionDelay = `${i * 0.08}s`;
  card.innerHTML = `
    ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
    <div class="card-img"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
    <div class="card-body">
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    ${p.features ? `<ul class="features">${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
    ${swatchesHtml(p)}
    <div class="price">
      <strong>₹${p.price}</strong>
      ${p.mrp ? `<s>₹${p.mrp}</s><small>${off}% off</small>` : ""}
    </div>
    <a class="btn" href="#order" data-pick="${p.id}">Buy now 💗</a>
    </div>`;
  useFallback(card.querySelector("img"), p.icon || "🌸", p.name);
  card.querySelector("[data-pick]").addEventListener("click", () => selectProduct(p.id));
  grid.appendChild(card);
});

// scroll reveal
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// gentle 3D tilt on product cards
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
if (finePointer) {
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });
}

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// floating sparkles & hearts in the background
const sparkleBox = document.querySelector(".sparkles");
const symbols = ["♡", "✦", "✿", "♥", "✧"];
function spawnSparkle() {
  const s = document.createElement("span");
  s.className = "sparkle";
  s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  s.style.left = Math.random() * 100 + "vw";
  s.style.fontSize = 10 + Math.random() * 16 + "px";
  s.style.animationDuration = 10 + Math.random() * 10 + "s";
  sparkleBox.appendChild(s);
  s.addEventListener("animationend", () => s.remove());
}
if (!reduceMotion) {
  for (let i = 0; i < 6; i++) setTimeout(spawnSparkle, i * 700);
  setInterval(spawnSparkle, 1400);
}

// little heart burst on button clicks
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || reduceMotion) return;
  for (let i = 0; i < 6; i++) {
    const h = document.createElement("span");
    h.className = "heart-pop";
    h.textContent = ["💗", "💖", "🌸"][i % 3];
    h.style.left = e.clientX - 10 + "px";
    h.style.top = e.clientY - 10 + "px";
    h.style.setProperty("--dx", (Math.random() - 0.5) * 120 + "px");
    document.body.appendChild(h);
    h.addEventListener("animationend", () => h.remove());
  }
});

document.querySelectorAll(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
