import pkg from "enquirer";
import { ValuesPromptsObject, SleepPromptsObject, BasicPromptsObject, Network, PromptsObject } from "./types.js";
import { createBinanceWithdrawal, createOkxWithdrawal, displayAsciiTitle, getConfig, makeNetworks, randomInt, readAddressesFromFile, sleep, saveConfigToFile, makeUpCurrencies } from "./utils.js";
import chalk from "chalk";
import ccxt from "ccxt";
import { config } from "dotenv";
const { prompt } = pkg;
config();

const { BINANCE_API_KEY, BINANCE_SECRET_KEY, OKEX_API_KEY, OKEX_API_SECRET, OKEX_API_PASSWORD } = process.env;

const binance = new ccxt.binance({
  apiKey: BINANCE_API_KEY,
  secret: BINANCE_SECRET_KEY,
});
const okx = new ccxt.okx({
  enableRateLimit: true,
  apiKey: OKEX_API_KEY,
  secret: OKEX_API_SECRET,
  password: OKEX_API_PASSWORD,
});

async function fetchData() {
  const [okxTickers, okxCurrencies, binanceTickers, binanceCurrencies]: any[] = await Promise.all([
    (async () => makeUpCurrencies(await okx.fetchTickers()))(),
    okx.fetchCurrencies(),
    (async () => makeUpCurrencies(await binance.fetchTickers()))(),
    binance.fetchCurrencies(),
  ]);

  return [okxTickers, okxCurrencies, binanceTickers, binanceCurrencies];
}

const main = async () => {
  let valuePrompts: ValuesPromptsObject,
    sleepPrompts: SleepPromptsObject,
    useConfig: { use: boolean },
    prompts: PromptsObject,
    okxTickers: any,
    okxCurrencies: any,
    binanceTickers: any,
    binanceCurrencies: any;

  const accs = readAddressesFromFile("./addresses.txt");

  const fetchDataPromise = fetchData().then(res => {
    okxTickers = res[0];
    okxCurrencies = res[1];
    binanceTickers = res[2];
    binanceCurrencies = res[3];
  });

  await displayAsciiTitle("DEV in 16", "https://t.me/coderv16");

  await Promise.all([fetchDataPromise]);

  const config = getConfig();

  if (config) {
    useConfig = await prompt({
      type: "toggle",
      name: "use",
      message: "Использовать сохраненные настройки?",
      enabled: "Да",
      disabled: "Нет",
    });
  }

  if (!useConfig?.use) {
    const platform: { platform: "Binance" | "OKX" } = await prompt({
      type: "select",
      name: "platform",
      message: "Выберите биржу",
      choices: ["Binance", "OKX"],
    });
    const ticker: { ticker: string } = await prompt({
      type: "autocomplete",
      name: "ticker",
      message: "Выберите тикер: ",
      //@ts-ignore
      limit: 12,
      choices: platform.platform === "Binance" ? binanceTickers : okxTickers,
    });

    const basicPrompts: BasicPromptsObject = await prompt([
      {
        type: "select",
        name: "network",
        message: "Выберите сеть",
        choices: platform.platform === "Binance" ? makeNetworks(binanceCurrencies[ticker.ticker].info.networkList, "Binance") : makeNetworks(okxCurrencies[ticker.ticker].networks, "OKX"),
      },
      {
        type: "toggle",
        name: "random",
        message: "Рандомизировать кол-во выводимого токена?",
        enabled: "Да",
        disabled: "Нет",
      },
    ]);

    if (basicPrompts.random) {
      valuePrompts = await prompt([
        {
          type: "numeral",
          name: "min_value",
          message: "Введите минимальное кол-во токенов на вывод: ",
        },
        {
          type: "numeral",
          name: "max_value",
          message: "Введите максимальное кол-во токенов на вывод: ",
        },
      ]);

      if (valuePrompts.min_value > valuePrompts.max_value) {
        console.log(chalk.redBright.bold("\nМинимальное кол-во токенов не может быть больше максимального\n"));
        process.exit(1);
      }
    } else {
      valuePrompts = await prompt({
        type: "numeral",
        name: "value",
        message: "Введите кол-во токенов на вывод: ",
      });
    }

    const sleepPrompt: { sleep: boolean } = await prompt({
      type: "toggle",
      name: "sleep",
      message: "Установить задержку перед каждым выводом?",
      enabled: "Да",
      disabled: "Нет",
    });

    if (sleepPrompt.sleep) {
      sleepPrompts = await prompt([
        {
          type: "numeral",
          name: "min_sleep",
          message: "Введите минимальное время задержки (в секундах): ",
        },
        {
          type: "numeral",
          name: "max_sleep",
          message: "Введите максимальное время задержки (в секундах): ",
        },
      ]);

      if (sleepPrompts.min_sleep > sleepPrompts.max_sleep) {
        console.log(chalk.redBright.bold("\nМинимальное кол-во секунд не может быть больше максимального\n"));
        process.exit(1);
      }
    }

    prompts = { ...platform, ...ticker, ...basicPrompts, ...valuePrompts, ...(sleepPrompt.sleep ? { ...sleepPrompts, sleep: true } : { sleep: false }) };
    const saveConfig: { save: boolean } = await prompt({
      type: "toggle",
      name: "save",
      message: "Сохранить выбранные настройки?",
      enabled: "Да",
      disabled: "Нет",
    });
    if (saveConfig.save) {
      saveConfigToFile(prompts);
    }
  } else {
    prompts = config;
  }
  for (let i = 0; i < accs.length; i++) {
    try {
      const acc = accs[i];
      const amount = prompts.value ?? randomInt(prompts.min_value as number, prompts.max_value as number);
      console.log(`(${chalk.green(prompts.platform)}) ${chalk.gray("=>")} ${chalk.cyan(acc)}: заявка на вывод ${amount} ETH`);
      switch (prompts.platform) {
        case "Binance":
          await createBinanceWithdrawal(binance, amount, prompts.network as Network, prompts.ticker, acc);
          break;
        case "OKX":
          await createOkxWithdrawal(okx, amount, prompts.network as Network, prompts.ticker, acc, okxCurrencies);
          break;
      }

      if (prompts.sleep && i + 1 !== accs.length) {
        await sleep(prompts.min_sleep, prompts.max_sleep);
      }
    } catch (e) {
      console.log(`${chalk.red("[ERROR]")}: ошибка в ходе вывода:`);
      console.dir(e);
    }
  }
};

main();
