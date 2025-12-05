export class Bookmarks {
  constructor(listEl){
    this.listEl = listEl;
    this.items = JSON.parse(localStorage.getItem('tp_bookmarks')||'[]');
    this.render();
  }
  add(title, url){
    this.items.unshift({title, url});
    localStorage.setItem('tp_bookmarks', JSON.stringify(this.items));
    this.render();
  }
  render(){
    this.listEl.innerHTML = '';
    for(const b of this.items){
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href='#'; a.textContent=b.title; a.addEventListener('click', (e)=>{ e.preventDefault(); window.open(b.url,'_blank'); });
      li.appendChild(a);
      this.listEl.appendChild(li);
    }
  }
}
