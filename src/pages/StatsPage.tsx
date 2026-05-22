import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';

interface SessionStat {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  endTime: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: Record<string, number>;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const MODEL_PRICING: Record<string, [number, number]> = {
  'glm-4.7':         [5,   5],
  'glm-5.1':         [10,  10],
  'glm-5-turbo':     [1,   1],
  'mimo-v2-pro':     [0.5, 0.5],
  'mimo-v2.5-pro':   [1,   1],
  'kimi-for-coding': [12,  12],
  'MiniMax-M2.5':    [4,   4],
  'MiniMax-M2.7':    [4,   4],
  '<synthetic>':     [0,   0],
  'unknown':         [0,   0],
};
const DEFAULT_PRICING: [number, number] = [5, 5];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function formatMoney(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(2)}万`;
  if (n >= 1000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n.toFixed(2)}`;
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}秒`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}分钟`;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.round((ms % 3600000) / 60000);
  return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
}

const PIE_COLORS = ['#d97706', '#78716c', '#0d9488', '#7c3aed', '#dc2626', '#2563eb', '#059669', '#c026d3', '#ea580c', '#4f46e5'];
const TOOL_COLORS = ['#d97706', '#0d9488', '#dc2626', '#7c3aed', '#2563eb', '#059669'];

function DateRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const options: { key: TimeRange; label: string }[] = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: '90d', label: '近90天' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            value === opt.key ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
      <div className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 dark:bg-stone-700 text-stone-100 dark:text-stone-100 px-3 py-2 rounded-lg text-xs shadow-xl">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-stone-400 dark:text-stone-300">{p.name}:</span>
          <span className="font-medium tabular-nums">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 dark:bg-stone-700 text-stone-100 dark:text-stone-100 px-3 py-2 rounded-lg text-xs shadow-xl">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-stone-400 dark:text-stone-300">{p.name}:</span>
          <span className="font-medium">{formatMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-stone-900 dark:bg-stone-700 text-stone-100 dark:text-stone-100 px-3 py-2 rounded-lg text-xs shadow-xl">
      <div className="font-medium">{d.name}</div>
      <div className="text-stone-400 dark:text-stone-300 mt-0.5">{formatNumber(d.value)} ({(d.payload.percent * 100).toFixed(1)}%)</div>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: { date: string; value: number }[] }) {
  const weeks = 26;
  const today = new Date();

  const startDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - weeks * 7);
    const day = d.getDay();
    d.setDate(d.getDate() - day + 1);
    return d;
  }, []);

  const cells = useMemo(() => {
    const dateMap = new Map(data.map((d) => [d.date, d.value]));
    const result: { date: string; value: number }[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(cellDate.getDate() + w * 7 + d);
        const key = cellDate.toISOString().slice(0, 10);
        result.push({ date: key, value: dateMap.get(key) || 0 });
      }
    }
    return result;
  }, [data, startDate]);

  const maxVal = Math.max(...cells.map((c) => c.value), 1);

  const getLevel = (value: number): number => {
    if (value === 0) return 0;
    const intensity = value / maxVal;
    if (intensity < 0.25) return 1;
    if (intensity < 0.5) return 2;
    if (intensity < 0.75) return 3;
    return 4;
  };

  const levelColors: Record<number, string> = {
    0: 'bg-stone-100 dark:bg-stone-800',
    1: 'bg-amber-100 dark:bg-amber-900/60',
    2: 'bg-amber-200 dark:bg-amber-800/70',
    3: 'bg-amber-400 dark:bg-amber-600',
    4: 'bg-amber-600 dark:bg-amber-500',
  };

  const dayLabels = ['一', '', '三', '', '五', '', '日'];

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between py-0.5">
        {dayLabels.map((label, i) => (
          <div key={i} className="h-3 flex items-center">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-none">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-[3px] overflow-x-auto" style={{ gridTemplateRows: 'repeat(7, 12px)', gridAutoFlow: 'column' }}>
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={`w-3 h-3 rounded-[2px] cursor-default ${levelColors[getLevel(cell.value)]}`}
            title={`${cell.date}: ${formatNumber(cell.value)} tokens`}
          />
        ))}
      </div>
      <div className="flex items-end gap-1 ml-2">
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`w-3 h-3 rounded-[2px] ${levelColors[level]}`} />
        ))}
        <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-1">少 → 多</span>
      </div>
    </div>
  );
}

