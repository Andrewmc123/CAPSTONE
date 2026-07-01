// Aura verification is *earned* — it rides on the creator tier (driven by
// aura_score on the backend). Pro = verified, Icon = celebrity.
//   0 = none · 1 = verified (Pro) · 2 = celebrity (Icon)
export const verifyLevel = (tierKey) =>
  tierKey === "icon" ? 2 : tierKey === "pro" ? 1 : 0;

export const isVerified = (tierKey) => verifyLevel(tierKey) > 0;
export const isCelebrity = (tierKey) => verifyLevel(tierKey) === 2;
