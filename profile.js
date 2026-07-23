
(async()=>{
 const s=await GV.requireAuth();if(!s)return;
 const user=s.user;
 const {data:profile}=await GV.client.from("profiles").select("*").eq("id",user.id).maybeSingle();
 const {data:save}=await GV.client.from("game_saves").select("player_level,xp,coins,updated_at").eq("user_id",user.id).maybeSingle();
 const put=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??"—"};
 put("displayName",GV.safeName(profile,user));put("username",profile?.username||"—");put("email",user.email);
 put("joined",new Date(user.created_at).toLocaleDateString());put("level",save?.player_level||1);
 put("xp",Math.floor(save?.xp||0));put("coins",Math.floor(save?.coins||0));put("lastSave",save?.updated_at?new Date(save.updated_at).toLocaleString():"No cloud save");
 document.getElementById("logout")?.addEventListener("click",async()=>{await GV.client.auth.signOut();location.href="index.html"});
})();
