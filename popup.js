const DEFAULTS = {
    enabled: true,
  
    mode: "light", // light | strong | custom
  
    hideShorts: true,
    hideExploreTrending: true,
    hideSubscriptions: false,
  
    hideSidebar: false,
    hideHomeFeed: false,
    hideChipsBar: true,
    hideSearchResultsExtras: false,
  
    hideRightRail: false,
    keepPlaylist: true,
  
    hideComments: false,
    hideEndscreenCards: false
  };
  
  const MODE_PRESETS = {
    light: {
      hideShorts: true,
      hideExploreTrending: true,
      hideSubscriptions: false,
  
      hideSidebar: false,
      hideHomeFeed: false,
      hideChipsBar: true,
      hideSearchResultsExtras: false,

      hideRightRail: false,
      keepPlaylist: true,

      hideComments: false,
      hideEndscreenCards: true
    },
    strong: {
      hideShorts: true,
      hideExploreTrending: true,
      hideSubscriptions: true,

      hideSidebar: true,
      hideHomeFeed: true,
      hideChipsBar: true,
      hideSearchResultsExtras: true,
  
      hideRightRail: true,
      keepPlaylist: true,
  
      hideComments: true,
      hideEndscreenCards: true
    }
  };
  
  function $(id) {
    return document.getElementById(id);
  }
  
  async function loadConfig() {
    const data = await chrome.storage.sync.get(DEFAULTS);
    return { ...DEFAULTS, ...data };
  }
  
  async function saveConfig(cfg) {
    await chrome.storage.sync.set(cfg);
  }
  
  function setUI(cfg) {
    $("enabled").checked = cfg.enabled;
    $("mode").value = cfg.mode;
  
    $("hideShorts").checked = cfg.hideShorts;
    $("hideExploreTrending").checked = cfg.hideExploreTrending;
    $("hideSubscriptions").checked = cfg.hideSubscriptions;
  
    $("hideSidebar").checked = cfg.hideSidebar;
    $("hideHomeFeed").checked = cfg.hideHomeFeed;
    $("hideChipsBar").checked = cfg.hideChipsBar;
    $("hideSearchResultsExtras").checked = cfg.hideSearchResultsExtras;
  
    $("hideRightRail").checked = cfg.hideRightRail;
    $("keepPlaylist").checked = cfg.keepPlaylist;
  
    $("hideComments").checked = cfg.hideComments;
    $("hideEndscreenCards").checked = cfg.hideEndscreenCards;
  
    // If disabled, disable UI (optional)
    const disabled = !cfg.enabled;
    for (const id of [
      "mode",
      "hideShorts",
      "hideExploreTrending",
      "hideSubscriptions",
      "hideSidebar",
      "hideHomeFeed",
      "hideChipsBar",
      "hideSearchResultsExtras",
      "hideRightRail",
      "keepPlaylist",
      "hideComments",
      "hideEndscreenCards"
    ]) {
      $(id).disabled = disabled;
    }
  }
  
  function readUI() {
    return {
      enabled: $("enabled").checked,
  
      mode: $("mode").value,
  
      hideShorts: $("hideShorts").checked,
      hideExploreTrending: $("hideExploreTrending").checked,
      hideSubscriptions: $("hideSubscriptions").checked,
  
      hideSidebar: $("hideSidebar").checked,
      hideHomeFeed: $("hideHomeFeed").checked,
      hideChipsBar: $("hideChipsBar").checked,
      hideSearchResultsExtras: $("hideSearchResultsExtras").checked,
  
      hideRightRail: $("hideRightRail").checked,
      keepPlaylist: $("keepPlaylist").checked,
  
      hideComments: $("hideComments").checked,
      hideEndscreenCards: $("hideEndscreenCards").checked
    };
  }
  
  function applyModePresetIfNeeded(cfg) {
    if (cfg.mode === "light" || cfg.mode === "strong") {
      return { ...cfg, ...MODE_PRESETS[cfg.mode] };
    }
    return cfg;
  }
  
  async function sendApplyMessage(cfg) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      if (!String(tab.url || "").includes("youtube.com")) return;
      await chrome.tabs.sendMessage(tab.id, { type: "APPLY_FOCUS_CONFIG", payload: cfg });
    } catch (err) {
      // Content script not ready or tab not available - ignore silently
      console.log("Could not send message to content script:", err.message);
    }
  }
  
  async function init() {
    const cfg = await loadConfig();
    setUI(cfg);
  
    // Master enable
    $("enabled").addEventListener("change", async () => {
      const next = readUI();
      await saveConfig(next);
      setUI(next);
      await sendApplyMessage(next);
    });
  
    // Mode change
    $("mode").addEventListener("change", async () => {
      const current = readUI();
      const next = applyModePresetIfNeeded(current);
      setUI(next);
      await saveConfig(next);
      await sendApplyMessage(next);
    });
  
    // Any toggle => custom (when enabled)
    const toggles = [
      "hideShorts",
      "hideExploreTrending",
      "hideSubscriptions",
      "hideSidebar",
      "hideHomeFeed",
      "hideChipsBar",
      "hideSearchResultsExtras",
      "hideRightRail",
      "keepPlaylist",
      "hideComments",
      "hideEndscreenCards"
    ];
  
    for (const id of toggles) {
      $(id).addEventListener("change", async () => {
        const current = readUI();
        const next = { ...current, mode: "custom" };
        await saveConfig(next);
        setUI(next);
        await sendApplyMessage(next);
      });
    }
  }
  
  init();
