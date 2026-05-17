import { Restaurant } from "@workspace/api-client-react";
import { formatEvidenceLabel, evidenceBadgeStyle, getCuisineColor } from "@/lib/labels";

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onClick: () => void;
}

function ScoreDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(score / 2);
        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: filled ? "#B8860B" : "#e0dcdc",
            }}
          />
        );
      })}
      <span style={{ fontSize: "11px", color: "#888", marginLeft: 4 }}>{score}/10</span>
    </div>
  );
}

export function RestaurantCard({ restaurant, isSelected, onClick }: RestaurantCardProps) {
  const photoSrc = restaurant.photoUrl || restaurant.photoCache;
  const cuisineColor = getCuisineColor(restaurant.cuisine);
  const badge = formatEvidenceLabel(restaurant.evidenceLevel, "restaurant");
  const { bg, color } = evidenceBadgeStyle(restaurant.evidenceLevel, "restaurant");

  return (
    <div
      onClick={onClick}
      style={{
        background: "white",
        borderRadius: 12,
        border: isSelected ? "1.5px solid #B8860B" : "0.5px solid rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.15s",
        overflow: "hidden",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Photo area */}
      <div style={{ position: "relative", height: 110, overflow: "hidden" }}>
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={restaurant.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: cuisineColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em" }}>
              {restaurant.cuisine}
            </span>
          </div>
        )}
        {badge && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: bg,
              color: color,
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 20,
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#1a1a1a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 3,
          }}
        >
          {restaurant.name}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
          {[restaurant.district, restaurant.cuisine].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}
