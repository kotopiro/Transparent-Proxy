// downloads.js - a tiny download manager stored in localStorage
export class Downloads {
  constructor(listEl){
    this.listEl = listEl;
    this.items = JSON.parse(localStorage.getItem('tp_downloads')||'[]');
    this.render();
  }
  add(url, filename){
    const it = { id: 'd'+Math.random().toString(36).slice(2,9), url, filename, time: Date.now(), status:'queued' };
    this.items.unshift(it);
    localStorage.setItem('tp_downloads', JSON.stringify(this.items));
    this.render();
    this.start(it);
  }
  async start(item){
    // mark running
    item.status = 'running'; this.saveAndRender();
    try{
      const res = await fetch(item.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = item.filename || (item.url.split('/').pop() || 'download.bin');
      document.body.appendChild(a);
      a.click();
      a.remove();
      item.status = 'done';
    }catch(e){
      item.status = 'error';
      item.error = String(e);
    }
    this.saveAndRender();
  }
  saveAndRender(){ localStorage.setItem('tp_downloads', JSON.stringify(this.items)); this.render(); }
  render(){
    if(!this.listEl) return;
    this.listEl.innerHTML = '';
    for(const d of this.items){
      const li = document.createElement('li');
      li.textContent = `${new Date(d.time).toLocaleString()} [${d.status}] ${d.filename || d.url}`;
      this.listEl.appendChild(li);
    }
  }
}
