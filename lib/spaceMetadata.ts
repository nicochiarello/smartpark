// UI-only data per space not stored on-chain (coordinates, images, descriptions, slot counts)
interface SpaceMeta {
  lat: number;
  lng: number;
  totalSlots: number;
  availableSlots: number;
  imageUrl: string;
  description: string;
}

export const SPACE_METADATA: Record<string, SpaceMeta> = {
  "space-1": {
    lat: -32.8895, lng: -68.8442,
    totalSlots: 8, availableSlots: 5,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=San+Martín+400",
    description: "Sobre la peatonal San Martín, en el corazón del microcentro mendocino.",
  },
  "space-2": {
    lat: -32.8878, lng: -68.8455,
    totalSlots: 6, availableSlots: 2,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Sarmiento+200",
    description: "Estacionamiento techado a dos cuadras de la Plaza Independencia.",
  },
  "space-3": {
    lat: -32.8940, lng: -68.8432,
    totalSlots: 10, availableSlots: 3,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Av.+España+500",
    description: "Sobre Av. España, con acceso rápido al área judicial y comercial.",
  },
  "space-4": {
    lat: -32.8888, lng: -68.8468,
    totalSlots: 7, availableSlots: 2,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Garibaldi+300",
    description: "Playón cubierto en zona residencial y comercial céntrica.",
  },
  "space-5": {
    lat: -32.8862, lng: -68.8440,
    totalSlots: 9, availableSlots: 7,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Las+Heras+100",
    description: "A metros del Parque General San Martín, amplio y con vigilancia.",
  },
  "space-6": {
    lat: -32.8910, lng: -68.8425,
    totalSlots: 5, availableSlots: 5,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Gutiérrez+450",
    description: "Estacionamiento en galería, ideal para estadías cortas en el centro.",
  },
  "space-7": {
    lat: -32.8928, lng: -68.8415,
    totalSlots: 8, availableSlots: 1,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Montevideo+600",
    description: "Muy demandado en horario laboral, reservá con anticipación.",
  },
  "space-8": {
    lat: -32.8945, lng: -68.8400,
    totalSlots: 6, availableSlots: 4,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Colón+700",
    description: "Playón descubierto sobre Colón, acceso directo desde la avenida.",
  },
  "space-9": {
    lat: -32.8898, lng: -68.8458,
    totalSlots: 4, availableSlots: 1,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Rivadavia+350",
    description: "Espacio reducido pero cómodo, en zona comercial de alta demanda.",
  },
  "space-10": {
    lat: -32.8958, lng: -68.8395,
    totalSlots: 10, availableSlots: 8,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Belgrano+800",
    description: "El más amplio del área, con rampas de acceso y vigilancia 24 horas.",
  },
};

export const DEFAULT_SPACE_META: SpaceMeta = {
  lat: -32.8908,
  lng: -68.8440,
  totalSlots: 6,
  availableSlots: 3,
  imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Estacionamiento",
  description: "Estacionamiento registrado en la blockchain.",
};
