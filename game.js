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
 const s={coins:0,level:1,xp:0,gems:{},stored:{},unlocked:{Quartz:true},machines:{},boostUntil:0,last:Date.now()};
 FACTORIES.forEach(f=>{
  s.gems[f.name]=0;
  s.stored[f.name]=0;
  s.machines[f.name]=[
   {open:true,level:1},
   {open:false,level:1},
   {open:false,level:1}
  ];
 });
 return s;
}
let S=load();
FACTORIES.forEach(f=>{
 S.gems[f.name]??=0;
 S.stored??={};
 S.stored[f.name]??=0;
 S.machines[f.name]??=[{open:true,level:1},{open:false,level:1},{open:false,level:1}];
});
S.unlocked.Quartz=true;

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
 const amount=Math.floor(S.stored[f.name]||0);
 if(amount<1){toast("No "+f.name+" ready to collect");return}
 S.stored[f.name]-=amount;
 S.gems[f.name]+=amount;
 // 2 gemstones = 1 XP
 addXp(amount/2);
 toast("Collected "+fmt(amount)+" "+f.name);
 render()
}
function requirementText(f){
 return Object.entries(f.unlock).map(([k,v])=>fmt(v)+" "+k).concat(f.unlockCoins?[fmt(f.unlockCoins)+" coins"]:[]).join(" • ")
}
function machineCard(f,index){
 const m=S.machines[f.name][index],card=document.createElement("div");card.className="machine-card";
 if(m.open){
  card.innerHTML=`
   <div class="machine running"><div class="head"></div><div class="window"></div><span class="machine-level">${m.level}</span></div>
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
    <div class="storage-line"><span>Factory storage</span><span data-storage-text="${f.name}" class="${(S.stored[f.name]||0)>=storageCapacity(f)?"full-note":""}">${fmt(S.stored[f.name]||0)} / ${fmt(storageCapacity(f))}</span></div>
    <div class="storage-bar"><i data-storage-bar="${f.name}" style="width:${Math.min(100,(S.stored[f.name]||0)/storageCapacity(f)*100)}%"></i></div>
   </div>
   <div class="summary">
    <div class="production" data-production="${f.name}"><strong>${fmt(totalGps(f))} gems/sec</strong>Inventory: ${fmt(S.gems[f.name])}<br>${(S.stored[f.name]||0)>=storageCapacity(f)?"Storage full — collect to resume":"Factory is mining into storage."}</div>
    <div style="display:grid;gap:5px">
     <button class="collect-btn" data-collect="${f.name}" ${(S.stored[f.name]||0)<1?"disabled":""}>Collect</button>
     <button class="sell-btn">Sell 15%</button>
    </div>
   </div>`;
  const row=z.querySelector(".machine-row");
  [0,1,2].forEach(i=>row.appendChild(machineCard(f,i)));
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
 document.getElementById("boostBtn").innerHTML=left?`<span>⚡ ACTIVE</span><b>×2</b><span>${left}s</span>`:`<span>▶ AD</span><b>×2</b><span>BOOST</span>`;

 FACTORIES.filter(f=>S.unlocked[f.name]).forEach(f=>{
  const stored=S.stored[f.name]||0;
  const cap=storageCapacity(f);
  const full=stored>=cap-0.001;

  const text=document.querySelector(`[data-storage-text="${f.name}"]`);
  if(text){
   text.textContent=`${fmt(stored)} / ${fmt(cap)}`;
   text.classList.toggle("full-note",full);
  }

  const bar=document.querySelector(`[data-storage-bar="${f.name}"]`);
  if(bar) bar.style.width=Math.min(100,stored/cap*100)+"%";

  const production=document.querySelector(`[data-production="${f.name}"]`);
  if(production){
   production.innerHTML=`<strong>${fmt(totalGps(f))} gems/sec</strong>Inventory: ${fmt(S.gems[f.name])}<br>${full?"Storage full — collect to resume":"Factory is mining into storage."}`;
  }

  const collect=document.querySelector(`[data-collect="${f.name}"]`);
  if(collect) collect.disabled=stored<1;
 });
}
function tick(){
 const now=Date.now(),dt=Math.min(2,(now-S.last)/1000);S.last=now;
 FACTORIES.forEach(f=>{
  if(S.unlocked[f.name]){
   const cap=storageCapacity(f);
   const room=Math.max(0,cap-(S.stored[f.name]||0));
   if(room>0){
    const amount=Math.min(room,totalGps(f)*dt);
    S.stored[f.name]=(S.stored[f.name]||0)+amount;
   }
  }
 });
 renderTop()
}
function activateBoost(){S.boostUntil=Date.now()+60000;toast("×2 production active for 60 seconds");render()}
function save(silent=false){localStorage.setItem("gemValleyCompact",JSON.stringify(S));if(!silent)toast("Game saved locally")}
function load(){
 try{
  const x=JSON.parse(localStorage.getItem("gemValleyCompact"));if(!x)return newState();
  const offline=Math.min((Date.now()-(x.last||Date.now()))/1000,28800);
  FACTORIES.forEach(f=>{
   if(x.unlocked?.[f.name]){
    const machines=x.machines?.[f.name]||[];
    let rate=0;
    machines.forEach(m=>{
     if(m.open){
      const growth=f.levelReq<=6?1.24:f.levelReq<=22?1.18:1.14;
      rate+=f.base*Math.pow(growth,(m.level||1)-1)
     }
    });
    x.stored??={};
    const openCount=machines.filter(m=>m.open).length;
    const totalLevels=machines.reduce((a,m)=>a+(m.open?(m.level||1):0),0);
    const baseCap=f.levelReq<=6?120:f.levelReq<=22?300:700;
    const cap=Math.floor(baseCap*(1+openCount*.55+totalLevels*.28));
    x.stored[f.name]=Math.min(cap,(x.stored[f.name]||0)+rate*offline*.5)
   }
  });
  x.last=Date.now();return x
 }catch{return newState()}
}
let toastTimer;
function toast(t){
 const e=document.getElementById("toast");e.textContent=t;e.classList.add("show");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),1700)
}
window.GemGame={getState:()=>JSON.parse(JSON.stringify(S)),setState:(n)=>{if(!n||typeof n!=="object")return;S=n;S.gems??={};S.stored??={};S.unlocked??={Quartz:true};S.machines??={};FACTORIES.forEach(f=>{S.gems[f.name]??=0;S.stored[f.name]??=0;S.machines[f.name]??=[{open:true,level:1},{open:false,level:1},{open:false,level:1}]});S.unlocked.Quartz=true;S.last=Date.now();save(true);render()},notify:(m)=>toast(m)};
document.getElementById("boostBtn").onclick=activateBoost;
document.getElementById("saveBtn").onclick=async()=>{save();if(window.GemCloud)await window.GemCloud.saveCloud(false)};
render();setInterval(tick,250);setInterval(()=>localStorage.setItem("gemValleyCompact",JSON.stringify(S)),10000);