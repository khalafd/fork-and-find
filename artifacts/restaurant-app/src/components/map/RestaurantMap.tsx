import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Restaurant } from "@workspace/api-client-react";

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAskAI: (id: number, name: string) => void;
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

function RestaurantMarker({
  restaurant,
  isActive,
  onSelect,
  onAskAI,
}: {
  restaurant: Restaurant;
  isActive: boolean;
  onSelect: (id: number) => void;
  onAskAI: (id: number, name: string) => void;
}) {
  const map = useMap();

  const handleClick = () => {
    onSelect(restaurant.id);

    const mapsUrl =
      restaurant.googleMapsUrl ??
      `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`;

    const div = document.createElement("div");
    div.style.fontFamily = "system-ui, sans-serif";
    div.style.minWidth = "170px";

    const namePart = restaurant.name ?? "";
    const metaParts = [restaurant.district, restaurant.cuisine].filter(Boolean).join(" · ");

    div.innerHTML = `
      <div style="font-weight:600;font-size:13px;color:#1a1a1a;margin-bottom:3px">${namePart}</div>
      ${metaParts ? `<div style="font-size:11px;color:#888;margin-bottom:10px">${metaParts}</div>` : ""}
      <div style="display:flex;gap:6px;margin-top:8px">
        <a href="${mapsUrl}" target="_blank" rel="noreferrer"
           style="flex:1;text-align:center;font-size:12px;font-weight:500;padding:5px 8px;border-radius:6px;background:#f5f5f5;color:#1a1a1a;text-decoration:none;border:0.5px solid rgba(0,0,0,0.12);cursor:pointer">
          Navigate
        </a>
        <button data-ask
          style="flex:1;font-size:12px;font-weight:500;padding:5px 8px;border-radius:6px;background:#1a1a1a;color:white;border:none;cursor:pointer">
          Ask advisor
        </button>
      </div>
    `;

    div.querySelector("[data-ask]")?.addEventListener("click", () => {
      map.closePopup();
      onAskAI(restaurant.id, restaurant.name);
    });

    L.popup({ offset: L.point(0, -14), closeButton: true, maxWidth: 240 })
      .setLatLng([restaurant.latitude!, restaurant.longitude!])
      .setContent(div)
      .openOn(map);
  };

  return (
    <Marker
      position={[restaurant.latitude!, restaurant.longitude!]}
      icon={createPin(isActive)}
      eventHandlers={{ click: handleClick }}
    />
  );
}

export function RestaurantMap({ restaurants, selectedId, onSelect, onAskAI }: RestaurantMapProps) {
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
          return (
            <RestaurantMarker
              key={restaurant.id}
              restaurant={restaurant}
              isActive={restaurant.id === selectedId}
              onSelect={onSelect}
              onAskAI={onAskAI}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
