// ========================================
// Rewriter - HTML/CSS書き換えエンジン
// ========================================

const TRACKING_SCRIPTS = [
  'ga.js', 'analytics.js', 'gtag.js', 'fbevents.js', 'pixel.js',
  'tracker.js', 'tracking.js', 'telemetry.js', 'gtm.js', 'tag-manager',
  'hotjar', 'clarity.ms', 'mouseflow', 'fullstory', 'heap.js'
];

/**
 * HTML書き換え
 */
async function rewriteHTML(html, origin) {
  // 1. トラッキングスクリプト削除
  TRACKING_SCRIPTS.forEach(script => {
    const regex = new RegExp(
      `<script[^>]*src=["'][^"']*${script}[^"']*["'][^>]*>\\s*</script>`,
      'gi'
    );
    html = html.replace(regex, '<!-- Tracking removed -->');
  });
  
  // 2. 広告iframe削除
  html = html.replace(
    /<iframe[^>]*src=["'][^"']*(doubleclick|googlesyndication|advertising|adservice)[^"']*["'][^>]*>.*?<\/iframe>/gi,
    '<!-- Ad removed -->'
  );
  
  // 3. <base>タグ注入
  const baseTag = `<base href="${origin}/">`;
  if (!html.includes('<base')) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head>${baseTag}</head>`);
    } else {
      html = `<head>${baseTag}</head>` + html;
    }
  }
  
  // 4. CSP/XFOメタタグ削除
  html = html.replace(
    /<meta[^>]*http-equiv=["'](Content-Security-Policy|X-Frame-Options)["'][^>]*>/gi,
    ''
  );
  
  // 5. 相対URL → 絶対URL（href）
  html = html.replace(
    /href=["'](?!https?:\/\/|\/\/|#|data:|javascript:|mailto:|tel:)([^"']+)["']/gi,
    (match, path) => {
      try {
        return `href="${new URL(path, origin).href}"`;
      } catch {
        return match;
      }
    }
  );
  
  // 6. 相対URL → 絶対URL（src）
  html = html.replace(
    /src=["'](?!https?:\/\/|\/\/|data:|javascript:)([^"']+)["']/gi,
    (match, path) => {
      try {
        return `src="${new URL(path, origin).href}"`;
      } catch {
        return match;
      }
    }
  );
  
  // 7. srcset対応
  html = html.replace(
    /srcset=["']([^"']+)["']/gi,
    (match, srcset) => {
      const rewritten = srcset.split(',').map(item => {
        const [url, descriptor] = item.trim().split(/\s+/);
        try {
          const absoluteUrl = new URL(url, origin).href;
          return descriptor ? `${absoluteUrl} ${descriptor}` : absoluteUrl;
        } catch {
          return item;
        }
      }).join(', ');
      return `srcset="${rewritten}"`;
    }
  );
  
  // 8. インラインスタイルのurl()
  html = html.replace(
    /url\(["']?(?!https?:\/\/|data:|\/\/)([^)"']+)["']?\)/gi,
    (match, path) => {
      try {
        return `url("${new URL(path, origin).href}")`;
      } catch {
        return match;
      }
    }
  );
  
  // 9. フォームaction
  html = html.replace(
    /<form([^>]*)action=["'](?!https?:\/\/)([^"']+)["']/gi,
    (match, attrs, path) => {
      try {
        return `<form${attrs}action="${new URL(path, origin).href}"`;
      } catch {
        return match;
      }
    }
  );
  
  // 10. JavaScript保護スクリプト注入
  const protectionScript = generateProtectionScript(origin);
  if (html.includes('</head>')) {
    html = html.replace('</head>', protectionScript + '</head>');
  } else {
    html = protectionScript + html;
  }
  
  // 11. DNS/IPリーク防止
  html = html.replace(
    /<link[^>]*rel=["']dns-prefetch["'][^>]*>/gi,
    '<!-- DNS prefetch removed -->'
  );
  
  html = html.replace(
    /<link[^>]*rel=["']preconnect["'][^>]*>/gi,
    '<!-- Preconnect removed -->'
  );
  
  return html;
}

/**
 * CSS書き換え
 */
function rewriteCSS(css, origin) {
  // url()修正
  css = css.replace(
    /url\(["']?(?!https?:\/\/|data:|\/\/)([^)"']+)["']?\)/gi,
    (match, path) => {
      try {
        return `url("${new URL(path, origin).href}")`;
      } catch {
        return match;
      }
    }
  );
  
  // @import修正
  css = css.replace(
    /@import\s+["'](?!https?:\/\/)([^"']+)["']/gi,
    (match, path) => {
      try {
        return `@import "${new URL(path, origin).href}"`;
      } catch {
        return match;
      }
    }
  );
  
  return css;
}

/**
 * JavaScript保護スクリプト生成
 */
function generateProtectionScript(origin) {
  return `
<script>
(function() {
  'use strict';
  
  const ORIGIN = '${origin}';
  
  // URL修正関数
  function fixUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://') || 
        url.startsWith('data:') || url.startsWith('javascript:') || 
        url.startsWith('#') || url.startsWith('blob:')) {
      return url;
    }
    try {
      return new URL(url, ORIGIN).href;
    } catch {
      return url;
    }
  }
  
  // window.open保護
  const originalOpen = window.open;
  window.open = function(url, ...args) {
    return originalOpen.call(this, fixUrl(url), ...args);
  };
  
  // fetch保護
  const originalFetch = window.fetch;
  window.fetch = function(url, ...args) {
    if (typeof url === 'string') {
      url = fixUrl(url);
    }
    return originalFetch.call(this, url, ...args);
  };
  
  // XMLHttpRequest保護
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    return originalXHROpen.call(this, method, fixUrl(url), ...args);
  };
  
  // document.write保護
  const originalWrite = document.write;
  document.write = function(content) {
    if (typeof content === 'string') {
      content = content.replace(/src=["'](?!https?:)([^"']+)["']/gi, (m, p) => \`src="\${fixUrl(p)}"\`);
      content = content.replace(/href=["'](?!https?:)([^"']+)["']/gi, (m, p) => \`href="\${fixUrl(p)}"\`);
    }
    return originalWrite.call(this, content);
  };
  
  // document.writeln保護
  const originalWriteln = document.writeln;
  document.writeln = function(content) {
    if (typeof content === 'string') {
      content = content.replace(/src=["'](?!https?:)([^"']+)["']/gi, (m, p) => \`src="\${fixUrl(p)}"\`);
      content = content.replace(/href=["'](?!https?:)([^"']+)["']/gi, (m, p) => \`href="\${fixUrl(p)}"\`);
    }
    return originalWriteln.call(this, content);
  };
  
  // WebSocket保護（URL変換のみ）
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, ...args) {
    // WebSocketは完全対応は難しいが、URLは修正
    if (typeof url === 'string' && !url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = fixUrl(url).replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    }
    return new originalWebSocket(url, ...args);
  };
  
  // DNS/IPリーク防止（RTCPeerConnection）
  if (window.RTCPeerConnection) {
    const originalRTC = window.RTCPeerConnection;
    window.RTCPeerConnection = function(config, ...args) {
      if (config && config.iceServers) {
        config.iceServers = [];
      }
      return new originalRTC(config, ...args);
    };
  }
  
  console.log('🔒 Transparent Proxy v2.1 Protection Active');
})();
</script>
`;
}

module.exports = {
  rewriteHTML,
  rewriteCSS
};
