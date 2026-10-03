(function(){
  "use strict";
  const URL="https://uwuklryzxexpofcxrbnm.supabase.co";
  const KEY="sb_publishable_pC4zCrTiZLb0hW0oXqt0tg_i1vjIoW2";
  if(!window.supabase) throw new Error("Supabase library is not loaded.");
  const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  async function getAdmin(){
    const {data:{user},error}=await db.auth.getUser();
    if(error||!user) return null;
    const {data,error:adminError}=await db.from("foundation_admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
    if(adminError||!data) return null;
    const {data:{session}}=await db.auth.getSession();
    return {user,session};
  }
  async function requireAdmin(){
    const admin=await getAdmin();
    if(admin) return admin;
    const next=encodeURIComponent(location.pathname.split("/").pop()||"registers.html");
    location.replace("admin.html?next="+next);
    throw new Error("Admin authentication required.");
  }
  const FOUNDATION_ADMIN_IDLE_LIMIT=30*60*1000;
  let idleTimer=null;
  function resetIdle(){
    clearTimeout(idleTimer);
    idleTimer=setTimeout(()=>{ db.auth.signOut().finally(()=>location.replace("admin.html?reason=idle")); },FOUNDATION_ADMIN_IDLE_LIMIT);
  }
  ["click","keydown","input","change","touchstart"].forEach(evt=>document.addEventListener(evt,resetIdle,{passive:true}));
  resetIdle();
  async function signOut(){await db.auth.signOut();location.replace("admin.html");}
  window.foundationSupabase=db;
  window.foundationAuth={getAdmin,requireAdmin,signOut};
})();