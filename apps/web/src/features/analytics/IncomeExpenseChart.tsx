import type { ReactNode } from 'react'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'

const config = {
  income: { color: 'var(--chart-1)' },
  expenses: { color: 'var(--chart-3)' },
} satisfies ChartConfig

/**
 * Donut as in the PostFinance app: income on the outer ring, expenditures on the inner one, both on
 * the same scale. Decorative for screen readers: the totals are listed as text below the chart.
 */
export default function IncomeExpenseChart({ incomeRp, expensesRp, children }: { incomeRp: number; expensesRp: number; children: ReactNode }) {
  // Inner ring first: recharts draws the first entry closest to the centre.
  const data = [
    { key: 'expenses', value: expensesRp, fill: 'var(--color-expenses)' },
    { key: 'income', value: incomeRp, fill: 'var(--color-income)' },
  ]

  return (
    <div className="relative w-full max-w-60">
      <ChartContainer config={config} className="aspect-square w-full" aria-hidden>
        <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
          <PolarAngleAxis type="number" domain={[0, 'dataMax']} tick={false} axisLine={false} />
          <RadialBar dataKey="value" background cornerRadius={7} isAnimationActive={false} />
        </RadialBarChart>
      </ChartContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">{children}</div>
    </div>
  )
}
