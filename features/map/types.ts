import type { MedicalFacility, MedicalFacilityCategory } from "@/api/types/map";

export interface MapCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapRegion extends MapCoordinate {
  readonly latitudeDelta: number;
  readonly longitudeDelta: number;
}

export interface MapFacilityMarker {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly category: Exclude<MedicalFacilityCategory, "all">;
}

export type { MedicalFacility, MedicalFacilityCategory };
