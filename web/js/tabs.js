export class Tabs {
  constructor(tabContainer, viewportEl){
    this.tabContainer = tabContainer;
    this.viewport = viewportEl;
    this.tabs = [];
    this.active = null;
  }
  createTab(url=null){
    const id = 't'+Math.random().toString(36).slice(2,9);
    const tabEl = document.createElement('div');
    tabEl.className='tab-pill';
    tabEl.textContent='New Tab';
    tabEl.dataset.id=id;
    tabEl.addEventListener('click', ()=>this.activate(id));
    this.tabContainer.appendChild(tabEl);
    // drag & drop reorder
tabEl.draggable = true;
tabEl.addEventListener('dragstart', e=>{
  e.dataTransfer.setData('text/plain', id);
});
tabEl.addEventListener('dragover', e=>e.preventDefault());
tabEl.addEventListener('drop', e=>{
  e.preventDefault();
  const fromId = e.dataTransfer.getData('text/plain');
  const toId = id;
  const fromIndex = this.tabs.findIndex(x=>x.id===fromId);
  const toIndex = this.tabs.findIndex(x=>x.id===toId);
  if(fromIndex<0 || toIndex<0) return;
  const [moved]=this.tabs.splice(fromIndex,1);
  this.tabs.splice(toIndex,0,moved);
  this.tabContainer.innerHTML='';
  for(const t of this.tabs) this.tabContainer.appendChild(t.el);
});


    const iframe = document.createElement('iframe');
    iframe.dataset.id=id;
    iframe.style.width='100%';
    iframe.style.height='100%';
    iframe.style.border='0';
    iframe.src='about:blank';

    this.tabs.push({id, el:tabEl, iframe, url:null, title:'New Tab'});
    this.activate(id);
    return id;
  }
  activate(id){
    const t = this.tabs.find(x=>x.id===id);
    if(!t) return;
    this.active=id;
    [...this.tabContainer.children].forEach(c=>c.classList.toggle('active',c.dataset.id===id));
    this.viewport.innerHTML='';
    this.viewport.appendChild(t.iframe);
  }
  getActive(){ return this.tabs.find(x=>x.id===this.active)||null; }
  navigateActiveTo(url){
    const t=this.getActive()||this.tabs[0];
    if(!t) return;
    t.iframe.src=url;
    t.url=url;
    t.title=url;
    // fetch favicon automatically
const link = document.createElement('link');
link.rel='icon';
link.href=`https://www.google.com/s2/favicons?domain=${(new URL(url)).hostname}`;
t.iframe.onload = ()=>{ t.el.style.backgroundImage=`url(${link.href})`; t.el.style.backgroundSize='16px 16px'; t.el.style.backgroundRepeat='no-repeat'; t.el.style.paddingLeft='20px'; };

  }
}
