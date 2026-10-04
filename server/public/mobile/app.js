/**
 * Shopping mobile PWA
 * A mobile counterpart to the shop website, using the same API and Google auth.
 */

const API = `${window.location.origin}/api`;
const KEYS = {
  user: 'mobile_user',
  cart: 'mobile_cart',
  wishlist: 'mobile_wishlist',
  recent: 'mobile_recent',
  addresses: 'mobile_addresses',
  theme: 'mobile_theme',
};
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#eceff1"/><text x="100" y="112" font-size="72" text-anchor="middle" fill="#b0bec5">S</text></svg>'
  );

const state = {
  user: readJSON(KEYS.user, null),
  products: [],
  cart: [],
  wishlist: readJSON(KEYS.wishlist, []),
  recent: readJSON(KEYS.recent, []),
  addresses: readJSON(KEYS.addresses, []),
  deliveryFees: { default: 3000 },
  promoHints: [],
  promo: null,
  category: 'All',
  sort: 'newest',
  search: '',
  tab: 'shop',
  view: { name: 'home' },
  orders: [],
  loading: true,
  installPrompt: null,
};

let stream = null;

/* ----------------------------- helpers ----------------------------- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const naira = (n) =>
  `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

function showSuccess() {
  const el = document.getElementById('success');
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 1000);
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function finalPrice(product) {
  const discount = Number(product.discount_percent || 0);
  return Number(product.price) * (1 - discount / 100);
}

function isNew(product) {
  if (!product.created_at) return false;
  return Date.now() - new Date(product.created_at).getTime() < 7 * 86400000;
}

function stars(rating) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

async function api(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/* ------------------------------- auth ------------------------------- */

function captureAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const email = params.get('email');
  const name = params.get('name');
  if (userId && email) {
    state.user = { id: userId, email, name };
    writeJSON(KEYS.user, state.user);
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function login() {
  window.location.href = `${API}/auth/google?redirect=${encodeURIComponent('/mobile/')}`;
}

function logout() {
  state.user = null;
  state.cart = [];
  state.orders = [];
  localStorage.removeItem(KEYS.user);
  if (stream) {
    stream.close();
    stream = null;
  }
  state.view = { name: 'home' };
  state.tab = 'shop';
  renderAll();
}

/* ------------------------------ theme ------------------------------- */

function applyTheme() {
  const theme = readJSON(KEYS.theme, 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-btn').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  writeJSON(KEYS.theme, next);
  applyTheme();
}

/* ----------------------------- wishlist ----------------------------- */

function isWished(id) {
  return state.wishlist.includes(id);
}

function toggleWishlist(id) {
  if (isWished(id)) {
    state.wishlist = state.wishlist.filter((x) => x !== id);
    toast('Removed from wishlist');
  } else {
    state.wishlist.push(id);
    toast('Added to wishlist');
  }
  writeJSON(KEYS.wishlist, state.wishlist);
  renderAll();
}

/* --------------------------- recently viewed ------------------------ */

function addRecent(product) {
  state.recent = [product, ...state.recent.filter((p) => p.id !== product.id)].slice(0, 8);
  writeJSON(KEYS.recent, state.recent);
}

/* ------------------------------- cart ------------------------------- */

function mapServerItems(items) {
  return (items || [])
    .filter((row) => row.product)
    .map((row) => {
      const p = row.product;
      return {
        ...p,
        price: finalPrice(p),
        quantity: row.quantity,
      };
    });
}

async function syncCart(items) {
  if (!state.user) return;
  try {
    await api(`/cart/${state.user.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    });
  } catch (error) {
    console.error(error);
    toast('Cart sync failed');
  }
}

function updateCart(next) {
  state.cart = next;
  writeJSON(KEYS.cart, next);
  renderCartBadges();
  renderAll();
  syncCart(next);
}

function addToCart(product, quantity = 1) {
  if (!state.user) {
    toast('Sign in to sync your cart');
    login();
    return;
  }
  const price = finalPrice(product);
  const existing = state.cart.find((i) => i.id === product.id);
  const next = existing
    ? state.cart.map((i) =>
        i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
      )
    : [...state.cart, { ...product, price, quantity }];
  updateCart(next);
  toast('Added to cart');
}

function changeQty(productId, delta) {
  updateCart(
    state.cart
      .map((i) => (i.id === productId ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0)
  );
}

function removeItem(productId) {
  updateCart(state.cart.filter((i) => i.id !== productId));
}

function startCartSync() {
  if (!state.user) return;
  if (stream) stream.close();

  api(`/cart/${state.user.id}`)
    .then((items) => {
      state.cart = mapServerItems(items);
      writeJSON(KEYS.cart, state.cart);
      renderCartBadges();
      renderAll();
    })
    .catch((error) => console.error(error));

  stream = new EventSource(`${API}/cart/${state.user.id}/stream`);
  stream.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'cart') {
        state.cart = mapServerItems(data.items);
        writeJSON(KEYS.cart, state.cart);
        renderCartBadges();
        renderAll();
      }
    } catch (error) {
      console.error(error);
    }
  };
}

function renderCartBadges() {
  const total = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  ['cart-badge', 'fab-cart-badge'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = total;
    el.hidden = total === 0;
  });
  const fab = document.getElementById('fab-cart');
  if (fab) fab.hidden = total === 0;
}

/* ----------------------------- products ----------------------------- */

async function loadProducts() {
  try {
    state.products = await api('/products');
  } catch (error) {
    console.error(error);
    toast('Could not load products');
  }
  state.loading = false;
  renderAll();
}

function visibleProducts() {
  let list = [...state.products];

  if (state.category !== 'All') {
    list = list.filter((p) => p.category === state.category);
  }
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }

  switch (state.sort) {
    case 'price-asc':
      list.sort((a, b) => finalPrice(a) - finalPrice(b));
      break;
    case 'price-desc':
      list.sort((a, b) => finalPrice(b) - finalPrice(a));
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
  }
  return list;
}

function categories() {
  const set = new Set(state.products.map((p) => p.category).filter(Boolean));
  return ['All', ...set];
}

/* ------------------------------ reviews ----------------------------- */

async function loadReviews(productId) {
  try {
    return await api(`/reviews/${productId}`);
  } catch (error) {
    console.error(error);
    return { reviews: [], average: 0, count: 0 };
  }
}

async function submitReview(productId, rating, comment) {
  if (!state.user) {
    toast('Sign in to review');
    return;
  }
  try {
    await api('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        userId: state.user.id,
        userName: state.user.name || 'Anonymous',
        rating,
        comment,
      }),
    });
    toast('Review submitted');
    openProduct(productId);
  } catch (error) {
    console.error(error);
    toast('Could not submit review');
  }
}

/* ------------------------------ orders ------------------------------ */

async function loadOrders() {
  if (!state.user) return;
  try {
    state.orders = await api(`/orders/${encodeURIComponent(state.user.email)}`);
    renderAll();
  } catch (error) {
    console.error(error);
  }
}

async function placeOrder(form) {
  const items = state.cart.map((i) => ({
    productId: i.id,
    name: i.name,
    quantity: i.quantity,
    price: i.price,
  }));

  const totals = computeTotals();
  try {
    await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items,
        customerEmail: form.email,
        customerName: form.name,
        totalAmount: totals.total,
        shippingAddress: `${form.address}, ${form.city} · ${form.phone}`,
      }),
    });

    showSuccess();
    updateCart([]);
    state.promo = null;
    state.view = { name: 'orders' };
    state.tab = 'orders';
    loadOrders();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order placed', { body: 'Your Shopping order was confirmed.' });
    }
  } catch (error) {
    console.error(error);
    toast('Could not place order');
  }
}

/* ------------------------------ meta -------------------------------- */

async function loadMeta() {
  try {
    const data = await api('/meta');
    state.deliveryFees = data.deliveryFees || state.deliveryFees;
    state.promoHints = data.promoHints || [];
  } catch (error) {
    console.error(error);
  }
}

function shippingFor(city) {
  return state.deliveryFees[city] ?? state.deliveryFees.default ?? 3000;
}

function computeTotals() {
  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const city = state.checkoutCity || 'Lagos';
  const shipping = state.cart.length ? shippingFor(city) : 0;
  let discount = 0;
  if (state.promo) {
    discount =
      state.promo.type === 'percent'
        ? Math.round((subtotal * state.promo.value) / 100)
        : shipping;
  }
  return { subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) };
}

/* ---------------------------- navigation ---------------------------- */

function switchTab(tab) {
  state.tab = tab;
  state.view = { name: tab === 'shop' ? 'home' : tab };
  window.scrollTo({ top: 0 });
  renderAll();
}

function openProduct(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;
  addRecent(product);
  state.view = { name: 'product', product };
  window.scrollTo({ top: 0 });
  renderAll();
  loadReviews(id).then((data) => {
    state.reviews = data;
    renderAll();
  });
}

function goBack() {
  state.view = { name: 'home' };
  renderAll();
}

/* ------------------------------ render ------------------------------ */

function productCard(p) {
  const price = finalPrice(p);
  const hasDiscount = Number(p.discount_percent || 0) > 0;
  return `
    <div class="product-card">
      <div class="product-image-wrap" data-open="${p.id}">
        <img class="product-image" src="${p.image_url || PLACEHOLDER}" alt="${escapeHtml(
    p.name
  )}" loading="lazy" />
        ${
          hasDiscount
            ? `<span class="badge new">-${p.discount_percent}%</span>`
            : isNew(p)
            ? '<span class="badge new">New</span>'
            : ''
        }
        ${
          Number(p.stock) > 0 && Number(p.stock) <= 10
            ? `<span class="badge low" style="left:auto;right:38px">${p.stock} left</span>`
            : ''
        }
        <button class="wish-btn" data-wish="${p.id}" aria-label="Wishlist">${
    isWished(p.id) ? '❤️' : '🤍'
  }</button>
      </div>
      <div class="product-body">
        <span class="product-category">${escapeHtml(p.category || '')}</span>
        <span class="product-name" data-open="${p.id}">${escapeHtml(p.name)}</span>
        <span class="product-price">${naira(price)}${
    hasDiscount
      ? ` <span style="font-size:.72rem;color:var(--muted);text-decoration:line-through">${naira(
          p.price
        )}</span>`
      : ''
  }</span>
        <div class="card-actions">
          <button class="add-btn" data-add="${p.id}">Add to cart</button>
        </div>
      </div>
    </div>`;
}

function renderHome() {
  if (state.loading) return '<p class="empty">Loading products…</p>';

  const deals = `
    <div class="deal-strip">
      <div class="deal-card"><h4>Welcome offer</h4><p>Use code <b>WELCOME10</b> for 10% off</p></div>
      <div class="deal-card gold"><h4>Free delivery</h4><p>Use code <b>FREESHIP</b> on your order</p></div>
      <div class="deal-card"><h4>Team Kestrel</h4><p>Use code <b>KESTREL15</b> for 15% off</p></div>
    </div>`;

  const chips = categories()
    .map(
      (c) =>
        `<button class="chip ${
          state.category === c ? 'is-active' : ''
        }" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    )
    .join('');

  const recent = state.recent.length
    ? `<p class="section-title">Recently viewed</p><div class="deal-strip">${state.recent
        .map(
          (p) =>
            `<div class="deal-card" data-open="${p.id}" style="min-width:150px;padding:10px"><img src="${
              p.image_url || PLACEHOLDER
            }" style="width:100%;border-radius:10px;aspect-ratio:1;object-fit:cover"/><p style="margin-top:6px">${escapeHtml(
              p.name
            )}</p></div>`
        )
        .join('')}</div>`
    : '';

  const list = visibleProducts();

  const toolbar = `
    <div class="toolbar">
      <div class="chips">${chips}</div>
      <select class="sort-select" id="sort-select">
        <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
        <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Price ↑</option>
        <option value="price-desc" ${
          state.sort === 'price-desc' ? 'selected' : ''
        }>Price ↓</option>
        <option value="name" ${state.sort === 'name' ? 'selected' : ''}>A–Z</option>
      </select>
    </div>`;

  return `
    <section class="hero">
      <h2>Quality Goods, Delivered.</h2>
      <p>Shop the best of Nigerian fashion, food, electronics and more.</p>
    </section>
    ${deals}
    <p class="section-title">Shop by category</p>
    ${toolbar}
    ${
      state.search
        ? `<p class="section-title">${list.length} result${
            list.length === 1 ? '' : 's'
          } for “${escapeHtml(state.search)}”</p>`
        : ''
    }
    <div class="product-list">${
      list.length ? list.map(productCard).join('') : '<p class="empty">No products found.</p>'
    }</div>
    ${recent}`;
}

