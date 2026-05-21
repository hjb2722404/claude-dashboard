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
    <div className="bg-gray-900 text-gray-300 px-6 py-2 text-sm flex items-center gap-6">
      <span>
        Token: 输入 <span className="text-white font-medium">{formatNumber(input)}</span>
      </span>
      <span>
        | 输出 <span className="text-white font-medium">{formatNumber(output)}</span>
      </span>
      {cacheRead !== undefined && cacheRead > 0 && (
        <span>
          | 缓存 <span className="text-white font-medium">{formatNumber(cacheRead)}</span>
        </span>
      )}
    </div>
  );
}

export default TokenStats;
