"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { ParkingSpace } from "@/lib/types";
import { renderToStaticMarkup } from "react-dom/server";
import { SpacePinSVG } from "./SpacePin";

interface MapProps {
  spaces: ParkingSpace[];
  selectedSpace: ParkingSpace | null;
  onSelectSpace: (space: ParkingSpace) => void;
}

const MENDOZA_CENTER: [number, number] = [-32.8908, -68.8440];
const DEFAULT_ZOOM = 15;

export default function Map({ spaces, selectedSpace, onSelectSpace }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || leafletMapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;

      if (cancelled || !mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current, {
        center: MENDOZA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Style attribution control
      map.attributionControl.setPrefix(false);

      leafletMapRef.current = map;
      setIsLoaded(true);
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Add/update markers whenever spaces or selection change
  useEffect(() => {
    if (!isLoaded || !leafletMapRef.current) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      const map = leafletMapRef.current;

      // Remove old markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      spaces.forEach((space) => {
        const isSelected = selectedSpace?.id === space.id;
        const svgString = renderToStaticMarkup(
          <SpacePinSVG
            status={space.status}
            availableSlots={space.availableSlots}
            isSelected={isSelected}
          />
        );

        const iconWidth = isSelected ? 53 : 44;
        const iconHeight = isSelected ? 62 : 52;

        const icon = L.divIcon({
          html: svgString,
          className: "",
          iconSize: [iconWidth, iconHeight],
          iconAnchor: [iconWidth / 2, iconHeight],
          popupAnchor: [0, -iconHeight],
        });

        const marker = L.marker([space.lat, space.lng], { icon })
          .addTo(map)
          .on("click", () => onSelectSpace(space));

        markersRef.current.set(space.id, marker);
      });
    }

    updateMarkers();
  }, [isLoaded, spaces, selectedSpace, onSelectSpace]);

  // Pan to selected space
  useEffect(() => {
    if (!isLoaded || !leafletMapRef.current || !selectedSpace) return;
    leafletMapRef.current.panTo([selectedSpace.lat, selectedSpace.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [isLoaded, selectedSpace]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-900">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-surface-400">Cargando mapa...</span>
          </div>
        </div>
      )}
    </div>
  );
}
