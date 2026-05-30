"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { API_KEY_STORAGE_ERROR_EVENT, hydrateKeys } from "@/lib/api-keys";
import { runLocalDataMigrations } from "@/lib/local-data-migrations";

/**
 * Runs once on client mount: pulls API key configs from the Tauri store
 * into localStorage so synchronous readers see persisted values, and
 * migrates any legacy localStorage values into the store on first run.
 */
export function KeyHydrator() {
  useEffect(() => {
    const handler = (
      event: WindowEventMap[typeof API_KEY_STORAGE_ERROR_EVENT],
    ) => {
      const action =
        event.detail.operation === "delete"
          ? "删除"
          : event.detail.operation === "hydrate"
            ? "读取"
            : "保存";
      toast.error(`API key ${action}失败：${event.detail.message}`);
    };
    window.addEventListener(API_KEY_STORAGE_ERROR_EVENT, handler);
    const migration = runLocalDataMigrations();
    if (migration.quarantinedKeys.length > 0) {
      toast.warning(
        `已隔离 ${migration.quarantinedKeys.length} 个损坏的本地数据项`,
      );
    }
    void hydrateKeys();
    return () => {
      window.removeEventListener(API_KEY_STORAGE_ERROR_EVENT, handler);
    };
  }, []);
  return null;
}
