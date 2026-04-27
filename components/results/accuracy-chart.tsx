'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface TimelinePoint {
  label: string
  accuracy: number
  hit: number
  q: string
}

function AccTip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: TimelinePoint }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-lg">
      <div className="text-[10px] text-muted-foreground">{d?.label}</div>
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${d?.hit ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        {d?.q}
      </div>
      <div className="text-xs font-bold text-emerald-600">{d?.accuracy}%</div>
    </div>
  )
}

function AccDot({
  cx,
  cy,
  payload,
}: {
  cx?: number
  cy?: number
  payload?: TimelinePoint
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={payload?.hit ? '#10B981' : '#EF4444'}
      stroke="white"
      strokeWidth={2}
    />
  )
}

interface AccuracyChartProps {
  data: TimelinePoint[]
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        🎯 예측 적중률 흐름
      </h3>
      <p className="mb-3 text-[10.5px] text-muted-foreground">
        50% 이상이면 찍기보다 잘하는 중!
      </p>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 6, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine
            y={50}
            stroke="rgba(0,0,0,0.08)"
            strokeDasharray="4 4"
          />
          <Tooltip
            content={<AccTip />}
            cursor={{ stroke: 'rgba(16,185,129,.1)' }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={<AccDot />}
            activeDot={{
              r: 6,
              fill: '#10B981',
              stroke: 'white',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {data.map((d, i) => (
          <div
            key={i}
            title={d.q}
            className={`h-2.5 w-2.5 rounded-full transition-transform hover:scale-150 ${
              d.hit ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          적중
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          빗나감
        </span>
      </div>
    </div>
  )
}
