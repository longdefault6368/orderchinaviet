// OrderChinaViet Extension — Background Service Worker v2.6

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'OPEN_TAB') {
    chrome.tabs.create({ url: request.url });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'FETCH_LINK_DATA') {
    fetchLinkData(request.url)
      .then((data) => sendResponse(data))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep response channel open
  }

  return true;
});

async function fetchLinkData(url) {
  let platform = 'Unknown';
  if (url.includes('1688.com')) platform = '1688';
  else if (url.includes('taobao.com')) platform = 'Taobao';
  else if (url.includes('tmall.com')) platform = 'Tmall';
  else if (url.includes('yangkeduo.com') || url.includes('pinduoduo.com')) platform = 'Pinduoduo';
  else if (url.includes('alibaba.com')) platform = 'Alibaba';
  else if (url.includes('aliexpress.com')) platform = 'AliExpress';

  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!res.ok) {
      return { success: false, error: `HTTP status ${res.status}` };
    }
    const htmlText = await res.text();

    // Parse title
    let title = '';
    const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       htmlText.match(/property="og:title"\s+content="([^"]+)"/i) ||
                       htmlText.match(/content="([^"]+)"\s+property="og:title"/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/[-_|–—].*$/, '').trim();
      // Decode HTML entities if any
      title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }

    // Parse price
    let price = 0;
    const priceMatch = htmlText.match(/"price"\s*:\s*"([\d\.]+)"/) ||
                       htmlText.match(/"price"\s*:\s*([\d\.]+)/) ||
                       htmlText.match(/"refPrice"\s*:\s*"([\d\.]+)"/) ||
                       htmlText.match(/"displayPrice"\s*:\s*"([\d\.]+)"/) ||
                       htmlText.match(/class="[^"]*price[^"]*"[^>]*>[\s¥￥]*([\d\.]+)/i);
    if (priceMatch && parseFloat(priceMatch[1]) > 0) {
      price = parseFloat(priceMatch[1]);
    }

    if (title && title.length > 2) {
      return { success: true, title, price, platform, url };
    } else {
      return { success: false, error: 'Không trích xuất được thông tin sản phẩm từ HTML' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[OrderChinaViet Extension v2.6] Ready.');
});
