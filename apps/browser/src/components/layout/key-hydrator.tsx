"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  API_KEY_STORAGE_ERROR_EVENT,
  API_KEY_STORAGE_KEYS,
  APP_PREFERENCE_STORAGE_KEYS,
  hydrateKeys,
} from "@/lib/api-keys";
import { runLocalDataMigrations } from "@/lib/local-data-migrations";

const LOCAL_DATA_MIGRATION_FAILURE_MESSAGE =
  "本机学习数据检查失败：本机存储暂时不可用。应用会继续启动；如果设置页仍显示异常，请导出诊断包或重置本机数据后重试。";

/**
 * Runs once on client mount: validates browser storage and hydrates
 * synchronous settings readers after local migrations complete.
 */
export function KeyHydrator() {
  useEffect(() => {
    const apiKeySlots = new Set<string>(API_KEY_STORAGE_KEYS);
    const appPreferenceSlots = new Set<string>(APP_PREFERENCE_STORAGE_KEYS);
    const handler = (
      event: WindowEventMap[typeof API_KEY_STORAGE_ERROR_EVENT],
    ) => {
      const subject = apiKeySlots.has(event.detail.key)
        ? "API key "
        : appPreferenceSlots.has(event.detail.key)
          ? "本机设置"
          : "本机数据";
      const action =
        event.detail.operation === "delete"
          ? "删除"
          : event.detail.operation === "hydrate"
            ? "读取"
            : "保存";
      toast.error(`${subject}${action}失败：${event.detail.message}`);
    };
    window.addEventListener(API_KEY_STORAGE_ERROR_EVENT, handler);
    try {
      const migration = runLocalDataMigrations();
      if (migration.quarantinedKeys.length > 0) {
        toast.warning(
          `已隔离 ${migration.quarantinedKeys.length} 个损坏的本地数据项`,
        );
      }
    } catch {
      toast.error(LOCAL_DATA_MIGRATION_FAILURE_MESSAGE);
    }
    void hydrateKeys();
    return () => {
      window.removeEventListener(API_KEY_STORAGE_ERROR_EVENT, handler);
    };
  }, []);
  return null;
}
