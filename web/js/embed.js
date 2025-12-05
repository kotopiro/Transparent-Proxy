export function openProxiedBlank(url){
  const win=window.open('about:blank','_blank');
  if(!win) return alert('Popup blocked');
  const encoded=encodeURIComponent(url);
  const worker=localStorage.getItem('worker_url')||'https://transparent-proxy-worker.mnxsv69789.workers.dev';
  win.document.write(`<iframe src="${worker}/proxy/${encoded}" style="width:100%;height:100vh;border:0"></iframe>`);
  win.document.close();
}
