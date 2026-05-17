export function formatEvidenceLabel(
  level: string | null | undefined,
  type: "dish" | "restaurant"
): string {
  if (!level) return "";
  if (type === "dish") {
    switch (level) {
      case "strong":   return "Signature dish";
      case "moderate": return "Crowd favourite";
      case "weak":     return "Worth a try";
      default:         return level;
    }
  } else {
    switch (level) {
      case "strong":   return "Well documented";
      case "moderate": return "Curated pick";
      case "weak":     return "Hidden gem";
      default:         return level;
    }
  }
}

export function evidenceBadgeStyle(
  level: string | null | undefined,
  type: "dish" | "restaurant"
): { bg: string; color: string } {
  if (type === "dish") {
    switch (level) {
      case "strong":   return { bg: "#FFF3CD", color: "#7B4F00" };
      case "moderate": return { bg: "#DCF0DC", color: "#1A5C1A" };
      case "weak":     return { bg: "#EEF0F8", color: "#2A2A7A" };
      default:         return { bg: "#F0F0F0", color: "#555" };
    }
  } else {
    switch (level) {
      case "strong":   return { bg: "#FFF3CD", color: "#7B4F00" };
      case "moderate": return { bg: "#DCF0DC", color: "#1A5C1A" };
      case "weak":     return { bg: "#EEF0F8", color: "#2A2A7A" };
      default:         return { bg: "#F0F0F0", color: "#555" };
    }
  }
}

export const cuisineColors: Record<string, string> = {
  japanese:   "#1a2a3a",
  italian:    "#3d1a0a",
  arabic:     "#1a3020",
  saudi:      "#1a3020",
  steakhouse: "#2a1505",
  seafood:    "#0a2535",
  default:    "#2a2a2a",
};

export function getCuisineColor(cuisine: string | null | undefined): string {
  if (!cuisine) return cuisineColors.default;
  const key = cuisine.toLowerCase();
  for (const [k, v] of Object.entries(cuisineColors)) {
    if (key.includes(k)) return v;
  }
  return cuisineColors.default;
}
