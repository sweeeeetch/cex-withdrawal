import figlet from "figlet";
import fs from "fs";
import chalk, { ColorName } from "chalk";
import ccxt from "ccxt";
import { config } from "dotenv";
import { SingleBar } from "cli-progress";
import { IExchange, Network, NetworksObject } from "./types.js";
config();

const colors: ColorName[] = ["red", "yellow", "green", "cyan", "blue", "magenta", "white", "redBright", "yellowBright", "greenBright", "cyanBright", "blueBright", "magentaBright", "whiteBright"];
const { BINANCE_API_KEY, BINANCE_SECRET_KEY, OKEX_API_KEY, OKEX_API_SECRET, OKEX_API_PASSWORD } = process.env;

export const networks: NetworksObject = {
  ETH: {
    binance: "ETH",
    okx: "ERC20",
  },
  ARBITRUM: {
    binance: "ARBITRUM",
    okx: "Arbitrum One",
  },
  OPTIMISM: {
    binance: "OPTIMISM",
    okx: "Optimism",
  },
  BSC: {
    binance: "BSC",
  },
  BASE: {
    binance: "BASE",
    okx: "Base",
  },
  ZKSYNCERA: {
    binance: "ZKSYNCERA",
    okx: "zkSync Era",
  },
  STARKNET: {
    okx: "Starknet",
  },
  LINEA: {
    okx: "Linea",
  },
};

export function displayAsciiTitle(titleText: string, secondaryTitle?: string) {
  return new Promise<void>((resolve, reject) => {
    figlet.text(
      titleText,
      {
        font: "Swamp Land",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: true,
      },
      (err, data) => {
        if (err) {
          console.error("Error generating ASCII art:", err);
          reject(err);
          return;
        }
        if (!data) {
          resolve();
          return;
        }

        const terminalWidth = process.stdout.columns;
        const terminalHeight = process.stdout.rows;

        if (terminalWidth < 79) {
          resolve();
          return;
        }

        const paddingTop = Math.max(0, Math.floor((terminalHeight - data.split("\n").length) / 2));

        const paddingSize = Math.max(0, Math.floor((terminalWidth - data.split("\n")[0].length) / 2));

        const rightPaddingSize = Math.max(0, terminalWidth - data.split("\n")[0].length - paddingSize);

        const centeredText = data
          .split("\n")
          .map(line => " ".repeat(paddingSize) + line + " ".repeat(rightPaddingSize))
          .join("\n");

        const finalText = "\n".repeat(paddingTop) + centeredText;

        let currentIndex = 0;

        const interval = setInterval(() => {
          const color = colors[currentIndex];
          const rainbowText = finalText
            .split("\n")
            .map((line, index) => {
              const colorIndex = (index + currentIndex) % colors.length;
              const color = colors[colorIndex];
              return chalk[color as ColorName](line);
            })
            .join("\n");

          console.clear();
          console.log(chalk[color as ColorName](rainbowText));

          if (secondaryTitle) {
            const secondaryPaddingSize = Math.max(0, Math.floor((terminalWidth - secondaryTitle.length) / 2));
            const secondaryRightPaddingSize = Math.max(0, terminalWidth - secondaryTitle.length - secondaryPaddingSize);
            const secondaryColorIndex = (currentIndex + secondaryPaddingSize) % colors.length;
            const secondaryColor = colors[secondaryColorIndex];
            const centeredSecondaryTitle = " ".repeat(secondaryPaddingSize) + chalk[secondaryColor as ColorName](secondaryTitle) + " ".repeat(secondaryRightPaddingSize);
            console.log(centeredSecondaryTitle);
          }

          currentIndex = (currentIndex + 1) % colors.length;
        }, 150);

        setTimeout(() => {
          clearInterval(interval);
          console.clear();
          resolve();
        }, 2500);
      }
    );
  });
}

export function readAddressesFromFile(filePath: string): string[] {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");
    const keys = lines.filter(line => line.trim() !== "").map(line => line.trim());

    return keys;
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return [];
  }
}

export function randomInt(min: number, max: number): number {
  if (Number.isInteger(min) && Number.isInteger(max)) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    let randomFloat = Math.random() * (max - min) + min;
    return parseFloat(randomFloat.toFixed(10));
  }
}

