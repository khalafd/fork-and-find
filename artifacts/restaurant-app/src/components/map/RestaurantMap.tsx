import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon bug
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

import { RestaurantWithDishes, Restaurant } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function MapUpdater({ selectedId, restaurants }: { selectedId: number | null; restaurants: Restaurant[] }) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) {
      const selected = restaurants.find((r) => r.id === selectedId);
      if (selected && selected.latitude && selected.longitude) {
        map.flyTo([selected.latitude, selected.longitude], 15, { duration: 1.5 });
      }
    }
  }, [selectedId, restaurants, map]);

  return null;
}

export function RestaurantMap({ restaurants, selectedId, onSelect }: RestaurantMapProps) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[48.8566, 2.3522]} // Default Paris
        zoom={4}
        className="w-full h-full bg-background"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <MapUpdater selectedId={selectedId} restaurants={restaurants} />

        {restaurants.map((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return null;
          
          return (
            <Marker
              key={restaurant.id}
              position={[restaurant.latitude, restaurant.longitude]}
              eventHandlers={{
                click: () => onSelect(restaurant.id),
              }}
            >
              <Popup className="restaurant-popup">
                <div className="flex flex-col gap-1">
                  <span className="font-serif font-bold text-base text-foreground">{restaurant.name}</span>
                  <span className="text-xs text-muted-foreground">{restaurant.cuisine} • {restaurant.city}</span>
                  <Badge variant="outline" className="w-fit mt-1 border-primary/30 text-primary">
                    {restaurant.evidenceLevel} evidence
                  </Badge>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <style>{`
        .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}
