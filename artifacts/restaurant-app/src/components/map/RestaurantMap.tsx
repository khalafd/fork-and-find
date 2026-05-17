import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Restaurant } from "@workspace/api-client-react";

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function createPin(isActive: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px; height:28px; border-radius:50%;
      background:${isActive ? "#B8860B" : "#1a1a1a"};
      border:2px solid white;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      transition:transform 0.15s;
    " onmouseenter="this.style.transform='scale(1.2)'" onmouseleave="this.style.transform='scale(1)'">
      <div style="width:8px;height:8px;border-radius:50%;background:${isActive ? "white" : "#B8860B"}"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function MapUpdater({ selectedId, restaurants }: { selectedId: number | null; restaurants: Restaurant[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId) {
      const selected = restaurants.find((r) => r.id === selectedId);
      if (selected && selected.latitude && selected.longitude) {
        map.flyTo([selected.latitude, selected.longitude], 15, { duration: 1.2 });
      }
    }
  }, [selectedId, restaurants, map]);
  return null;
}

export function RestaurantMap({ restaurants, selectedId, onSelect }: RestaurantMapProps) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[26.3927, 50.1815]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater selectedId={selectedId} restaurants={restaurants} />
        {restaurants.map((restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude) return null;
          const isActive = restaurant.id === selectedId;
          return (
            <Marker
              key={restaurant.id}
              position={[restaurant.latitude, restaurant.longitude]}
              icon={createPin(isActive)}
              eventHandlers={{ click: () => onSelect(restaurant.id) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
