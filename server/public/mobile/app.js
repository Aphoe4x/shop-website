/**
 * Shopping mobile PWA
 * Talks to the same Express API as the website so accounts and carts stay in sync.
 */

const API = `${window.location.origin}/api`;
const USER_KEY = 'mobile_user';
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#eceff1"/><text x="100" y="110" font-size="72" text-anchor="middle" fill="#b0bec5">S</text></svg>'
  );

const state = {
  user: loadUser(),
  products: [],
  cart: [],
  tab: 'shop',
  loading: true,
};

let stream = null;

/** Read the saved user from localStorage. */
function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Format a number as Nigerian Naira. */
const naira = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

/** Show a short toast message. */
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

/** Handle the redirect back from Google OAuth. */
function captureAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const email = params.get('email');
  const name = params.get('name');
  if (userId && email) {
    state.user = { id: userId, email, name };
    localStorage.setItem(USER_KEY, JSON.stringify(state.user));
    window.history.replaceState({}, '', window.location.pathname);
  }
}

/** Fetch JSON with basic error handling. */
async function api(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/** Load products for the shop tab. */
async function loadProducts() {
  try {
    state.products = await api('/products');
  } catch (error) {
    console.error(error);
    toast('Could not load products');
  }
  state.loading = false;
  render();
}

/** Convert API cart rows into local cart items. */
function mapServerItems(items) {
  return (items || [])
    .filter((row) => row.product)
    .map((row) => ({ ...row.product, quantity: row.quantity }));
}

/** Replace the cart on the server so the website updates too. */
async function syncCart(items) {
  if (!state.user) return;
  try {
    await api(`/cart/${state.user.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      }),
    });
  } catch (error) {
    console.error(error);
    toast('Cart sync failed');
  }
}

/** Set the cart locally and push it to the server. */
function updateCart(next) {
  state.cart = next;
  renderCartBadge();
  render();
  syncCart(next);
}

/** Load the cart once, then keep it live via Server-Sent Events. */
function startCartSync() {
  if (!state.user) return;
  if (stream) stream.close();

  api(`/cart/${state.user.id}`)
    .then((items) => {
      state.cart = mapServerItems(items);
      renderCartBadge();
      render();
    })
    .catch((error) => console.error(error));

  stream = new EventSource(`${API}/cart/${state.user.id}/stream`);
  stream.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'cart') {
        state.cart = mapServerItems(data.items);
        renderCartBadge();
        render();
      }
    } catch (error) {
      console.error(error);
    }
  };
}

/** Start Google login, returning to the mobile app afterwards. */
function login() {
  window.location.href = `${API}/auth/google?redirect=${encodeURIComponent('/mobile/')}`;
}

/** Sign out and clear local state. */
function logout() {
  state.user = null;
  state.cart = [];
  localStorage.removeItem(USER_KEY);
  if (stream) {
    stream.close();
    stream = null;
  }
  renderCartBadge();
  render();
}

function addToCart(product) {
  if (!state.user) {
    toast('Sign in to sync your cart');
    login();
    return;
  }
  const existing = state.cart.find((item) => item.id === product.id);
  const next = existing
    ? state.cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      )
    : [...state.cart, { ...product, quantity: 1 }];
  updateCart(next);
  toast('Added to cart');
}

function changeQty(productId, delta) {
  const next = state.cart
    .map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + delta } : item
    )
    .filter((item) => item.quantity > 0);
  updateCart(next);
}

function removeItem(productId) {
  updateCart(state.cart.filter((item) => item.id !== productId));
}

function renderCartBadge() {
  const total = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-badge');
  badge.textContent = total;
  badge.hidden = total === 0;
}

function renderHeader() {
  const btn = document.getElementById('account-btn');
  if (state.user) {
    btn.textContent = state.user.name ? state.user.name.split(' ')[0] : 'Account';
    btn.onclick = () => {
      if (confirm('Sign out?')) logout();
    };
  } else {
    btn.textContent = 'Sign in';
    btn.onclick = login;
  }
}

function renderShop() {
  if (state.loading) {
    return '<p class="empty">Loading products…</p>';
  }
  const cards = state.products
    .map(
      (p) => `
      <div class="product-card">
        <img class="product-image" src="${p.image_url || PLACEHOLDER}" alt="${p.name}" loading="lazy" />
        <div class="product-body">
          <span class="product-category">${p.category || ''}</span>
          <span class="product-name">${p.name}</span>
          <span class="product-price">${naira(p.price)}</span>
          <button class="add-btn" data-add="${p.id}" type="button">Add to cart</button>
        </div>
      </div>`
    )
    .join('');

  return `
    <section class="hero">
      <h2>Quality Goods, Delivered.</h2>
      <p>Shop the best of Nigerian fashion, food, electronics and more.</p>
    </section>
    <p class="section-title">Featured products</p>
    <div class="product-list">${cards || '<p class="empty">No products found.</p>'}</div>
  `;
}

function renderCart() {
  if (!state.user) {
    return `
      <div class="signed-out">
        <h3>Sign in to sync your cart</h3>
        <p>Use the same Google account as the website.</p>
        <button class="google-btn" id="login-inline" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>`;
  }

  if (state.cart.length === 0) {
    return `
      <div class="empty">
        <h3>Your cart is empty</h3>
        <p>Add products to see them here — and on the website.</p>
      </div>`;
  }

  const items = state.cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image_url || PLACEHOLDER}" alt="${item.name}" />
        <div class="cart-info">
          <h4>${item.name}</h4>
          <div class="cart-price">${naira(item.price * item.quantity)}</div>
          <button class="remove-btn" data-remove="${item.id}" type="button">Remove</button>
        </div>
        <div class="qty">
          <button data-dec="${item.id}" type="button">−</button>
          <span>${item.quantity}</span>
          <button data-inc="${item.id}" type="button">+</button>
        </div>
      </div>`
    )
    .join('');

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return `
    <p class="section-title">Your cart</p>
    ${items}
    <div class="cart-summary">
      <div class="cart-row"><span>Total</span><span>${naira(total)}</span></div>
      <button class="checkout-btn" type="button" id="checkout-btn">Checkout on website</button>
      <p class="note">Checkout is completed on the main website.</p>
    </div>`;
}

function render() {
  renderHeader();
  const view = document.getElementById('view');
  view.innerHTML = state.tab === 'shop' ? renderShop() : renderCart();

  const inlineLogin = document.getElementById('login-inline');
  if (inlineLogin) inlineLogin.onclick = login;

  view.querySelectorAll('[data-add]').forEach((btn) => {
    btn.onclick = () => {
      const product = state.products.find((p) => p.id === btn.dataset.add);
      if (product) addToCart(product);
    };
  });
  view.querySelectorAll('[data-inc]').forEach((btn) => {
    btn.onclick = () => changeQty(btn.dataset.inc, 1);
  });
  view.querySelectorAll('[data-dec]').forEach((btn) => {
    btn.onclick = () => changeQty(btn.dataset.dec, -1);
  });
  view.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.onclick = () => removeItem(btn.dataset.remove);
  });

  document.getElementById('tab-shop').classList.toggle('is-active', state.tab === 'shop');
  document.getElementById('tab-cart').classList.toggle('is-active', state.tab === 'cart');
}

function switchTab(tab) {
  state.tab = tab;
  render();
}

function init() {
  captureAuthRedirect();
  renderCartBadge();
  render();
  renderHeader();
  loadProducts();
  startCartSync();

  document.getElementById('tab-shop').onclick = () => switchTab('shop');
  document.getElementById('tab-cart').onclick = () => switchTab('cart');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((error) => console.error(error));
  }
}

init();
