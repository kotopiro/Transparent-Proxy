export class History {
  constructor(listEl){
    this.listEl=listEl;
    this.items=JSON.parse(localStorage.getItem('tp_history')||'[]');
    this.render();
  }
  add(url){
    this.items.unshift({url,time:Date.now()});
    this.items=this.items.slice(0,100);
    localStorage.setItem('tp_history',JSON.stringify(this.items));
    this.render();
  }
  render(){
    this.listEl.innerHTML='';
    for(const it of this.items){
      const li=document.createElement('li');
      li.textContent=`${new Date(it.time).toLocaleString()} — ${it.url}`;
      this.listEl.appendChild(li);
    }
  }
}
