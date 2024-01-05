import pkg from "enquirer";
import { ValuesPromptsObject, SleepPromptsObject, BasicPromptsObject, Network } from "./types.js";
import { createBinanceWithdrawal, createOkxWithdrawal, displayAsciiTitle, getConfig, getNetworks, randomInt, readAddressesFromFile, sleep, saveConfigToFile } from "./utils.js";
import chalk from "chalk";

const { prompt } = pkg;

const main = async () => {
  let valuePrompts: ValuesPromptsObject;
  let sleepPrompts: SleepPromptsObject;
  let useConfig: { use: boolean };
  let prompts;
  const accs = readAddressesFromFile("./addresses.txt");

  await displayAsciiTitle("DEV in 16", "https://t.me/coderv16");
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

    const basicPrompts: BasicPromptsObject = await prompt([
      {
        type: "select",
        name: "network",
        message: "Выберите сеть",
        choices: getNetworks(platform.platform),
      },
      {
        type: "toggle",
        name: "random",
        message: "Рандомизировать кол-во выводимого эфира?",
        enabled: "Да",
        disabled: "Нет",
      },
    ]);

    if (basicPrompts.random) {
      valuePrompts = await prompt([
        {
          type: "numeral",
          name: "min_value",
          message: "Введите минимальное кол-во эфира на вывод: ",
        },
        {
          type: "numeral",
          name: "max_value",
          message: "Введите максимальное кол-во эфира на вывод: ",
        },
      ]);

      if (valuePrompts.min_value > valuePrompts.max_value) {
        console.log(chalk.redBright.bold("\nМинимальное кол-во эфира не может быть больше максимального\n"));
        process.exit(1);
      }
    } else {
      valuePrompts = await prompt({
        type: "numeral",
        name: "value",
        message: "Введите кол-во эфира на вывод: ",
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

    prompts = { ...platform, ...basicPrompts, ...valuePrompts, ...(sleepPrompt.sleep ? { ...sleepPrompts, sleep: true } : {}) };

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
          await createBinanceWithdrawal(amount, prompts.network as Network, acc);
          break;
        case "OKX":
          await createOkxWithdrawal(amount, prompts.network as Network, acc);
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

/* 
const { Spot } = require('@binance/connector');
const { config } = require('./config');

// API Key and Secret (replace with your own)
const apiKey = config.binance_api_key;
const apiSecret = config.binance_api_secret;
const client = new Spot(apiKey, apiSecret);

async function createWithdrawal(amount, asset, network, address) {
  await client
    .withdraw(asset, address, amount, {
      network,
    })
    .then((response) => response.data.id)
    .catch((error) => {
      client.logger.error(error);
      throw new Error(error);
    });
}

(async () => {
  const accounts = [
    '0x06738c0034c27b54a7f8297453723465e3109544',
    '0xe3c6a230ec4ed467b8125f1553743e6989693ad0',
    '0xc974e219b89f9569a1ac892678e07597bb3a9241',
    '0x7b0dc9af12be601d841b7c9c3b6c0ffbf65c83f5',
    '0xea8399a9e9f83e7bb0af1c5b2500c335a2b1ef10',
    '0xead39b927f21b7b1a36bbe4ade9cabd4cda97abe',
    '0x6f4bda8482a14eccbff4f5a478b11f08f585e1f7',
    '0x650b9f8406b65303fb71c13ffa5434842e65341e',
    '0x8254f6a5d0e7367c06651c488a03fc05bdf91b71',
    '0xd5953adc30357039d5de574fc1a1b0c0f6b83b2a',
  ];
  for (let i = 0; i < accounts.length; i++) {
    try {
      const acc = accounts[i];
      console.log(`Withdarawal request Binnce -> ${acc}, ETH-Arbitrum`);
      const amount = 0.01274512;
      await createWithdrawal(amount, 'ETH', 'ARBITRUM', acc);
    } catch (error) {
      console.log(error);
      return;
    }
  }
})();

*/

/* 
(function() {
  const wallets = [""];
  
  const names = [];
  
  const walletSelectors = [];
  const nameSelectors = [];
  
  for (let i = 3; i <= 98; i += 5) {
   walletSelectors.push(
     `#scroll-box > div > div > form > div:nth-child(6) > div > div > div > div > div:nth-child(${i}) > div.okui-form-item-control > div > div > div > div > input.okui-input-input`
   );
  }
  
  for (let i = 5; i <= 100; i += 5) {
   nameSelectors.push(
     `#scroll-box > div > form > div:nth-child(3) > div > div > div > div > div:nth-child(${i}) > div.okui-form-item-control > div > div > div > div > input.okui-input-input`
   );
  }
  
  const addButtonSelector =
    "#scroll-box > div > div > form > div:nth-child(6) > div > div > div > div > div.add-address-form-btn";

  
  function fillInput(input, value) {
    input.setAttribute('value', value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  async function addWallets() {
    for (let i = 0; i < wallets.length; i++) {
      console.log(`Добавление кошелька ${i + 1} из ${wallets.length}`);
  
      const addressInput = document.querySelector(walletSelectors[i]);
      const nameInput = document.querySelector(nameSelectors[i]);
  
      fillInput(addressInput, wallets[i]);
      await new Promise((resolve) => setTimeout(resolve, 300));
  
      if (names.length > 0) {
        fillInput(nameInput, names[i]);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
  
      if (i < wallets.length - 1) {
        const button = document.querySelector(addButtonSelector);
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  
    console.log('Завершено');
  }
  
  addWallets();
 })();
*/
