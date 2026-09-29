export type MedicalFacilityCategory = "all" | "pharmacy" | "emergency";

export type MedicalFacilityStatus = "open" | "closed" | "unknown";

export interface MedicalFacility {
  readonly id: string;
  readonly name: string;
  readonly category: Exclude<MedicalFacilityCategory, "all">;
  readonly address: string;
  readonly roadAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMeters: number;
  readonly phoneNumber: string | null;
  readonly is24Hours: boolean;
  readonly status: MedicalFacilityStatus;
  readonly placeUrl: string | null;
}

export interface FetchNearbyMedicalFacilitiesParams {
  readonly latitude: number;
  readonly longitude: number;
  readonly category: MedicalFacilityCategory;
  readonly keyword: string;
}

export interface NearbyMedicalFacilitiesResponse {
  readonly source: "kakao" | "mock";
  readonly facilities: readonly MedicalFacility[];
}
