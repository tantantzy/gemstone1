
(() => {
  const GV = window.GV;

  async function getUser() {
    const session = await GV.session();
    return session?.user || null;
  }

  function playerIdentity(user) {
    const metadata = user?.user_metadata || {};
    return {
      username: String(metadata.username || user.email?.split("@")[0] || "player").toLowerCase(),
      display_name: String(metadata.display_name || metadata.username || user.email?.split("@")[0] || "Player")
    };
  }

  async function ensurePlayerRow() {
    const user = await getUser();
    if (!GV.client || !user) return null;

    const { data, error } = await GV.client
      .from("game_saves")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const identity = playerIdentity(user);
    const { data: created, error: createError } = await GV.client
      .from("game_saves")
      .insert({
        user_id: user.id,
        username: identity.username,
        display_name: identity.display_name,
        player_level: 1,
        xp: 0,
        coins: 0,
        game_state: {},
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (createError) throw createError;
    return created;
  }

  async function saveCloud(silent = false) {
    try {
      const user = await getUser();
      if (!GV.client || !user) {
        if (!silent) window.GemGame?.notify("Log in to use cloud saves");
        return false;
      }

      const state = window.GemGame?.getState();
      if (!state) return false;

      const identity = playerIdentity(user);
      const { error } = await GV.client.from("game_saves").upsert({
        user_id: user.id,
        username: identity.username,
        display_name: identity.display_name,
        game_state: state,
        player_level: state.level || 1,
        xp: state.xp || 0,
        coins: state.coins || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

      if (error) throw error;
      if (!silent) window.GemGame?.notify("Saved locally and to cloud");
      return true;
    } catch (error) {
      if (!silent) window.GemGame?.notify(error.message || "Cloud save failed");
      return false;
    }
  }

  async function loadCloud(silent = false) {
    try {
      const row = await ensurePlayerRow();
      if (!row) return false;

      if (row.game_state && Object.keys(row.game_state).length) {
        window.GemGame?.setState(row.game_state);
        if (!silent) window.GemGame?.notify("Cloud save loaded");
        return true;
      }

      if (!silent) window.GemGame?.notify("No cloud save yet");
      return false;
    } catch (error) {
      if (!silent) window.GemGame?.notify(error.message || "Cloud load failed");
      return false;
    }
  }

  window.GemCloud = { saveCloud, loadCloud, ensurePlayerRow };
})();
