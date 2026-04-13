"use client";

import { useState } from "react";
import type { Scenario, ScenarioResult } from "@/types";
import { KpiCard } from "./kpi-card";
import { CashflowChart } from "./cashflow-chart";
import { MonthlyBarChart } from "./monthly-bar-chart";
import { RunwayIndicator } from "./runway-indicator";
import { ScenarioToggle } from "./scenario-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCHF } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Shield,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";

interface DashboardClientProps {
  scenarios: ScenarioResult;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  ytdIncome: number;
  ytdExpenses: number;
  ytdTaxEstimate: number;
  minCashBuffer: number;
  horizonMonths: number;
  startingCash: number;
  effectiveTaxRate: number;
}

export function DashboardClient({
  scenarios,
  currentMonthIncome,
  currentMonthExpenses,
  ytdIncome,
  ytdExpenses,
  ytdTaxEstimate,
  minCashBuffer,
  horizonMonths,
  startingCash,
  effectiveTaxRate,
}: DashboardClientProps) {
  const [scenario, setScenario] = useState<Scenario>("base");

  const forecast = scenarios[scenario];
  const currentProjection = forecast.projections[0];
  const currentCash = startingCash;

  // Year-end projected profit
  const yearEndProfit =
    forecast.totalProjectedIncome - forecast.totalProjectedExpenses;

  // Year-end tax estimate
  const yearEndTaxEstimate =
    Math.max(0, yearEndProfit) * (effectiveTaxRate / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your financial overview at a glance
          </p>
        </div>
        <ScenarioToggle value={scenario} onChange={setScenario} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Cash Balance"
          value={formatCHF(currentCash)}
          subtitle="Current starting cash"
          icon={Wallet}
          variant={currentCash > minCashBuffer ? "success" : "danger"}
        />
        <KpiCard
          title="Monthly Income"
          value={formatCHF(currentMonthIncome)}
          subtitle="Current month"
          icon={TrendingUp}
          variant="default"
        />
        <KpiCard
          title="Monthly Expenses"
          value={formatCHF(currentMonthExpenses)}
          subtitle="Current month"
          icon={TrendingDown}
          variant="default"
        />
        <KpiCard
          title="Tax Reserve"
          value={formatCHF(forecast.totalTaxReserve)}
          subtitle={`${effectiveTaxRate}% effective rate`}
          icon={Shield}
          variant="warning"
        />
      </div>

      {/* Runway + Tax Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <RunwayIndicator
            months={forecast.runwayMonths}
            horizonMonths={horizonMonths}
          />
        </div>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Tax Estimates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">YTD tax estimate</span>
              <span className="font-semibold">{formatCHF(ytdTaxEstimate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Projected year-end
              </span>
              <span className="font-semibold">
                {formatCHF(yearEndTaxEstimate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly reserve</span>
              <span className="font-semibold">
                {formatCHF(currentProjection?.taxReserve ?? 0)}
              </span>
            </div>
            <div className="mt-3 p-2 rounded-md bg-warning/10 text-xs text-warning flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Simplified estimate only — not tax advice. Consult a Swiss tax
                advisor for accurate calculations.
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">YTD Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total income</span>
              <span className="font-semibold text-success">
                {formatCHF(ytdIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total expenses</span>
              <span className="font-semibold text-danger">
                {formatCHF(ytdExpenses)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-muted-foreground font-medium">
                Net profit
              </span>
              <span className="font-bold">
                {formatCHF(ytdIncome - ytdExpenses)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After tax (est.)</span>
              <span className="font-semibold">
                {formatCHF(ytdIncome - ytdExpenses - ytdTaxEstimate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Forecasted Cash Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart
              projections={forecast.projections}
              minCashBuffer={minCashBuffer}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Monthly Cashflow Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBarChart projections={forecast.projections} />
          </CardContent>
        </Card>
      </div>

      {/* Scenario comparison */}
      {scenario !== "base" && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                Scenario: {scenario}
              </span>{" "}
              — Income adjusted by{" "}
              {scenario === "conservative" ? "−20%" : "+20%"}. Runway:{" "}
              <span className="font-semibold">
                {forecast.runwayMonths === -1
                  ? `${horizonMonths}+ months`
                  : `${forecast.runwayMonths} months`}
              </span>
              . End cash:{" "}
              <span className="font-semibold">
                {formatCHF(forecast.endingCash)}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
