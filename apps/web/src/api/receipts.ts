import type { ScanResult } from './types'

// POST /api/receipts/scan is not merged yet (BE-6, #40). Until then every photo "reads" as the
// LOLA test photo (services/api/app/data/scans/receipt-lola-20251121.png), items copied from it,
// matched to the 2025-11-21 payment P-0236. Replace the body of scanReceipt() with a multipart
// POST of the photo (field "file", JPEG, max 4 MB; the API answers 413 or 415 otherwise).
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
}

/** Read a receipt photo and find the payment it belongs to (fixture until BE-6). */
export async function scanReceipt(_photo: Blob): Promise<ScanResult> {
  return LOLA_SCAN_FIXTURE
}
