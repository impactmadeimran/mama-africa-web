import type { OcrResult } from './types'

function safeNum(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === 'number') return val
  return null
}

export type OcrDisplayEntry = {
  name: string
  count?: number | null
  countStr?: string
  price?: number | null
  total?: number | null
  packSize?: number | null
  uncertain: boolean
  formatB: boolean
  table: boolean
}

export type OcrDisplayCost = {
  name: string
  algebraStr: string
  totalStr: string
  totalAmount: number | null
  uncertain: boolean
}

export type OcrDisplaySimple = {
  name: string
  totalStr: string
  uncertain: boolean
}

export type OcrDisplay = {
  salesDays: { date: string; entries: OcrDisplayEntry[] }[]
  costEntries: OcrDisplayCost[]
  ingredientEntries: OcrDisplaySimple[]
  leftoverEntries: OcrDisplaySimple[]
  spoilageEntries: OcrDisplaySimple[]
  isFormatB: boolean
  isTable: boolean
  isFood: boolean
  costPeriod: string
  notes: string
}

export function buildOcrDisplay(ocr: OcrResult): OcrDisplay {
  const isTableLayout = (ocr.notes ?? '').includes('layout:table')
  const salesDays: OcrDisplay['salesDays'] = []
  for (const day of ocr.sales ?? []) {
    const entries: OcrDisplayEntry[] = []
    for (const e of day.entries ?? []) {
      const name = e.product_raw ?? '?'
      if (!name.trim() || ['p', 'p:', 'p.', 'p-'].includes(name.trim().toLowerCase())) continue

      if (e.transactions?.length) {
        const totalUnits = e.total_units_sold ?? e.transactions.reduce((a, b) => a + b, 0)
        entries.push({
          name,
          count: totalUnits,
          countStr: `${e.transactions.join(' + ')} = ${totalUnits} units`,
          price: null,
          total: safeNum(e.day_revenue_ghs),
          uncertain: Boolean(e.uncertain_fields?.length),
          formatB: true,
          table: false,
        })
      } else if (e.row_total_ghs != null || isTableLayout) {
        const qty = e.tally_count
        const price = safeNum(e.price_per_unit_ghs)
        const rowTotal = safeNum(e.row_total_ghs) ?? safeNum(e.day_revenue_ghs)
        entries.push({
          name,
          count: qty,
          price,
          total:
            rowTotal ??
            (qty != null && price != null ? round2(qty * price) : null),
          uncertain: Boolean(e.uncertain_fields?.length),
          formatB: false,
          table: true,
        })
      } else {
        entries.push({
          name,
          count: e.tally_count,
          price: safeNum(e.price_per_unit_ghs),
          total:
            e.tally_count != null && e.price_per_unit_ghs != null
              ? round2(e.tally_count * e.price_per_unit_ghs)
              : null,
          uncertain: Boolean(e.uncertain_fields?.length),
          formatB: false,
          table: false,
        })
      }
    }
    if (entries.length) {
      salesDays.push({ date: day.date ?? 'Unknown date', entries })
    }
  }

  const costEntries: OcrDisplayCost[] = []
  for (const period of ocr.costs ?? []) {
    for (const e of period.entries ?? []) {
      const name = e.product_raw ?? '?'
      const ppu = safeNum(e.price_per_pack_ghs)
      const packs = safeNum(e.packs_bought)
      const ps = safeNum(e.pack_size)
      const pkDisplay = packs ?? 1
      let algebraStr = '?'
      let totalStr = ''
      let totalAmount: number | null = null

      if (ppu != null) {
        totalAmount = round2(ppu * pkDisplay)
        if (ps && ps > 1) {
          algebraStr = `${pkDisplay} × GHS ${ppu.toFixed(2)} (pack of ${ps}) = GHS ${totalAmount.toFixed(2)}`
          totalStr = `Pack size: ${ps}`
        } else {
          algebraStr = `${pkDisplay} × GHS ${ppu.toFixed(2)} = GHS ${totalAmount.toFixed(2)}`
        }
        if (packs == null) algebraStr += ' ⚠️ quantity unclear'
      }

      costEntries.push({
        name,
        algebraStr,
        totalStr,
        totalAmount,
        uncertain: Boolean(e.uncertain_fields?.length),
      })
    }
  }

  const ingredientEntries = (ocr.ingredients ?? []).map((ing) => ({
    name: ing.ingredient ?? '?',
    totalStr: ing.amount_ghs != null ? `GHS ${ing.amount_ghs.toFixed(2)}` : '?',
    uncertain: false,
  }))

  const leftoverEntries = (ocr.leftovers ?? []).map((l) => ({
    name: l.ingredient ?? '?',
    totalStr: l.value_ghs != null ? `GHS ${l.value_ghs.toFixed(2)}` : '?',
    uncertain: false,
  }))

  const spoilageEntries = (ocr.spoilage ?? []).map((s) => ({
    name: s.ingredient ?? '?',
    totalStr: s.value_ghs != null ? `GHS ${s.value_ghs.toFixed(2)}` : '?',
    uncertain: false,
  }))

  return {
    salesDays,
    costEntries,
    ingredientEntries,
    leftoverEntries,
    spoilageEntries,
    isFormatB: salesDays.some((d) => d.entries.some((e) => e.formatB)),
    isTable: isTableLayout || salesDays.some((d) => d.entries.some((e) => e.table)),
    isFood: Boolean(leftoverEntries.length || spoilageEntries.length || ingredientEntries.length),
    costPeriod: ocr.cost_period ?? 'unknown',
    notes: ocr.notes ?? '',
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