function renderProduct() {
  const p = state.view.product;
  const price = finalPrice(p);
  const hasDiscount = Number(p.discount_percent || 0) > 0;
  const related = state.products
    .filter((x) => x.category === p.category && x.id !== p.id)
    .slice(0, 4);

  const reviews = state.reviews || { reviews: [], average: 0, count: 0 };
  const reviewList = reviews.reviews.length
    ? reviews.reviews
        .map(
          (r) => `
        <div class="review-item">
          <div class="review-head"><span>${escapeHtml(r.user_name)}</span><span class="stars">${stars(
            r.rating
          )}</span></div>
          ${r.comment ? `<p class="review-comment">${escapeHtml(r.comment)}</p>` : ''}
        </div>`
        )
        .join('')
    : '<p class="note">No reviews yet. Be the first!</p>';

  return `
    <div class="product-detail">
      <img class="detail-image" src="${p.image_url || PLACEHOLDER}" alt="${escapeHtml(p.name)}" />
      <div>
        <h1 class="detail-title">${escapeHtml(p.name)}</h1>
        <div class="stars">${stars(reviews.average)} <span style="color:var(--muted);font-size:.75rem">(${
    reviews.count
  })</span></div>
      </div>
      <div class="detail-price">${naira(price)}${
    hasDiscount
      ? ` <span style="font-size:.85rem;color:var(--muted);text-decoration:line-through">${naira(
          p.price
        )}</span>`
      : ''
  }</div>
      <p class="detail-desc">${escapeHtml(p.description || '')}</p>
      <p class="note">${
        Number(p.stock) <= 10 ? `Only ${p.stock} left in stock` : 'In stock'
      } · ${escapeHtml(p.category || '')}</p>
      <div class="detail-actions">
        <button class="btn btn-primary" id="detail-add">Add to cart</button>
        <button class="wish-btn" style="position:static;width:44px;height:44px" data-wish="${
          p.id
        }">${isWished(p.id) ? '❤️' : '🤍'}</button>
      </div>
      <div class="detail-actions">
        <a class="btn btn-whatsapp" style="flex:1;text-align:center" href="https://wa.me/?text=${encodeURIComponent(
          `${p.name} — ${naira(price)} on Shopping`
        )}" target="_blank" rel="noopener">Share on WhatsApp</a>
      </div>

      <p class="section-title">Reviews</p>
      ${reviewList}
      <div class="review-form">
        <select id="review-rating">
          <option value="5">★★★★★ Excellent</option>
          <option value="4">★★★★☆ Good</option>
          <option value="3">★★★☆☆ Okay</option>
          <option value="2">★★☆☆☆ Poor</option>
          <option value="1">★☆☆☆☆ Bad</option>
        </select>
        <textarea id="review-comment" rows="2" placeholder="Share your thoughts…"></textarea>
        <button class="btn btn-outline" id="review-submit">Submit review</button>
      </div>

      ${
        related.length
          ? `<p class="section-title">You may also like</p><div class="product-list">${related
              .map(productCard)
              .join('')}</div>`
          : ''
      }
    </div>`;
}

