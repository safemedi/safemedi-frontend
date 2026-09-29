import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  AcceptedFamilyInvitation,
  FamiliesResponse,
  FamilyInvitation,
  FamilyInvitationInfo,
  FamilySummary,
  UpdatedFamilyRelation,
  UpdateFamilyRelationBody,
} from "@/api/types/family";

export async function fetchFamilies(): Promise<FamilySummary[]> {
  const response = await api.get(apiPaths.families).json<FamiliesResponse>();
  return response.families;
}

export async function createFamilyInvitation(): Promise<FamilyInvitation> {
  return api.post(apiPaths.familyInvitations).json<FamilyInvitation>();
}

export async function fetchFamilyInvitation(token: string): Promise<FamilyInvitationInfo> {
  return api.get(apiPaths.familyInvitation(token)).json<FamilyInvitationInfo>();
}

export async function acceptFamilyInvitation(token: string): Promise<AcceptedFamilyInvitation> {
  return api.post(apiPaths.familyInvitationAccept(token)).json<AcceptedFamilyInvitation>();
}

export async function updateFamilyRelation(
  familyId: number,
  body: UpdateFamilyRelationBody,
): Promise<UpdatedFamilyRelation> {
  return api.patch(apiPaths.family(familyId), { json: body }).json<UpdatedFamilyRelation>();
}

export async function deleteFamily(familyId: number): Promise<void> {
  await api.delete(apiPaths.family(familyId)).text();
}
