const FACTORIES=[
 {name:"Quartz",icon:"◇",color:"#dff8ff",levelReq:1,base:1,price:1,unlockCoins:0,unlock:{}},
 {name:"Amethyst",icon:"◆",color:"#b95cff",levelReq:3,base:5,price:3,unlockCoins:300,unlock:{Quartz:120}},
 {name:"Ruby",icon:"♦",color:"#ff405d",levelReq:6,base:10,price:7,unlockCoins:1200,unlock:{Quartz:250,Amethyst:120}},
 {name:"Sapphire",icon:"⬙",color:"#43a9ff",levelReq:10,base:20,price:15,unlockCoins:5000,unlock:{Quartz:700,Amethyst:350,Ruby:180}},
 {name:"Emerald",icon:"⬘",color:"#48e878",levelReq:15,base:35,price:30,unlockCoins:16000,unlock:{Amethyst:900,Ruby:500,Sapphire:250}},
 {name:"Topaz",icon:"⬗",color:"#ffd447",levelReq:22,base:55,price:60,unlockCoins:50000,unlock:{Ruby:1500,Sapphire:850,Emerald:400}},
 {name:"Opal",icon:"✦",color:"#ff8fe8",levelReq:30,base:80,price:120,unlockCoins:160000,unlock:{Sapphire:2500,Emerald:1300,Topaz:700}},
 {name:"Diamond",icon:"💎",color:"#62efff",levelReq:40,base:120,price:250,unlockCoins:600000,unlock:{Emerald:4000,Topaz:2200,Opal:1100}}
];

function newState(){
 const s={coins:0,level:1,xp:0,gems:{},stored:{},unlocked:{Quartz:true},machines:{},mining:{},mineRemaining:{},boostUntil:0,last:Date.now()};
 FACTORIES.forEach(f=>{
  s.gems[f.name]=0;
  s.stored[f.name]=0;
  s.mining[f.name]=false;
  s.mineRemaining[f.name]=0;
  s.machines[f.name]=[
   {open:true,level:1},
   {open:false,level:1},
   {open:false,level:1}
  ];
 });
 return s;
}
let CURRENT_USER_ID=null;
let S=newState();

function normalizeState(state){
 const next=(state&&typeof state==="object")?state:newState();
 next.coins??=0;
 next.level??=1;
 next.xp??=0;
 next.gems??={};
 next.stored??={};
 next.unlocked??={Quartz:true};
 next.machines??={};
 next.boostUntil??=0;
 next.mining??={};
 next.mineRemaining??={};
 next.last??=Date.now();

 FACTORIES.forEach(f=>{
  next.gems[f.name]??=0;
  next.stored[f.name]??=0;
  next.mining[f.name]??=false;
  next.mineRemaining[f.name]??=0;
  next.machines[f.name]??=[
   {open:true,level:1},
   {open:false,level:1},
   {open:false,level:1}
  ];
 });

 next.unlocked.Quartz=true;
 return next;
}

