import { useState } from "react";
import { X, Globe, ExternalLink, Clock, Navigation, MessageCircle, Heart, HeartOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetRestaurant, getGetRestaurantQueryKey, useAddToShortlist, useRemoveFromShortlist, useGetShortlist } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getCuisineColor } from "@/lib/labels";

interface RestaurantDetailPanelProps {
  restaurantId: number;
  onClose: () => void;
  onAskAI: (message?: string) => void;
  isMobile?: boolean;
}

function renderStars(score: number): string {
  const rating = score / 2;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function dishBadge(level: string | null | undefined): { label: string; bg: string; color: string } {
  if (level === "strong") return { label: "Must order", bg: "#FFF3CD", color: "#7B4F00" };
  if (level === "moderate") return { label: "Try it", bg: "#DCF0DC", color: "#1A5C1A" };
  return { label: "Optional", bg: "#F0F0F0", color: "#555" };
}

function categoryColor(category: string): string {
  if (category === "main") return "#1a2a3a";
  if (category === "starter") return "#2a1a0a";
  if (category === "dessert") return "#1a2a1a";
  return "#2a2a2a";
}

function formatBestFor(bestFor: string | null | undefined): string {
  if (!bestFor) return "";
  const first = bestFor.split(",")[0].trim();
  const map: Record<string, string> = {
    date: "Date night",
    "fine dining": "Fine dining",
    group: "Groups",
    business: "Business",
    family: "Family",
    casual: "Casual",
    quick: "Quick bite",
    social: "Social",
  };
  return map[first] ?? first;
}

export function RestaurantDetailPanel({ restaurantId, onClose, onAskAI, isMobile }: RestaurantDetailPanelProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

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
      <div className="h-full flex flex-col">
        <Skeleton className="h-[180px] w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const photoSrc = restaurant.photoUrl || restaurant.photoCache;
  const cuisineColor = getCuisineColor(restaurant.cuisine);
  const topDish = restaurant.dishes?.reduce((best, d) =>
    (d.recommendationScore ?? 0) > (best?.recommendationScore ?? 0) ? d : best
  , restaurant.dishes?.[0]);
  const topScore = topDish?.recommendationScore ?? 8;
  const stars = renderStars(topScore);
  const bestForLabel = formatBestFor(restaurant.bestFor);
  const summary = restaurant.reviewConsensusSummary ?? "";
  const isLong = summary.length > 120;

  const mapsUrl = restaurant.googleMapsUrl
    || (restaurant.latitude && restaurant.longitude
      ? `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`
      : null);

  return (
    <div className="h-full flex flex-col" style={{ background: "white" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
        {photoSrc ? (
          <img src={photoSrc} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: cuisineColor }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />

        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(0,0,0,0.35)", border: "none", cursor: "pointer",
          borderRadius: "50%", width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <X style={{ width: 14, height: 14, color: "white" }} />
        </button>

        {/* Price pill bottom-left */}
        {restaurant.priceRange && (
          <div style={{
            position: "absolute", bottom: 44, left: 14,
            background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
            border: "0.5px solid rgba(255,255,255,0.3)",
            borderRadius: 20, padding: "2px 8px",
            fontSize: 11, color: "white", fontWeight: 600,
          }}>
            {restaurant.priceRange}
          </div>
        )}

        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 48 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: "white", lineHeight: 1.2, margin: 0 }}>
            {restaurant.name}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "3px 0 0" }}>
            {[restaurant.district, restaurant.cuisine].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Rating row */}
      <div style={{ padding: "10px 16px 8px", borderBottom: "0.5px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: "#555", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "#B8860B", letterSpacing: 1 }}>{stars}</span>
          {restaurant.priceRange && <><span style={{ color: "#ccc" }}>·</span><span>{restaurant.priceRange}</span></>}
          {bestForLabel && <><span style={{ color: "#ccc" }}>·</span><span>{bestForLabel}</span></>}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div style={{ padding: "14px 16px 0" }}>

          {/* About */}
          {summary && (
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: 13, color: "#555", lineHeight: 1.65, margin: 0,
                display: "-webkit-box", WebkitLineClamp: expanded ? undefined : 2,
                WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden",
              }}>
                {summary}
              </p>
              {isLong && (
                <button onClick={() => setExpanded(!expanded)} style={{
                  fontSize: 11, color: "#B8860B", background: "none", border: "none",
                  cursor: "pointer", padding: 0, marginTop: 2, fontWeight: 500,
                }}>
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* What to order */}
          {restaurant.dishes && restaurant.dishes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>
                What to order
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                {restaurant.dishes.map((dish) => {
                  const badge = dishBadge(dish.evidenceLevel);
                  return (
                    <div key={dish.id} style={{
                      flexShrink: 0, width: 130,
                      border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 8,
                      overflow: "hidden", background: "white",
                    }}>
                      <div style={{ height: 80, overflow: "hidden" }}>
                        {dish.photoUrl ? (
                          <img src={dish.photoUrl} alt={dish.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: categoryColor(dish.category), display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{dish.category}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "6px 8px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#111", marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {dish.name}
                        </div>
                        <span style={{ fontSize: 9, background: badge.bg, color: badge.color, padding: "1px 6px", borderRadius: 20, fontWeight: 500 }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hours */}
          {restaurant.openingHoursNotes && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: "#888", marginBottom: 12 }}>
              <Clock style={{ width: 13, height: 13, marginTop: 1, flexShrink: 0 }} />
              <span>{restaurant.openingHoursNotes}</span>
            </div>
          )}

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
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
      <div style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 8,
        padding: "12px 16px",
        borderTop: "0.5px solid rgba(0,0,0,0.08)",
        background: "white",
      }}>
        <button
          onClick={() => mapsUrl && window.open(mapsUrl, "_blank")}
          disabled={!mapsUrl}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "#1a1a1a", color: "white", border: "none", borderRadius: 8,
            fontSize: isMobile ? 14 : 12, fontWeight: 500,
            minHeight: isMobile ? 48 : undefined,
            padding: isMobile ? "0 16px" : "9px 0",
            cursor: mapsUrl ? "pointer" : "not-allowed",
            opacity: mapsUrl ? 1 : 0.4,
          }}
        >
          <Navigation style={{ width: 13, height: 13 }} /> Navigate
        </button>
        <button
          onClick={() => onAskAI(`Tell me about ${restaurant.name} — what should I order?`)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "transparent", color: "#B8860B",
            border: "0.5px solid rgba(184,134,11,0.4)", borderRadius: 8,
            fontSize: isMobile ? 14 : 12, fontWeight: 500,
            minHeight: isMobile ? 48 : undefined,
            padding: isMobile ? "0 16px" : "9px 0",
            cursor: "pointer",
          }}
        >
          <MessageCircle style={{ width: 13, height: 13 }} /> Ask advisor
        </button>
        <button
          onClick={toggleShortlist}
          style={{
            width: isMobile ? "100%" : 38,
            minHeight: isMobile ? 48 : undefined,
            display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 6 : 0,
            background: "transparent", color: isShortlisted ? "#B8860B" : "#aaa",
            border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, cursor: "pointer",
            fontSize: isMobile ? 14 : undefined, fontWeight: isMobile ? 500 : undefined,
          }}
        >
          {isShortlisted ? <HeartOff style={{ width: 15, height: 15 }} /> : <Heart style={{ width: 15, height: 15 }} />}
          {isMobile && (isShortlisted ? "Saved" : "Save")}
        </button>
      </div>
    </div>
  );
}
