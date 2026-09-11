"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PlugZap, Save } from "lucide-react";
import { Button, Status } from "@/components/ui";
import { apiFetch } from "@/lib/api";

type SettingsResponse = {
  provider: string;
  configured: boolean;
};

type ApiKeyTestResponse = {
  provider: string;
  valid: boolean;
};

export function Settings() {
  const [key, setKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "valid" | "failed">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch<SettingsResponse>("/settings");
        setConfigured(data.configured);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const save = async () => {
    if (key.trim().length === 0) return;

    setSaveStatus("saving");
    setTestStatus("idle");
    setError("");

    try {
      const data = await apiFetch<{ provider: string; configured: boolean }>("/settings/api-key", {
        method: "PUT",
        body: JSON.stringify({ api_key: key.trim() }),
      });
      setConfigured(data.configured);
      setSaveStatus("saved");
      setKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key.");
      setSaveStatus("failed");
    }
  };

  const test = async () => {
    setTestStatus("testing");
    setError("");

    try {
      const data = await apiFetch<ApiKeyTestResponse>("/settings/api-key/test", {
        method: "POST",
      });
      setTestStatus(data.valid ? "valid" : "failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Key test failed.");
      setTestStatus("failed");
    }
  };

  return (
    <div className="flex justify-center px-16 py-14">
      <div className="w-full max-w-[840px]">
        <p className="font-medium text-sm tracking-[0.17em] text-neutral-500 uppercase mb-1.0">Settings</p>
        <h1 className="text-[42px] font-bold tracking-tight text-white mb-3.5">Bring your own key</h1>
        <p className="text-base text-neutral-400 leading-relaxed mb-9 max-w-[600px]">
          Use a supported provider for reasoning evaluation. Keys are encrypted and never displayed again after saving.
        </p>

        <div className="bg-[#121312] border border-[#242624] rounded-[18px] p-11">
          <p className="text-xs tracking-wide text-neutral-500 uppercase mb-3.5">Provider</p>
          <div className="flex items-center justify-between h-[60px] rounded-xl bg-[#0E0F0E] border border-[#242624] px-[22px] mb-8">
            <div className="flex items-center gap-3.5">
              <span className={`w-[10px] h-[10px] rounded-full ${configured ? "bg-[#1FAE81]" : "bg-neutral-600"}`} />
              <span className="text-lg font-medium text-white">Gemini</span>
            </div>
            <span className="text-[11px] tracking-wide uppercase text-[#ffff] bg-[#4e6152]/10 px-3.5 py-1.5 rounded-full">
              {loading ? "Checking…" : configured ? "Configured" : "Not Configured"}
            </span>
          </div>

          <p className="text-xs tracking-wide text-neutral-500 uppercase mb-3.5">API key</p>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            type="password"
            autoComplete="off"
            placeholder="Paste your Gemini API key"
            className="w-full h-[60px] rounded-xl bg-[#0E0F0E] border border-[#242624] px-[22px] text-[15px] font-mono text-white placeholder:text-neutral-600 outline-none focus:border-[#1FAE81]/50"
          />
          <p className="text-[13px] text-neutral-500 mt-3 mb-8">Enter a key to test and save it securely.</p>

          {error && <p className="text-sm text-danger mb-4">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Button
              loading={saveStatus === "saving"}
              onClick={save}
              disabled={key.trim().length === 0}
              className="h-[58px] rounded-xl bg-[#4e6152] hover:bg-[#4e6152]/90 text-[#ffff] font-medium text-[15px] flex items-center justify-center gap-2.5"
            >
              <Save size={19} />
              Save key
            </Button>

            <Button
              loading={testStatus === "testing"}
              onClick={test}
              disabled={!configured}
              className="h-[58px] rounded-xl bg-[#4e6152] hover:bg-[#4e6152]/90 text-[#ffff] font-medium text-[15px] flex items-center justify-center gap-2.5"
            >
              <PlugZap size={19} />
              Test connection
            </Button>
          </div>

          {saveStatus === "saved" && (
            <div className="mt-5">
              <Status tone="success">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Key saved securely.
                </span>
              </Status>
            </div>
          )}

          {testStatus === "valid" && (
            <div className="mt-5">
              <Status tone="success">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Connection successful.
                </span>
              </Status>
            </div>
          )}
          {testStatus === "failed" && (
            <div className="mt-5">
              <Status tone="error">We could not verify this key. Check the provider and try again.</Status>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}