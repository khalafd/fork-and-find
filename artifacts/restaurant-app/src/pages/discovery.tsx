import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RestaurantDetailPanel } from "@/components/restaurant/RestaurantDetailPanel";
import { useListRestaurants, useListCuisines, useGetRestaurant, getGetRestaurantQueryKey } from "@workspace/api-client-react";

export default function DiscoveryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileDetailId, setMobileDetailId] = useState<number | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // keep last selected id so detail panel content shows during close animation
  useEffect(() => {
    if (selectedId) setMobileDetailId(selectedId);
  }, [selectedId]);

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
    if (isMobile) {
      setSelectedId(null);
      setMobileChatOpen(true);
    }
  };

  const handleSelectPin = (id: number) => {
    if (isMobile && mobileChatOpen) setMobileChatOpen(false);
    setSelectedId(id);
  };

  const cuisineChipList = ["All", ...cuisines].map((c) => {
    const isAll = c === "All";
    const active = isAll ? selectedCuisine === null : selectedCuisine === c;
    return (
      <button
        key={c}
        onClick={() => setSelectedCuisine(isAll ? null : c)}
        style={{
          fontSize: 12,
          padding: isMobile ? "6px 14px" : "5px 12px",
          height: isMobile ? 32 : undefined,
          borderRadius: 20,
          fontWeight: 500,
          whiteSpace: "nowrap",
          cursor: "pointer",
          backdropFilter: isMobile ? undefined : "blur(4px)",
          border: active ? "none" : "0.5px solid rgba(0,0,0,0.15)",
          background: active ? "#1a1a1a" : "rgba(255,255,255,0.92)",
          color: active ? "white" : "#555",
          flexShrink: 0,
        }}
      >
        {c}
      </button>
    );
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Mobile: cuisine chip bar below navbar */}
      {isMobile && (
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "0.5px solid rgba(0,0,0,0.08)",
            display: "flex",
            gap: 6,
            whiteSpace: "nowrap",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {cuisineChipList}
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Map column */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          {/* Desktop: floating cuisine chips over map */}
          {!isMobile && (
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
              {cuisineChipList}
            </div>
          )}

          <RestaurantMap
            restaurants={filteredRestaurants}
            selectedId={selectedId}
            onSelect={handleSelectPin}
            onAskAI={(id, name) => handleAskAI(id, name)}
            selectedCuisine={selectedCuisine}
          />

          {/* Desktop: detail bottom sheet — absolute inside map col */}
          {!isMobile && selectedId && (
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

        {/* Desktop: chat panel sidebar */}
        {!isMobile && (
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
        )}
      </div>

      {/* ── MOBILE ONLY ───────────────────────────────────────── */}

      {/* Mobile: detail sheet backdrop */}
      {isMobile && selectedId && (
        <div
          onClick={() => setSelectedId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1499,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Mobile: detail bottom sheet — always in DOM for animation */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "72vh",
            background: "white",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            zIndex: 1500,
            overflowY: "auto",
            transform: selectedId ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.15)",
              margin: "10px auto 0",
            }}
          />
          {mobileDetailId && (
            <RestaurantDetailPanel
              restaurantId={mobileDetailId}
              onClose={() => setSelectedId(null)}
              onAskAI={(msg) => handleAskAI(msg)}
              isMobile
            />
          )}
        </div>
      )}

      {/* Mobile: chat drawer backdrop */}
      {isMobile && mobileChatOpen && (
        <div
          onClick={() => setMobileChatOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1999,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Mobile: chat drawer — always in DOM for animation */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "85vh",
            background: "white",
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            zIndex: 2000,
            transform: mobileChatOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.15)",
              margin: "10px auto 0",
              flexShrink: 0,
            }}
          />
          {/* Close button */}
          <button
            onClick={() => setMobileChatOpen(false)}
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X style={{ width: 20, height: 20, color: "#888" }} />
          </button>
          <div style={{ flex: 1, overflow: "hidden", marginTop: 8 }}>
            <ChatPanel
              initialMessage={chatInitialMessage}
              onInitialMessageSent={() => setChatInitialMessage(undefined)}
              selectedRestaurant={selectedRestaurant}
            />
          </div>
        </div>
      )}

      {/* Mobile: floating chat button */}
      {isMobile && !mobileChatOpen && (
        <button
          onClick={() => setMobileChatOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 20,
            zIndex: 1000,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#1a1a1a",
            border: "2px solid white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
