import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useListRestaurants } from "@workspace/api-client-react";

export default function DiscoveryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);

  const { data: allRestaurants = [] } = useListRestaurants({}, {
    query: { queryKey: ["/api/restaurants"] },
  });

  const filteredRestaurants = selectedCuisine
    ? allRestaurants.filter((r) => r.cuisine === selectedCuisine)
    : allRestaurants;

  const handleAskAI = (_restaurantId: number, restaurantName: string) => {
    setChatInitialMessage(`Tell me about ${restaurantName}. What should I order?`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <RestaurantMap
            restaurants={filteredRestaurants}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAskAI={handleAskAI}
          />
        </div>
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
          />
        </div>
      </div>
    </div>
  );
}
