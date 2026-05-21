import { Message, SessionDetail, ToolCall, TokenUsage } from '../../src/types';

interface RawEntry {
  type: string;
  uuid?: string;
  parentUuid?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: string | Array<Record<string, unknown>>;
    model?: string;
    usage?: TokenUsage;
  };
  leafUuid?: string;
  toolUseResult?: {
    content?: string;
  };
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

  // 构建 UUID → entry 映射
  const entryMap = new Map<string, RawEntry>();
  for (const entry of entries) {
    if (entry.uuid) {
      entryMap.set(entry.uuid, entry);
    }
  }

  // 找到叶子节点（last-prompt 类型）
  const leafEntry = entries.find((e) => e.type === 'last-prompt');
  const leafUuid = leafEntry?.leafUuid;

  if (!leafUuid) {
    return {
      id: '',
      model: 'unknown',
      messages: [],
      totalTokens: { input: 0, output: 0 },
      filesModified: [],
    };
  }

  // 沿 parentUuid 反向遍历构建消息链
  const messageChain: RawEntry[] = [];
  let currentUuid: string | undefined = leafUuid;

  while (currentUuid) {
    const entry = entryMap.get(currentUuid);
    if (!entry) break;

    messageChain.push(entry);
    currentUuid = entry.parentUuid;
  }

  // 反转为正序
  messageChain.reverse();

  // 转换为 Message 格式
  const messages: Message[] = [];
  const filesModified: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  for (const entry of messageChain) {
    if (entry.type !== 'message' && entry.type !== 'user') continue;
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
          const toolCall: ToolCall = {
            name: (block.name as string) || 'unknown',
            input: (block.input as Record<string, unknown>) || {},
            result: '',
          };

          // 提取修改的文件
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

    // 累计 token
    if (usage) {
      totalInput += usage.input_tokens || 0;
      totalOutput += usage.output_tokens || 0;
    }

    messages.push({
      role: role as 'user' | 'assistant',
      content: textContent,
      thinking: thinking || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: usage || undefined,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  }

  // 获取模型名
  const modelEntry = entries.find((e) => e.message?.model);
  const model = modelEntry?.message?.model || 'unknown';

  // 获取会话 ID
  const firstEntry = entries[0];
  const sessionId = firstEntry?.uuid || '';

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
