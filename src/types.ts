export type Network = "ETH" | "ARBITRUM" | "BSC" | "OPTIMISM" | "ZKSYNCERA" | "BASE" | "LINEA" | "STARKNET";
export type IExchange = "Binance" | "OKX";

export interface PromptsObject {
  platform: string;
  ticker: string;
  network: Network;
  random: boolean;
  min_value?: number;
  max_value?: number;
  value?: number;
  sleep: boolean;
  min_sleep?: number;
  max_sleep?: number;
}

export interface BasicPromptsObject {
  ticker: string;
  network: Network;
  random: boolean;
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