function renderCart() {
  if (!state.user) {
    return `
      <div class="signed-out">
        <h3>Sign in to sync your cart</h3>
        <p>Use the same Google account as the website.</p>
        <button class="google-btn" id="login-inline">Continue with Google</button>
      </div>`;
  }
  if (state.cart.length === 0) {
    return '<div class="empty"><h3>Your cart is empty</h3><p>Add products to see them here — and on the website.</p></div>';
  }

  const items = state.cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image_url || PLACEHOLDER}" alt="${escapeHtml(item.name)}" />
        <div class="cart-info">
          <h4>${escapeHtml(item.name)}</h4>
          <div class="cart-price">${naira(item.price * item.quantity)}</div>
          <button class="remove-btn" data-remove="${item.id}">Remove</button>
        </div>
        <div class="stepper">
          <button data-dec="${item.id}">−</button><span>${item.quantity}</span><button data-inc="${
        item.id
      }">+</button>
        </div>
      </div>`
    )
    .join('');

  const t = computeTotals();
  return `
    <p class="section-title">Your cart</p>
    ${items}
    <div class="summary">
      <div class="summary-row"><span>Subtotal</span><span>${naira(t.subtotal)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${naira(t.shipping)}</span></div>
      ${
        t.discount
          ? `<div class="summary-row"><span>Promo</span><span>-${naira(t.discount)}</span></div>`
          : ''
      }
      <div class="summary-row total"><span>Total</span><span>${naira(t.total)}</span></div>
      <button class="btn btn-primary" style="width:100%;margin-top:12px" id="go-checkout">Checkout</button>
    </div>`;
}

function renderCheckout() {
  if (!state.user || state.cart.length === 0) return renderCart();
  const t = computeTotals();
  const cities = Object.keys(state.deliveryFees).filter((c) => c !== 'default');
  return `
    <p class="section-title">Checkout</p>
    <div class="field"><label>Full name</label><input id="co-name" value="${escapeHtml(
      state.user.name || ''
    )}" /></div>
    <div class="field"><label>Email</label><input id="co-email" type="email" value="${escapeHtml(
      state.user.email || ''
    )}" /></div>
    <div class="field"><label>Phone</label><input id="co-phone" placeholder="0803…" /></div>
    <div class="field"><label>Address</label><input id="co-address" placeholder="Street, area" /></div>
    <div class="field"><label>City</label><select id="co-city">${cities
      .map(
        (c) =>
          `<option value="${c}" ${
            (state.checkoutCity || 'Lagos') === c ? 'selected' : ''
          }>${c} — ${naira(shippingFor(c))}</option>`
      )
      .join('')}</select></div>
    <div class="field"><label>Promo code</label>
      <div class="promo-row">
        <input id="co-promo" placeholder="WELCOME10" value="${escapeHtml(
          state.promo?.code || ''
        )}" />
        <button class="btn btn-outline" id="apply-promo">Apply</button>
      </div>
      <p class="note">Try: ${state.promoHints.join(', ') || 'WELCOME10, FREESHIP, KESTREL15'}</p>
    </div>
    <div class="summary">
      <div class="summary-row"><span>Subtotal</span><span>${naira(t.subtotal)}</span></div>
      <div class="summary-row"><span>Delivery</span><span>${naira(t.shipping)}</span></div>
      ${
        t.discount
          ? `<div class="summary-row"><span>Promo</span><span>-${naira(t.discount)}</span></div>`
          : ''
      }
      <div class="summary-row total"><span>Total</span><span>${naira(t.total)}</span></div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:12px" id="place-order">Pay ${naira(
      t.total
    )}</button>
    <p class="note">Test payment — no real charge is made.</p>`;
}

function renderOrders() {
  if (!state.user) {
    return '<div class="signed-out"><h3>Sign in to see your orders</h3></div>';
  }
  if (!state.orders.length) {
    return '<div class="empty"><h3>No orders yet</h3><p>Your orders will appear here.</p></div>';
  }
  return `
    <p class="section-title">My orders</p>
    ${state.orders
      .map(
        (o) => `
      <div class="order-card" data-order="${o.id}">
        <div class="order-head"><span>#${String(o.id).slice(0, 8)}</span><span class="status">${
          o.status
        }</span></div>
        <p class="note" style="text-align:left">${new Date(o.created_at).toLocaleDateString(
          'en-NG',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )}</p>
        <div class="summary-row total" style="border:none;padding:0;margin:0"><span>Total</span><span>${naira(
          o.total_amount
        )}</span></div>
      </div>`
      )
      .join('')}`;
}

function renderProfile() {
  if (!state.user) {
    return `
      <div class="signed-out">
        <h3>Welcome to Shopping</h3>
        <p>Sign in with Google to sync your cart across devices.</p>
        <button class="google-btn" id="login-inline">Continue with Google</button>
      </div>`;
  }
  return `
    <div class="profile-head">
      <div class="avatar">${initials(state.user.name)}</div>
      <div><strong>${escapeHtml(state.user.name || 'Shopper')}</strong><p class="note" style="text-align:left">${escapeHtml(
    state.user.email
  )}</p></div>
    </div>
    <p class="section-title">Edit profile</p>
    <div class="field"><label>Display name</label><input id="pf-name" value="${escapeHtml(
      state.user.name || ''
    )}" /></div>
    <button class="btn btn-primary" id="pf-save">Save</button>

    <p class="section-title">Saved addresses</p>
    ${
      state.addresses.length
        ? state.addresses
            .map(
              (a, i) =>
                `<div class="order-card"><div class="order-head"><span>${escapeHtml(
                  a.label
                )}</span><button class="remove-btn" data-del-addr="${i}">Delete</button></div><p class="note" style="text-align:left">${escapeHtml(
                  a.address
                )}, ${escapeHtml(a.city)}</p></div>`
            )
            .join('')
        : '<p class="note">No saved addresses.</p>'
    }
    <div class="field"><label>Label</label><input id="addr-label" placeholder="Home / Work" /></div>
    <div class="field"><label>Address</label><input id="addr-address" placeholder="Street, area" /></div>
    <div class="field"><label>City</label><input id="addr-city" placeholder="Lagos" /></div>
    <button class="btn btn-outline" id="addr-save">Add address</button>

    <p class="section-title">Preferences</p>
    <button class="btn btn-outline" style="width:100%;margin-bottom:10px" id="pref-theme">Toggle dark mode</button>
    <button class="btn btn-outline" style="width:100%;margin-bottom:10px" id="pref-notify">Enable order notifications</button>
    <button class="btn btn-outline" style="width:100%" id="pref-logout">Sign out</button>`;
}

function renderWishlist() {
  const items = state.products.filter((p) => isWished(p.id));
  if (!items.length) {
    return '<div class="empty"><h3>Your wishlist is empty</h3><p>Tap the heart on a product to save it.</p></div>';
  }
  return `<p class="section-title">Wishlist</p><div class="product-list">${items
    .map(productCard)
    .join('')}</div>`;
}

function renderAll() {
  renderHeader();
  const view = document.getElementById('view');
  const name = state.view.name;
  let html = '';
  if (name === 'product') html = renderProduct();
  else if (name === 'cart') html = renderCart();
  else if (name === 'checkout') html = renderCheckout();
  else if (name === 'orders') html = renderOrders();
  else if (name === 'profile') html = renderProfile();
  else if (name === 'wishlist') html = renderWishlist();
  else html = renderHome();
  view.innerHTML = html;
  wireView();
  updateTabs();
}

function renderHeader() {
  const btn = document.getElementById('account-btn');
  if (state.user) {
    btn.textContent = state.user.name ? state.user.name.split(' ')[0] : 'Account';
    btn.onclick = () => switchTab('profile');
  } else {
    btn.textContent = 'Sign in';
    btn.onclick = login;
  }
  document.getElementById('back-btn').hidden = state.view.name === 'home';
}

function updateTabs() {
  document.getElementById('tab-shop').classList.toggle('is-active', state.tab === 'shop');
  document.getElementById('tab-wishlist').classList.toggle(
    'is-active',
    state.tab === 'wishlist'
  );
  document.getElementById('tab-cart').classList.toggle('is-active', state.tab === 'cart');
  document.getElementById('tab-orders').classList.toggle('is-active', state.tab === 'orders');
  document.getElementById('tab-profile').classList.toggle(
    'is-active',
    state.tab === 'profile'
  );
}

/* --------------------------- event wiring --------------------------- */

function wireView() {
  const view = document.getElementById('view');

  view.querySelectorAll('[data-open]').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      openProduct(el.dataset.open);
    };
  });
  view.querySelectorAll('[data-add]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const p = state.products.find((x) => x.id === btn.dataset.add);
      if (p) addToCart(p);
    };
  });
  view.querySelectorAll('[data-wish]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleWishlist(btn.dataset.wish);
    };
  });
  view.querySelectorAll('[data-inc]').forEach((b) => (b.onclick = () => changeQty(b.dataset.inc, 1)));
  view.querySelectorAll('[data-dec]').forEach((b) => (b.onclick = () => changeQty(b.dataset.dec, -1)));
  view.querySelectorAll('[data-remove]').forEach((b) => (b.onclick = () => removeItem(b.dataset.remove)));
  view.querySelectorAll('[data-cat]').forEach((b) => {
    b.onclick = () => {
      state.category = b.dataset.cat;
      renderAll();
    };
  });
  view.querySelectorAll('[data-order]').forEach((card) => {
    card.onclick = () => {
      state.view = { name: 'orders' };
      const o = state.orders.find((x) => x.id === card.dataset.order);
      if (o) toast(`Order #${String(o.id).slice(0, 8)} · ${o.status}`);
    };
  });
  view.querySelectorAll('[data-del-addr]').forEach((b) => {
    b.onclick = () => {
      state.addresses.splice(Number(b.dataset.delAddr), 1);
      writeJSON(KEYS.addresses, state.addresses);
      renderAll();
    };
  });

  const sort = document.getElementById('sort-select');
  if (sort) sort.onchange = () => {
    state.sort = sort.value;
    renderAll();
  };

  const inlineLogin = document.getElementById('login-inline');
  if (inlineLogin) inlineLogin.onclick = login;

  const detailAdd = document.getElementById('detail-add');
  if (detailAdd)
    detailAdd.onclick = () => addToCart(state.view.product);

  const reviewSubmit = document.getElementById('review-submit');
  if (reviewSubmit)
    reviewSubmit.onclick = () =>
      submitReview(
        state.view.product.id,
        Number(document.getElementById('review-rating').value),
        document.getElementById('review-comment').value
      );

  const goCheckout = document.getElementById('go-checkout');
  if (goCheckout)
    goCheckout.onclick = () => {
      state.view = { name: 'checkout' };
      renderAll();
    };

  const applyPromo = document.getElementById('apply-promo');
  if (applyPromo)
    applyPromo.onclick = async () => {
      const code = document.getElementById('co-promo').value.trim();
      if (!code) return;
      try {
        const res = await api('/meta/promo', {
          method: 'POST',
          body: JSON.stringify({
            code,
            subtotal: computeTotals().subtotal,
            shipping: computeTotals().shipping,
          }),
        });
        state.promo = { code: res.code, type: res.type, value: res.value };
        toast(res.label || 'Promo applied');
        renderAll();
      } catch {
        state.promo = null;
        toast('Invalid promo code');
        renderAll();
      }
    };

  const coCity = document.getElementById('co-city');
  if (coCity)
    coCity.onchange = () => {
      state.checkoutCity = coCity.value;
      renderAll();
    };

  const placeBtn = document.getElementById('place-order');
  if (placeBtn)
    placeBtn.onclick = () => {
      const form = {
        name: document.getElementById('co-name').value.trim(),
        email: document.getElementById('co-email').value.trim(),
        phone: document.getElementById('co-phone').value.trim(),
        address: document.getElementById('co-address').value.trim(),
        city: document.getElementById('co-city').value,
      };
      if (!form.name || !form.email || !form.address) {
        toast('Please complete the checkout form');
        return;
      }
      placeOrder(form);
    };

  const pfSave = document.getElementById('pf-save');
  if (pfSave)
    pfSave.onclick = async () => {
      const name = document.getElementById('pf-name').value.trim();
      try {
        await api('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ userId: state.user.id, name }),
        });
        state.user.name = name;
        writeJSON(KEYS.user, state.user);
        toast('Profile saved');
        renderAll();
      } catch {
        toast('Could not save profile');
      }
    };

  const addrSave = document.getElementById('addr-save');
  if (addrSave)
    addrSave.onclick = () => {
      const label = document.getElementById('addr-label').value.trim() || 'Address';
      const address = document.getElementById('addr-address').value.trim();
      const city = document.getElementById('addr-city').value.trim() || 'Lagos';
      if (!address) {
        toast('Enter an address');
        return;
      }
      state.addresses.push({ label, address, city });
      writeJSON(KEYS.addresses, state.addresses);
      toast('Address saved');
      renderAll();
    };

  const prefTheme = document.getElementById('pref-theme');
  if (prefTheme) prefTheme.onclick = toggleTheme;

  const prefNotify = document.getElementById('pref-notify');
  if (prefNotify)
    prefNotify.onclick = () => {
      if (!('Notification' in window)) {
        toast('Notifications not supported');
        return;
      }
      Notification.requestPermission().then((p) =>
        toast(p === 'granted' ? 'Notifications enabled' : 'Permission denied')
      );
    };

  const prefLogout = document.getElementById('pref-logout');
  if (prefLogout) prefLogout.onclick = logout;
}

