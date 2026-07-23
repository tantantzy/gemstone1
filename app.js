
(() => {
 const cfg = window.GEMSTONE_CONFIG || {};
 const configured = !!(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.includes("YOUR_") && !cfg.supabaseAnonKey.includes("YOUR_"));
 window.GV = {
  configured,
  client: configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null,
  setStatus(id,msg){const e=document.getElementById(id);if(e)e.textContent=msg},
  async session(){if(!this.client)return null;const {data}=await this.client.auth.getSession();return data.session||null},
  async requireAuth(){
   const s=await this.session();
   if(!s){location.href="login.html?next="+encodeURIComponent(location.pathname.split("/").pop()||"play.html");return null}
   return s;
  },
  safeName(profile,user){return profile?.display_name||profile?.username||user?.email?.split("@")[0]||"Player"}
 };
})();
