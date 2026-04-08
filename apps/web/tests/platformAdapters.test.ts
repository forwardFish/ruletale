import { createWebNavigationAdapter } from "@/platform/web/navigation";
import { createSessionStorageAdapter } from "@/platform/web/sessionStorage";
import { webRuntimeConfig } from "@/platform/web/runtime";

describe("web platform adapters", () => {
  it("reads and writes the session id through the storage adapter", () => {
    const storage = new Map<string, string>();
    const adapter = createSessionStorageAdapter(() => ({
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
    }));

    adapter.setSessionId("session-42");
    expect(adapter.getSessionId()).toBe("session-42");

    adapter.clearSessionId();
    expect(adapter.getSessionId()).toBeNull();
  });

  it("delegates navigation through the web navigation adapter", () => {
    const router = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    };
    const adapter = createWebNavigationAdapter(router);

    adapter.push("/dungeon/session-42");
    adapter.replace("/?lobby=1");
    adapter.back();

    expect(router.push).toHaveBeenCalledWith("/dungeon/session-42");
    expect(router.replace).toHaveBeenCalledWith("/?lobby=1");
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("exposes a web runtime config that future mini-app shells can swap out", () => {
    expect(webRuntimeConfig.platform).toBe("web");
    expect(webRuntimeConfig.enableMotion).toBe(true);
    expect(webRuntimeConfig.apiBase).toContain("127.0.0.1");
  });
});
