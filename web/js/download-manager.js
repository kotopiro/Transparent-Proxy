export class DownloadManager {
  constructor(){
    this.items = JSON.parse(localStorage.getItem('tp_downloads')||'[]');
  }
  startDownload(url, filename){
    // create invisible link to trigger download via browser
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.items.unshift({url, filename, time: Date.now(), status:'started'});
    localStorage.setItem('tp_downloads', JSON.stringify(this.items));
  }
  list(){ return this.items; }
}
