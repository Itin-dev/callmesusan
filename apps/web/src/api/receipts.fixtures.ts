import type { ScanResult } from './types'

// Answer of POST /api/receipts/scan for the LOLA test photo
// (services/api/app/data/scans/receipt-lola-20251121.png), matched to the payment P-0236.
export const LOLA_SCAN_FIXTURE: ScanResult = {
  transaction_id: 'P-0236',
  receipt: {
    receipt_id: 'LOLA-20251121-199652',
    store: 'LOLA',
    branch: 'Mattenhof',
    time: '11:52',
    source: 'photo',
    total_rp: 910,
    items: [
      { name: 'Club-Mate, Loscher, 50cl', category: 'beverages', quantity: 1, unit: 'pcs', unit_price_rp: 200, line_total_rp: 200, discount_rp: 0 },
      { name: 'Depot', category: 'beverages', quantity: 1, unit: 'pcs', unit_price_rp: 30, line_total_rp: 30, discount_rp: 0 },
      { name: 'Stella Schokolade Lait Noisette, Morga, 100g', category: 'chocolate', quantity: 1, unit: 'pcs', unit_price_rp: 360, line_total_rp: 360, discount_rp: 0 },
      { name: 'Cookie Caramel&Sel gf, Freely, 65g', category: 'snacks', quantity: 1, unit: 'pcs', unit_price_rp: 320, line_total_rp: 320, discount_rp: 0 },
    ],
    category_totals: [
      { category: 'beverages', total_rp: 230 },
      { category: 'chocolate', total_rp: 360 },
      { category: 'snacks', total_rp: 320 },
    ],
  },
  check: { items_sum_rp: 910, matches_total: true },
  fallback: false,
}
