# 🚀 Transparent Proxy v2.1.0

**The Ultimate Web Proxy - Beyond Interstellar, Shadow, and Utopia**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/kotopiro/Transparent-Proxy/pulls)

---

## 📖 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **🔒 Google Classroom Disguise** - Perfect favicon & title masking (`HOME`)
- **🪟 Full about:blank Support** - Display everything inside `about:blank`
- **🚀 Ultra-Fast Proxy Engine** - Cloudflare Workers-grade performance
- **🚫 Ad Blocker** - Auto-block 30+ ad domains
- **🤖 CAPTCHA Bypass** - Auto-detect reCAPTCHA & hCAPTCHA
- **🔐 URL Obfuscation** - Base64 & XOR encryption for filter evasion
- **📝 Complete HTML Rewriting** - Full support for relative paths, CSP, XFO

### 🎨 UI/UX
- **💎 Glassmorphism** - Premium 3D glass UI design
- **✨ Particle Background** - Real-time 3D particle effects
- **🌈 Neon Glow** - Cyberpunk-style neon effects
- **📱 Fully Responsive** - Mobile, tablet, and desktop support
- **🌙 Theme System** - Dark, light, and cyberpunk themes

### 🛠️ Developer Features
- **📦 Fully Modular** - Maximum maintainability
- **🔧 Customizable** - All settings managed via JSON
- **🚀 Multi-Platform** - Render, Railway, Vercel, Netlify support
- **📊 Real-time Logging** - Detailed access logs
- **⚡ PWA Support** - Works offline

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Clone
```bash
git clone https://github.com/kotopiro/Transparent-Proxy.git
cd transparent-proxy
```

### Install Dependencies
```bash
npm install
```

### Start
```bash
npm start
```

Open `http://localhost:3000` in your browser

---

## 🚀 Usage

### Basic Operations

#### 1. Open URL
- Enter `example.com` in the URL bar
- Click "GO" button
- about:blank window opens

#### 2. Search
- Enter `transparent proxy` in the URL bar
- Google search results displayed

#### 3. Tab Operations
- **New Tab:** `Ctrl+T` or "+ New Tab" button
- **Close Tab:** `Ctrl+W` or `×` button
- **Switch Tab:** Click on tab

#### 4. History & Bookmarks
- **History:** `Ctrl+H` or "📜 History" button
- **Add Bookmark:** `Ctrl+D`
- **Show Bookmarks:** `Ctrl+B`

---

## 🌐 Deployment

See [DEPLOY.md](DEPLOY.md) for detailed instructions

### Deploy to Render

#### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Render Setup
1. Open [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click "Create Web Service"

#### 3. Done!
Deployment completes in a few minutes. URL will be provided.

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Optional
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
CACHE_TTL=3600
```

### config/default.json

Edit `src/config/default.js` for detailed settings:

```javascript
module.exports = {
  server: { port: 3000 },
  proxy: { timeout: 30000 },
  adblock: { enabled: true },
  // ...
};
```

---

## 📡 API Documentation

See [API.md](API.md) for complete API documentation

### Quick Example

```javascript
// Fetch through proxy
const url = 'https://example.com';
const encodedUrl = btoa(url);
const proxyUrl = `https://your-domain.com/proxy/${encodedUrl}`;

fetch(proxyUrl)
  .then(response => response.text())
  .then(html => console.log(html));
```

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `Ctrl+T` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+R` | Reload |
| `Ctrl+L` | Focus URL Bar |
| `Ctrl+H` | Show History |
| `Ctrl+B` | Show Bookmarks |
| `Ctrl+D` | Add Bookmark |
| `Ctrl+,` | Open Settings |
| `Ctrl+/` | Shortcuts List |
| `Esc` | Close Panel |

---

## 🔧 Troubleshooting

### Q. Page not loading

**A.** Check:
1. Is server running?
2. Is URL correct? (`http://` or `https://` required)
3. Any errors in browser console?

### Q. about:blank blocked

**A.** Allow popups in browser settings:
- Chrome: Settings → Privacy and security → Site Settings → Pop-ups and redirects
- Firefox: Settings → Privacy & Security → Permissions → Block pop-up windows

### Q. Images not loading

**A.** May be caused by ad blocker:
- Temporarily disable ad blocker in settings
- Or add domain to whitelist

---

## 🤝 Contributing

Contributions are welcome!

### Steps
1. Fork
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Create Pull Request

### Coding Guidelines
- Follow ESLint configuration
- Use clear variable names
- Add comments for complex logic

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details

---

## 🙏 Acknowledgments

- [Ultraviolet](https://github.com/titaniumnetwork-dev/ultraviolet)
- [Interstellar](https://github.com/interstellarnetwork/interstellar)
- [Shadow](https://github.com/shadow-proxy/shadow)

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/kotopiro/Transparent-Proxy/issues)
- **Email:** contact@transparent-proxy.dev

---

**Made with ❤️ by Transparent Proxy Team**
