// ============================================================
// 1. SETTINGS
// ============================================================
const SCRIPT_URL = "PASTE_YOUR_NEW_WEB_APP_URL_HERE"; // must end in /exec (deploy the new Code.gs and paste its URL)
const DELIVERY_FEE = 250;   // added automatically when "Delivered to home" is chosen

// The three QR codes customers can choose from
const PAY_OPTIONS = [
  { id: "samarth", name: "Samarth Annadana", app: "PhonePe",    upi: "9740511988@ibl",   qr: "images/qr-samarth.jpg", paidTo: "Samarth (PhonePe)" },
  { id: "varan",   name: "Varan Erranki",    app: "Google Pay", upi: "varanerranki@oksbi", qr: "images/qr-varan.jpg",   paidTo: "Varan (Google Pay)" },
  { id: "vinish",  name: "Vinish Khumar",    app: "Google Pay", upi: "vinishkhumar@oksbi", qr: "images/qr-vinish.jpg",  paidTo: "Vinish (Google Pay)" }
];

// ============================================================
// 2. HELPERS
// ============================================================
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Number(n).toLocaleString("en-IN");
const discountPct = p => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
const REC_KEY = "__recommendations__";

const cart = {};          // product id -> quantity
let customer = null;      // details from step 1
let currentStep = 1;

// ============================================================
// 3. PRODUCT LIST (Recommendations first, then categories)
// ============================================================
const IMG_EXT = ["jpg", "jpeg", "png", "webp"];   // photo file types we try, in this order

// If a photo is missing, try the next file type; after the last one show a plain placeholder
function imgFail(img) {
  const next = Number(img.dataset.i) + 1;
  if (next < IMG_EXT.length) {
    img.dataset.i = next;
    img.src = `images/products/p${img.dataset.id}.${IMG_EXT[next]}`;
    return;
  }
  const thumb = img.closest(".thumb");
  thumb.classList.add("noimg");
  thumb.removeAttribute("data-zoom");
  thumb.disabled = true;
  img.remove();
}

function card(p, inRec) {
  const off = discountPct(p);
  const src = p.image || `images/products/p${p.id}.${IMG_EXT[0]}`;
  return `
    <div class="card">
      ${off ? `<span class="off">${off}% OFF</span>` : ""}
      <button type="button" class="thumb" data-zoom="${esc(p.name)}" aria-label="View photo of ${esc(p.name)}">
        <img src="${esc(src)}" data-id="${p.id}" data-i="${p.image ? -1 : 0}" alt="" loading="lazy" onerror="imgFail(this)">
      </button>
      <h4>${p.rec && !inRec ? '<span class="star" title="Recommended">⭐</span>' : ""}${esc(p.name)}</h4>
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <p class="price">
        <span class="our">₹${fmt(p.price)}</span>
        ${off ? `<s class="mrp">₹${fmt(p.mrp)}</s>` : ""}
        ${p.unit ? `<span class="unit">/ ${esc(p.unit)}</span>` : ""}
      </p>
      <div class="qty">
        <button type="button" data-id="${p.id}" data-d="-1" aria-label="Remove one ${esc(p.name)}">−</button>
        <span class="qty-val" data-qty="${p.id}" aria-live="polite">${cart[p.id] || 0}</span>
        <button type="button" data-id="${p.id}" data-d="1" aria-label="Add one ${esc(p.name)}">+</button>
      </div>
    </div>`;
}

function section(title, items, opts = {}) {
  return `
    <details class="category${opts.rec ? " rec" : ""}"${opts.open ? " open" : ""}>
      <summary><span>${esc(title)} <span class="badge" data-cat="${esc(opts.rec ? REC_KEY : title)}"></span></span></summary>
      ${opts.rec ? '<p class="rec-intro">Hand-picked favourites from our price list.</p>' : ""}
      <div class="grid">${items.map(p => card(p, opts.rec)).join("")}</div>
    </details>`;
}

function renderProducts() {
  if (typeof PRODUCTS === "undefined") {
    $("products").innerHTML = '<p style="padding:20px">Products could not be loaded. Please refresh the page.</p>';
    return;
  }
  const groups = {};
  PRODUCTS.forEach(p => (groups[p.category] ||= []).push(p));
  const recs = PRODUCTS.filter(p => p.rec);
  let html = "";
  if (recs.length) html += section("⭐ Recommendations", recs, { rec: true, open: true });
  Object.entries(groups).forEach(([cat, items]) => { html += section(cat, items); });
  $("products").innerHTML = html;
}

// ============================================================
// 4. CART
// ============================================================
function changeQty(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  document.querySelectorAll(`[data-qty="${id}"]`).forEach(el => (el.textContent = cart[id]));
  updateSummary();
}

function getCartItems() {
  return PRODUCTS.filter(p => cart[p.id] > 0).map(p => ({ id: p.id, name: p.name, unit: p.unit, mrp: p.mrp, price: p.price, qty: cart[p.id] }));
}

