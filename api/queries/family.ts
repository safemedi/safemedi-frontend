import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptFamilyInvitation,
  createFamilyInvitation,
  deleteFamily,
  fetchFamilies,
  fetchFamilyInvitation,
  updateFamilyRelation,
} from "@/api/endpoints/family";
import { queryKeys } from "@/api/query-keys";
import type { FamilySummary, UpdateFamilyRelationBody } from "@/api/types/family";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 5 * 60 * 1000;

type FamilyListUpdater = (current: FamilySummary[] | undefined) => FamilySummary[] | undefined;

function useFamilyListMutationEffects() {
  const queryClient = useQueryClient();

  const applyFamilyListUpdate = async (updater: FamilyListUpdater) => {
    queryClient.setQueryData<FamilySummary[]>(queryKeys.family.list, updater);
    await queryClient.invalidateQueries({ queryKey: queryKeys.family.list });
  };

  return { applyFamilyListUpdate };
}

export function useFamilies() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.list,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchFamilies,
  });
}

export function useCreateFamilyInvitation() {
  return useMutation({
    mutationFn: createFamilyInvitation,
  });
}

export function useFamilyInvitation(token: string | null) {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.invitation(token ?? ""),
    enabled: !!accessToken && !!token,
    staleTime: STALE_MS,
    queryFn: async () => {
      if (!token) {
        throw new Error("초대 토큰이 필요합니다.");
      }
      return fetchFamilyInvitation(token);
    },
  });
}

export function useAcceptFamilyInvitation() {
  const { applyFamilyListUpdate } = useFamilyListMutationEffects();

  return useMutation({
    mutationFn: acceptFamilyInvitation,
    onSuccess: async (accepted) => {
      await applyFamilyListUpdate((current) => {
        if (!current) {
          return current;
        }
        const withoutDuplicate = current.filter((family) => family.familyId !== accepted.familyId);
        return [
          ...withoutDuplicate,
          {
            familyId: accepted.familyId,
            name: accepted.name,
            relation: accepted.relation,
          },
        ];
      });
    },
  });
}

export function useUpdateFamilyRelation() {
  const { applyFamilyListUpdate } = useFamilyListMutationEffects();

  return useMutation({
    mutationFn: ({ familyId, body }: { familyId: number; body: UpdateFamilyRelationBody }) =>
      updateFamilyRelation(familyId, body),
    onSuccess: async (updated) => {
      await applyFamilyListUpdate((current) => {
        if (!current) {
          return current;
        }
        return current.map((family) =>
          family.familyId === updated.familyId
            ? { ...family, name: updated.name, relation: updated.relation }
            : family,
        );
      });
    },
  });
}

export function useDeleteFamily() {
  const { applyFamilyListUpdate } = useFamilyListMutationEffects();

  return useMutation({
    mutationFn: deleteFamily,
    onSuccess: async (_result, familyId) => {
      await applyFamilyListUpdate((current) =>
        current?.filter((family) => family.familyId !== familyId),
      );
    },
  });
}
