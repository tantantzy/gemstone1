
(async()=>{
 if(!GV.configured){document.getElementById("boardStatus").textContent="Supabase is not configured.";return}
 const {data,error}=await GV.client.from("leaderboard").select("*").limit(100);
 if(error){document.getElementById("boardStatus").textContent=error.message;return}
 const body=document.getElementById("boardBody");
 body.innerHTML="";
 (data||[]).forEach((p,i)=>{
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${i+1}</td><td>${p.display_name||p.username}</td><td>${p.player_level}</td><td>${Math.floor(p.coins||0).toLocaleString()}</td>`;
  body.appendChild(tr)
 });
 document.getElementById("boardStatus").textContent=data?.length?"":"No ranked players yet.";
})();
