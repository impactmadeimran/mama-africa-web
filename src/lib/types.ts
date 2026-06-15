export type User = {
  id: string;
  name: string;
  vendorType?: "retail" | "food" | "format_b" | "both" | "table";
  restockFrequency?: string;
  sellingDaysPerWeek?: number;
};

export type OcrSalesEntry = {
  product_raw?: string;
  tally_count?: number | null;
  price_per_unit_ghs?: number | null;
  uncertain_fields?: string[];
  transactions?: number[];
  total_units_sold?: number;
  day_revenue_ghs?: number;
  row_total_ghs?: number | null;
};

export type OcrCostEntry = {
  product_raw?: string;
  pack_size?: number | null;
  price_per_pack_ghs?: number | null;
  packs_bought?: number | null;
  uncertain_fields?: string[];
};

export type OcrResult = {
  sales?: { date?: string; entries?: OcrSalesEntry[] }[];
  costs?: { date?: string; entries?: OcrCostEntry[] }[];
  ingredients?: { ingredient?: string; amount_ghs?: number; uncertain?: boolean }[];
  leftovers?: { ingredient?: string; value_ghs?: number; date?: string }[];
  spoilage?: { ingredient?: string; value_ghs?: number; date?: string }[];
  cost_period?: string;
  image_quality?: string;
  uncertainties?: string[];
  notes?: string;
};

export type ProductBreakdown = {
  name: string;
  revenue: number;
  cost: number;
  margin: number;
  unitsSold?: number;
};

export type ReportVisual = {
  revenue_ghs?: number;
  cost_ghs?: number;
  profit_ghs?: number | null;
  profit_color?: string;
  best_day?: { day?: string; revenue_ghs?: number } | null;
  top_product?: { name?: string; revenue_ghs?: number } | null;
  revenue_vs_last_week?: "up" | "down" | "same" | null;
  revenue_change_pct?: number | null;
  revenue_trend_icon?: string | null;
  stock_alert?: string | null;
  concentration_alert?: string | null;
  total_receivables_ghs?: number | null;
  cost_note?: string | null;
  projection?: {
    projected_monthly_revenue_ghs?: number | null;
    projected_monthly_profit_ghs?: number | null;
    based_on_days?: number;
    confidence?: "low" | "medium" | "high";
  } | null;
};

export type ReportText = {
  what_this_means?: string;
  what_is_working?: string;
  critical_alerts?: string;
  areas_to_watch?: string;
  recommendation?: string;
  pricing_notes?: string;
  this_weeks_numbers?: string;
};

export type ReportJson = {
  weekStart: string;
  revenue: number;
  cost: number;
  profit: number;
  products: ProductBreakdown[];
  visual?: ReportVisual;
  text?: ReportText;
  report: {
    headline: string;
    summary: string;
    concerns: string[];
    suggestions: string[];
    criticalAlerts?: string;
    whatIsWorking?: string;
    recommendation?: string;
    areasToWatch?: string;
    pricingNotes?: string;
    whatThisMeans?: string;
    costNote?: string;
  };
};

export type WeekSummary = {
  weekStart: string;
  revenue: number;
  cost: number;
  profit: number;
  days?: number;
};

export type DashboardHeadline = {
  text: string;
  color: "green" | "amber" | "red";
};

export type DashboardAction = {
  icon: string;
  text: string;
};

export type DashboardPayload = {
  report: ReportJson | null;
  weekStart?: string;
  history: WeekSummary[];
  chartWeeks: string[];
  chartRevenue: number[];
  chartProfit: number[];
  streak: number;
  headline: DashboardHeadline | null;
  action: DashboardAction | null;
};