export function sleep(from: number, to: number) {
  return new Promise<void>(resolve => {
    const duration = randomInt(from, to);

    let bar = new SingleBar({
      format: `Задержка | ${chalk.blue("{bar}")} | {value}/{total} с.`,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    });
    bar.start(duration, 0);

    const interval = setInterval(() => {
      bar.increment();
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      bar.increment();
      bar.stop();
      resolve();
    }, duration * 1000);
  });
}

export function getNetworks(exchange: IExchange) {
  const lowercaseExchange = exchange.toLowerCase() as "binance" | "okx";
  const selectedNetworks = Object.keys(networks).reduce((acc, network) => {
    if (networks[network as Network][lowercaseExchange]) {
      acc.push({
        message: networks[network as Network][lowercaseExchange],
        name: network,
      });
    }
    return acc;
  }, []);

  return selectedNetworks;
}

export async function createOkxWithdrawal(amount: number, network: Network, address: string) {
  try {
    const okx = new ccxt.okx({
      enableRateLimit: true,
      apiKey: OKEX_API_KEY,
      secret: OKEX_API_SECRET,
      password: OKEX_API_PASSWORD,
    });
    const res: any = await okx.fetchCurrencies();
    const fee = res.ETH.networks[networks[network].okx].fee;
    console.log(fee);

    const withdrawResponse = await okx.withdraw("ETH", amount, address, {
      password: OKEX_API_PASSWORD,
      network: networks[network].okx,
      fee,
    });

    if (withdrawResponse.info.wdId) {
      console.log(`(${chalk.green("OKX")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: успешный вывод ${amount} ETH`);
    } else {
      console.log(`(${chalk.green("OKX")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: неудачная попытка вывода ${amount} ETH -> ${withdrawResponse?.info}`);
    }
  } catch (e) {
    let stringErr = e.message;
    if (stringErr.includes("exceeds the upper limit") || stringErr.includes("Insufficient balance")) {
      console.log(`(${chalk.green("OKX")}) ${chalk.gray("=>")} ${chalk.cyan(address)} недостаточно средств.. ожидаем..`);
      await sleep(20, 60);
      return createOkxWithdrawal(amount, network, address);
    } else if (stringErr.includes("Request failed")) {
      await sleep(100, 300);
      return createOkxWithdrawal(amount, network, address);
    } else {
      console.log(`${chalk.red("[ERROR]")}: ошибка в ходе вывода с OKX:`);
      console.dir(e);
      return;
    }
  }
}

export async function createBinanceWithdrawal(amount: number, network: Network, address: string) {
  try {
    const binance = new ccxt.binance({
      apiKey: BINANCE_API_KEY,
      secret: BINANCE_SECRET_KEY,
    });

    const withdrawResponse = await binance.withdraw("ETH", amount, address, {
      network: networks[network].binance,
    });
    console.log(withdrawResponse);
    if (withdrawResponse.info.id) {
      console.log(`(${chalk.green("Binance")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: успешный вывод ${amount} ETH`);
    } else {
      console.log(`(${chalk.green("Binance")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: неудачная попытка вывода ${amount} ETH`);
    }
  } catch (e) {
    let stringErr = e.message;
    if (stringErr.includes("exceeds the upper limit") || stringErr.includes("insufficient balance")) {
      console.log(`(${chalk.red("Binance")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: недостаточно средств`);
      // await sleep(20, 60);
      return;
    } else if (stringErr.includes("Request failed")) {
      console.log(`(${chalk.green("Binance")}) ${chalk.gray("=>")} ${chalk.cyan(address)}: ошибка в ходе вывода.. ожидаем..`);
      await sleep(10, 30);
      return createBinanceWithdrawal(amount, network, address);
    } else {
      console.log(`${chalk.red("[ERROR]")}: ошибка в ходе вывода с Binance:`);
      console.dir(e);
      await sleep(20, 60);
      return createBinanceWithdrawal(amount, network, address);
    }
  }
}

export function getConfig() {
  try {
    const data = fs.readFileSync("./config.txt", "utf-8");
    if (!data) return null;
    const config = JSON.parse(data);
    return config;
  } catch (error) {
    return null;
  }
}

export function saveConfigToFile(config: any) {
  const jsonConfig = JSON.stringify(config, null, 2);
  fs.writeFileSync("config.txt", jsonConfig, "utf-8");
}