function xpNeed(l){return Math.floor(80*Math.pow(l,1.55))}
function boost(){return Date.now()<S.boostUntil?2:1}
function machineRate(f,m){
 if(!m.open)return 0;
 const growth=f.levelReq<=6?1.24:f.levelReq<=22?1.18:1.14;
 return f.base*Math.pow(growth,m.level-1);
}
function totalGps(f){return S.machines[f.name].reduce((a,m)=>a+machineRate(f,m),0)*boost()}
function storageCapacity(f){
 const openCount=S.machines[f.name].filter(m=>m.open).length;
 const totalLevels=S.machines[f.name].reduce((a,m)=>a+(m.open?m.level:0),0);
 const base=f.levelReq<=6?120:f.levelReq<=22?300:700;
 return Math.floor(base*(1+openCount*.55+totalLevels*.28));
}
function machineGemCost(f,index){
 const m=S.machines[f.name][index];
 const base=f.levelReq<=6?8:20;
 return Math.floor(base*(index+1)*Math.pow(f.levelReq<=6?1.42:f.levelReq<=22?1.62:1.82,m.level-1));
}
function machineCoinCost(f,index){
 const m=S.machines[f.name][index];
 const base=f.levelReq<=6?40:180;
 return Math.floor(base*(index+1)*Math.pow(f.levelReq<=6?1.5:f.levelReq<=22?1.7:1.9,m.level-1));
}
function machineUnlockGem(f,index){return Math.floor((f.levelReq<=6?45:120)*index*Math.pow(1.7,index-1))}
function machineUnlockCoins(f,index){return Math.floor((f.levelReq<=6?180:700)*index*Math.pow(2,index-1))}
function fmt(n){
 if(n>=1e9)return(n/1e9).toFixed(1)+"B";
 if(n>=1e6)return(n/1e6).toFixed(1)+"M";
 if(n>=1e3)return(n/1e3).toFixed(1)+"k";
 return Math.floor(n).toString()
}
function canOpenFactory(f){
 if(S.level<f.levelReq||S.coins<f.unlockCoins)return false;
 return Object.entries(f.unlock).every(([k,v])=>(S.gems[k]||0)>=v)
}
function openFactory(f){
 if(!canOpenFactory(f))return;
 S.coins-=f.unlockCoins;
 Object.entries(f.unlock).forEach(([k,v])=>S.gems[k]-=v);
 S.unlocked[f.name]=true;
 S.machines[f.name]=[{open:true,level:1},{open:false,level:1},{open:false,level:1}];
 S.stored[f.name]=0;
 S.mining[f.name]=false;
 S.mineRemaining[f.name]=0;
 toast(f.name+" factory opened");
 render()
}
function openMachine(f,index){
 const gem=machineUnlockGem(f,index),coin=machineUnlockCoins(f,index);
 if(S.gems[f.name]<gem||S.coins<coin){toast("Need more "+f.name+" and coins");return}
 S.gems[f.name]-=gem;S.coins-=coin;S.machines[f.name][index].open=true;
 toast("Machine "+(index+1)+" opened");render()
}
function upgradeMachine(f,index){
 const m=S.machines[f.name][index];
 if(!m.open)return;
 const gem=machineGemCost(f,index),coin=machineCoinCost(f,index);
 if(S.gems[f.name]<gem||S.coins<coin){toast("Not enough materials");return}
 S.gems[f.name]-=gem;S.coins-=coin;m.level++;
 toast(f.name+" machine "+(index+1)+" upgraded — production increased");render()
}
function sell(f){
 const amount=Math.floor(S.gems[f.name]*.15);
 if(amount<1){toast("No gems to sell");return}
 S.gems[f.name]-=amount;S.coins+=amount*f.price;toast("Sold "+fmt(amount)+" "+f.name);renderTop()
}
function addXp(n){
 S.xp+=n;
 while(S.xp>=xpNeed(S.level)){
  S.xp-=xpNeed(S.level);S.level++;
  toast("Player level "+S.level)
 }
}
function collectFactory(f){
 stopMining(f);
 const amount=Math.floor(S.stored[f.name]||0);
 if(amount<1){toast("No "+f.name+" ready to collect");return}
 S.stored[f.name]-=amount;
 S.gems[f.name]+=amount;
 // 2 gemstones = 1 XP
 addXp(amount/2);
 toast("Collected "+fmt(amount)+" "+f.name);
 render()
}
function isMining(f){return Boolean(S.mining?.[f.name])}
function mineCapacity(f){
 const ms=S.machines[f.name],open=ms.filter(m=>m.open).length;
 const levels=ms.reduce((a,m)=>a+(m.open?m.level:0),0);
 const base=f.levelReq<=6?150:f.levelReq<=22?450:1100;
 return Math.floor(base*(1+open*.55+levels*.32))
}
function remainingMine(f){
 return Math.max(0,Math.min(mineCapacity(f),Number(S.mineRemaining?.[f.name]||0)))
}
function startMining(f){
 if(!S.unlocked[f.name])return;
 if(remainingMine(f)<=0)S.mineRemaining[f.name]=mineCapacity(f);
 S.mining[f.name]=true;save(true);render();toast(f.name+" mining started")
}
function stopMining(f){S.mining[f.name]=false}
function requirementText(f){
 return Object.entries(f.unlock).map(([k,v])=>fmt(v)+" "+k).concat(f.unlockCoins?[fmt(f.unlockCoins)+" coins"]:[]).join(" • ")
}
function machineCard(f,index){
 const m=S.machines[f.name][index],card=document.createElement("div");card.className="machine-card";
 if(m.open){
  card.innerHTML=`
   <div class="machine ${isMining(f)?"running":""}"><div class="head"></div><div class="window"></div><span class="machine-level">${m.level}</span></div>
   <div class="machine-label">Machine ${index+1}</div>
   <button class="small-btn">Upgrade</button>
   <div class="cost">${fmt(machineGemCost(f,index))} ${f.name}<br>${fmt(machineCoinCost(f,index))} coins</div>`;
  card.querySelector("button").onclick=()=>upgradeMachine(f,index)
 }else{
  card.innerHTML=`
   <div class="machine locked-machine"><div class="head"></div><div class="window"></div></div>
   <div class="machine-label">Machine ${index+1}</div>
   <button class="small-btn gold">Open</button>
   <div class="cost">${fmt(machineUnlockGem(f,index))} ${f.name}<br>${fmt(machineUnlockCoins(f,index))} coins</div>`;
  card.querySelector("button").onclick=()=>openMachine(f,index)
 }
 return card
}
function zone(f){
 const z=document.createElement("section");z.className="zone"+(S.unlocked[f.name]?"":" locked");z.style.setProperty("--gem",f.color);
 if(S.unlocked[f.name]){
  z.innerHTML=`
   <div class="zone-head"><h2>${f.icon} ${f.name} Factory</h2><span class="badge">Player Lv ${f.levelReq}</span></div>
   <div class="machine-row"></div>
   <div class="conveyor">
    <i class="gem" style="--speed:${Math.max(2.1,5-Math.log2(totalGps(f)+1))}s"></i>
    <i class="gem" style="--speed:${Math.max(2.1,5-Math.log2(totalGps(f)+1))}s"></i>
    <i class="gem" style="--speed:${Math.max(2.1,5-Math.log2(totalGps(f)+1))}s"></i>
    <i class="gem" style="--speed:${Math.max(2.1,5-Math.log2(totalGps(f)+1))}s"></i>
   </div>
   <div class="storage-wrap">
    <div class="storage-line"><span>Mine capacity remaining</span><span data-storage-text="${f.name}">${fmt(remainingMine(f))} / ${fmt(mineCapacity(f))}</span></div>
    <div class="storage-bar"><i data-storage-bar="${f.name}" style="width:${Math.min(100,remainingMine(f)/mineCapacity(f)*100)}%"></i></div>
    <div class="mined-output">Ready to collect: <strong data-output-text="${f.name}">${fmt(S.stored[f.name]||0)}</strong></div>
   </div>
   <div class="summary">
    <div class="production" data-production="${f.name}">
     <strong>${fmt(totalGps(f))} gems/sec</strong>
     Inventory: ${fmt(S.gems[f.name])}<br>
     ${isMining(f)?'Mine capacity is decreasing while gems are produced.':remainingMine(f)<=0?'<span class="full-note">Mine depleted — press Mine Again.</span>':'Factory paused — press Start Mining.'}
    </div>
    <div class="factory-actions">
     <button class="run-btn" data-run="${f.name}" ${isMining(f)?"disabled":""}>${isMining(f)?"Mining…":remainingMine(f)<=0?"Mine Again":"Start Mining"}</button>
     <button class="collect-btn" data-collect="${f.name}" ${(S.stored[f.name]||0)<1?"disabled":""}>Collect</button>
    </div>
   </div>`;
  const row=z.querySelector(".machine-row");
  [0,1,2].forEach(i=>row.appendChild(machineCard(f,i)));
  z.querySelector(".run-btn").onclick=()=>startMining(f);
  z.querySelector(".collect-btn").onclick=()=>collectFactory(f);
  z.querySelector(".sell-btn").onclick=()=>sell(f)
 }else{
  z.innerHTML=`
   <div class="zone-head"><h2>🔒 ${f.name} Factory</h2><span class="badge">Requires Lv ${f.levelReq}</span></div>
   <div class="lockbox"><p>${requirementText(f)||"Free"}</p><button class="open-btn" ${canOpenFactory(f)?"":"disabled"}>Open Factory</button></div>`;
  z.querySelector(".open-btn").onclick=()=>openFactory(f)
 }
 return z
}
function render(){
 const w=document.getElementById("world");w.querySelectorAll(".zone").forEach(e=>e.remove());
 FACTORIES.forEach(f=>w.appendChild(zone(f)));renderTop()
}
function renderTop(){
 document.getElementById("levelText").textContent=S.level+" ("+fmt(S.xp)+"/"+fmt(xpNeed(S.level))+" XP)";
 document.getElementById("xpFill").style.width=Math.min(100,S.xp/xpNeed(S.level)*100)+"%";
 document.getElementById("coinsText").textContent=fmt(S.coins);
 const r=document.getElementById("resources");r.innerHTML="";
 FACTORIES.filter(f=>S.unlocked[f.name]).forEach(f=>{
  const d=document.createElement("div");d.className="res";d.innerHTML=`<span style="color:${f.color}">${f.icon}</span><b>${f.name}<br>${fmt(S.gems[f.name])}</b>`;r.appendChild(d)
 });
 const left=Math.max(0,Math.ceil((S.boostUntil-Date.now())/1000));
 updateDailyReward();
 document.getElementById("boostBtn").innerHTML=left?`<span>⚡ ACTIVE</span><b>×2</b><span>${left}s</span>`:`<span>▶ AD</span><b>×2</b><span>BOOST</span>`;

 FACTORIES.filter(f=>S.unlocked[f.name]).forEach(f=>{
  const stored=S.stored[f.name]||0;
  const cap=storageCapacity(f);
  const full=stored>=cap-0.001;

  const remaining=remainingMine(f),maximum=mineCapacity(f);
  const text=document.querySelector(`[data-storage-text="${f.name}"]`);
  if(text)text.textContent=`${fmt(remaining)} / ${fmt(maximum)}`;
  const bar=document.querySelector(`[data-storage-bar="${f.name}"]`);
  if(bar)bar.style.width=Math.min(100,remaining/maximum*100)+"%";
  const output=document.querySelector(`[data-output-text="${f.name}"]`);
  if(output)output.textContent=fmt(stored);

  const production=document.querySelector(`[data-production="${f.name}"]`);
  if(production){
   const status=isMining(f)?'Mine capacity is decreasing while gems are produced.':remaining<=0?'<span class="full-note">Mine depleted — press Mine Again.</span>':'Factory paused — press Start Mining.';
   production.innerHTML=`<strong>${fmt(totalGps(f))} gems/sec</strong>Inventory: ${fmt(S.gems[f.name])}<br>${status}`;
  }

  const run=document.querySelector(`[data-run="${f.name}"]`);
  if(run){run.disabled=isMining(f);run.textContent=isMining(f)?"Mining…":remaining<=0?"Mine Again":"Start Mining"}
  const collect=document.querySelector(`[data-collect="${f.name}"]`);
  if(collect)collect.disabled=stored<1;
 });
}
function tick(){
 const now=Date.now(),dt=Math.min(1,(now-S.last)/1000);S.last=now;
 FACTORIES.forEach(f=>{
  if(!S.unlocked[f.name]||!isMining(f))return;
  const remaining=remainingMine(f);
  if(remaining<=0){S.mineRemaining[f.name]=0;stopMining(f);return}
  const mined=Math.min(remaining,totalGps(f)*dt);
  S.mineRemaining[f.name]=Math.max(0,remaining-mined);
  S.stored[f.name]=(S.stored[f.name]||0)+mined;
  if(S.mineRemaining[f.name]<=.001){S.mineRemaining[f.name]=0;stopMining(f)}
 });
 renderTop();updateLive();
}

