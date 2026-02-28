import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceDot, Tooltip } from 'recharts';
import type { TimeSeriesPoint } from '@/types/spotify-analysis';

interface EmotionalArcChartProps {
  data: TimeSeriesPoint[];
  height?: number;
}

interface ChartDataPoint {
  index: number;
  valence: number;
  energy: number;
  tempo: number;
  isCopingCluster: boolean;
  label: string;
}

export function EmotionalArcChart({ data, height = 300 }: EmotionalArcChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((point, index) => ({
      index,
      valence: Math.round(point.valence * 100),
      energy: Math.round(point.energy * 100),
      tempo: Math.round(point.tempo),
      isCopingCluster: point.isCopingCluster || false,
      label: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [data]);

  const copingPoints = useMemo(() => {
    return chartData.filter(d => d.isCopingCluster);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-neutral-400 text-xs mb-2">{data.label}</p>
          <div className="space-y-1">
            <p className="text-[#1DB954] text-sm">
              Valence: {data.valence}%
            </p>
            <p className="text-blue-400 text-sm">
              Energy: {data.energy}%
            </p>
            {data.isCopingCluster && (
              <p className="text-red-400 text-xs mt-2">
                ⚠ Coping cluster detected
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1DB954" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#1ed760" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="index" 
            hide 
          />
          
          <YAxis 
            domain={[0, 100]} 
            hide 
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Valence line */}
          <Line
            type="monotone"
            dataKey="valence"
            stroke="url(#valenceGradient)"
            strokeWidth={3}
            dot={false}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          
          {/* Energy line */}
          <Line
            type="monotone"
            dataKey="energy"
            stroke="url(#energyGradient)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={2000}
            animationEasing="ease-in-out"
          />
          
          {/* Coping cluster indicators */}
          {copingPoints.map((point, i) => (
            <ReferenceDot
              key={i}
              x={point.index}
              y={point.valence}
              r={8}
              fill="#ef4444"
              stroke="none"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded bg-gradient-to-r from-[#1DB954] to-[#ef4444]" />
          <span className="text-neutral-400">Valence (Positivity)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded bg-blue-400 border-dashed" style={{ borderTop: '2px dashed #3b82f6' }} />
          <span className="text-neutral-400">Energy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-neutral-400">Coping Clusters</span>
        </div>
      </div>
    </div>
  );
}
