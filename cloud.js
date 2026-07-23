
(() => {
 const GV=window.GV;
 async function getUser(){const s=await GV.session();return s?.user||null}
 async function saveCloud(silent=false){
  const user=await getUser();
  if(!GV.client||!user){if(!silent)window.GemGame?.notify("Log in to use cloud saves");return false}
  const state=window.GemGame?.getState();if(!state)return false;
  const {error}=await GV.client.from("game_saves").upsert({
   user_id:user.id,game_state:state,player_level:state.level||1,xp:state.xp||0,coins:state.coins||0,updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error){if(!silent)window.GemGame?.notify(error.message);return false}
  if(!silent)window.GemGame?.notify("Saved locally and to cloud");
  return true
 }
 async function loadCloud(silent=false){
  const user=await getUser();
  if(!GV.client||!user)return false;
  const {data,error}=await GV.client.from("game_saves").select("game_state").eq("user_id",user.id).maybeSingle();
  if(error){if(!silent)window.GemGame?.notify(error.message);return false}
  if(!data?.game_state){if(!silent)window.GemGame?.notify("No cloud save yet");return false}
  window.GemGame?.setState(data.game_state);
  if(!silent)window.GemGame?.notify("Cloud save loaded");
  return true
 }
 window.GemCloud={saveCloud,loadCloud};
})();
