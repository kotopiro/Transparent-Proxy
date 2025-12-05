export class Tabs {
  constructor(tabContainer, viewportEl){
    this.tabContainer = tabContainer;
    this.viewport = viewportEl;
    this.tabs = [];
    this.active = null;
  }
  createTab(url = null){
    const id = 't'+Math.random().toString(36).slice(2,9);
    const tabEl = document.createElement('div');
    tabEl.className = 'tab-pill';
    tabEl.textContent = 'New Tab';
    tabEl.dataset.id = id;
    tabEl.addEventListener('click', ()=> this.activate(id));
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
  navigateActiveTo(url){
    const t = this.getActive();
    if(!t) t = this.tabs[0];
    if(!t) return;
    t.iframe.src = url;
    t.url = url;
    t.title = url;
  }
}
