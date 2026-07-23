
(async () => {
  const status = document.getElementById("boardStatus");
  const body = document.getElementById("boardBody");

  if (!GV.configured) {
    status.textContent = "Supabase is not configured.";
    return;
  }

  const { data, error } = await GV.client
    .from("game_saves")
    .select("username,display_name,player_level,coins")
    .order("player_level", { ascending: false })
    .order("coins", { ascending: false })
    .limit(100);

  if (error) {
    status.textContent = error.message;
    return;
  }

  body.innerHTML = "";
  (data || []).forEach((player, index) => {
    const row = document.createElement("tr");
    const safeName = player.display_name || player.username || "Player";
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(safeName)}</td>
      <td>${Number(player.player_level || 1)}</td>
      <td>${Math.floor(Number(player.coins || 0)).toLocaleString()}</td>
    `;
    body.appendChild(row);
  });

  status.textContent = data?.length ? "" : "No ranked players yet.";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }
})();
