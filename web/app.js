// web/app.js
(async () => {
  // config
  const PROXY = (window.PROXY_ORIGIN || '').replace(/\/$/, '');
  const PROXY_KEY = window.PROXY_KEY || '';

  // elements
  const urlInput = document.getElementById('urlInput');
  const goBtn = document.getElementById('goBtn');
  const newTabBtn = document.getElementById('newTabBtn');
  const stealthToggle = document.getElementById('stealthToggle');
  const bookmarkBar = document.getElementById('bookmarkBar');
  const tabBar = document.getElementById('tabBar');
  const viewWrapper = document.getElementById('viewWrapper');
  const downloadPanelBtn = document.getElementById('downloadPanelBtn');
  const downloadPanel = document.getElementById('downloadPanel');
  const downloadList = document.getElementById('downloadList');
  const downloadInput = document.getElementById('downloadInput');
  const downloadBtn = document.getElementById('downloadBtn');

  // state
  let tabs = [];
  let activeId = null;

  const bookmarks = [
    {title:'YouTube', url:'https://www.youtube.com'},
    {title:'Google', url:'https://www.google.com'},
    {title:'X (Twitter)', url:'https://twitter.com'}
  ];

  // --- crypto helpers (AES-GCM) ---
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  async function deriveKey(pass) {
    const salt = enc.encode('transparent-proxy-salt-v1');
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), {name:'PBKDF2'}, false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
  }
  function toB64Url(buf){
    let s = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return s.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromB64Url(str){
    str = str.replace(/-/g,'+').replace(/_/g,'/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const arr = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return arr.buffer;
  }
  async function encryptURL(url){
    if (!PROXY_KEY) return null;
    const key = await deriveKey(PROXY_KEY);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(url));
    // combine iv + cipher
    const combined = new Uint8Array(iv.length + cipher.byteLength);
    combined.set(iv,0); combined.set(new Uint8Array(cipher), iv.length);
    return toB64Url(combined.buffer);
  }

  // --- UI helpers ---
  function makeId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

  function renderBookmarks(){
    bookmarkBar.innerHTML='';
    bookmarks.forEach(b=>{
      const el = document.createElement('button');
      el.className='bm';
      el.textContent = b.title;
      el.onclick = ()=> openURL(b.url);
      bookmarkBar.appendChild(el);
    });
  }

  function renderTabs(){
    tabBar.innerHTML='';
    tabs.forEach(t=>{
      const el = document.createElement('div');
      el.className = 'tab' + (t.id===activeId? ' active':'');
      const fav = document.createElement('img'); fav.className='favicon';
      fav.src = t.favicon || '';
      fav.onerror = ()=> fav.style.display='none';
      const lbl = document.createElement('span'); lbl.textContent = t.title || t.url;
      const close = document.createElement('button'); close.textContent='×'; close.onclick = (e)=>{ e.stopPropagation(); closeTab(t.id); };
      el.appendChild(fav); el.appendChild(lbl); el.appendChild(close);
      el.onclick = ()=> activateTab(t.id);
      tabBar.appendChild(el);
    });
  }

  function createIframe(id, src){
    const iframe = document.createElement('iframe');
    iframe.dataset.id = id;
    iframe.sandbox = 'allow-scripts allow-forms allow-popups allow-same-origin';
    iframe.loading = 'lazy';
    iframe.style.display = 'none';
    iframe.src = src;
    viewWrapper.appendChild(iframe);
    return iframe;
  }

  async function openURL(rawUrl){
    let url = rawUrl;
    if (!/^https?:\/\//i.test(url) && !url.startsWith('about:')) {
      // interpret as search
      url = 'https://www.google.com/search?q=' + encodeURIComponent(rawUrl);
    }
    const id = makeId();
    const title = url.replace(/^https?:\/\//,'').split('/')[0];
    const favicon = getFaviconUrl(url);
    // build proxy url
    let proxyUrl;
    const stealth = stealthToggle.checked;
    if (stealth && PROXY_KEY && PROXY) {
      const enc = await encryptURL(url);
      proxyUrl = `${PROXY}/proxy?e=${encodeURIComponent(enc)}`;
    } else if (PROXY) {
      proxyUrl = `${PROXY}/proxy?u=${encodeURIComponent(url)}`;
    } else {
      proxyUrl = url;
    }

    const iframe = createIframe(id, proxyUrl);
    tabs.push({id, url, title, favicon, iframe});
    activateTab(id);

    // try fetch favicon via worker
    if (PROXY) {
      fetch(`${PROXY}/favicon-proxy?u=${encodeURIComponent(url)}`)
        .then(r=>r.blob())
        .then(b=> {
          const obj = URL.createObjectURL(b);
          const t = tabs.find(x=>x.id===id);
          if(t){ t.favicon = obj; renderTabs(); }
        }).catch(()=>{});
    }
    renderTabs();
  }

  function activateTab(id){
    activeId = id;
    tabs.forEach(t=>{
      t.iframe.style.display = t.id===id ? 'block' : 'none';
    });
    renderTabs();
  }
  function closeTab(id){
    const idx = tabs.findIndex(t=>t.id===id);
    if (idx===-1) return;
    const t = tabs[idx];
    t.iframe.remove();
    tabs.splice(idx,1);
    if (tabs.length) activateTab(tabs[Math.max(0, idx-1)].id);
    else openURL('about:blank');
  }
  function getFaviconUrl(url){
    try { return `https://www.google.com/s2/favicons?domain=${(new URL(url)).hostname}&sz=64`; } catch(e){ return ''; }
  }

  // download
  async function downloadURL(url){
    const item = document.createElement('div'); item.textContent='Starting: '+url; downloadList.appendChild(item);
    try {
      const proxy = PROXY ? `${PROXY}/download?url=${encodeURIComponent(url)}` : url;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const filename = (new URL(url)).pathname.split('/').pop() || 'download';
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      item.textContent = 'Done: '+filename;
    } catch(e){ item.textContent = 'Failed: '+e.message; }
  }

  // events
  goBtn.onclick = ()=> { const v = urlInput.value.trim(); if (!v) return; openURL(v); urlInput.value=''; };
  newTabBtn.onclick = ()=> openURL('about:blank');
  downloadPanelBtn.onclick = ()=> downloadPanel.classList.toggle('hidden');
  if (downloadBtn) downloadBtn.onclick = ()=> { const v = (downloadInput && downloadInput.value)||''; if (!v) return alert('Enter URL'); downloadURL(v); };

  // boot
  renderBookmarks();
  openURL('about:blank');

  // expose for debug
  window.TP = { openURL, tabs, PROXY };

})();
