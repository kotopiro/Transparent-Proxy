// app.js - register SW, create about:blank iframe, navigate via /_proxy/<encoded>
async function registerSW(){
  if('serviceWorker' in navigator){
    try{
      await navigator.serviceWorker.register('/sw.js', {scope:'/'});
      console.log('sw registered');
    }catch(e){ console.warn('sw reg failed', e); }
  }
}

function createIframe(initialHtml){
  const viewport = document.getElementById('viewport');
  viewport.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.id = 'uv-frame';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  iframe.src = 'about:blank';
  viewport.appendChild(iframe);

  iframe.addEventListener('load', () => {
    try{
      const doc = iframe.contentWindow.document;
      doc.open();
      if(initialHtml) doc.write(initialHtml);
      else doc.write('<!doctype html><html><body style="background:#000;color:#fff"><h2>New Tab</h2></body></html>');
      doc.close();
    }catch(e){
      console.warn('write blocked', e);
    }
  });
  return iframe;
}

function navigateTo(iframe, url){
  // Navigate via SW proxy path
  const encoded = encodeURIComponent(url);
  iframe.src = `/_proxy/${encoded}`;
  document.getElementById('status').textContent = `Navigating: ${url}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  await registerSW();
  const omnibox = document.getElementById('omnibox');
  const btnGo = document.getElementById('btn-go');
  const btnOpen = document.getElementById('btn-open-blank');
  let iframe = createIframe();

  btnOpen.addEventListener('click', () => { iframe = createIframe(); });

  btnGo.addEventListener('click', () => {
    const v = omnibox.value.trim(); if(!v) return;
    try { new URL(v); } catch(e){ v = 'https://' + v; }
    navigateTo(iframe, v);
  });

  omnibox.addEventListener('keydown', e => { if(e.key==='Enter') btnGo.click(); });
});
