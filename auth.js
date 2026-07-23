
(() => {
 const GV=window.GV;
 const page=document.body.dataset.page;
 const status=(m)=>GV.setStatus("formStatus",m);
 const value=(id)=>document.getElementById(id)?.value.trim()||"";

 async function signIn(){
  if(!GV.configured)return status("Supabase is not configured. Keep your existing config.js beside these files.");
  const email=value("email"),password=document.getElementById("password")?.value||"";
  if(!email)return status("Enter your email address.");
  if(!password)return status("Enter your password.");
  status("Signing in…");
  const {error}=await GV.client.auth.signInWithPassword({email,password});
  if(error)return status(error.message);
  const next=new URLSearchParams(location.search).get("next")||"play.html";
  location.href=next;
 }

 async function signUp(){
  if(!GV.configured)return status("Supabase is not configured. Keep your existing config.js beside these files.");
  const username=value("username").toLowerCase();
  const displayName=value("displayName");
  const email=value("email");
  const password=document.getElementById("password")?.value||"";
  const confirm=document.getElementById("confirmPassword")?.value||"";
  const terms=document.getElementById("terms")?.checked;
  if(!/^[a-z0-9_]{3,20}$/.test(username))return status("Username must be 3–20 characters using letters, numbers, or underscores.");
  if(displayName.length<2)return status("Enter a display name.");
  if(!email)return status("Enter your email address.");
  if(password.length<6)return status("Password must contain at least 6 characters.");
  if(password!==confirm)return status("Passwords do not match.");
  if(!terms)return status("Accept the Terms to create an account.");
  status("Checking username…");
  const {data:existing,error:checkError}=await GV.client.from("profiles").select("username").eq("username",username).maybeSingle();
  if(checkError && checkError.code!=="PGRST116")return status(checkError.message);
  if(existing)return status("That username is already taken.");
  status("Creating your account…");
  const {data,error}=await GV.client.auth.signUp({
   email,password,
   options:{data:{username,display_name:displayName}}
  });
  if(error)return status(error.message);
  if(data.user){
   const {error:profileError}=await GV.client.from("profiles").upsert({
    id:data.user.id,username,display_name:displayName
   });
   if(profileError)return status("Account created, but profile setup failed: "+profileError.message);
  }
  if(data.session) location.href="play.html";
  else status("Account created. Check your email to confirm it, then log in.");
 }

 async function resetPassword(){
  if(!GV.configured)return status("Supabase is not configured.");
  const email=value("email");
  if(!email)return status("Enter your email address.");
  const redirectTo=new URL("reset-password.html",location.href).href;
  status("Sending reset email…");
  const {error}=await GV.client.auth.resetPasswordForEmail(email,{redirectTo});
  status(error?error.message:"Password reset email sent.");
 }

 async function updatePassword(){
  if(!GV.configured)return status("Supabase is not configured.");
  const password=document.getElementById("password")?.value||"";
  const confirm=document.getElementById("confirmPassword")?.value||"";
  if(password.length<6)return status("Password must contain at least 6 characters.");
  if(password!==confirm)return status("Passwords do not match.");
  const {error}=await GV.client.auth.updateUser({password});
  if(error)return status(error.message);
  status("Password updated. You can now log in.");
  setTimeout(()=>location.href="login.html",1200);
 }

 document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("loginForm")?.addEventListener("submit",e=>{e.preventDefault();signIn()});
  document.getElementById("signupForm")?.addEventListener("submit",e=>{e.preventDefault();signUp()});
  document.getElementById("forgotForm")?.addEventListener("submit",e=>{e.preventDefault();resetPassword()});
  document.getElementById("resetForm")?.addEventListener("submit",e=>{e.preventDefault();updatePassword()});
 });
})();
