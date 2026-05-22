import { Message, SessionDetail, ToolCall, TokenUsage } from '../../src/types';

interface RawEntry {
  type: string;
  uuid?: string;
  parentUuid?: string;
  timestamp?: string;
  sessionId?: string;
  message?: {
    id?: string;
    role?: string;
    content?: string | Array<Record<string, unknown>>;
    model?: string;
    usage?: TokenUsage;
  };
  leafUuid?: string;
}

// 解析 JSONL 内容为会话详情
export function parseSession(jsonlContent: string): SessionDetail {
  const lines = jsonlContent.split('\n').filter((l) => l.trim());
  const entries: RawEntry[] = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // 跳过损坏的行
    }
  }

  // 第一遍：建立 tool_use_id → tool_result 内容的映射
  const toolResultMap = new Map<string, string>();
  for (const entry of entries) {
    if (entry.type !== 'user' || !entry.message?.content) continue;
    const content = entry.message.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (typeof block === 'object' && block.type === 'tool_result' && block.tool_use_id) {
        let result = '';
        if (typeof block.content === 'string') {
          result = block.content;
        } else if (Array.isArray(block.content)) {
          result = block.content
            .filter((b: Record<string, unknown>) => b.type === 'text')
            .map((b: Record<string, unknown>) => b.text || '')
            .join('\n');
        }
        toolResultMap.set(block.tool_use_id as string, result);
      }
    }
  }

  // 收集所有消息条目，按时间戳排序
  const messageChain = entries
    .filter((e) => (e.type === 'user' || e.type === 'assistant') && e.message)
    .filter((e) => {
      // 跳过只包含 tool_result 的 user 条目（结果已合并到工具调用中）
      if (e.type === 'user' && Array.isArray(e.message!.content)) {
        const blocks = e.message!.content as Record<string, unknown>[];
        const onlyToolResults = blocks.every(
          (b) => typeof b === 'object' && b.type === 'tool_result'
        );
        if (onlyToolResults) return false;
      }
      return true;
    })
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  // 转换为 Message 格式，合并同一轮次的连续 assistant 条目
  const messages: Message[] = [];
  const filesModified: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  // 先将所有条目解析为中间格式
  interface ParsedEntry {
    role: 'user' | 'assistant';
    textContent: string;
    thinking: string;
    toolCalls: ToolCall[];
    usage?: TokenUsage;
    timestamp: string;
  }

  const parsed: ParsedEntry[] = [];
  for (const entry of messageChain) {
    if (!entry.message) continue;
    const { role, content, usage } = entry.message;
    if (!role || (role !== 'user' && role !== 'assistant')) continue;

    let textContent = '';
    let thinking = '';
    const toolCalls: ToolCall[] = [];

    if (typeof content === 'string') {
      textContent = content;
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          textContent += block.text;
        } else if (block.type === 'thinking' && block.thinking) {
          thinking = block.thinking as string;
        } else if (block.type === 'tool_use') {
          const toolCallId = (block.id as string) || '';
          const toolCall: ToolCall = {
            name: (block.name as string) || 'unknown',
            input: (block.input as Record<string, unknown>) || {},
            result: toolResultMap.get(toolCallId) || '',
          };

          if (['Edit', 'Write'].includes(toolCall.name)) {
            const filePath = toolCall.input.file_path || toolCall.input.path;
            if (filePath && typeof filePath === 'string') {
              filesModified.push(filePath);
            }
          }

          toolCalls.push(toolCall);
        }
      }
    }

    if (!textContent && !thinking && toolCalls.length === 0) continue;

    if (usage) {
      totalInput += usage.input_tokens || 0;
      totalOutput += usage.output_tokens || 0;
    }

    parsed.push({
      role: role as 'user' | 'assistant',
      textContent,
      thinking,
      toolCalls,
      usage,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  }

  // 合并连续的 assistant 条目为一个消息
  for (let i = 0; i < parsed.length; i++) {
    const entry = parsed[i];
    if (entry.role === 'assistant' && i > 0 && parsed[i - 1].role === 'assistant') {
      // 合并到前一个 assistant 消息
      const prev = messages[messages.length - 1];
      if (entry.textContent) prev.content += entry.textContent;
      if (entry.thinking && !prev.thinking) prev.thinking = entry.thinking;
      if (entry.toolCalls.length > 0) {
        prev.toolCalls = [...(prev.toolCalls || []), ...entry.toolCalls];
      }
    } else {
      messages.push({
        role: entry.role,
        content: entry.textContent,
        thinking: entry.thinking || undefined,
        toolCalls: entry.toolCalls.length > 0 ? entry.toolCalls : undefined,
        usage: entry.usage || undefined,
        timestamp: entry.timestamp,
      });
    }
  }

  // 获取模型名
  const modelEntry = entries.find((e) => e.message?.model);
  const model = modelEntry?.message?.model || 'unknown';

  // 获取会话 ID
  const sessionId = entries[0]?.sessionId || '';

  return {
    id: sessionId,
    model,
    messages,
    totalTokens: {
      input: totalInput,
      output: totalOutput,
    },
    filesModified: [...new Set(filesModified)],
  };
}
