// 项目摘要
export interface ProjectSummary {
  path: string;
  displayName: string;
  sessionCount: number;
  lastActive: string;
}

// 会话摘要
export interface SessionSummary {
  id: string;
  startTime: string;
  messageCount: number;
  totalTokens: number;
  model: string;
}

// 工具调用
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

// Token 使用情况
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
}

// 会话消息
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  timestamp: string;
}

// 完整会话数据
export interface SessionDetail {
  id: string;
  model: string;
  messages: Message[];
  totalTokens: {
    input: number;
    output: number;
  };
  filesModified: string[];
}
