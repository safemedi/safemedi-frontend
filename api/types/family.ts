/** GET /api/v1/families 목록 항목 */
export type FamilySummary = {
  familyId: number | null;
  name: string;
  relation: string;
};

/** GET /api/v1/families 응답 */
export type FamiliesResponse = {
  families: FamilySummary[];
};

/** POST /api/v1/family-invitations 응답 */
export type FamilyInvitation = {
  invitationId: number;
  inviteUrl: string;
  status: "PENDING";
  createdAt: string;
  expiresAt: string;
};

/** GET /api/v1/family-invitations/{token} 응답 */
export type FamilyInvitationInfo = {
  inviterName: string;
  expiresAt: string;
};

/** POST /api/v1/family-invitations/{token}/accept 응답 */
export type AcceptedFamilyInvitation = {
  familyId: number;
  name: string;
  relation: string;
  connectedAt: string;
};

/** PATCH /api/v1/families/{familyId} 요청 */
export type UpdateFamilyRelationBody = {
  relation: string;
};

/** PATCH /api/v1/families/{familyId} 응답 */
export type UpdatedFamilyRelation = {
  familyId: number;
  name: string;
  relation: string;
  updatedAt: string;
};
