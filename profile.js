
(async () => {
  const session = await GV.requireAuth();
  if (!session) return;

  const user = session.user;
  const { data: player, error } = await GV.client
    .from("game_saves")
    .select("username,display_name,player_level,xp,coins,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const put = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "—";
  };

  if (error) {
    put("displayName", "Profile error");
    put("username", error.message);
  } else {
    put("displayName", player?.display_name || user.user_metadata?.display_name || "Player");
    put("username", player?.username || user.user_metadata?.username || "—");
    put("email", user.email);
    put("joined", new Date(user.created_at).toLocaleDateString());
    put("level", player?.player_level || 1);
    put("xp", Math.floor(player?.xp || 0));
    put("coins", Math.floor(player?.coins || 0));
    put("lastSave", player?.updated_at ? new Date(player.updated_at).toLocaleString() : "No cloud save");
  }

  document.getElementById("logout")?.addEventListener("click", async () => {
    await GV.client.auth.signOut();
    location.href = "index.html";
  });
})();
