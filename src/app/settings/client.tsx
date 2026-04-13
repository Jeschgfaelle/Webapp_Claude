"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { updateSettings } from "@/lib/actions/settings";
import {
  Settings as SettingsIcon,
  Wallet,
  Shield,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SettingsData {
  id: string;
  startingCash: number;
  minCashBuffer: number;
  horizonMonths: number;
  effectiveTaxRate: number;
  taxDeductions: number;
  taxReservePercent: number;
  taxPaymentSchedule: string;
  currency: string;
}

export function SettingsPageClient({ settings }: { settings: SettingsData }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings(formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Configure your financial parameters and tax settings
        </p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Cash Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cash & Forecast
            </CardTitle>
            <CardDescription>
              Set your current cash position and forecast parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startingCash">Starting Cash (CHF)</Label>
                <Input
                  id="startingCash"
                  name="startingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={settings.startingCash}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your current bank balance
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCashBuffer">Minimum Cash Buffer (CHF)</Label>
                <Input
                  id="minCashBuffer"
                  name="minCashBuffer"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={settings.minCashBuffer}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Runway alert triggers below this
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horizonMonths">Forecast Horizon (months)</Label>
                <Input
                  id="horizonMonths"
                  name="horizonMonths"
                  type="number"
                  min="1"
                  max="36"
                  defaultValue={settings.horizonMonths}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  id="currency"
                  name="currency"
                  defaultValue={settings.currency}
                  options={[
                    { value: "CHF", label: "CHF – Swiss Franc" },
                    { value: "EUR", label: "EUR – Euro" },
                    { value: "USD", label: "USD – US Dollar" },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Tax Settings (Simplified)
            </CardTitle>
            <CardDescription>
              Configure your estimated tax rates for the forecast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-md bg-warning/10 text-sm text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                These are simplified estimates combining income tax, AHV/IV/EO,
                and other contributions. For accurate tax planning, consult a
                Swiss tax advisor or Treuhänder.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveTaxRate">
                  Effective Tax Rate (%)
                </Label>
                <Input
                  id="effectiveTaxRate"
                  name="effectiveTaxRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={settings.effectiveTaxRate}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Combined rate: income tax + AHV/IV/EO etc.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxDeductions">
                  Annual Deductions (CHF)
                </Label>
                <Input
                  id="taxDeductions"
                  name="taxDeductions"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={settings.taxDeductions}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. Pillar 3a, business deductions
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxReservePercent">
                  Tax Reserve Rate (%)
                </Label>
                <Input
                  id="taxReservePercent"
                  name="taxReservePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={settings.taxReservePercent}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  % of profit set aside for taxes
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxPaymentSchedule">
                  Tax Payment Schedule
                </Label>
                <Select
                  id="taxPaymentSchedule"
                  name="taxPaymentSchedule"
                  defaultValue={settings.taxPaymentSchedule}
                  options={[
                    { value: "monthly", label: "Monthly reserve" },
                    { value: "quarterly", label: "Quarterly payments" },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
          {saved && (
            <span className="text-sm text-success flex items-center gap-1 animate-fade-in">
              <CheckCircle className="h-4 w-4" />
              Settings saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
