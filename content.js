const DEFAULTS = {
    enabled: true,
    mode: "light",
  
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
    hideEndscreenCards: false,
    hideSponsoredAds: true
  };
  
let styleEl = null;
let currentConfig = { ...DEFAULTS };
let isApplying = false;
let debounceTimer = null;
  
  function ensureStyleEl() {
    if (styleEl) return styleEl;
    styleEl = document.createElement("style");
    styleEl.id = "yt-focus-mode-style";
    document.documentElement.appendChild(styleEl);
    return styleEl;
  }
  
  function buildCSS(cfg) {
    // If disabled, don't apply anything
    if (!cfg.enabled) return "";
  
    const css = [];
  
    // 1) Shorts (links + shelves + menu + entire section)
    if (cfg.hideShorts) {
      css.push(`
        /* Hide all shorts links */
        a[href^="/shorts/"] { display: none !important; }
        
        /* Hide shorts shelf and items */
        ytd-reel-shelf-renderer { display: none !important; }
        ytd-reel-item-renderer { display: none !important; }
        
        /* Hide entire rich section containing shorts */
        ytd-rich-section-renderer:has(ytd-reel-shelf-renderer) { display: none !important; }
        ytd-rich-section-renderer:has([is-shorts]) { display: none !important; }
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]) { display: none !important; }
        
        /* Hide shorts shelf with title */
        ytd-rich-shelf-renderer[is-shorts] { display: none !important; }
        ytd-rich-shelf-renderer:has(a[href="/shorts"]) { display: none !important; }
        
        /* Hide "Shorts" section header */
        #title-container:has(a[href="/shorts"]) { display: none !important; }
        ytd-rich-section-renderer #rich-shelf-header { display: none !important; }
        
        /* Menu entries - by href */
        ytd-guide-entry-renderer:has(a[href^="/shorts"]) { display: none !important; }
        ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]) { display: none !important; }
        
        /* Hide shorts tab on channel pages */
        yt-tab-shape[tab-title="Shorts"] { display: none !important; }
        tp-yt-paper-tab:has(a[href*="/shorts"]) { display: none !important; }
      `);
    }
  
    // 2) Explore / Trending (menu)
    if (cfg.hideExploreTrending) {
      css.push(`
        ytd-guide-entry-renderer:has(a[href^="/feed/explore"]),
        ytd-mini-guide-entry-renderer:has(a[href^="/feed/explore"]),
        ytd-guide-entry-renderer:has(a[href^="/feed/trending"]),
        ytd-mini-guide-entry-renderer:has(a[href^="/feed/trending"]) {
          display: none !important;
        }
      `);
    }
  
    // 3) Subscriptions (menu)
    if (cfg.hideSubscriptions) {
      css.push(`
        ytd-guide-entry-renderer:has(a[href^="/feed/subscriptions"]),
        ytd-mini-guide-entry-renderer:has(a[href^="/feed/subscriptions"]) {
          display: none !important;
        }
      `);
    }
  
    // 4) Left sidebar (guide/menu)
    if (cfg.hideSidebar) {
      css.push(`
        #guide, ytd-guide-renderer { display: none !important; }
        /* Layout adjustment when guide is hidden (YouTube may vary; best effort) */
        ytd-page-manager { margin-left: 0 !important; }
      `);
    }
  
    // 5) Home feed (feed cards)
    if (cfg.hideHomeFeed) {
      css.push(`
        /* Hide content grid on home */
        ytd-browse[page-subtype="home"] #primary { display: none !important; }
        ytd-browse[page-subtype="home"] #contents { display: none !important; }
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer { display: none !important; }
      `);
    }
  
    // 6) Filter chips bar (Tudo, Music, Mixes, etc.)
    if (cfg.hideChipsBar) {
      css.push(`
        /* Home page chips bar */
        ytd-feed-filter-chip-bar-renderer { display: none !important; }
        #chip-bar { display: none !important; }
        #chips-wrapper { display: none !important; }
        yt-chip-cloud-renderer { display: none !important; }
        
        /* Masthead chips */
        ytd-masthead #chips { display: none !important; }
      `);
    }

    // 7) Search extras (chips/filters etc.)
    if (cfg.hideSearchResultsExtras) {
      css.push(`
        /* Filter/chip bar on search (may vary) */
        ytd-search ytd-search-sub-menu-renderer { display: none !important; }
        ytd-search ytd-horizontal-card-list-renderer { display: none !important; }
        ytd-search ytd-chip-cloud-renderer { display: none !important; }
      `);
    }
  
    // 8) Right column on watch (recommendations / up next)
    if (cfg.hideRightRail) {
      if (cfg.keepPlaylist) {
        css.push(`
          /* Try to hide "related" while keeping playlist when present */
          ytd-watch-flexy #secondary-inner #related { display: none !important; }
        `);
      } else {
        css.push(`
          ytd-watch-flexy #secondary { display: none !important; }
        `);
      }
    }
  
    // 9) Comments
    if (cfg.hideComments) {
      css.push(`
        #comments, ytd-comments { display: none !important; }
      `);
    }
  
    // 10) Player overlays (end screen/cards)
    if (cfg.hideEndscreenCards) {
      css.push(`
        .ytp-endscreen-content,
        .ytp-ce-element,
        .ytp-cards-teaser,
        .ytp-cards-button,
        .ytp-paid-content-overlay { display: none !important; }
      `);
    }

    // 11) Sponsored/Promoted ads in feed
    if (cfg.hideSponsoredAds) {
      css.push(`
        /* Hide sponsored/promoted video cards */
        ytd-ad-slot-renderer { display: none !important; }
        ytd-in-feed-ad-layout-renderer { display: none !important; }
        ytd-promoted-sparkles-web-renderer { display: none !important; }
        ytd-promoted-video-renderer { display: none !important; }
        ytd-display-ad-renderer { display: none !important; }
        ytd-compact-promoted-video-renderer { display: none !important; }
        ytd-banner-promo-renderer { display: none !important; }
        ytd-action-companion-ad-renderer { display: none !important; }
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"] { display: none !important; }
        
        /* Hide rich items containing ads */
        ytd-rich-item-renderer:has(ytd-ad-slot-renderer) { display: none !important; }
        ytd-rich-item-renderer:has([is-ad]) { display: none !important; }
        ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer) { display: none !important; }
        
        /* Hide video items with "Patrocinado" or "Sponsored" badge */
        ytd-rich-item-renderer:has(span.ytd-badge-supported-renderer) { display: none !important; }
        ytd-rich-item-renderer:has([badge-style="BADGE_STYLE_TYPE_AD"]) { display: none !important; }
        
        /* Hide banner/display ads with "Acessar o site" or similar */
        ytd-rich-section-renderer:has(ytd-ad-slot-renderer) { display: none !important; }
        ytd-rich-section-renderer:has(ytd-in-feed-ad-layout-renderer) { display: none !important; }
        ytd-rich-section-renderer:has([is-ad]) { display: none !important; }
        
        /* Hide masthead ads */
        ytd-primetime-promo-renderer { display: none !important; }
        ytd-brand-video-shelf-renderer { display: none !important; }
        ytd-statement-banner-renderer { display: none !important; }
        ytd-brand-video-singleton-renderer { display: none !important; }
        
        /* Hide search result ads */
        ytd-search-pyv-renderer { display: none !important; }
        
        /* Hide movie/purchase promos */
        ytd-movie-offer-module-renderer { display: none !important; }
        ytd-merch-shelf-renderer { display: none !important; }
        
        /* Hide any element containing ad text markers */
        #content:has(> ytd-in-feed-ad-layout-renderer) { display: none !important; }
      `);
    }
  
    // "Strong mode" adjustments: general minimalism
    if (cfg.mode === "strong") {
      css.push(`
        /* Try to reduce blocks below the player (without removing the player) */
        ytd-watch-flexy #below #meta { margin-bottom: 6px !important; }
      `);
    }
  
    return css.join("\n");
  }
  
  function applyConfig(cfg) {
    currentConfig = { ...DEFAULTS, ...cfg };
    const el = ensureStyleEl();
    el.textContent = buildCSS(currentConfig);
  }
  
  // SPA: re-apply on internal navigation
  function hookNavigation() {
    const origPushState = history.pushState;
    history.pushState = function (...args) {
      origPushState.apply(this, args);
      window.dispatchEvent(new Event("yt-focus-location-changed"));
    };
  
    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("yt-focus-location-changed"));
    });
  
    window.addEventListener("yt-focus-location-changed", () => {
      applyConfig(currentConfig);
    });
  }
  
  // Receive configs from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "APPLY_FOCUS_CONFIG") {
      applyConfig(msg.payload || {});
    }
  });
  
  // Initialization
  (async function init() {
    try {
      const stored = await chrome.storage.sync.get(DEFAULTS);
      applyConfig(stored);
    } catch {
      applyConfig(DEFAULTS);
    }
  
    hookNavigation();
  
    // Re-apply when DOM changes (YouTube loads content dynamically)
    // Using debounce + flag to prevent infinite loop
    const obs = new MutationObserver(() => {
      if (isApplying) return;
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        isApplying = true;
        applyConfig(currentConfig);
        isApplying = false;
      }, 100);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  })();
