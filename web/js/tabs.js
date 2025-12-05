import { faviconFor } from './favicon.js';

export class Tabs {
  constructor(tabContainer, viewportEl){
    this.tabContainer = tabContainer;
    this.viewport = viewportEl;
    this.tabs = [];
    this.active = null;

    // drag state
    this.tabContainer.addEventListener('dragover', e => e.preventDefault());
  }
  createTab(url = null){
    const id = 't'+Math.random().toString(36).slice(2,9);
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-pill';
    tabEl.draggable = true;
    tabEl.dataset.id = id;

    const fav = document.createElement('img');
    fav.className = 'tab-favicon';
    fav.width = 16; fav.height = 16;
    fav.style.marginRight='6px';

    const label = document.createElement('span');
    label.textContent = 'New Tab';

    tabEl.appendChild(fav);
    tabEl.appendChild(label);

    tabEl.addEventListener('click', ()=> this.activate(id));
    tabEl.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', id);
      tabEl.classList.add('dragging');
    });
    tabEl.addEventListener('dragend', ()=> tabEl.classList.remove('dragging'));

    tabEl.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const srcId = ev.dataTransfer.getData('text/plain');
      if(srcId && srcId !== id) this.reorderTabs(srcId, id);
    });

    this.tabContainer.appendChild(tabEl);

    const iframe = document.createElement('iframe');
    iframe.dataset.id = id;
    iframe.style.width='100%'; iframe.style.height='100%'; iframe.style.border='0';
    iframe.src = 'about:blank';

    this.tabs.push({id, el: tabEl, iframe, url: null, title: 'New Tab'});
    this.activate(id);
    return id;
  }
  activate(id){
    const t = this.tabs.find(x=>x.id===id);
    if(!t) return;
    this.active = id;
    // UI active class
    [...this.tabContainer.children].forEach(c=>c.classList.toggle('active', c.dataset.id===id));
    // replace viewport
    this.viewport.innerHTML = '';
    this.viewport.appendChild(t.iframe);
  }
  getActive(){ return this.tabs.find(x=>x.id===this.active) || null; }
  async navigateActiveTo(url){
    const t = this.getActive();
    if(!t) return;
    t.iframe.src = url;
    t.url = url;
    t.title = url;
    // update UI text and favicon
    const txt = t.el.querySelector('span');
    txt.textContent = url;
    const img = t.el.querySelector('img');
    img.src = faviconFor(url);
  }
  reorderTabs(srcId, destId){
    const srcIndex = this.tabs.findIndex(t => t.id === srcId);
    const destIndex = this.tabs.findIndex(t => t.id === destId);
    if(srcIndex < 0 || destIndex < 0) return;
    const [item] = this.tabs.splice(srcIndex,1);
    this.tabs.splice(destIndex,0,item);
    // re-render tabContainer
    this.tabContainer.innerHTML = '';
    for(const t of this.tabs){
      this.tabContainer.appendChild(t.el);
    }
  }
}
