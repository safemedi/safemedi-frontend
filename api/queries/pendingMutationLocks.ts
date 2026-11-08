import type { QueryClient } from "@tanstack/react-query";

const locks = new WeakMap<QueryClient, Set<string>>();

export function acquireMutationLock(client: QueryClient, key: string): () => void {
  let keys = locks.get(client);
  if (!keys) {
    keys = new Set();
    locks.set(client, keys);
  }
  if (keys.has(key)) throw new Error("이미 저장 중입니다. 잠시 후 다시 시도해주세요.");
  keys.add(key);
  return () => keys.delete(key);
}