function activateBoost(){S.boostUntil=Date.now()+60000;toast("×2 production active for 60 seconds");render()}
function saveKey(){
 return CURRENT_USER_ID?`gemValleyCompact:${CURRENT_USER_ID}`:null
}
function save(silent=false){
 const key=saveKey();
 if(!key)return;
 S.last=Date.now();
 localStorage.setItem(key,JSON.stringify(S));
 if(!silent)toast("Game saved locally")
}
function applyOfflineProgress(state){
 const next=normalizeState(state),now=Date.now(),offline=Math.min((now-(next.last||now))/1000,28800);
 FACTORIES.forEach(f=>{
  if(!next.unlocked?.[f.name]||!next.mining?.[f.name])return;
  const ms=next.machines?.[f.name]||[];let rate=0;
  ms.forEach(m=>{if(m.open){const growth=f.levelReq<=6?1.24:f.levelReq<=22?1.18:1.14;rate+=f.base*Math.pow(growth,(m.level||1)-1)}});
  const open=ms.filter(m=>m.open).length,levels=ms.reduce((a,m)=>a+(m.open?(m.level||1):0),0);
  const base=f.levelReq<=6?150:f.levelReq<=22?450:1100,maximum=Math.floor(base*(1+open*.55+levels*.32));
  const remaining=Math.max(0,Math.min(maximum,Number(next.mineRemaining?.[f.name]||0)));
  const mined=Math.min(remaining,rate*offline*.5);
  next.mineRemaining[f.name]=Math.max(0,remaining-mined);next.stored[f.name]=(next.stored[f.name]||0)+mined;
  if(next.mineRemaining[f.name]<=.001){next.mineRemaining[f.name]=0;next.mining[f.name]=false}
 });
 next.last=now;return next
}

