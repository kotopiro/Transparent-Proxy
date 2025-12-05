// embed.js - helper for opening about:blank in a new tab with iframe to proxy
export function openProxiedBlank(url){
  const win = window.open('about:blank','_blank');
  if(!win) return alert('Popup blocked');
  const encoded = encodeURIComponent(url);
  win.document.write(`<iframe src="/_proxy/${encoded}" style="width:100%;height:100vh;border:0"></iframe>`);
  win.document.close();
}
