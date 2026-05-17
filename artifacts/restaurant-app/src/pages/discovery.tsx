import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RestaurantDetailPanel } from "@/components/restaurant/RestaurantDetailPanel";
import { useListRestaurants, useListCuisines, useGetRestaurant, getGetRestaurantQueryKey, RestaurantWithDishes } from "@workspace/api-client-react";

export default function DiscoveryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  const { data: allRestaurants = [] } = useListRestaurants({}, {
    query: { queryKey: ["/api/restaurants"] },
  });

  const { data: cuisines = [] } = useListCuisines({
    query: { queryKey: ["/api/restaurants/cuisines"] },
  });

  const { data: selectedRestaurant = null } = useGetRestaurant(selectedId ?? 0, {
    query: {
      enabled: !!selectedId,
      queryKey: getGetRestaurantQueryKey(selectedId ?? 0),
    },
  });

  const filteredRestaurants = selectedCuisine
    ? allRestaurants.filter((r) => r.cuisine === selectedCuisine)
    : allRestaurants;

  const handleAskAI = (msg?: string | number, nameOrUndefined?: string) => {
    if (typeof msg === "string") {
      setChatInitialMessage(msg);
    } else if (typeof msg === "number" && nameOrUndefined) {
      setChatInitialMessage(`Tell me about ${nameOrUndefined}. What should I order?`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Map column */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          {/* Cuisine filter chips */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              zIndex: 500,
              display: "flex",
              gap: 6,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {["All", ...cuisines].map((c) => {
              const isAll = c === "All";
              const active = isAll ? selectedCuisine === null : selectedCuisine === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(isAll ? null : c)}
                  style={{
                    fontSize: 12,
                    padding: "5px 12px",
                    borderRadius: 20,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)",
                    border: active ? "none" : "0.5px solid rgba(0,0,0,0.15)",
                    background: active ? "#1a1a1a" : "rgba(255,255,255,0.92)",
                    color: active ? "white" : "#555",
                    flexShrink: 0,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <RestaurantMap
            restaurants={filteredRestaurants}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAskAI={(id, name) => handleAskAI(id, name)}
            selectedCuisine={selectedCuisine}
          />

          {/* Restaurant detail bottom sheet */}
          {selectedId && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 420,
                background: "white",
                borderRadius: "16px 16px 0 0",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                zIndex: 1000,
                overflowY: "auto",
              }}
            >
              <RestaurantDetailPanel
                restaurantId={selectedId}
                onClose={() => setSelectedId(null)}
                onAskAI={(msg) => handleAskAI(msg)}
              />
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div
          style={{
            width: "340px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderLeft: "0.5px solid rgba(0,0,0,0.09)",
            background: "#fff",
          }}
        >
          <ChatPanel
            initialMessage={chatInitialMessage}
            onInitialMessageSent={() => setChatInitialMessage(undefined)}
            selectedRestaurant={selectedRestaurant}
          />
        </div>
      </div>
    </div>
  );
}
