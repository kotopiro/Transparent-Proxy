// favicon.js
export async function fetchFavicon(url){
  try{
    // try common favicon path
    const u = new URL(url);
    const f = `${u.origin}/favicon.ico`;
    // Check if accessible (HEAD)
    const r = await fetch(f, { method: 'HEAD', mode:'no-cors' }).catch(()=>null);
    // If accessible return origin/favicon.ico (browser will handle 404)
    return f;
  }catch(e){
    return '/assets/icons/default-favicon.png';
  }
}
