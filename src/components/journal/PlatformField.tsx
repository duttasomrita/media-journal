import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WATCH_PLATFORMS } from "@/lib/watch-details";

export function PlatformField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [other, setOther] = useState(false);
  const custom = other || (!!value && !WATCH_PLATFORMS.includes(value));
  return <div className="space-y-2">
    <Label>Watched on</Label>
    <Select value={custom ? "Other" : value} onValueChange={(v) => { setOther(v === "Other"); onChange(v === "Other" ? "" : v); }}>
      <SelectTrigger aria-label="Watched on"><SelectValue placeholder="Select a platform" /></SelectTrigger>
      <SelectContent>{WATCH_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
    </Select>
    {custom && <Input aria-label="Other platform" placeholder="Platform name" value={value} onChange={(e) => onChange(e.target.value)} />}
  </div>;
}