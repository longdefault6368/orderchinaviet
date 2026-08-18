/**
 * OrderChinaViet Extension — Content Script v2.8
 * Encapsulated in Shadow DOM for 100% immune styling.
 * Inter / Tahoma Sans-serif Font + Clean Product Scraper & Cart Management.
 */

(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────────
  const OCV_HOST_ID = 'ocv-panel-root';
  const OCV_CART_KEY = 'ocv_cart_v2';
  const OCV_OPEN_KEY = 'ocv_panel_open';
  let OCV_EXRATE     = 3650; // CNY → VND (Dynamic)

  // Sync exchange rate from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['ocv_exrate'], (res) => {
      if (res && res.ocv_exrate) OCV_EXRATE = Number(res.ocv_exrate);
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.ocv_exrate && changes.ocv_exrate.newValue) {
        OCV_EXRATE = Number(changes.ocv_exrate.newValue);
        updateProductUI();
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

  let hostEl = null;
  let shadowRoot = null;
  let activeProduct = null;

  function s$(id) { return shadowRoot ? shadowRoot.getElementById(id) : null; }
  function s$$(sel) { return shadowRoot ? shadowRoot.querySelectorAll(sel) : []; }

  function getPlatform() {
    const host = window.location.hostname;
    for (const [domain, label] of Object.entries(PLATFORM_MAP)) {
      if (host.includes(domain)) return label;
    }
    return 'Unknown';
  }

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
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ─── Price Parser ─────────────────────────────────────────────────────────────
  function parsePrice(text) {
    if (!text) return 0;
    const cleaned = text.replace(/¥|￥|元|\s+/g, '');
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (match && parseFloat(match[1]) > 0) {
      return parseFloat(match[1]);
    }
    return 0;
  }

  // ─── Scrapers ─────────────────────────────────────────────────────────────────
  function scrape1688Title() {
    const selectors = [
      '.title-content h1',
      '.title-content',
      '[class*="title-content"] h1',
      '[class*="title-content"]',
      '.d-title',
      'h1.title-text',
      '.title-text',
      '.offer-title',
      '[class*="title-text"]',
      '[class*="titleText"]',
      '[class*="offer-title"]',
      '[class*="title-main"]',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest(`#${OCV_HOST_ID}`)) {
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt && txt.length > 3) return txt;
      }
    }
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle && metaTitle.content) return metaTitle.content.trim();
    return document.title.replace(/[-_|–—].*$/, '').trim();
  }

  function scrape1688Price() {
    // 1. Check .price-info containers first
    const priceInfoEls = document.querySelectorAll('.price-info, [class*="price-info"], [class*="priceInfo"]');
    for (const el of priceInfoEls) {
      if (el.closest(`#${OCV_HOST_ID}`)) continue;
      const fullTxt = (el.innerText || el.textContent || '').trim();
      const p = parsePrice(fullTxt);
      if (p > 0) return p;
    }

    // 2. Secondary price container selectors
    const priceSelectors = [
      '.price-text',
      '.price-num',
      '.price-value',
      '.mod-detail-price',
      '[class*="price-text"]',
      '[class*="priceText"]',
      '[class*="price-num"]',
      '[class*="priceNum"]',
      '[class*="price-value"]',
      '[class*="priceValue"]',
      '[class*="priceRange"]',
      '[class*="price-discount"]',
      '[class*="discountPrice"]',
      '[class*="unit-price"]',
      '[class*="offer-price"]',
      '.price-original-sku',
      '.value.discount-price',
      '[class*="sku-price"]'
    ];

    for (const sel of priceSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if (el.closest(`#${OCV_HOST_ID}`)) continue;
        const txt = el.innerText || el.textContent || '';
        const p = parsePrice(txt);
        if (p > 0) return p;
      }
    }

    // 3. Search elements containing "¥" or "￥"
    const detailBox = document.querySelector('[class*="detail"], [class*="offer"], [class*="sku"], main, body');
    if (detailBox) {
      const priceNodes = Array.from(detailBox.querySelectorAll('span, div, em, b, strong')).filter(el => {
        if (el.closest(`#${OCV_HOST_ID}`)) return false;
        const t = (el.innerText || '').trim();
        return (t.startsWith('¥') || t.startsWith('￥') || t.includes('元')) && /[\d\.]+/.test(t) && t.length < 25;
      });
      for (const node of priceNodes) {
        const p = parsePrice(node.innerText);
        if (p > 0) return p;
      }
    }

    // 4. Script fallback
    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent || '';
        if (text.includes('price') || text.includes('skuMap') || text.includes('refPrice')) {
          const match = text.match(/"price"\s*:\s*"([\d\.]+)"/) ||
                        text.match(/"price"\s*:\s*([\d\.]+)/) ||
                        text.match(/"refPrice"\s*:\s*"([\d\.]+)"/) ||
                        text.match(/"displayPrice"\s*:\s*"([\d\.]+)"/);
          if (match && parseFloat(match[1]) > 0) {
            return parseFloat(match[1]);
          }
        }
      }
    } catch {}

    return 0;
  }

  function scrape1688SKU() {
    const attrs = [];
    const addAttr = (val) => {
      if (!val) return;
      const clean = val.replace(/\s+/g, ' ').trim();
      if (clean && clean.length < 60 && !attrs.includes(clean)) attrs.push(clean);
    };

    const skuSelectors = [
      '.prop-item.selected',
      '.sku-item.selected',
      '.sku-item-current',
      '[class*="sku-item"][class*="selected"]',
      '[class*="sku-item"][class*="active"]',
      '[class*="prop-item"][class*="selected"]',
      '[class*="prop-item"][class*="active"]',
      '[class*="skuItem"][class*="selected"]',
      '[class*="select-spec"] [class*="text"]',
      '[class*="sku-spec-value"][class*="selected"]',
      '[class*="sku-attr-item"][class*="selected"]',
      '[class*="sku-attr-item"][class*="active"]',
      '[class*="sku-name"][class*="selected"]',
      '.sku-prop .selected',
      '.sku-prop .active'
    ];

    for (const sel of skuSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (el.closest(`#${OCV_HOST_ID}`)) return;
        addAttr(el.innerText || el.textContent);
      });
    }

    document.querySelectorAll('input[class*="amount"], input[class*="quantity"], input[class*="count"], input[class*="num"]').forEach(input => {
      if (input.closest(`#${OCV_HOST_ID}`)) return;
      const val = parseInt(input.value);
      if (val > 0) {
        const row = input.closest('tr, [class*="sku-item"], [class*="spec-row"], [class*="sku-row"], [class*="item-row"]');
        if (row) {
          const labelEl = row.querySelector('[class*="name"], [class*="title"], [class*="spec"], [class*="color"], [class*="size"], td:first-child');
          if (labelEl) {
            const labelText = (labelEl.innerText || labelEl.textContent).replace(/\s+/g, ' ').trim();
            if (labelText) addAttr(`${labelText} (x${val})`);
          }
        }
      }
    });

    const selectedBar = document.querySelector('[class*="selected-sku"], [class*="select-spec"], [class*="sku-info-selected"]');
    if (selectedBar && !selectedBar.closest(`#${OCV_HOST_ID}`)) {
      const barText = (selectedBar.innerText || selectedBar.textContent).replace(/^(已选|已選擇|Selected)\s*[:：]?\s*/i, '').trim();
      if (barText && attrs.length === 0) addAttr(barText);
    }

    return attrs.join(' | ');
  }

  function scrapeProduct() {
    const platform = getPlatform();
    let name = '';
    let price = 0;

    if (platform === '1688') {
      name = scrape1688Title();
      price = scrape1688Price();
    } else if (platform === 'Taobao' || platform === 'Tmall') {
      name = qs('.tb-main-title, h1, .itemInfo-wrap h1, .page-title-info, [class*="mainTitle"], [class*="ItemHeader--title"]')?.innerText?.trim() || '';
      price = parsePrice(qs('.price-info, .tb-rmb-num, .price em, .itemInfo-wrap .tb-rmb-num, .J_Price, [class*="Price--priceText"], [class*="priceText"]')?.innerText);
    } else if (platform === 'Pinduoduo') {
      name = qs('._35NRpx5, .GF15p_PD, [class*="goods-name"], h1')?.innerText?.trim() || '';
      price = parsePrice(qs('._1NMapMa, [class*="price-current"], [class*="origin-price"]')?.innerText);
    } else if (platform === 'Alibaba') {
      name = qs('.product-name, h1.product-title, [class*="product-title"]')?.innerText?.trim() || '';
      price = parsePrice(qs('.price-main, .price .value, [class*="price-item"]')?.innerText);
    } else if (platform === 'AliExpress') {
      name = qs('h1[class*="title"], .product-title-text')?.innerText?.trim() || '';
      price = parsePrice(qs('[class*="uniform-banner-box-price"], .product-price-value, [class*="price--current"]')?.innerText);
    }

    if (!name) name = document.title.replace(/[-_|–—].*$/, '').trim().slice(0, 120);
    const attributes = scrapeSKUAttributes();

    return { name, price, attributes, platform, url: window.location.href };
  }

  function scrapeSKUAttributes() {
    const platform = getPlatform();
    if (platform === '1688') return scrape1688SKU();

    const attrs = [];
    const addAttr = (val) => {
      if (!val) return;
      const clean = val.replace(/\s+/g, ' ').trim();
      if (clean && clean.length < 60 && !attrs.includes(clean)) attrs.push(clean);
    };

    if (platform === 'Taobao' || platform === 'Tmall') {
      document.querySelectorAll('.tb-selected, li.selected, [class*="valueItem"][class*="selected"], [class*="skuItem"][class*="selected"]').forEach(el => {
        if (!el.closest(`#${OCV_HOST_ID}`) && !el.querySelector('.selected')) addAttr(el.innerText);
      });
    } else if (platform === 'Pinduoduo') {
      document.querySelectorAll('[class*="sku-item"][class*="selected"], [class*="spec-item-active"], [class*="sku-btn-active"]').forEach(el => {
        if (!el.closest(`#${OCV_HOST_ID}`)) addAttr(el.innerText);
      });
    } else if (platform === 'Alibaba' || platform === 'AliExpress') {
      document.querySelectorAll('.sku-attr-val.selected, .sku-item.selected, [class*="sku-val"][class*="selected"]').forEach(el => {
        if (!el.closest(`#${OCV_HOST_ID}`)) addAttr(el.innerText);
      });
    }

    if (attrs.length === 0) {
      document.querySelectorAll('.selected, .active').forEach(el => {
        if (el.closest(`#${OCV_HOST_ID}`)) return;
        const parent = el.closest('[class*="sku"], [class*="prop"], [class*="spec"], [class*="attr"]');
        if (parent && el.children.length === 0) addAttr(el.innerText);
      });
    }

    return attrs.join(' | ');
  }

  function qs(selector) {
    const parts = selector.split(',').map(s => s.trim());
    for (const sel of parts) {
      try {
        const el = document.querySelector(sel);
        if (el?.innerText?.trim() && !el.closest(`#${OCV_HOST_ID}`)) return el;
      } catch {}
    }
    return null;
  }

  // ─── Cart Store ───────────────────────────────────────────────────────────────
  let currentCartMemory = [];

  function loadCart() {
    try {
      const localData = JSON.parse(localStorage.getItem(OCV_CART_KEY) || '[]');
      if (localData && localData.length > 0) return localData;
    } catch {}
    return currentCartMemory;
  }

  function saveCart(cart) {
    currentCartMemory = cart;
    try { localStorage.setItem(OCV_CART_KEY, JSON.stringify(cart)); } catch {}
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [OCV_CART_KEY]: cart });
    }
  }

  // Load initially from chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([OCV_CART_KEY], (res) => {
      if (res && res[OCV_CART_KEY]) {
        currentCartMemory = res[OCV_CART_KEY];
        try { localStorage.setItem(OCV_CART_KEY, JSON.stringify(res[OCV_CART_KEY])); } catch {}
        updateCartUI();
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[OCV_CART_KEY]) {
        currentCartMemory = changes[OCV_CART_KEY].newValue || [];
        try { localStorage.setItem(OCV_CART_KEY, JSON.stringify(currentCartMemory)); } catch {}
        updateCartUI();
      }
    });
  }

  function addToCart(item) {
    const cart = loadCart();
    const existing = cart.find(c => c.url === item.url && (c.attributes || '') === (item.attributes || ''));
    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
      if (item.note) existing.note = item.note;
    } else {
      cart.unshift({ ...item, id: Date.now(), addedAt: new Date().toLocaleString('vi-VN') });
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    const cart = loadCart().filter(c => c.id !== id);
    saveCart(cart);
    return cart;
  }

  function clearCart() { saveCart([]); }

  const logoUrl = chrome.runtime.getURL('logo.png');

  // ─── Build Panel HTML ─────────────────────────────────────────────────────────
  function buildPanel(product) {
    const platform = getPlatform();
    const cartHtml = renderCart(loadCart());

    const html = `
    <div class="ocv-panel" id="ocv-panel">
      <!-- Toggle Tab -->
      <div class="ocv-toggle-tab" id="ocv-tab">
        <img src="${logoUrl}" alt="OCV" width="22" height="22" style="width:22px;height:22px;object-fit:contain" />
        <div class="ocv-tab-badge" id="ocv-tab-badge">${loadCart().length}</div>
      </div>

      <!-- Header (Draggable) -->
      <div class="ocv-header" id="ocv-header" title="Giữ chuột và kéo để di chuyển">
        <div class="ocv-header-brand">
          <img src="${logoUrl}" alt="OrderChinaViet" width="110" height="24" style="width:110px;height:24px;object-fit:contain" />
          <div class="ocv-header-title">
            <span>OrderChinaViet</span>
            <span>MUA HỘ PLATFORM</span>
          </div>
        </div>
        <div class="ocv-header-actions">
          <button class="ocv-btn-icon" id="ocv-open-site" title="Mở trang OrderChinaViet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="ocv-btn-icon" id="ocv-minimize" title="Thu nhỏ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 01-2 2H3"/><path d="M21 8h-3a2 2 0 01-2-2V3"/><path d="M3 16h3a2 2 0 012 2v3"/><path d="M16 21v-3a2 2 0 012-2h3"/></svg>
          </button>
          <button class="ocv-btn-icon" id="ocv-close" title="Đóng panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Platform Bar -->
      <div class="ocv-platform-bar">
        <div class="ocv-platform-badge">
          <div class="ocv-platform-dot"></div>
          Nền tảng: ${platform}
        </div>
        <div class="ocv-exrate">1 ¥ = ${OCV_EXRATE.toLocaleString('vi-VN')} ₫</div>
      </div>

      <!-- Auto-detected Product -->
      ${product.name ? `
      <div class="ocv-product-card">
        <div class="ocv-label">Sản Phẩm Đang Xem</div>
        <div class="ocv-product-name" id="ocv-pname">${escHtml(product.name)}</div>

        <div class="ocv-attr-box" id="ocv-pattr" style="${product.attributes ? '' : 'display:none'}">
          <span class="ocv-attr-tag">Phân loại đang chọn:</span>
          <span class="ocv-attr-val" id="ocv-pattr-val">${escHtml(product.attributes || '')}</span>
        </div>

        <div class="ocv-price-row">
          <div class="ocv-price-cny" id="ocv-price-cny">${product.price ? fmtCny(product.price) : 'Chưa chọn SKU'}</div>
          ${product.price ? `<div class="ocv-price-vnd" id="ocv-price-vnd">≈ ${fmtVnd(cnyToVnd(product.price))}</div>` : ''}
        </div>
      </div>

      <!-- Add Controls -->
      <div class="ocv-add-controls">
        <div class="ocv-qty-box">
          <button class="ocv-qty-btn" id="ocv-qty-dec">−</button>
          <input class="ocv-qty-input" type="number" id="ocv-qty" value="1" min="1" max="9999" />
          <button class="ocv-qty-btn" id="ocv-qty-inc">+</button>
        </div>
        <button class="ocv-btn-add" id="ocv-btn-add">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm Vào Giỏ
        </button>
      </div>

      <!-- Note -->
      <div class="ocv-note-row">
        <textarea class="ocv-note-input" id="ocv-note" rows="2" placeholder="Ghi chú thêm: màu sắc, size, lưu ý đặc biệt..."></textarea>
      </div>
      ` : `
      <div style="padding:10px 12px 4px;flex-shrink:0">
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;font-size:11px;color:#92400e;font-weight:600;line-height:1.5">
          Không tự động nhận diện được sản phẩm trên trang này. Hãy chọn phân loại hoặc reload lại trang.
        </div>
      </div>
      `}

      <!-- Cart -->
      <div class="ocv-cart-header">
        <div class="ocv-cart-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>
          Giỏ Hàng Mua Hộ
          <span class="ocv-cart-count" id="ocv-cart-count">${loadCart().length}</span>
        </div>
        <button class="ocv-btn-clear" id="ocv-clear-cart">Xóa tất cả</button>
      </div>

      <div class="ocv-cart-list" id="ocv-cart-list">
        ${cartHtml}
      </div>

      <!-- Footer -->
      <div class="ocv-cart-footer" id="ocv-cart-footer">
        ${renderFooter(loadCart())}
      </div>
    </div>
    `;

    return html;
  }

  function renderCart(cart) {
    if (!cart.length) {
      return `<div class="ocv-cart-empty"><span>🛒</span>Chưa có sản phẩm nào.<br>Bấm "Thêm Vào Giỏ" để bắt đầu!</div>`;
    }
    return cart.map(item => `
      <div class="ocv-cart-item" data-id="${item.id}">
        <div class="ocv-cart-item-info">
          <div class="ocv-cart-item-name">${escHtml(item.name)}</div>
          ${item.attributes ? `<div class="ocv-cart-item-attr">Phân loại: ${escHtml(item.attributes)}</div>` : ''}
          <div class="ocv-cart-item-meta">
            <span class="ocv-cart-item-price">${fmtCny(item.price * item.qty)}</span>
            <span class="ocv-cart-item-qty">×${item.qty}</span>
            <span class="ocv-cart-item-platform">${item.platform}</span>
            <span class="ocv-cart-item-vnd">≈ ${fmtVnd(cnyToVnd(item.price * item.qty))}</span>
          </div>
          ${item.note ? `<div class="ocv-cart-item-note">${escHtml(item.note)}</div>` : ''}
        </div>
        <button class="ocv-cart-item-remove" data-remove="${item.id}">×</button>
      </div>
    `).join('');
  }

  function renderFooter(cart) {
    const totalCny = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const totalVnd = cnyToVnd(totalCny);
    const disabled = cart.length === 0 ? 'disabled' : '';
    return `
      <div class="ocv-total-row">
        <div class="ocv-total-label">Tổng (${cart.length} sản phẩm)</div>
        <div class="ocv-total-value">
          <div class="ocv-total-cny">${fmtCny(totalCny)}</div>
          <div class="ocv-total-vnd">≈ ${fmtVnd(totalVnd)}</div>
        </div>
      </div>
      <button class="ocv-btn-submit" id="ocv-submit" ${disabled}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        Gửi Đơn Mua Hộ Về OrderChinaViet
      </button>
    `;
  }

  function showToast(msg, type = 'success') {
    const existing = s$('ocv-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'ocv-toast';
    t.className = `ocv-toast ocv-toast-${type}`;
    t.innerHTML = type === 'success' ? `<span>✓</span>${msg}` : `<span>✗</span>${msg}`;
    shadowRoot.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function updateCartUI() {
    const cart = loadCart();
    const list = s$('ocv-cart-list');
    const footer = s$('ocv-cart-footer');
    const count = s$('ocv-cart-count');
    const badge = s$('ocv-tab-badge');
    if (list) list.innerHTML = renderCart(cart);
    if (footer) footer.innerHTML = renderFooter(cart);
    if (count) count.textContent = cart.length;
    if (badge) badge.textContent = cart.length;

    s$$('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-remove'));
        removeFromCart(id);
        updateCartUI();
      });
    });

    const submitBtn = s$('ocv-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }
  }

  function updateProductUI() {
    if (!activeProduct) activeProduct = scrapeProduct() || {};

    const qtyInput = s$('ocv-qty');
    const qty = Math.max(1, parseInt(qtyInput?.value || '1'));

    const nameEl   = s$('ocv-pname');
    const priceCny = s$('ocv-price-cny');
    const priceVnd = s$('ocv-price-vnd');
    const attrBox  = s$('ocv-pattr');
    const attrVal  = s$('ocv-pattr-val');

    if (nameEl && activeProduct && activeProduct.name) {
      nameEl.textContent = activeProduct.name;
    }

    const priceNum = Number(activeProduct?.price) || 0;
    const totalPriceCny = priceNum * qty;
    const totalPriceVnd = cnyToVnd(totalPriceCny);

    if (priceCny) priceCny.textContent = activeProduct.price ? fmtCny(totalPriceCny) : 'Chưa chọn SKU';
    if (priceVnd) {
      if (activeProduct.price) {
        priceVnd.textContent = `≈ ${fmtVnd(totalPriceVnd)}`;
        priceVnd.style.display = '';
      } else {
        priceVnd.style.display = 'none';
      }
    }
    if (attrBox && attrVal) {
      if (activeProduct.attributes) {
        attrVal.textContent = activeProduct.attributes;
        attrBox.style.display = '';
      } else {
        attrBox.style.display = 'none';
      }
    }
  }

  async function getDynamicAppUrl() {
    try {
      if (location.hostname.includes('localhost')) return 'http://localhost:3000';
    } catch (e) {}
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'GET_APP_URL' }, (res) => resolve(res));
      });
      if (response && response.url) return response.url;
    } catch (e) {}
    return 'https://orderchinaviet.com';
  }

  async function handleSubmit() {
    const cart = loadCart();
    if (!cart.length) return;

    const baseUrl = await getDynamicAppUrl();
    const encodedCart = encodeURIComponent(JSON.stringify(cart));
    const targetUrl = `${baseUrl}/vi/orders?source=extension&cart=${encodedCart}`;

    chrome.runtime.sendMessage({ action: 'OPEN_TAB', url: targetUrl });
    showToast(`Đã gửi ${cart.length} sản phẩm về OrderChinaViet!`, 'success');

    setTimeout(() => {
      clearCart();
      updateCartUI();
    }, 1500);
  }

  // ─── Host Dragging ────────────────────────────────────────────────────────────
  function setupHostDraggable(headerEl) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;

    headerEl.style.cursor = 'grab';

    headerEl.addEventListener('mousedown', (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      if (path.some(el => el.tagName === 'BUTTON' || (el.classList && el.classList.contains('ocv-btn-icon')))) {
        return;
      }

      isDragging = true;
      headerEl.style.cursor = 'grabbing';
      startX = e.clientX;
      startY = e.clientY;

      const rect = hostEl.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      hostEl.style.right = 'auto';
      hostEl.style.left = startLeft + 'px';
      hostEl.style.top = startTop + 'px';

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      const maxLeft = window.innerWidth - hostEl.offsetWidth;
      const maxTop = window.innerHeight - 80;
      newLeft = Math.max(0, Math.min(newLeft, maxLeft));
      newTop = Math.max(0, Math.min(newTop, maxTop));

      hostEl.style.left = newLeft + 'px';
      hostEl.style.top = newTop + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        headerEl.style.cursor = 'grab';
      }
    });
  }

  // ─── Bind Events ──────────────────────────────────────────────────────────────
  function bindEvents() {
    const panel      = s$('ocv-panel');
    const tab        = s$('ocv-tab');
    const header     = s$('ocv-header');
    const closeBtn   = s$('ocv-close');
    const minBtn     = s$('ocv-minimize');
    const addBtn     = s$('ocv-btn-add');
    const decBtn     = s$('ocv-qty-dec');
    const incBtn     = s$('ocv-qty-inc');
    const qtyInput   = s$('ocv-qty');
    const noteEl     = s$('ocv-note');
    const clearBtn   = s$('ocv-clear-cart');
    const openSite   = s$('ocv-open-site');

    if (header) setupHostDraggable(header);

    tab?.addEventListener('click', () => {
      panel?.classList.toggle('ocv-minimized');
      sessionStorage.setItem(OCV_OPEN_KEY, panel?.classList.contains('ocv-minimized') ? 'minimized' : 'open');
    });

    closeBtn?.addEventListener('click', () => {
      panel?.classList.add('ocv-minimized');
      sessionStorage.setItem(OCV_OPEN_KEY, 'minimized');
    });

    minBtn?.addEventListener('click', () => {
      panel?.classList.toggle('ocv-minimized');
      sessionStorage.setItem(OCV_OPEN_KEY, panel?.classList.contains('ocv-minimized') ? 'minimized' : 'open');
    });

    openSite?.addEventListener('click', async () => {
      const baseUrl = await getDynamicAppUrl();
      chrome.runtime.sendMessage({ action: 'OPEN_TAB', url: `${baseUrl}/vi/orders` });
    });

    decBtn?.addEventListener('click', () => {
      if (qtyInput) {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1') - 1);
        updateProductUI();
      }
    });
    incBtn?.addEventListener('click', () => {
      if (qtyInput) {
        qtyInput.value = parseInt(qtyInput.value || '1') + 1;
        updateProductUI();
      }
    });
    qtyInput?.addEventListener('input', () => updateProductUI());

    addBtn?.addEventListener('click', () => {
      const prod = activeProduct || scrapeProduct();
      if (!prod.name) return;
      const qty = parseInt(qtyInput?.value || '1');
      const note = noteEl?.value?.trim() || '';
      addToCart({ ...prod, qty, note });
      updateCartUI();
      const attrMsg = prod.attributes ? ` (${prod.attributes})` : '';
      showToast(`Đã thêm ×${qty} sản phẩm${attrMsg} vào giỏ!`, 'success');
      if (noteEl) noteEl.value = '';
      if (qtyInput) qtyInput.value = '1';
      updateProductUI();
    });

    clearBtn?.addEventListener('click', () => {
      if (confirm('Xóa toàn bộ giỏ hàng?')) {
        clearCart();
        updateCartUI();
        showToast('Đã xóa toàn bộ giỏ hàng.', 'error');
      }
    });

    updateCartUI();
    s$('ocv-submit')?.addEventListener('click', handleSubmit);

    // Multi-tab Cart Sync Listener
    window.addEventListener('storage', (e) => {
      if (e.key === OCV_CART_KEY) {
        updateCartUI();
      }
    });

    document.body.addEventListener('click', (e) => {
      if (e.target.closest(`#${OCV_HOST_ID}`)) return;
      setTimeout(() => { activeProduct = scrapeProduct(); updateProductUI(); }, 200);
      setTimeout(() => { activeProduct = scrapeProduct(); updateProductUI(); }, 600);
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById(OCV_HOST_ID)) return;

    activeProduct = scrapeProduct();

    hostEl = document.createElement('div');
    hostEl.id = OCV_HOST_ID;
    hostEl.style.all = 'initial';
    hostEl.style.position = 'fixed';
    hostEl.style.top = '80px';
    hostEl.style.right = '0';
    hostEl.style.zIndex = '2147483647';

    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('panel.css');
    shadowRoot.appendChild(link);

    const container = document.createElement('div');
    container.id = 'ocv-container';
    container.innerHTML = buildPanel(activeProduct);
    shadowRoot.appendChild(container);

    document.body.appendChild(hostEl);

    const savedState = sessionStorage.getItem(OCV_OPEN_KEY);
    const panel = s$('ocv-panel');
    if (savedState === 'minimized') {
      panel?.classList.add('ocv-minimized');
    }

    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
    setTimeout(() => { activeProduct = scrapeProduct(); updateProductUI(); }, 2500);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PRODUCT_INFO') {
      const product = scrapeProduct();
      sendResponse(product);
    }
    if (request.action === 'GET_CART') {
      sendResponse(loadCart());
    }
    if (request.action === 'ADD_FROM_POPUP') {
      addToCart(request.item);
      updateCartUI();
      sendResponse({ success: true });
    }
    return true;
  });

})();
