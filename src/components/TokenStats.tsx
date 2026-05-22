interface TokenStatsProps {
  input: number;
  output: number;
  cacheRead?: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function TokenStats({ input, output, cacheRead }: TokenStatsProps) {
  return (
    <div className="bg-stone-900 px-6 py-2 text-xs flex items-center gap-5 text-stone-400 border-t border-stone-800">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        输入 <span className="text-stone-200 font-medium tabular-nums">{formatNumber(input)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
        输出 <span className="text-stone-200 font-medium tabular-nums">{formatNumber(output)}</span>
      </span>
      {cacheRead !== undefined && cacheRead > 0 && (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
          缓存 <span className="text-stone-200 font-medium tabular-nums">{formatNumber(cacheRead)}</span>
        </span>
      )}
    </div>
  );
}

export default TokenStats;
