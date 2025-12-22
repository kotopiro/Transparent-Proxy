self.__uv$config = {
    prefix: '/service/',
    bare: '/bare/',
    encodeUrl: (str) => encodeURIComponent(str),
    decodeUrl: (str) => decodeURIComponent(str),
    handler: '/uv.handler.js',
    bundle: '/uv.bundle.js',
    config: '/uv.config.js',
    sw: '/uv.sw.js',
};
