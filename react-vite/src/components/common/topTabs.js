// The three top-level feeds. Order matters: Feed's swipe gesture walks this
// same list left-to-right, so keep the routes in visual order.
export const TOP_TABS = [
  { to: "/live", label: "Live", end: false },
  { to: "/following", label: "Following", end: false },
  { to: "/", label: "Aura Worldwide", end: true },
];

export const TOP_TAB_ROUTES = TOP_TABS.map((t) => t.to);
