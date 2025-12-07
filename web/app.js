// SETTINGS
let currentTab = 0;
const tabs = [];

// Create new tab
function createTab(url = "./tabs/blank.html") {
  const id = tabs.length;
  tabs.push(url);
  renderTabs();
  switchTab(id);
}

function renderTabs() {
  const el = document.getElementById("tabs-container");
  el.innerHTML = "";

  tabs.forEach((t, i) => {
    const tab = document.createElement("div");
    tab.className = i === currentTab ? "tab active" : "tab";
    tab.textContent = `Tab ${i+1}`;
    tab.onclick = () => switchTab(i);
    el.appendChild(tab);
  });
}

function switchTab(id) {
  currentTab = id;
  document.getElementById("view").src = tabs[id];
  renderTabs();
}

document.getElementById("newTabBtn").onclick = () => createTab();

// URL bar → Worker
document.getElementById("goBtn").onclick = () => {
  let url = document.getElementById("urlInput").value.trim();

  if (!url.startsWith("http")) {
    url = "https://www.google.com/search?q=" + encodeURIComponent(url);
  }

  const proxy = WORKER_URL + "/proxy/" + btoa(url);
  tabs[currentTab] = proxy;
  switchTab(currentTab);
};

// bookmark buttons
document.querySelectorAll(".bm").forEach(b => {
  b.onclick = () => {
    const url = b.getAttribute("data-url");
    document.getElementById("urlInput").value = url;

    const proxy = WORKER_URL + "/proxy/" + btoa(url);
    tabs[currentTab] = proxy;
    switchTab(currentTab);
  };
});

// Init
createTab();
