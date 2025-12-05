import { Tabs } from './tabs.js';
import { Bookmarks } from './bookmarks.js';
import { History } from './history.js';
import { openProxiedBlank } from './embed.js';

const DEFAULT_WORKER_URL = localStorage.getItem('worker_url') || 'https://transparent-proxy-worker.mnxsv69789.workers.dev';

async function registerSW(){
  if('serviceWorker' in navigator){
    try{
      await navigator.serviceWorker.register('/sw.js', {scope:'/'});
      console.log('SW registered');
    }catch(e){ console.warn('SW register failed', e); }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await registerSW();

  const tabs = new Tabs(document.getElementById('tabs'), document.getElementById('viewport'));
  const bookmarks = new Bookmarks(document.getElementById('bookmark-list'));
  const history = new History(document.getElementById('history-list'));
  const btnDownload = document.getElementById('btn-download');

btnDownload.addEventListener('click', () => {
  const t = tabs.getActive();
  if (!t || !t.url) {
    alert('No active page to download!');
    return;
  }

  // a タグを使ってダウンロード開始
  const a = document.createElement('a');
  a.href = t.url;  // 現在のタブ URL
  a.download = ''; // 空文字で元のファイル名を保持
  document.body.appendChild(a);
  a.click();
  a.remove();
});
  const omnibox = document.getElementById('omnibox');
  const btnGo = document.getElementById('btn-go');
  const btnNew = document.getElementById('btn-newtab');
  const btnBookmark = document.getElementById('btn-bookmark');
  const btnDev = document.getElementById('btn-dev');
  const devPanel = document.getElementById('dev-panel');
  const workerInput = document.getElementById('worker-url');
  const status = document.getElementById('status');

  workerInput.value = DEFAULT_WORKER_URL;

  btnNew.addEventListener('click', ()=>tabs.createTab());
  btnBookmark.addEventListener('click', ()=>{
    const t = tabs.getActive();
    if(t && t.url) bookmarks.add(t.title||t.url, t.url);
  });
  btnDev.addEventListener('click', ()=>devPanel.classList.toggle('hidden'));
  document.getElementById('flush-cache').addEventListener('click', ()=>{
    if(navigator.serviceWorker && navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.postMessage({type:'flush-cache'});
      logDev('Sent flush-cache');
    }
  });

  btnGo.addEventListener('click', ()=>{
    let v = omnibox.value.trim();
    if(!v) return;
    if(!/^https?:\/\//i.test(v)) v='https://'+v;
    const url = v;
    const encoded = encodeURIComponent(url);
    const worker = workerInput.value.trim() || DEFAULT_WORKER_URL;
    tabs.navigateActiveTo(`${worker}/proxy/${encoded}`);
    history.add(url);
    status.textContent='Navigating...';
  });

  omnibox.addEventListener('keydown', e=>{ if(e.key==='Enter') btnGo.click(); });
  tabs.createTab();

  window.logDev = function(msg){
    const el = document.getElementById('dev-log');
    el.textContent+=`${new Date().toLocaleTimeString()} ${msg}\n`;
    el.scrollTop=el.scrollHeight;
  };
});
