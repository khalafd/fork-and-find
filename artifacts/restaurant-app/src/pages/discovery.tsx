import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RestaurantDetailPanel } from "@/components/restaurant/RestaurantDetailPanel";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import {
  useListRestaurants,
  useGetShortlist,
  useGetRestaurant,
  getGetRestaurantQueryKey,
  useListCuisines,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, X } from "lucide-react";
import { getSessionId } from "@/hooks/use-session";

export default function DiscoveryPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  const { data: allRestaurants = [], isLoading } = useListRestaurants({ search }, {
    query: { queryKey: ["/api/restaurants", { search }] },
  });

  const { data: cuisines = [] } = useListCuisines();

  const { data: shortlist = [] } = useGetShortlist();

  const { data: selectedRestaurant = null } = useGetRestaurant(selectedId || 0, {
    query: { enabled: !!selectedId, queryKey: getGetRestaurantQueryKey(selectedId || 0) },
  });

  const filteredRestaurants = selectedCuisine
    ? allRestaurants.filter((r) => r.cuisine === selectedCuisine)
    : allRestaurants;

  const handleAskAI = (message?: string) => {
    if (message) setChatInitialMessage(message);
    setChatOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--color-cream)" }}>
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Map (60%) */}
        <div className="w-[60%] h-full relative flex-shrink-0">
          <RestaurantMap
            restaurants={filteredRestaurants}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selectedId && (
            <RestaurantDetailPanel
              restaurantId={selectedId}
              onClose={() => setSelectedId(null)}
              onAskAI={handleAskAI}
            />
          )}
        </div>

        {/* Sidebar (40%) */}
        <div
          className="w-[40%] h-full flex flex-col overflow-hidden"
          style={{ background: "var(--color-cream)", borderLeft: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          {/* Search + count row */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-white"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            <div className="relative flex-1 mr-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#aaa" }} />
              <Input
                placeholder="Search restaurants, cuisines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ fontSize: "13px", color: "#1a1a1a" }}
              />
            </div>
          </div>

          {/* Cuisine filter chips */}
          <div
            className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 bg-white"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}
          >
            <button
              onClick={() => setSelectedCuisine(null)}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 20,
                border: selectedCuisine === null ? "1px solid #1a1a1a" : "0.5px solid rgba(0,0,0,0.15)",
                background: selectedCuisine === null ? "#1a1a1a" : "transparent",
                color: selectedCuisine === null ? "white" : "#555",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.12s",
              }}
            >
              All
            </button>
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: 20,
                  border: selectedCuisine === cuisine ? "1px solid #1a1a1a" : "0.5px solid rgba(0,0,0,0.15)",
                  background: selectedCuisine === cuisine ? "#1a1a1a" : "transparent",
                  color: selectedCuisine === cuisine ? "white" : "#555",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.12s",
                }}
              >
                {cuisine}
              </button>
            ))}
          </div>

          {/* Section header */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0 flex items-baseline gap-2">
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#1a1a1a",
              }}
            >
              {selectedCuisine ? selectedCuisine : "Restaurants"}
            </span>
            <span style={{ fontSize: 11, color: "#888" }}>
              {isLoading ? "..." : `${filteredRestaurants.length} places`}
            </span>
          </div>

          {/* Restaurant card list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <div style={{ color: "#aaa", fontSize: 13, paddingTop: 32, textAlign: "center" }}>
                  Loading...
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div
                  style={{
                    color: "#aaa",
                    fontSize: 13,
                    paddingTop: 32,
                    textAlign: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                  }}
                >
                  No restaurants found
                </div>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isSelected={restaurant.id === selectedId}
                    onClick={() => setSelectedId(restaurant.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Chat toggle button */}
          <div
            className="flex-shrink-0 p-3 flex items-center justify-between bg-white"
            style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
          >
            <span style={{ fontSize: 12, color: "#888" }}>Curated database — not live data</span>
            <button
              onClick={() => { setChatInitialMessage(undefined); setChatOpen(true); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
                background: "#1a1a1a",
                color: "white",
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              <MessageCircle style={{ width: 13, height: 13 }} />
              Ask advisor
            </button>
          </div>
        </div>

        {/* Chat overlay drawer */}
        {chatOpen && (
          <div
            className="absolute right-0 top-0 h-full z-30 flex flex-col"
            style={{
              width: "40%",
              background: "white",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>
                Dining Advisor
              </span>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                selectedRestaurant={selectedRestaurant}
                shortlist={shortlist}
                initialMessage={chatInitialMessage}
                onInitialMessageSent={() => setChatInitialMessage(undefined)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
