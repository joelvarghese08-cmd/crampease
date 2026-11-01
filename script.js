// ======================================================
//  EDIT HERE — payment links, COD rules and your products
// ======================================================

// Paste your Razorpay Payment Page links here (razorpay.com → Payment Pages).
// ONLINE_LINK = page for the full online price, COD_LINK = page for the COD advance.
const ONLINE_LINK = "https://rzp.io/rzp/crampease-online";
const COD_LINK = "https://rzp.io/rzp/crampease-cod";

const COD_EXTRA = 50;   // COD costs this much more than paying online
const COD_ADVANCE = 99; // paid online to confirm a COD order; the rest is paid on delivery

// Put product photos in the /images folder and write the file name below.
// price = your selling price, mrp = crossed-out price (optional), badge = small tag (optional)
// features = bullet points (optional). Add more products by copying a { ... } block.
const PRODUCTS = [
  {
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
];

// ======================================================

// fill the "Online vs COD" order section from the numbers above
const price = PRODUCTS[0].price;
const fill = (key, value) =>
  document.querySelectorAll(`[data-fill="${key}"]`).forEach((el) => (el.textContent = value));
fill("online", `₹${price}`);
fill("cod", `₹${price + COD_EXTRA}`);
fill("extra", `₹${COD_EXTRA}`);
fill("advance", `₹${COD_ADVANCE}`);
fill("balance", `₹${price + COD_EXTRA - COD_ADVANCE}`);

function wirePay(selector, link) {
  document.querySelectorAll(selector).forEach((a) => {
    if (link) {
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Payments open very soon 💗 Please check back shortly!");
      });
    }
  });
}
wirePay("[data-pay=online]", ONLINE_LINK);
wirePay("[data-pay=cod]", COD_LINK);

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
    ? `💳 Paying by UPI? <a href="${inChrome(location.href)}">Open in Chrome</a> for a smooth payment`
    : `💳 Paying by UPI? Tap <b>•••</b> (top right) → <b>Open in browser</b> first`;
  document.body.prepend(bar);

  document.querySelectorAll("[data-pay]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const link = a.dataset.pay === "cod" ? COD_LINK : ONLINE_LINK;
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
  m.onclick = (e) => e.target === m && m.remove();
  document.body.appendChild(m);
}

// Meta Pixel events (the base PageView is in index.html)
const track = (event, data) => window.fbq && fbq("track", event, data);
const productData = (value) => ({
  content_name: PRODUCTS[0].name,
  content_type: "product",
  value,
  currency: "INR",
});
track("ViewContent", productData(price));
document.querySelectorAll("[data-pay=online]").forEach((a) =>
  a.addEventListener("click", () => track("InitiateCheckout", productData(price)))
);
document.querySelectorAll("[data-pay=cod]").forEach((a) =>
  a.addEventListener("click", () => track("InitiateCheckout", productData(price + COD_EXTRA)))
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
  card.style.transitionDelay = `${i * 0.08}s`;
  card.innerHTML = `
    ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
    <div class="card-img"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>
    <div class="card-body">
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    ${p.features ? `<ul class="features">${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
    <div class="price">
      <strong>₹${p.price}</strong>
      ${p.mrp ? `<s>₹${p.mrp}</s><small>${off}% off</small>` : ""}
    </div>
    <a class="btn" href="#order">Buy now 💗</a>
    </div>`;
  useFallback(card.querySelector("img"), p.icon || "🌸", p.name);
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
