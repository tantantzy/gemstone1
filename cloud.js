(() => {
  const config = window.GEMSTONE_CONFIG || {};
  const isConfigured = Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_") &&
    !config.supabaseAnonKey.includes("YOUR_") &&
    window.supabase
  );

  let client = null;
  let currentUser = null;
  const $ = (id) => document.getElementById(id);

  function setStatus(message) {
    const element = $("cloudStatus");
    if (element) element.textContent = message;
  }

  let lastHeaderTrigger = null;

  function openAccount(mode = "login", trigger = null) {
    lastHeaderTrigger = trigger || document.activeElement;
    const modal = $("authModal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("show");
    if (!currentUser) {
      setStatus(mode === "signup"
        ? "Create a new account using your email and password."
        : "Enter your account email and password to sign in.");
    }
    requestAnimationFrame(() => {
      const target = currentUser
        ? $("cloudSaveBtn")
        : mode === "signup" ? $("authEmail") : $("authEmail");
      target?.focus();
    });
  }

  function closeAccount() {
    const modal = $("authModal");
    if (!modal) return;
    // Move focus outside the dialog before hiding it. This prevents the
    // browser's aria-hidden accessibility warning.
    if (lastHeaderTrigger && typeof lastHeaderTrigger.focus === "function") {
      lastHeaderTrigger.focus();
    } else {
      $("loginHeaderBtn")?.focus();
    }
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  // Inline fallback used by the button in index.html.
  window.openPlayerAccount = openAccount;

  function updateUI() {
    const signedIn = Boolean(currentUser);
    $("signedOutPanel")?.classList.toggle("hidden", signedIn);
    $("signedInPanel")?.classList.toggle("hidden", !signedIn);
    if ($("accountEmail")) $("accountEmail").textContent = currentUser?.email || "";
    $("signedOutHeaderActions")?.classList.toggle("hidden", signedIn);
    $("signedInHeaderActions")?.classList.toggle("hidden", !signedIn);
    if ($("accountBtn")) {
      $("accountBtn").textContent = signedIn ? `👤 ${currentUser.email}` : "👤 Account";
    }
  }

  function getCredentials() {
    const email = $("authEmail")?.value.trim() || "";
    const password = $("authPassword")?.value || "";
    if (!email) {
      setStatus("Enter your email address.");
      return null;
    }
    if (password.length < 6) {
      setStatus("Password must contain at least 6 characters.");
      return null;
    }
    return { email, password };
  }

  async function signUp() {
    if (!client) return setStatus("Add your Supabase settings to config.js first.");
    const credentials = getCredentials();
    if (!credentials) return;

    setStatus("Creating account…");
    const { data, error } = await client.auth.signUp(credentials);
    if (error) {
      console.error("Signup error:", error);
      return setStatus(error.message);
    }

    currentUser = data.user || null;
    updateUI();
    setStatus(data.session
      ? "Account created and signed in."
      : "Account created. Check your email to confirm it.");
  }

  async function signIn() {
    if (!client) return setStatus("Add your Supabase settings to config.js first.");
    const credentials = getCredentials();
    if (!credentials) return;

    setStatus("Signing in…");
    const { data, error } = await client.auth.signInWithPassword(credentials);
    if (error) {
      console.error("Sign-in error:", error);
      return setStatus(error.message);
    }

    currentUser = data.user;
    updateUI();
    setStatus("Signed in.");
    await loadCloud(true);
  }

  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) return setStatus(error.message);
    currentUser = null;
    updateUI();
    setStatus("Signed out. Guest mode is active.");
  }

  async function saveCloud(silent = false) {
    if (!client || !currentUser) {
      if (!silent) setStatus("Sign in before saving to cloud.");
      return false;
    }
    if (!window.GemGame) return false;

    const state = window.GemGame.getState();
    const { error } = await client.from("game_saves").upsert({
      user_id: currentUser.id,
      player_level: state.level || 1,
      xp: state.xp || 0,
      coins: state.coins || 0,
      game_state: state,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    if (error) {
      setStatus(`Cloud save failed: ${error.message}`);
      return false;
    }
    if (!silent) {
      setStatus("Cloud save complete.");
      window.GemGame.notify("Saved to cloud");
    }
    return true;
  }

  async function loadCloud(silent = false) {
    if (!client || !currentUser) {
      if (!silent) setStatus("Sign in before loading cloud save.");
      return false;
    }

    const { data, error } = await client
      .from("game_saves")
      .select("game_state, updated_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      setStatus(`Cloud load failed: ${error.message}`);
      return false;
    }
    if (!data?.game_state) {
      if (!silent) setStatus("No cloud save exists yet.");
      return false;
    }

    window.GemGame?.setState(data.game_state);
    setStatus("Cloud save loaded.");
    return true;
  }

  async function initialize() {
    updateUI();

    $("loginHeaderBtn")?.addEventListener("click", (event) => openAccount("login", event.currentTarget));
    $("signupHeaderBtn")?.addEventListener("click", (event) => openAccount("signup", event.currentTarget));
    $("accountBtn")?.addEventListener("click", (event) => openAccount("account", event.currentTarget));
    $("closeAuthBtn")?.addEventListener("click", closeAccount);
    $("authModal")?.addEventListener("click", (event) => {
      if (event.target === $("authModal")) closeAccount();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && $("authModal")?.classList.contains("show")) closeAccount();
    });
    $("signUpBtn")?.addEventListener("click", signUp);
    $("signInBtn")?.addEventListener("click", signIn);
    $("signOutBtn")?.addEventListener("click", signOut);
    $("cloudSaveBtn")?.addEventListener("click", () => saveCloud(false));
    $("cloudLoadBtn")?.addEventListener("click", () => loadCloud(false));

    if (!isConfigured) {
      setStatus("Supabase is not configured. Guest mode is active.");
      return;
    }

    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data, error } = await client.auth.getSession();
    if (error) console.error("Session error:", error);
    currentUser = data?.session?.user || null;
    updateUI();
    setStatus(currentUser ? "Cloud saving is available." : "Guest mode is active.");

    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateUI();
    });

    setInterval(() => saveCloud(true), 30000);
  }

  window.GemCloud = { initialize, saveCloud, loadCloud, openAccount, closeAccount };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
