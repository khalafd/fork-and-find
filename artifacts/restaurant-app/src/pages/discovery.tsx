import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { RestaurantDetailPanel } from "@/components/restaurant/RestaurantDetailPanel";
import { useListRestaurants, useGetShortlist, useGetRestaurant, getGetRestaurantQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getSessionId } from "@/hooks/use-session";

export default function DiscoveryPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: restaurants = [], isLoading } = useListRestaurants({ search }, {
    query: { queryKey: ['/api/restaurants', { search }] }
  });

  const { data: shortlist = [] } = useGetShortlist();

  // Fetch full details of selected restaurant to pass to ChatPanel
  const { data: selectedRestaurant = null } = useGetRestaurant(selectedId || 0, {
    query: { enabled: !!selectedId, queryKey: getGetRestaurantQueryKey(selectedId || 0) }
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      
      {/* Top Filter Bar */}
      <div className="w-full bg-card border-b border-border/40 p-2 flex items-center justify-between px-4 z-10 shrink-0">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search restaurants, cuisines..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background/50 border-border/50 text-sm focus-visible:ring-primary/50"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          {restaurants.length} {restaurants.length === 1 ? 'Location' : 'Locations'}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Panel (60%) */}
        <div className="w-[60%] h-full relative">
          <RestaurantMap 
            restaurants={restaurants} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
          />
          
          {selectedId && (
            <RestaurantDetailPanel 
              restaurantId={selectedId} 
              onClose={() => setSelectedId(null)}
              onAskAI={() => {
                // The ChatPanel already receives selectedRestaurant via props.
                // In a real implementation, we might auto-focus the chat input
                // or send an initial hidden context message.
              }}
            />
          )}
        </div>

        {/* Chat Panel (40%) */}
        <div className="w-[40%] h-full z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
          <ChatPanel selectedRestaurant={selectedRestaurant} shortlist={shortlist} />
        </div>
      </div>
    </div>
  );
}
