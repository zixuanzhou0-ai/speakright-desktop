"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getApiKeyPersistence,
  setApiKeyPersistence,
  type ApiKeyPersistence,
} from "@/lib/api-keys";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ApiKeyPersistenceCard() {
  const [mode, setMode] = useState<ApiKeyPersistence>("session");

  useEffect(() => {
    setMode(getApiKeyPersistence());
  }, []);

  const handleChange = (persistLocally: boolean) => {
    const nextMode: ApiKeyPersistence = persistLocally ? "local" : "session";
    setApiKeyPersistence(nextMode);
    setMode(nextMode);
    toast.success(
      persistLocally
        ? "API Key 将保存在本机浏览器。"
        : "API Key 已切回仅本次会话保存。",
    );
  };

  return (
    <div
      className="mb-6 rounded-xl border bg-card p-4 text-sm shadow-sm"
      data-smoke="api-key-persistence"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="font-heading font-medium">API Key 保存方式</h2>
          <p className="text-muted-foreground">
            默认仅保存在本次浏览器会话；开启后才写入 localStorage，适合个人可信设备。
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Label htmlFor="api-key-persistence">保存在本机浏览器</Label>
          <Switch
            id="api-key-persistence"
            checked={mode === "local"}
            onCheckedChange={handleChange}
            data-smoke="api-key-persistence-switch"
          />
        </div>
      </div>
    </div>
  );
}
