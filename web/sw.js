importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');

self.__uv$config.prefix = '/_proxy/';
self.__uv$config.encodeUrl = Ultraviolet.codec.xor.encode;
self.__uv$config.decodeUrl = Ultraviolet.codec.xor.decode;

// YT: Range 対応 / hls / dash
const YT_HEADERS = [
  'range', 'content-range', 'accept-ranges',
  'access-control-allow-origin',
  'access-control-allow-headers',
  'access-control-allow-methods'
];

// Fetch hook
self.addEventListener('fetch', (event) => {
  let req = event.request;

  // UVへルーティング
  event.respondWith(
    (async () => {
      const url = new URL(req.url);

      // 動画 streaming は Range を通す
      const headers = new Headers(req.headers);
      if (headers.get('Range')) {
        headers.set('Access-Control-Expose-Headers', YT_HEADERS.join(', '));
      }

      const uvReq = new Request(
        self.__uv$config.prefix + self.__uv$config.encodeUrl(url.toString()),
        {
          method: req.method,
          headers,
          body: req.body,
          mode: 'cors',
          credentials: 'omit'
        }
      );

      return await fetch(uvReq);
    })()
  );
});
