(() => {
  const config = window.GEMSTONE_CONFIG || {};
  const status = document.getElementById("authPageStatus");
  const form = document.getElementById("standaloneAuthForm");
  const mode = document.body.dataset.authMode;
  const configured = Boolean(
    window.supabase && config.supabaseUrl && config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_") && !config.supabaseAnonKey.includes("YOUR_")
  );
  const setStatus = (message) => { if (status) status.textContent = message; };
  if (!configured) {
    setStatus("Supabase is not configured. Add your settings to config.js.");
    return;
  }
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password")?.value || "";
    if (!email) return setStatus("Enter your email address.");
    if (mode !== "reset" && password.length < 6) return setStatus("Password must contain at least 6 characters.");
    setStatus("Please wait…");
    let result;
    if (mode === "signup") result = await client.auth.signUp({ email, password });
    else if (mode === "reset") result = await client.auth.resetPasswordForEmail(email, { redirectTo: new URL("index.html", location.href).href });
    else result = await client.auth.signInWithPassword({ email, password });
    if (result.error) return setStatus(result.error.message);
    if (mode === "signup" && !result.data.session) return setStatus("Account created. Check your email to confirm it.");
    if (mode === "reset") return setStatus("Password reset email sent.");
    setStatus(mode === "signup" ? "Account created. Opening game…" : "Signed in. Opening game…");
    setTimeout(() => { location.href = "index.html"; }, 600);
  });
})();
