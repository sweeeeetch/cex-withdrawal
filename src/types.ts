export type IExchange = "binance" | "okx" | "bybit" | "mexc" | "huobi";

export type ApiObject = {
  [K in IExchange]?: { apiKey: string; apiSecret: string; password: string | null };
};

export interface INewApiPrompts {
  exchange: "okx" | "binance";
  apiKey: string;
  apiSecret: string;
}

export interface Prompts {
  exName: string;
  ticker: string;
  value?: number;
  network: string;
  random: boolean;
  min_value?: number;
  max_value?: number;
  min_sleep?: number;
  max_sleep?: number;
  sleep: boolean;
  shuffle: boolean;
}

export interface ValuesPromptsObject {
  min_value?: number;
  max_value?: number;
  value?: number;
}

export interface SleepPromptsObject {
  min_sleep?: number;
  max_sleep?: number;
}