function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: stats = [], isLoading, error } = useQuery<SessionStat[]>({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (timeRange === 'all') return stats;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days!);
    return stats.filter((s) => new Date(s.startTime) >= cutoff);
  }, [stats, timeRange]);

  const summary = useMemo(() => {
    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;
    for (const s of filtered) {
      totalInput += s.inputTokens;
      totalOutput += s.outputTokens;
      const pricing = MODEL_PRICING[s.model] || DEFAULT_PRICING;
      totalCost += (s.inputTokens / 1_000_000) * pricing[0] + (s.outputTokens / 1_000_000) * pricing[1];
    }
    const total = totalInput + totalOutput;
    const projects = new Set(filtered.map((s) => s.projectPath));
    const days = new Set(filtered.map((s) => s.startTime.slice(0, 10)));
    const avgPerDay = days.size > 0 ? total / days.size : 0;

    return { total, totalInput, totalOutput, totalCost, sessions: filtered.length, projects: projects.size, days: days.size, avgPerDay };
  }, [filtered]);

  const timelineData = useMemo(() => {
    const dayMap = new Map<string, { date: string; input: number; output: number }>();
    for (const s of filtered) {
      const day = s.startTime.slice(0, 10);
      const entry = dayMap.get(day) || { date: day, input: 0, output: 0 };
      entry.input += s.inputTokens;
      entry.output += s.outputTokens;
      dayMap.set(day, entry);
    }
    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const heatmapData = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const s of filtered) {
      const day = s.startTime.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + s.inputTokens + s.outputTokens);
    }
    return Array.from(dayMap.entries()).map(([date, value]) => ({ date, value }));
  }, [filtered]);

  const monthlyCost = useMemo(() => {
    const map = new Map<string, { month: string; cost: number; input: number; output: number }>();
    for (const s of filtered) {
      const month = s.startTime.slice(0, 7);
      const pricing = MODEL_PRICING[s.model] || DEFAULT_PRICING;
      const cost = (s.inputTokens / 1_000_000) * pricing[0] + (s.outputTokens / 1_000_000) * pricing[1];
      const entry = map.get(month) || { month, cost: 0, input: 0, output: 0 };
      entry.cost += cost;
      entry.input += s.inputTokens;
      entry.output += s.outputTokens;
      map.set(month, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  const projectCost = useMemo(() => {
    const map = new Map<string, { name: string; cost: number }>();
    for (const s of filtered) {
      const short = s.projectDisplayName.split(/[/\\]/).pop() || s.projectDisplayName;
      const pricing = MODEL_PRICING[s.model] || DEFAULT_PRICING;
      const cost = (s.inputTokens / 1_000_000) * pricing[0] + (s.outputTokens / 1_000_000) * pricing[1];
      const entry = map.get(s.projectPath) || { name: short, cost: 0 };
      entry.cost += cost;
      map.set(s.projectPath, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost).slice(0, 10);
  }, [filtered]);

  const toolData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      for (const [tool, count] of Object.entries(s.toolCalls)) {
        map.set(tool, (map.get(tool) || 0) + count);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const durationData = useMemo(() => {
    const buckets = [
      { label: '<5min', min: 0, max: 5 * 60 * 1000, count: 0 },
      { label: '5-30min', min: 5 * 60 * 1000, max: 30 * 60 * 1000, count: 0 },
      { label: '30-60min', min: 30 * 60 * 1000, max: 60 * 60 * 1000, count: 0 },
      { label: '1-4h', min: 60 * 60 * 1000, max: 4 * 60 * 60 * 1000, count: 0 },
      { label: '>4h', min: 4 * 60 * 60 * 1000, max: Infinity, count: 0 },
    ];

    let totalMs = 0;
    let count = 0;
    for (const s of filtered) {
      if (!s.startTime || !s.endTime) continue;
      const ms = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
      if (ms <= 0) continue;
      totalMs += ms;
      count++;
      for (const b of buckets) {
        if (ms >= b.min && ms < b.max) { b.count++; break; }
      }
    }

    return {
      buckets,
      avgDuration: count > 0 ? totalMs / count : 0,
      medianDuration: count > 0 ? (() => {
        const durations = filtered
          .filter(s => s.startTime && s.endTime)
          .map(s => new Date(s.endTime).getTime() - new Date(s.startTime).getTime())
          .filter(d => d > 0)
          .sort((a, b) => a - b);
        return durations[Math.floor(durations.length / 2)] || 0;
      })() : 0,
      totalSessions: count,
    };
  }, [filtered]);

  const projectData = useMemo(() => {
    const map = new Map<string, { name: string; tokens: number }>();
    for (const s of filtered) {
      const short = s.projectDisplayName.split(/[/\\]/).pop() || s.projectDisplayName;
      const entry = map.get(s.projectPath) || { name: short, tokens: 0 };
      entry.tokens += s.inputTokens + s.outputTokens;
      map.set(s.projectPath, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.tokens - a.tokens).slice(0, 12);
  }, [filtered]);

  const modelData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      map.set(s.model, (map.get(s.model) || 0) + s.inputTokens + s.outputTokens);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  return (
    <>
      <ResizablePanel>
        <Sidebar />
      </ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Token 使用统计</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">跨项目、模型、时间的 Token 消耗与费用分析</p>
            </div>
            <DateRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm mb-6">加载统计数据失败</div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <div className="skeleton h-3 w-16 mb-3" />
                  <div className="skeleton h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <SummaryCard label="总 Token" value={formatTokens(summary.total)} sub={`输入 ${formatTokens(summary.totalInput)} / 输出 ${formatTokens(summary.totalOutput)}`} />
                <SummaryCard label="总费用" value={formatMoney(summary.totalCost)} sub="按模型单价估算" />
                <SummaryCard label="会话数" value={formatNumber(summary.sessions)} sub={`${summary.projects} 个项目`} />
                <SummaryCard label="活跃天数" value={`${summary.days} 天`} />
                <SummaryCard label="日均消耗" value={formatTokens(Math.round(summary.avgPerDay))} sub="tokens/天" />
              </div>

              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">活跃热力图</h3>
                <ActivityHeatmap data={heatmapData} />
              </div>

              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">时间趋势</h3>
                {timelineData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">所选时间范围内无数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="gradInput" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#78716c" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#78716c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => formatTokens(v)} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={50} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="input" name="输入" stroke="#d97706" fill="url(#gradInput)" strokeWidth={2} />
                      <Area type="monotone" dataKey="output" name="输出" stroke="#78716c" fill="url(#gradOutput)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">月度费用</h3>
                  {monthlyCost.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无数据</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlyCost}>
                        <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(2)} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v: number) => `¥${v.toFixed(0)}`} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip content={<MoneyTooltip />} />
                        <Bar dataKey="cost" name="费用" fill="#d97706" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">项目费用 Top 10</h3>
                  {projectCost.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无数据</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={projectCost} layout="vertical" margin={{ left: 0 }}>
                        <XAxis type="number" tickFormatter={(v: number) => `¥${v.toFixed(0)}`} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<MoneyTooltip />} />
                        <Bar dataKey="cost" name="费用" fill="#d97706" radius={[0, 4, 4, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">工具使用分析</h3>
                  {toolData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无工具调用数据</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={toolData} layout="vertical" margin={{ left: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" name="调用次数" radius={[0, 4, 4, 0]} barSize={16}>
                            {toolData.map((_, i) => (
                              <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400">
                        {toolData.map((t, i) => {
                          const total = toolData.reduce((s, x) => s + x.count, 0);
                          const pct = total > 0 ? ((t.count / total) * 100).toFixed(1) : '0';
                          return (
                            <span key={t.name} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TOOL_COLORS[i % TOOL_COLORS.length] }} />
                              {t.name} <span className="text-stone-400 dark:text-stone-500">{pct}%</span>
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">会话耗时</h3>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center">
                      <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">平均时长</div>
                      <div className="text-lg font-bold text-stone-800 dark:text-stone-100 tabular-nums">{formatDuration(durationData.avgDuration)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">中位数</div>
                      <div className="text-lg font-bold text-stone-800 dark:text-stone-100 tabular-nums">{formatDuration(durationData.medianDuration)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">总会话</div>
                      <div className="text-lg font-bold text-stone-800 dark:text-stone-100 tabular-nums">{durationData.totalSessions}</div>
                    </div>
                  </div>
                  {durationData.buckets.every(b => b.count === 0) ? (
                    <div className="h-32 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无耗时数据</div>
                  ) : (
                    <div className="space-y-2">
                      {durationData.buckets.map((b) => {
                        const maxCount = Math.max(...durationData.buckets.map(x => x.count), 1);
                        const pct = (b.count / maxCount) * 100;
                        return (
                          <div key={b.label} className="flex items-center gap-3">
                            <span className="text-xs text-stone-500 dark:text-stone-400 w-16 text-right tabular-nums">{b.label}</span>
                            <div className="flex-1 h-5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-stone-500 dark:text-stone-400 w-8 tabular-nums">{b.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">项目排行</h3>
                  {projectData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无数据</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={projectData} layout="vertical" margin={{ left: 0 }}>
                        <XAxis type="number" tickFormatter={(v: number) => formatTokens(v)} tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#57534e' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="tokens" name="Token" fill="#d97706" radius={[0, 4, 4, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">模型分布</h3>
                  {modelData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-400 dark:text-stone-500 text-sm">无数据</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={modelData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value">
                          {modelData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#78716c' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default StatsPage;
