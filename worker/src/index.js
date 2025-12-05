import { handleProxy } from './uv-handler.js';

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if(url.pathname.startsWith('/proxy/')){
      const enc=url.pathname.replace('/proxy/','');
      const target=decodeURIComponent(enc);
      return await handleProxy(request,target,env);
    }
    return new Response('Transparent-Proxy Worker OK',{status:200});
  }
}