/* ------------------------------ install ----------------------------- */

function setupInstall() {
  const banner = document.getElementById('install-banner');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    banner.hidden = false;
  });
  document.getElementById('install-btn').onclick = async () => {
    if (state.installPrompt) {
      state.installPrompt.prompt();
      state.installPrompt = null;
    } else {
      toast('Use Share → Add to Home Screen');
    }
    banner.hidden = true;
  };
  document.getElementById('install-dismiss').onclick = () => {
    banner.hidden = true;
  };
}

/* ------------------------------- init ------------------------------- */

function setupScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('to-top').hidden = window.scrollY < 400;
  });
  document.getElementById('to-top').onclick = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
  applyTheme();
  captureAuthRedirect();
  renderCartBadges();
  renderAll();
  loadMeta();
  loadProducts();
  startCartSync();
  if (state.user) loadOrders();

  document.getElementById('tab-shop').onclick = () => switchTab('shop');
  document.getElementById('tab-wishlist').onclick = () => switchTab('wishlist');
  document.getElementById('tab-cart').onclick = () => switchTab('cart');
  document.getElementById('tab-orders').onclick = () => {
    switchTab('orders');
    loadOrders();
  };
  document.getElementById('tab-profile').onclick = () => switchTab('profile');
  document.getElementById('fab-cart').onclick = () => switchTab('cart');
  document.getElementById('back-btn').onclick = goBack;
  document.getElementById('theme-btn').onclick = toggleTheme;

  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  document.getElementById('search-btn').onclick = () => {
    searchBar.hidden = !searchBar.hidden;
    if (!searchBar.hidden) searchInput.focus();
  };
  document.getElementById('search-close').onclick = () => {
    searchBar.hidden = true;
    searchInput.value = '';
    state.search = '';
    renderAll();
  };
  searchInput.oninput = () => {
    state.search = searchInput.value;
    if (state.view.name !== 'home') {
      state.view = { name: 'home' };
      state.tab = 'shop';
    }
    renderAll();
  };

  setupInstall();
  setupScroll();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((error) => console.error(error));
  }
}

init();