function totals() {
  let mrp = 0, our = 0;
  getCartItems().forEach(i => { mrp += i.mrp * i.qty; our += i.price * i.qty; });
  return { mrp, our, save: mrp - our };
}

function updateSummary() {
  const t = totals();
  $("total").textContent = fmt(t.our);
  $("mrp-total").textContent = "₹" + fmt(t.mrp);
  $("mrp-total").classList.toggle("hidden", t.save <= 0);
  $("savings-note").textContent = t.save > 0 ? "You save ₹" + fmt(t.save) : "";
  $("clear-btn").classList.toggle("hidden", !getCartItems().length);

  const counts = {};
  PRODUCTS.forEach(p => {
    const q = cart[p.id] || 0;
    if (!q) return;
    counts[p.category] = (counts[p.category] || 0) + q;
    if (p.rec) counts[REC_KEY] = (counts[REC_KEY] || 0) + q;
  });
  document.querySelectorAll(".badge[data-cat]").forEach(el => {
    const n = counts[el.dataset.cat] || 0;
    el.textContent = n ? `(${n} selected)` : "";
  });
}

function clearCart() {
  if (!getCartItems().length) return;
  if (!confirm("Remove all items from your cart?")) return;
  Object.keys(cart).forEach(k => delete cart[k]);
  document.querySelectorAll("[data-qty]").forEach(el => (el.textContent = "0"));
  updateSummary();
}
$("clear-btn").addEventListener("click", clearCart);

// ============================================================
// 5. POPUPS
// ============================================================
const openStack = [];

function openModal(id, opener) {
  const m = $(id);
  if (!m) return;
  m.classList.remove("hidden");
  if (!openStack.includes(id)) openStack.push(id);
  m._opener = opener || document.activeElement;
  document.body.classList.add("no-scroll");
  const first = m.querySelector("form:not(.hidden) input, form:not(.hidden) select") || m.querySelector(".close");
  if (first) first.focus();
}

function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.add("hidden");
  const i = openStack.indexOf(id);
  if (i > -1) openStack.splice(i, 1);
  if (!openStack.length) document.body.classList.remove("no-scroll");
  if (m._opener && document.contains(m._opener)) m._opener.focus();
}

document.addEventListener("click", e => {
  const openBtn = e.target.closest("[data-open]");
  if (openBtn) return openModal(openBtn.dataset.open, openBtn);

  const closeBtn = e.target.closest("[data-close]");
  if (closeBtn) return closeModal(closeBtn.closest(".modal").id);

  if (e.target.classList.contains("modal")) return closeModal(e.target.id);   // click on the dark backdrop

  const z = e.target.closest(".thumb[data-zoom]");
  if (z) {
    const im = z.querySelector("img");
    if (im) {
      $("photo-big").src = im.src; $("photo-big").alt = z.dataset.zoom;
      $("photo-caption").textContent = z.dataset.zoom;
      openModal("modal-photo", z);
    }
    return;
  }

  const q = e.target.closest(".qty button[data-id]");
  if (q) changeQty(Number(q.dataset.id), Number(q.dataset.d));
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && openStack.length) closeModal(openStack[openStack.length - 1]);
});

// ============================================================
// 6. CHECKOUT: step 1 (details) -> step 2 (pay + upload) -> step 3 (done)
// ============================================================
function showStep(n) {
  currentStep = n;
  $("step1").classList.toggle("hidden", n !== 1);
  $("order-form").classList.toggle("hidden", n !== 2);
  $("step3").classList.toggle("hidden", n !== 3);
  document.querySelector(".steps").classList.toggle("hidden", n === 3);
  $("dot1").classList.toggle("active", n === 1);
  $("dot2").classList.toggle("active", n === 2);
}

// "required" lets spaces through, so also reject whitespace-only answers
function allFilled(form) {
  for (const el of form.querySelectorAll("input[required]:not([type=file]):not([type=checkbox]):not([type=radio])")) {
    if (!el.value.trim()) {
      el.setCustomValidity("Please fill in this field");
      el.reportValidity();
      return false;
    }
  }
  return true;
}
document.addEventListener("input", e => { if (e.target.setCustomValidity) e.target.setCustomValidity(""); });

$("checkout-btn").addEventListener("click", () => {
  if (!getCartItems().length) return alert("Please add at least one item.");
  if (currentStep === 3) showStep(1);
  if (currentStep === 2) fillStep2();
  openModal("modal-checkout", $("checkout-btn"));
});

// ---- delivery option: show the matching fields ----
document.querySelectorAll(".fee-amt").forEach(el => (el.textContent = fmt(DELIVERY_FEE)));
$("delivery").querySelector('option[value="home"]').textContent = `Delivered to home (+ ₹${fmt(DELIVERY_FEE)} delivery fee)`;

function showDelivery(v) {
  $("fields-college").classList.toggle("hidden", v !== "college");
  $("fields-home").classList.toggle("hidden", v !== "home");
}
$("delivery").addEventListener("change", e => showDelivery(e.target.value));

