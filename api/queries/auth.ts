import { useMutation } from "@tanstack/react-query";

import { postLogout } from "@/api/endpoints/auth";
import { queryKeys } from "@/api/query-keys";

export function useLogoutMutation() {
  return useMutation({
    mutationKey: queryKeys.auth.logout,
    mutationFn: postLogout,
  });
}
