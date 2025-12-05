export async function handleProxy(request,target,env){
  try{
    const upstream=await fetch(target,{
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
      body: request.body
    });

    const headers=new Headers(upstream.headers);
    headers.delete('x-frame-options');
    headers.delete('frame-options');
    headers.delete('content-security-policy');
    headers.set('access-control-allow-origin','*');

    const ct=headers.get('content-type')||'';
    if(ct.includes('text/html')){
      let text=await upstream.text();
      // YouTube向け: CSP回避 + baseタグ挿入
      text=text.replace(/<head[^>]*>/i, `$&<base href="${target}"><script>/* YouTube proxy injected */</script>`);
      return new Response(text,{status:upstream.status,statusText:upstream.statusText,headers});
    }

    return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers});
  }catch(e){
    return new Response('Worker fetch failed: '+e.message,{status:502});
  }
}
