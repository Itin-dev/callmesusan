import { ApiError } from './client'
import type { TransactionDetail } from './types'

// GET /api/transactions/{id} is not merged yet (BE-1). These fixtures copy services/api/app/data/
// (transactions.json K-0241 + receipts/receipt-coop-20251119.json, K-0240 without a receipt).
// Replace the body of getTransaction() with getJson<TransactionDetail>(`/api/transactions/${id}`).
const FIXTURES: Record<string, TransactionDetail> = {
  'K-0241': {
    id: 'K-0241',
    account: 'kk',
    date: '2025-11-19',
    type: 'expense',
    description: 'Coop Luzern Bahnhof 2025-11-19',
    counterparty: 'Coop Luzern Bahnhof',
    amount_rp: 11970,
    currency: 'CHF',
    original_amount: null,
    original_currency: null,
    has_receipt: true,
    explanation: 'Groceries at Coop in Luzern station, paid with your credit card.',
    receipt: {
      receipt_id: 'COOP-20251119-2281',
      store: 'Coop',
      branch: 'Luzern Bahnhof',
      time: '18:15',
      source: 'store_app',
      total_rp: 11970,
      items: [
        { name: 'Feldschlösschen Original 10x50cl', category: 'alcohol', quantity: 1, unit_price_rp: 1295, line_total_rp: 1295 },
        { name: 'Fendant du Valais AOC 75cl', category: 'alcohol', quantity: 2, unit_price_rp: 1195, line_total_rp: 2390 },
        { name: 'Rioja Crianza DOCa 75cl', category: 'alcohol', quantity: 1, unit_price_rp: 995, line_total_rp: 995 },
        { name: 'Appenzeller Alpenbitter 70cl', category: 'alcohol', quantity: 1, unit_price_rp: 2990, line_total_rp: 2990 },
        { name: 'Bombay Sapphire Gin 70cl', category: 'alcohol', quantity: 1, unit_price_rp: 3495, line_total_rp: 3495 },
        { name: 'Naturaplan Bio Zopf 500g', category: 'bakery', quantity: 1, unit_price_rp: 395, line_total_rp: 395 },
        { name: 'Prix Garantie Chips Paprika 250g', category: 'snacks', quantity: 1, unit_price_rp: 230, line_total_rp: 230 },
        { name: 'Halba Milchschokolade 100g', category: 'chocolate', quantity: 1, unit_price_rp: 180, line_total_rp: 180 },
      ],
      category_totals: [
        { category: 'alcohol', total_rp: 11165 },
        { category: 'bakery', total_rp: 395 },
        { category: 'snacks', total_rp: 230 },
        { category: 'chocolate', total_rp: 180 },
      ],
    },
  },
  'K-0240': {
    id: 'K-0240',
    account: 'kk',
    date: '2025-11-16',
    type: 'expense',
    description: 'Paypal 2025-11-16',
    counterparty: 'Paypal',
    amount_rp: 3925,
    currency: 'CHF',
    original_amount: null,
    original_currency: null,
    has_receipt: false,
    receipt: null,
  },
}

export async function getTransaction(id: string): Promise<TransactionDetail> {
  const transaction = FIXTURES[id]
  if (!transaction) throw new ApiError('Transaction not found', 404)
  return transaction
}
