/**
 * OrderChinaViet Extension — Popup Script v2.8
 */

const OCV_CART_KEY = 'ocv_cart_v2';
let OCV_EXRATE     = 3650; // Dynamic

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['ocv_exrate'], (res) => {
    if (res && res.ocv_exrate) OCV_EXRATE = Number(res.ocv_exrate);
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.ocv_exrate && changes.ocv_exrate.newValue) {
      OCV_EXRATE = Number(changes.ocv_exrate.newValue);
      updateCardPrice();
    }
  });
}

const PLATFORM_MAP = {
  '1688.com':       '1688',
  'taobao.com':     'Taobao',
  'tmall.com':      'Tmall',
  'yangkeduo.com':  'Pinduoduo',
  'pinduoduo.com':  'Pinduoduo',
  'alibaba.com':    'Alibaba',
  'aliexpress.com': 'AliExpress',
};

const SUPPORTED_DOMAINS = Object.keys(PLATFORM_MAP);

// ─── State ────────────────────────────────────────────────────────────────────
let currentProduct = null;
let cart = [];

// ─── Format Helpers ───────────────────────────────────────────────────────────
function fmtCny(n) {
  const val = Number(n || 0);
  return `¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtVnd(n) {
  const val = Number(n || 0);
  return `${val.toLocaleString('vi-VN')} ₫`;
}

function cnyToVnd(cny) { return (Number(cny) || 0) * OCV_EXRATE; }

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = 'toast'; }, 2800);
}

function getPlatformFromUrl(url) {
  for (const [domain, label] of Object.entries(PLATFORM_MAP)) {
    if (url && url.includes(domain)) return label;
  }
  return null;
}

function isSupportedUrl(url) {
  return SUPPORTED_DOMAINS.some(d => url && url.includes(d));
}

// ─── Cart Store ───────────────────────────────────────────────────────────────
function loadCart() {
  return new Promise(resolve => {
    chrome.storage.local.get([OCV_CART_KEY], result => {
      resolve(result[OCV_CART_KEY] || []);
    });
  });
}

function saveCart(c) {
  cart = c;
  chrome.storage.local.set({ [OCV_CART_KEY]: c });
}

function addItem(item) {
  const existing = cart.find(c => c.url === item.url && (c.attributes || '') === (item.attributes || ''));
  if (existing) {
    existing.qty = (existing.qty || 1) + (item.qty || 1);
    if (item.note) existing.note = item.note;
  } else {
    cart.unshift({ ...item, id: Date.now(), addedAt: new Date().toLocaleString('vi-VN') });
  }
  saveCart(cart);
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(cart);
}

function clearCartAll() {
  cart = [];
  saveCart([]);
}

function updateCardPrice() {
  const priceNum = Number(currentProduct?.price) || 0;
  if (!priceNum) return;
  const qtyInput = document.getElementById('qty');
  const qty = Math.max(1, parseInt(qtyInput?.value || '1'));

  const priceCny = document.getElementById('price-cny');
  const priceVnd = document.getElementById('price-vnd');

  const totalCny = priceNum * qty;
  const totalVnd = cnyToVnd(totalCny);

  if (priceCny) priceCny.textContent = fmtCny(totalCny);
  if (priceVnd) {
    priceVnd.textContent = `≈ ${fmtVnd(totalVnd)}`;
    priceVnd.style.display = '';
  }
}

// ─── Render Cart ──────────────────────────────────────────────────────────────
function renderCart() {
  const listEl   = document.getElementById('cart-list');
  const footerEl = document.getElementById('cart-footer');
  const badgeEl  = document.getElementById('tab-cart-badge');

  if (badgeEl) badgeEl.textContent = cart.length;
  if (!listEl) return;

  if (!cart.length) {
    listEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        Giỏ hàng trống.<br>Bấm "Thêm Vào Giỏ" từ trang sản phẩm để bắt đầu!
      </div>`;
    if (footerEl) footerEl.innerHTML = `
      <div class="total-row">
        <div class="total-label">Tổng (0 sản phẩm)</div>
        <div class="total-amounts"><div class="total-cny">¥0</div></div>
      </div>
      <button class="btn-submit" disabled>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Gửi Đơn Mua Hộ Về OrderChinaViet
      </button>`;
    return;
  }

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        ${item.attributes ? `<div style="font-size:10px;font-weight:700;color:#0c3ed0;background:#eff6ff;border:1px solid #bfdbfe;padding:2px 6px;border-radius:5px;margin-bottom:4px;display:inline-block">Phân loại: ${escHtml(item.attributes)}</div>` : ''}
        <div class="cart-item-meta">
          <span class="tag-price">${fmtCny(item.price * item.qty)}</span>
          <span class="tag-qty">×${item.qty}</span>
          <span class="tag-platform">${item.platform}</span>
          <span class="tag-vnd">≈ ${fmtVnd(cnyToVnd(item.price * item.qty))}</span>
        </div>
        ${item.note ? `<div class="cart-item-note">${escHtml(item.note)}</div>` : ''}
      </div>
      <button class="btn-remove" data-remove="${item.id}">×</button>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeItem(parseInt(btn.getAttribute('data-remove')));
      renderCart();
    });
  });

  const totalCny = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const totalVnd = cnyToVnd(totalCny);
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="total-row">
        <div class="total-label">Tổng (${cart.length} sản phẩm)</div>
        <div class="total-amounts">
          <div class="total-cny">${fmtCny(totalCny)}</div>
          <div class="total-vnd">≈ ${fmtVnd(totalVnd)}</div>
        </div>
      </div>
      <button class="btn-submit" id="btn-submit">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Gửi Đơn Mua Hộ (${cart.length}) Về OrderChinaViet
      </button>
      <div style="text-align:center;margin-top:6px">
        <button id="btn-clear-all" style="background:none;border:none;font-size:10px;color:#94a3b8;cursor:pointer;font-weight:600">Xóa toàn bộ giỏ hàng</button>
      </div>`;

    document.getElementById('btn-submit')?.addEventListener('click', handleSubmit);
    document.getElementById('btn-clear-all')?.addEventListener('click', () => {
      if (confirm('Xóa toàn bộ giỏ hàng?')) {
        clearCartAll();
        renderCart();
        showToast('Đã xóa toàn bộ giỏ.', 'error');
      }
    });
  }
}

function handleSubmit() {
  if (!cart.length) return;
  const encodedCart = encodeURIComponent(JSON.stringify(cart));
  const url = `http://localhost:3000/vi/orders?source=extension&cart=${encodedCart}`;
  chrome.tabs.create({ url });
  showToast(`Đã gửi ${cart.length} sản phẩm!`, 'success');
  setTimeout(() => {
    clearCartAll();
    renderCart();
  }, 1500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  cart = await loadCart();
  renderCart();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  const platform = getPlatformFromUrl(url);
  const isSupported = isSupportedUrl(url);

  const dotEl  = document.getElementById('platform-dot');
  const textEl = document.getElementById('platform-text');

  if (isSupported && platform) {
    dotEl?.classList.remove('inactive');
    if (textEl) textEl.textContent = `Nền tảng: ${platform} — Đang hoạt động`;
  } else {
    dotEl?.classList.add('inactive');
    if (textEl) textEl.textContent = 'Trang này không được hỗ trợ tự động';
  }

  const loadingEl = document.getElementById('add-loading');
  const contentEl = document.getElementById('add-content');

  if (isSupported && tab?.id) {
    try {
      const product = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PRODUCT_INFO' });
      currentProduct = product;

      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';

      const nameEl   = document.getElementById('product-name');
      const addBtn   = document.getElementById('btn-add');

      if (product?.name) {
        if (nameEl) { nameEl.textContent = product.name; nameEl.classList.remove('empty'); }
        updateCardPrice();
        if (addBtn) addBtn.disabled = false;
      } else {
        if (nameEl) { nameEl.textContent = 'Không tìm thấy thông tin sản phẩm trên trang này.'; nameEl.classList.add('empty'); }
      }
    } catch (e) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';
      const nameEl = document.getElementById('product-name');
      if (nameEl) { nameEl.textContent = 'Extension cần được reload — vào chrome://extensions và Reload extension.'; nameEl.classList.add('empty'); }
    }
  } else {
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
    const nameEl = document.getElementById('product-name');
    if (nameEl) { nameEl.textContent = 'Hãy vào 1688, Taobao, Tmall, Pinduoduo, Alibaba, AliExpress để tự động nhận diện.'; nameEl.classList.add('empty'); }
  }

  // Qty Controls
  document.getElementById('qty-dec')?.addEventListener('click', () => {
    const q = document.getElementById('qty');
    if (q) {
      q.value = Math.max(1, parseInt(q.value || '1') - 1);
      updateCardPrice();
    }
  });

  document.getElementById('qty-inc')?.addEventListener('click', () => {
    const q = document.getElementById('qty');
    if (q) {
      q.value = parseInt(q.value || '1') + 1;
      updateCardPrice();
    }
  });

  document.getElementById('qty')?.addEventListener('input', () => updateCardPrice());

  // Add to Cart
  document.getElementById('btn-add')?.addEventListener('click', () => {
    if (!currentProduct?.name) return;
    const qty  = parseInt(document.getElementById('qty')?.value || '1');
    const note = document.getElementById('note')?.value?.trim() || '';
    addItem({ ...currentProduct, qty, note });
    renderCart();
    showToast(`Đã thêm ×${qty} sản phẩm vào giỏ!`, 'success');
    const noteEl = document.getElementById('note');
    if (noteEl) noteEl.value = '';
    const qtyEl = document.getElementById('qty');
    if (qtyEl) qtyEl.value = '1';
    updateCardPrice();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
  });

  // Real-time Storage Sync Listener
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[OCV_CART_KEY]) {
        cart = changes[OCV_CART_KEY].newValue || [];
        renderCart();
      }
    });
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
}

document.addEventListener('DOMContentLoaded', init);
