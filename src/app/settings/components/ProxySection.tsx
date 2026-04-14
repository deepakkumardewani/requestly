import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { useSettingsStore } from "@/stores/useSettingsStore";

type SettingsStore = ReturnType<typeof useSettingsStore.getState>;

type Props = {
  sslVerify: boolean;
  followRedirects: boolean;
  proxyUrl: string;
  setSetting: SettingsStore["setSetting"];
};

export function ProxySection({
  sslVerify,
  followRedirects,
  proxyUrl,
  setSetting,
}: Props) {
  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-base font-semibold">Network & Security</h2>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">SSL Verification</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Verify SSL certificates for HTTPS requests
            </p>
          </div>
          <Switch
            data-testid="ssl-verification-switch"
            checked={sslVerify}
            onCheckedChange={(v) => setSetting("sslVerify", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Follow Redirects</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Automatically follow HTTP redirects
            </p>
          </div>
          <Switch
            data-testid="follow-redirects-switch"
            checked={followRedirects}
            onCheckedChange={(v) => setSetting("followRedirects", v)}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label className="text-sm">Proxy URL</Label>
        <p className="text-xs text-muted-foreground">
          Override the proxy server URL for all requests
        </p>
        <Input
          data-testid="proxy-url-input"
          className="h-8 font-mono text-xs"
          value={proxyUrl}
          placeholder="http://127.0.0.1:8080"
          onChange={(e) => setSetting("proxyUrl", e.target.value)}
        />
      </div>
    </div>
  );
}
