(function(){
  "use strict";
  const URL="https://uwuklryzxexpofcxrbnm.supabase.co";
  const KEY="sb_publishable_pC4zCrTiZLb0hW0oXqt0tg_i1vjIoW2";
  if(!window.supabase) throw new Error("Supabase library is not loaded.");
  const db=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  async function getAdmin(){
    const {data:{session},error}=await db.auth.getSession();
    if(error||!session?.user) return null;
    const {data,error:adminError}=await db.from("foundation_admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
    if(adminError||!data) return null;
    return {user:session.user,session};
  }
  async function requireAdmin(){
    const admin=await getAdmin();
    if(admin) return admin;
    const next=encodeURIComponent(location.pathname.split("/").pop()||"registers.html");
    location.replace("admin.html?next="+next);
    throw new Error("Admin authentication required.");
  }
  async function signOut(){await db.auth.signOut();location.replace("admin.html");}
  window.foundationSupabase=db;
  window.foundationAuth={getAdmin,requireAdmin,signOut};
})();