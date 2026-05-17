import { X, MapPin, Globe, ExternalLink, Clock, BookmarkPlus, BookmarkMinus, Navigation, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetRestaurant, getGetRestaurantQueryKey, useAddToShortlist, useRemoveFromShortlist, useGetShortlist } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { formatEvidenceLabel, evidenceBadgeStyle, getCuisineColor } from "@/lib/labels";

interface RestaurantDetailPanelProps {
  restaurantId: number;
  onClose: () => void;
  onAskAI: (message?: string) => void;
}

export function RestaurantDetailPanel({ restaurantId, onClose, onAskAI }: RestaurantDetailPanelProps) {
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useGetRestaurant(restaurantId, {
    query: { enabled: !!restaurantId, queryKey: getGetRestaurantQueryKey(restaurantId) },
  });

  const { data: shortlist } = useGetShortlist();
  const addToShortlist = useAddToShortlist();
  const removeFromShortlist = useRemoveFromShortlist();
  const isShortlisted = shortlist?.some((r) => r.id === restaurantId);

  const toggleShortlist = () => {
    if (isShortlisted) {
      removeFromShortlist.mutate({ restaurantId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/shortlist"] }),
      });
    } else {
      addToShortlist.mutate({ restaurantId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/shortlist"] }),
      });
    }
  };

  if (isLoading || !restaurant) {
    return (
      <div className="absolute top-4 left-4 z-10 w-[400px] bg-white rounded-xl overflow-hidden flex flex-col" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "0.5px solid rgba(0,0,0,0.08)" }}>
        <div className="p-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const photoSrc = restaurant.photoUrl || restaurant.photoCache;
  const cuisineColor = getCuisineColor(restaurant.cuisine);
  const evidenceLabel = formatEvidenceLabel(restaurant.evidenceLevel, "restaurant");
  const { bg: evidenceBg, color: evidenceColor } = evidenceBadgeStyle(restaurant.evidenceLevel, "restaurant");

  const mapsUrl = restaurant.googleMapsUrl
    || (restaurant.latitude && restaurant.longitude
      ? `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`
      : null);

  const handleAskAdvisor = () => {
    onAskAI(`Tell me about ${restaurant.name} — what should I order?`);
  };

  return (
    <div
      className="absolute top-4 left-4 z-10 w-[400px] max-h-[calc(100vh-5rem)] bg-white flex flex-col animate-in slide-in-from-left-4 fade-in duration-250"
      style={{ borderRadius: 16, border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden" }}
    >
      {/* Hero */}
      <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
        {photoSrc ? (
          <img src={photoSrc} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: cuisineColor }} />
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.35)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X style={{ width: 14, height: 14, color: "white" }} />
        </button>

        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 40 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: "white", lineHeight: 1.2, margin: 0 }}>
            {restaurant.name}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "3px 0 0" }}>
            {[restaurant.cuisine, restaurant.district].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div style={{ padding: "16px 16px 0" }}>

          {/* Evidence badge */}
          {evidenceLabel && (
            <div style={{ marginBottom: 14 }}>
              <span style={{ background: evidenceBg, color: evidenceColor, fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>
                {evidenceLabel}
              </span>
            </div>
          )}

          {/* Review summary */}
          {restaurant.reviewConsensusSummary && (
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic", borderLeft: "2px solid #B8860B", paddingLeft: 10, marginBottom: 14 }}>
              "{restaurant.reviewConsensusSummary}"
            </p>
          )}

          {/* Why go / Worth knowing */}
          {(restaurant.strengths || restaurant.weaknesses) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {restaurant.strengths && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase", marginBottom: 5 }}>Why go</div>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>{restaurant.strengths}</p>
                </div>
              )}
              {restaurant.weaknesses && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase", marginBottom: 5 }}>Worth knowing</div>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: 0 }}>{restaurant.weaknesses}</p>
                </div>
              )}
            </div>
          )}

          {/* Best for tags */}
          {restaurant.bestFor && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
              {restaurant.bestFor.split(",").map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10, padding: "3px 9px", borderRadius: 20,
                    border: "0.5px solid rgba(0,0,0,0.15)", color: "#666", background: "transparent",
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Dishes section */}
          {restaurant.dishes && restaurant.dishes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase", marginBottom: 10 }}>
                Signature dishes
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {restaurant.dishes.map((dish) => {
                  const dishLabel = formatEvidenceLabel(dish.evidenceLevel, "dish");
                  const dishBadge = evidenceBadgeStyle(dish.evidenceLevel, "dish");
                  return (
                    <div
                      key={dish.id}
                      style={{
                        flexShrink: 0, width: 110,
                        border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 8,
                        overflow: "hidden", background: "white",
                      }}
                    >
                      {/* Dish photo or placeholder */}
                      <div style={{ height: 60, background: "#f5f3ef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {dish.photoUrl ? (
                          <img src={dish.photoUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 10, color: "#bbb" }}>{dish.category}</span>
                        )}
                      </div>
                      <div style={{ padding: "6px 7px" }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: "#1a1a1a", marginBottom: 3, lineHeight: 1.3 }}>{dish.name}</div>
                        {dishLabel && (
                          <span style={{ fontSize: 9, background: dishBadge.bg, color: dishBadge.color, padding: "1px 6px", borderRadius: 20, fontWeight: 500 }}>
                            {dishLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opening hours */}
          {restaurant.openingHoursNotes && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: "#888", marginBottom: 12 }}>
              <Clock style={{ width: 13, height: 13, marginTop: 1, flexShrink: 0 }} />
              <span>{restaurant.openingHoursNotes}</span>
            </div>
          )}

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {restaurant.websiteUrl && (
              <a href={restaurant.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#B8860B", display: "flex", alignItems: "center", gap: 3 }}>
                <Globe style={{ width: 12, height: 12 }} /> Website
              </a>
            )}
            {restaurant.instagramUrl && (
              <a href={restaurant.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#B8860B", display: "flex", alignItems: "center", gap: 3 }}>
                <ExternalLink style={{ width: 12, height: 12 }} /> Instagram
              </a>
            )}
            {restaurant.menuSourceUrl && (
              <a href={restaurant.menuSourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#B8860B", display: "flex", alignItems: "center", gap: 3 }}>
                <ExternalLink style={{ width: 12, height: 12 }} /> Menu
              </a>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div
        style={{
          flexShrink: 0, display: "flex", gap: 8, padding: "12px 16px",
          borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "white",
        }}
      >
        <button
          onClick={() => mapsUrl && window.open(mapsUrl, "_blank")}
          disabled={!mapsUrl}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "#1a1a1a", color: "white", border: "none", borderRadius: 8,
            fontSize: 12, fontWeight: 500, padding: "9px 0", cursor: mapsUrl ? "pointer" : "not-allowed",
            opacity: mapsUrl ? 1 : 0.4,
          }}
        >
          <Navigation style={{ width: 13, height: 13 }} /> Navigate
        </button>
        <button
          onClick={handleAskAdvisor}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "transparent", color: "#1a1a1a",
            border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8,
            fontSize: 12, fontWeight: 500, padding: "9px 0", cursor: "pointer",
          }}
        >
          <MessageCircle style={{ width: 13, height: 13 }} /> Ask advisor
        </button>
        <button
          onClick={toggleShortlist}
          style={{
            width: 38, display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", color: isShortlisted ? "#B8860B" : "#888",
            border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {isShortlisted
            ? <BookmarkMinus style={{ width: 15, height: 15 }} />
            : <BookmarkPlus style={{ width: 15, height: 15 }} />
          }
        </button>
      </div>
    </div>
  );
}
