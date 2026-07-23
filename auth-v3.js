
(() => {
  const GV = window.GV;
  const status = (message) => GV.setStatus("formStatus", message);
  const value = (id) => document.getElementById(id)?.value.trim() || "";

  async function signIn() {
    if (!GV.configured) {
      return status("Supabase is not configured. Keep your existing config.js beside these files.");
    }

    const email = value("email");
    const password = document.getElementById("password")?.value || "";

    if (!email) return status("Enter your email address.");
    if (!password) return status("Enter your password.");

    status("Signing in…");
    const { error } = await GV.client.auth.signInWithPassword({ email, password });

    if (error) return status(error.message);

    const next = new URLSearchParams(location.search).get("next") || "play.html";
    location.href = next;
  }

  async function usernameExists(username) {
    const { data, error } = await GV.client
      .from("game_saves")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return Boolean(data);
  }

  async function signUp() {
    if (!GV.configured) {
      return status("Supabase is not configured. Keep your existing config.js beside these files.");
    }

    const username = value("username").toLowerCase();
    const displayName = value("displayName");
    const email = value("email");
    const password = document.getElementById("password")?.value || "";
    const confirm = document.getElementById("confirmPassword")?.value || "";
    const terms = document.getElementById("terms")?.checked;

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return status("Username must be 3–20 characters using letters, numbers, or underscores.");
    }
    if (displayName.length < 2 || displayName.length > 32) {
      return status("Display name must contain 2–32 characters.");
    }
    if (!email) return status("Enter your email address.");
    if (password.length < 6) return status("Password must contain at least 6 characters.");
    if (password !== confirm) return status("Passwords do not match.");
    if (!terms) return status("Accept the Terms to create an account.");

    try {
      status("Checking username…");
      if (await usernameExists(username)) {
        return status("That username is already taken.");
      }

      status("Creating your account…");
      const { data, error } = await GV.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName
          }
        }
      });

      if (error) return status(error.message);
      if (!data.user) return status("Supabase did not return a new user.");

      // Insert immediately when email confirmation is disabled.
      // When confirmation is enabled, the database trigger creates this row instead.
      if (data.session) {
        const { error: saveError } = await GV.client.from("game_saves").upsert({
          user_id: data.user.id,
          username,
          display_name: displayName,
          player_level: 1,
          xp: 0,
          coins: 0,
          game_state: {},
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

        if (saveError) return status("Account created, but player setup failed: " + saveError.message);
        location.href = "play.html";
      } else {
        status("Account created. Check your email to confirm it, then log in.");
      }
    } catch (error) {
      status(error.message || "Registration failed.");
    }
  }

  async function resetPassword() {
    if (!GV.configured) return status("Supabase is not configured.");

    const email = value("email");
    if (!email) return status("Enter your email address.");

    const redirectTo = new URL("reset-password.html", location.href).href;
    status("Sending reset email…");

    const { error } = await GV.client.auth.resetPasswordForEmail(email, { redirectTo });
    status(error ? error.message : "Password reset email sent.");
  }

  async function updatePassword() {
    if (!GV.configured) return status("Supabase is not configured.");

    const password = document.getElementById("password")?.value || "";
    const confirm = document.getElementById("confirmPassword")?.value || "";

    if (password.length < 6) return status("Password must contain at least 6 characters.");
    if (password !== confirm) return status("Passwords do not match.");

    const { error } = await GV.client.auth.updateUser({ password });
    if (error) return status(error.message);

    status("Password updated. You can now log in.");
    setTimeout(() => location.href = "login.html", 1200);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      signIn();
    });

    document.getElementById("signupForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      signUp();
    });

    document.getElementById("forgotForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      resetPassword();
    });

    document.getElementById("resetForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      updatePassword();
    });
  });
})();