function loadForCurrentUser(){
 const key=saveKey();
 if(!key)return newState();
 try{
  const raw=localStorage.getItem(key);
  if(!raw)return newState();
  return applyOfflineProgress(JSON.parse(raw))
 }catch{
  return newState()
 }
}
let toastTimer;
function toast(t){
 const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),1700)
}
window.GemGame={
 getState:()=>JSON.parse(JSON.stringify(S)),
 setState:(n)=>{
  S=normalizeState(n);
  S.last=Date.now();
  save(true);
  render()
 },
 resetState:()=>{
  S=newState();
  save(true);
  render()
 },
 notify:(m)=>toast(m)
};
document.getElementById("boostBtn").onclick=activateBoost;
(async()=>{
 const session=await window.GV?.requireAuth();
 if(!session)return;

 CURRENT_USER_ID=session.user.id;
 S=loadForCurrentUser();

 const account=document.getElementById("accountEmail");
 if(account)account.textContent=session.user.email;

 document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  save(true);
  await window.GemCloud?.saveCloud(true);
  await window.GV.client.auth.signOut();
  location.href="index.html";
 });

 // Cloud data belongs only to this Supabase user.
 // If this account has no cloud state, the fresh/user-specific local state remains.
 const cloudLoaded=await window.GemCloud?.loadCloud(true);
 if(!cloudLoaded){
  save(true);
  await window.GemCloud?.saveCloud(true);
 }

 render();
 setInterval(tick,250);
 setInterval(()=>save(true),10000);
 setInterval(()=>window.GemCloud?.saveCloud(true),30000);
})();