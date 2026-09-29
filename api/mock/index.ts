import { registerSaf26Mocks } from "./handlers";
import { createMockFetch, resolveFetchImplementation } from "./mock-fetch";
import { MockRegistry } from "./registry";

const registry = new MockRegistry();
registerSaf26Mocks(registry);

export type { MockRegistry } from "./registry";
export type { HttpMethod, MockHandler, MockHandlerContext } from "./types";
export { createMockFetch, registry as mockRegistry, resolveFetchImplementation };
