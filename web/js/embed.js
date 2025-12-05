export function openProxiedBlank(url){
  const win = window.open('about:blank','_blank');
  if(!win) return alert('Popup blocked');
  const encoded = encodeURIComponent(url);
  const worker = document.getElementById('worker-url') ? document.getElementById('worker-url').value : (localStorage.getItem('worker_url') || '');
  const workerBase = worker || '';
  // pass worker URL to the toplevel of opened window for aboutblank script
  const html = `
    <!doctype html><html><head><meta charset="utf-8"><title>New Tab</title></head><body>
    <script>window.workerURL = ${JSON.stringify(workerBase)};</script>
    <iframe src="${workerBase? workerBase + '/proxy/' + encoded : '/_proxy/' + encoded}" style="width:100%;height:100vh;border:0"></iframe>
    </body></html>`;
  win.document.write(html);
  win.document.close();
}
