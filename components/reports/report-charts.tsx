'use client'

import { View, Text, Svg, Path, Rect, Circle, G } from '@react-pdf/renderer'
import { styles } from './report-layout'

interface PieChartProps {
  data: { label: string; value: number; color?: string }[]
  title?: string
  size?: number
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

export function PieChart({ data, title, size = 150 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const center = size / 2
  const radius = size / 2 - 20

  const slices = data.reduce<{ path: string; color: string; label: string; value: number; percentage: number }[]>((acc, item, index) => {
    const angle = (item.value / total) * 2 * Math.PI
    const startAngle = acc.length > 0 
      ? acc.reduce((sum, s) => sum + (s.value / total) * 2 * Math.PI, 0)
      : 0
    const endAngle = startAngle + angle

    const x1 = center + radius * Math.cos(startAngle - Math.PI / 2)
    const y1 = center + radius * Math.sin(startAngle - Math.PI / 2)
    const x2 = center + radius * Math.cos(endAngle - Math.PI / 2)
    const y2 = center + radius * Math.sin(endAngle - Math.PI / 2)

    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    acc.push({
      path,
      color: item.color || COLORS[index % COLORS.length],
      label: item.label,
      value: item.value,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    })
    return acc
  }, [])

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {slices.map((slice, index) => (
            <Path key={index} d={slice.path} fill={slice.color} />
          ))}
          <Circle cx={center} cy={center} r={radius * 0.4} fill="white" />
          <Text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 10, fontWeight: 'bold' }}
          >
            {total}
          </Text>
        </Svg>
        <View style={{ marginLeft: 15, flex: 1 }}>
          {slices.map((slice, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: slice.color,
                  marginRight: 6,
                  borderRadius: 2,
                }}
              />
              <Text style={{ fontSize: 8, flex: 1 }}>
                {slice.label}: {slice.value} ({slice.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  title?: string
  maxBars?: number
}

export function BarChart({ data, title, maxBars = 8 }: BarChartProps) {
  const chartHeight = 120
  const chartWidth = 280
  const barWidth = chartWidth / Math.min(data.length, maxBars) - 10
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const displayData = data.slice(0, maxBars)

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={0}
            y={chartHeight - 20 - (i * (chartHeight - 30)) / 4}
            width={chartWidth}
            height={0.5}
            fill="#e5e7eb"
          />
        ))}

        {/* Bars */}
        {displayData.map((item, index) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 30)
          const x = index * (barWidth + 10) + 5
          const y = chartHeight - 20 - barHeight
          const color = item.color || COLORS[index % COLORS.length]

          return (
            <G key={index}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx={2} />
              <Text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                style={{ fontSize: 8 }}
              >
                {item.value}
              </Text>
              <Text
                x={x + barWidth / 2}
                y={chartHeight - 5}
                textAnchor="middle"
                style={{ fontSize: 7, fill: '#666' }}
              >
                {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
              </Text>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

interface LineChartProps {
  data: { label: string; value: number }[]
  title?: string
}

export function LineChart({ data, title }: LineChartProps) {
  const chartHeight = 120
  const chartWidth = 280
  const padding = { top: 10, right: 10, bottom: 30, left: 10 }
  const graphWidth = chartWidth - padding.left - padding.right
  const graphHeight = chartHeight - padding.top - padding.bottom

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * graphWidth
    const y = padding.top + graphHeight - (item.value / maxValue) * graphHeight
    return { x, y, value: item.value, label: item.label }
  })

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={padding.left}
            y={padding.top + (i * graphHeight) / 4}
            width={graphWidth}
            height={0.5}
            fill="#e5e7eb"
          />
        ))}

        {/* Area under line */}
        {points.length > 0 && (
          <Path
            d={`${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`}
            fill="rgba(59, 130, 246, 0.1)"
          />
        )}

        {/* Line */}
        {points.length > 0 && (
          <Path d={pathData} fill="none" stroke="#3b82f6" strokeWidth={2} />
        )}

        {/* Points */}
        {points.map((p, index) => (
          <G key={index}>
            <Circle cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
            <Text
              x={p.x}
              y={padding.top + graphHeight + 15}
              textAnchor="middle"
              style={{ fontSize: 6, fill: '#666' }}
            >
              {p.label.length > 8 ? p.label.substring(0, 5) + '...' : p.label}
            </Text>
          </G>
        ))}
      </Svg>
    </View>
  )
}

interface HorizontalBarChartProps {
  data: { label: string; value: number }[]
  title?: string
  maxBars?: number
}

export function HorizontalBarChart({ data, title, maxBars = 6 }: HorizontalBarChartProps) {
  const chartHeight = Math.min(data.length, maxBars) * 25 + 30
  const chartWidth = 280
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const barHeight = 18
  const labelWidth = 80

  const displayData = data.slice(0, maxBars)

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <Svg width={chartWidth} height={chartHeight}>
        {displayData.map((item, index) => {
          const barWidth = (item.value / maxValue) * (chartWidth - labelWidth - 30)
          const y = index * 25 + 10

          return (
            <G key={index}>
              <Text
                x={5}
                y={y + 12}
                style={{ fontSize: 7, fill: '#666' }}
              >
                {item.label.length > 20 ? item.label.substring(0, 17) + '...' : item.label}
              </Text>
              <Rect
                x={labelWidth}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={COLORS[index % COLORS.length]}
                rx={2}
              />
              <Text
                x={labelWidth + barWidth + 5}
                y={y + 12}
                style={{ fontSize: 8 }}
              >
                {item.value}
              </Text>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}
