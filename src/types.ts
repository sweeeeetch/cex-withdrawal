export type Network = "ETH" | "ARBITRUM" | "BSC" | "OPTIMISM" | "ZKSYNCERA" | "BASE" | "LINEA" | "STARKNET";
export type IExchange = "Binance" | "OKX";
export type NetworksObject = {
  [K in Network]: {
    binance?: string;
    okx?: string;
  };
};

export interface PromptsObject {
  platform: string;
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
