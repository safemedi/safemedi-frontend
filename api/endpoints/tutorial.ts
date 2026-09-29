import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { TutorialRegistrationBody, TutorialRegistrationResponse } from "@/api/types/tutorial";

export async function postTutorialRegistration(
  body: TutorialRegistrationBody,
): Promise<TutorialRegistrationResponse> {
  return api
    .post(apiPaths.usersMeTutorial, {
      json: body,
    })
    .json<TutorialRegistrationResponse>();
}
