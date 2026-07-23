
const music=document.getElementById("music"),effects=document.getElementById("effects"),motion=document.getElementById("motion");
const settings=JSON.parse(localStorage.getItem("gvSettings")||'{"music":true,"effects":true,"motion":true}');
music.checked=settings.music;effects.checked=settings.effects;motion.checked=settings.motion;
document.getElementById("settingsForm").addEventListener("change",()=>{
 const next={music:music.checked,effects:effects.checked,motion:motion.checked};
 localStorage.setItem("gvSettings",JSON.stringify(next));
 document.getElementById("settingsStatus").textContent="Settings saved on this device.";
});
