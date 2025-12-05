export default {
  async fetch(request) {
    const url = new URL(request.url);

    // /_proxy/** を UV に流す
    if (url.pathname.startsWith('/_proxy/')) {
      return handleUv(request, url);
    }

    // root なら index.html を返す
    if (url.pathname === '/') {
      const res = await fetch('https://your-render-app.onrender.com');
      return new HTMLRewriter()
        .on('meta[http-equiv="Content-Security-Policy"]', {
          element(e) {
            e.setAttribute(
              'content',
              `
              default-src * blob: data: 'unsafe-inline' 'unsafe-eval';
              img-src * data:;
              media-src *;
              connect-src *;
              frame-src * https:;
              script-src * 'unsafe-inline' 'unsafe-eval';
              `
            );
          }
        })
        .transform(res);
    }

    return fetch(request);
  }
};
