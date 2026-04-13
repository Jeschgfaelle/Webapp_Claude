import { getSettings } from "@/lib/actions/settings";
import { SettingsPageClient } from "./client";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsPageClient settings={settings} />;
}
