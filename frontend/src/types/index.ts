export interface AnalyticsData {
  totalCalls: number;
  totalTokens: number;
  modelUsage: Record<string, number>;
  lastUpdated: string;
}

export interface LogEntry {
  timestamp: string;
  prompt: string;
  model: string;
  tokens: number;
  cost: number;
  duration: number;
  success: boolean;
  response?: string;
}

export interface Prompt {
  name: string;
  category: string;
  content: string;
  fullContent?: string;
  description?: string;
  variables?: string[];
  model?: string;
}

export interface Config {
  config: {
    ui: {
      theme: string;
      defaultModel: string;
      autoSave: boolean;
    };
    logging: {
      enabled: boolean;
      includeResponses: boolean;
      retention: string;
    };
  };
  env: Record<string, string>;
}

export interface PlaygroundRequest {
  prompt: string;
  model: string | string[];
  variables?: Record<string, string>;
}

export interface PlaygroundResponse {
  response: string;
  tokens: number;
  cost: number;
  duration: number;
  model?: string;
}