const deliveryFee = () => (customer && customer.delivery === "home" ? DELIVERY_FEE : 0);

$("step1").addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;     // only checks the format of what was filled in
  const v = id => $(id).value.trim(), d = $("delivery").value;
  customer = {
    customerType: $("ctype").value, name: v("name"), phone: v("phone"), delivery: d,
    cabin: d === "college" ? v("cabin") : "",
    address: d === "home" ? v("address") : "",
    mapLink: d === "home" ? v("mapLink") : ""
  };
  fillStep2();
  showStep(2);
  document.querySelector("#modal-checkout .modal-box").scrollTop = 0;
});

$("back-btn").addEventListener("click", () => showStep(1));

function fillStep2() {
  const t = totals(), fee = deliveryFee(), grand = t.our + fee;
  $("order-lines").innerHTML = getCartItems()
    .map(i => `<li><span>${i.qty} × ${esc(i.name)}</span><span>₹${fmt(i.qty * i.price)}</span></li>`).join("");
  $("sum-mrp").textContent = "₹" + fmt(t.mrp);
  $("sum-save").textContent = "− ₹" + fmt(t.save);
  $("sum-fee").textContent = "+ ₹" + fmt(fee);
  $("sum-total").textContent = "₹" + fmt(grand);
  $("row-save").classList.toggle("hidden", t.save <= 0);
  $("row-mrp").classList.toggle("hidden", t.save <= 0);
  $("row-fee").classList.toggle("hidden", !fee);
  $("qr-amount").textContent = "₹" + fmt(grand);
}

// ---- payment choice (3 QR codes) ----
$("pay-options").innerHTML = PAY_OPTIONS.map(o => `
  <label class="pay-opt">
    <input type="radio" name="pay" value="${o.id}">
    <span><strong>${esc(o.name)}</strong><small>${esc(o.app)}</small></span>
  </label>`).join("");

$("pay-options").addEventListener("change", e => {
  const o = PAY_OPTIONS.find(x => x.id === e.target.value);
  if (!o) return;
  $("qr-img").src = o.qr;
  $("qr-img").alt = `UPI QR code for ${o.name} (${o.app})`;
  $("qr-upi").textContent = o.upi;
  $("qr-panel").classList.remove("hidden");
});

$("copy-upi").addEventListener("click", async e => {
  const btn = e.currentTarget, text = $("qr-upi").textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const r = document.createRange(); r.selectNodeContents($("qr-upi"));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { document.execCommand("copy"); } catch (e2) { /* user can copy by hand */ }
  }
  btn.textContent = "Copied ✓";
  setTimeout(() => (btn.textContent = "Copy"), 1500);
});

// ---- place the order ----
// Order ID = first letter of the buyer's name + 3 random digits + tag, e.g. V472-FAC (FAC = faculty, GST = guest)
function newOrderId(name, tag) {
  const letter = ((name || "").match(/[A-Za-z]/) || ["X"])[0].toUpperCase();
  const bytes = window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(3)) : null;
  const digits = [0, 1, 2].map(i => (bytes ? bytes[i] % 10 : Math.floor(Math.random() * 10))).join("");
  return letter + digits + "-" + (tag || "NA");
}

async function sendOrder(order) {
  if (!SCRIPT_URL.includes("/exec")) throw new Error("SCRIPT_URL is not set");
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    await fetch(SCRIPT_URL, {
      method: "POST", mode: "no-cors", signal: ctrl.signal,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(order)
    });
  } finally { clearTimeout(timer); }
}

$("order-form").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target, btn = $("place-btn"), subErr = $("submit-error");
  subErr.classList.add("hidden");

  const items = getCartItems(), t = totals();
  if (!items.length || !customer) return;
  const fee = deliveryFee();
  const pay = PAY_OPTIONS.find(o => o.id === form.elements.pay.value);
  const order = {
    id: newOrderId(customer.name, { faculty: "FAC", guest: "GST" }[customer.customerType]),
    ...customer,
    items: items.map(i => `P${i.id} ${i.name} x${i.qty}`).join(", "),
    mrpTotal: t.mrp, discount: t.save, deliveryFee: fee, total: t.our + fee,
    utr: $("utr").value.trim(),
    paidTo: pay ? pay.paidTo : ""
  };

  btn.disabled = true; btn.textContent = "Placing order...";
  try {
    await sendOrder(order);
    $("done-id").textContent = order.id;
    Object.keys(cart).forEach(k => delete cart[k]);
    renderProducts(); updateSummary();
    form.reset(); $("step1").reset(); showDelivery(""); $("qr-panel").classList.add("hidden");
    customer = null;
    showStep(3);
  } catch (err) {
    subErr.textContent = "We couldn't send your order. Please check your internet connection and try again.";
    subErr.classList.remove("hidden");
  }
  btn.disabled = false; btn.textContent = "Place Order";
});

// ============================================================
// 7. START
// ============================================================
renderProducts();
updateSummary();
