(() => {
  const FACTORIES = [
    { name: "Quartz", icon: "◇", sell: 2, levelReq: 1 },
    { name: "Amethyst", icon: "◆", sell: 6, levelReq: 3 },
    { name: "Ruby", icon: "♦", sell: 15, levelReq: 6 },
    { name: "Sapphire", icon: "◇", sell: 35, levelReq: 10 },
    { name: "Emerald", icon: "◇", sell: 80, levelReq: 15 },
    { name: "Topaz", icon: "◆", sell: 180, levelReq: 22 },
    { name: "Opal", icon: "◈", sell: 420, levelReq: 30 },
    { name: "Diamond", icon: "◆", sell: 1000, levelReq: 40 }
  ];

  let user = null;
  let state = null;

  const status = (message) => {
    const element = document.getElementById("storeStatus");
    if (element) element.textContent = message;
  };

  function saveKey() {
    return user ? `gemValleyCompact:${user.id}` : null;
  }

  function freshState() {
    const gems = {};
    const stored = {};
    const unlocked = { Quartz: true };
    const machines = {};
    const mining = {};

    FACTORIES.forEach((factory) => {
      gems[factory.name] = 0;
      stored[factory.name] = 0;
      machines[factory.name] = [
        { open: true, level: 1 },
        { open: false, level: 1 },
        { open: false, level: 1 }
      ];
      mining[factory.name] = false;
    });

    return {
      coins: 0,
      level: 1,
      xp: 0,
      gems,
      stored,
      unlocked,
      machines,
      mining,
      boostUntil: 0,
      last: Date.now()
    };
  }

  function normalizeState(input) {
    const next = input && typeof input === "object" ? input : freshState();
    next.coins ??= 0;
    next.level ??= 1;
    next.xp ??= 0;
    next.gems ??= {};
    next.stored ??= {};
    next.unlocked ??= { Quartz: true };
    next.machines ??= {};
    next.mining ??= {};
    next.boostUntil ??= 0;
    next.last ??= Date.now();

    FACTORIES.forEach((factory) => {
      next.gems[factory.name] ??= 0;
      next.stored[factory.name] ??= 0;
      next.unlocked[factory.name] ??= factory.name === "Quartz";
      next.mining[factory.name] ??= false;
      next.machines[factory.name] ??= [
        { open: true, level: 1 },
        { open: false, level: 1 },
        { open: false, level: 1 }
      ];
    });

    next.unlocked.Quartz = true;
    return next;
  }

  function format(value) {
    const number = Math.floor(Number(value) || 0);
    if (number >= 1e9) return `${(number / 1e9).toFixed(1)}B`;
    if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
    if (number >= 1e3) return `${(number / 1e3).toFixed(1)}k`;
    return number.toLocaleString();
  }

  function buyUnitPrice(factory) {
    return Math.max(5, Math.ceil(factory.sell * 2.5));
  }

  function sellUnitPrice(factory) {
    return factory.sell;
  }

  async function loadState() {
    const session = await GV.requireAuth();
    if (!session) return false;
    user = session.user;

    const localRaw = localStorage.getItem(saveKey());
    if (localRaw) {
      try {
        state = normalizeState(JSON.parse(localRaw));
      } catch {
        state = freshState();
      }
    } else {
      const { data, error } = await GV.client
        .from("game_saves")
        .select("game_state")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        status(error.message);
        state = freshState();
      } else {
        state = normalizeState(data?.game_state);
      }
    }

    return true;
  }

  async function persist(message) {
    state.last = Date.now();
    localStorage.setItem(saveKey(), JSON.stringify(state));

    const metadata = user.user_metadata || {};
    const username = String(metadata.username || user.email?.split("@")[0] || "player").toLowerCase();
    const displayName = String(metadata.display_name || metadata.username || user.email?.split("@")[0] || "Player");

    const { error } = await GV.client.from("game_saves").upsert({
      user_id: user.id,
      username,
      display_name: displayName,
      player_level: state.level || 1,
      xp: state.xp || 0,
      coins: state.coins || 0,
      game_state: state,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });

    status(error ? `Saved locally, but cloud save failed: ${error.message}` : message);
  }

  function buy(factory, quantity) {
    if (!state.unlocked[factory.name]) {
      status(`Unlock the ${factory.name} Factory before buying ${factory.name}.`);
      return;
    }

    const cost = buyUnitPrice(factory) * quantity;
    if (state.coins < cost) {
      status(`You need ${format(cost)} coins to buy ${quantity} ${factory.name}.`);
      return;
    }

    state.coins -= cost;
    state.gems[factory.name] += quantity;
    render();
    persist(`Bought ${quantity} ${factory.name} for ${format(cost)} coins.`);
  }

  function sell(factory, mode) {
    const owned = Math.floor(state.gems[factory.name] || 0);
    if (owned <= 0) {
      status(`You do not have any ${factory.name} to sell.`);
      return;
    }

    let quantity = owned;
    if (mode === "25") quantity = Math.max(1, Math.floor(owned * 0.25));
    if (mode === "50") quantity = Math.max(1, Math.floor(owned * 0.50));

    const earned = quantity * sellUnitPrice(factory);
    state.gems[factory.name] -= quantity;
    state.coins += earned;
    render();
    persist(`Sold ${format(quantity)} ${factory.name} for ${format(earned)} coins.`);
  }

  function renderBuyCards() {
    const grid = document.getElementById("buyGrid");
    grid.innerHTML = "";

    FACTORIES.forEach((factory) => {
      const unlocked = Boolean(state.unlocked[factory.name]);
      const card = document.createElement("article");
      card.className = `store-card${unlocked ? "" : " store-card-locked"}`;
      card.innerHTML = `
        <div class="store-card-head">
          <span class="store-gem">${factory.icon}</span>
          <div>
            <h3>${factory.name}</h3>
            <small>${unlocked ? `Owned: ${format(state.gems[factory.name])}` : `Factory locked · Level ${factory.levelReq}`}</small>
          </div>
        </div>
        <div class="store-price">${format(buyUnitPrice(factory))} coins each</div>
        <div class="store-actions">
          <button type="button" data-buy="${factory.name}" data-qty="10" ${unlocked ? "" : "disabled"}>Buy 10</button>
          <button type="button" data-buy="${factory.name}" data-qty="50" ${unlocked ? "" : "disabled"}>Buy 50</button>
          <button type="button" data-buy="${factory.name}" data-qty="100" ${unlocked ? "" : "disabled"}>Buy 100</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll("[data-buy]").forEach((button) => {
      button.addEventListener("click", () => {
        const factory = FACTORIES.find((item) => item.name === button.dataset.buy);
        buy(factory, Number(button.dataset.qty));
      });
    });
  }

  function renderSellCards() {
    const grid = document.getElementById("sellGrid");
    grid.innerHTML = "";

    FACTORIES.forEach((factory) => {
      const owned = Math.floor(state.gems[factory.name] || 0);
      const card = document.createElement("article");
      card.className = "store-card";
      card.innerHTML = `
        <div class="store-card-head">
          <span class="store-gem">${factory.icon}</span>
          <div>
            <h3>${factory.name}</h3>
            <small>Inventory: ${format(owned)}</small>
          </div>
        </div>
        <div class="store-price">Sells for ${format(sellUnitPrice(factory))} coins each</div>
        <div class="store-actions">
          <button type="button" data-sell="${factory.name}" data-mode="25" ${owned <= 0 ? "disabled" : ""}>Sell 25%</button>
          <button type="button" data-sell="${factory.name}" data-mode="50" ${owned <= 0 ? "disabled" : ""}>Sell 50%</button>
          <button type="button" data-sell="${factory.name}" data-mode="all" ${owned <= 0 ? "disabled" : ""}>Sell All</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll("[data-sell]").forEach((button) => {
      button.addEventListener("click", () => {
        const factory = FACTORIES.find((item) => item.name === button.dataset.sell);
        sell(factory, button.dataset.mode);
      });
    });
  }

  function render() {
    document.getElementById("storeCoins").textContent = format(state.coins);
    renderBuyCards();
    renderSellCards();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (await loadState()) {
      render();
      status("Store ready. Purchases and sales save automatically.");
    }
  });
})();
