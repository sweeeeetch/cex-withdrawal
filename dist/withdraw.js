import pkg from "enquirer";
import fs from "fs";
import { getConfig, randomInt, readAddressesFromFile, sleepFn, saveConfigToFile, decryptData, encryptData, Exchange, shuffleWallets, displayAsciiTitle, color } from "./utils.js";
import chalk from "chalk";
import { config } from "dotenv";
const { prompt } = pkg;
config();
const main = async () => {
    let valuePrompts, sleepPrompts, pass, apiKeys = {}, exName;
    const wallets = readAddressesFromFile("./addresses.txt");
    await displayAsciiTitle("DEV in 16", "https://t.me/coderv16");
    const encryptedKeys = fs.readFileSync("./encryptedKeys.txt", "utf-8");
    while (true) {
        if (encryptedKeys) {
            pass = await prompt({
                type: "password",
                name: "password",
                message: "Введите пароль для продолжения работы",
            });
            const decryptedKeys = JSON.parse(decryptData(encryptedKeys, pass.password));
            if (!decryptedKeys) {
                console.log(chalk.red("Неверный пароль!"));
                console.log(chalk.red("Если вы забыли пароль, очистите содержимое файла encryptedKeys.txt и добавьте api-ключи заново"));
                continue;
            }
            apiKeys = decryptedKeys;
            break;
        }
        else {
            console.log(color("Придумайте пароль для шифрования api-ключей и запомните его"));
            console.log(color("Рекомендуется не использовать простые пароли!"));
            pass = await prompt({
                type: "input",
                name: "password",
                message: "Введите пароль",
            });
            if (pass.password.length < 8) {
                console.log(chalk.red("Пароль должен быть не менее 8 символов!"));
                continue;
            }
            break;
        }
    }
    while (true) {
        const { action } = await prompt({
            type: "select",
            name: "action",
            message: "Выберите действие",
            choices: ["Вывести средства", "Добавить/обновить api-ключи", "О скрипте"],
        });
        switch (action) {
            case "Вывести средства":
                let useConfig, allPrompts, exchange;
                const config = getConfig();
                if (config) {
                    useConfig = await prompt({
                        type: "toggle",
                        name: "use",
                        message: "Использовать сохраненные настройки?",
                        disabled: "Нет",
                        enabled: "Да",
                        initial: true,
                    });
                }
                if (!useConfig?.use) {
                    exName = await prompt({
                        type: "select",
                        name: "name",
                        message: "Выберите биржу",
                        choices: ["Binance", "OKX", "Bybit", "MEXC", "Huobi"],
                    });
                    const exchangeName = exName.name.toLowerCase();
                    if (!apiKeys[exchangeName]) {
                        console.log(chalk.red("Для вывода средств нужно добавить api-ключи для этой биржи!"));
                        continue;
                    }
                    exchange = new Exchange(exchangeName, apiKeys[exchangeName].apiKey, apiKeys[exchangeName].apiSecret, apiKeys[exchangeName].password);
                    console.log(chalk.whiteBright.bold("Загрузка токенов..."));
                    const currencies = await exchange.fetchCurrencies();
                    const { ticker } = await prompt({
                        type: "autocomplete",
                        name: "ticker",
                        message: "Выберите тикер: ",
                        //@ts-ignore
                        limit: 12,
                        choices: currencies,
                    });
                    const networks = await exchange.fetchNetworks(ticker);
                    console.log(networks);
                    const { network, random } = await prompt([
                        {
                            type: "select",
                            name: "network",
                            message: "Выберите сеть",
                            choices: networks,
                        },
                        {
                            type: "toggle",
                            name: "random",
                            message: "Рандомизировать кол-во выводимого токена?",
                            enabled: "Да",
                            disabled: "Нет",
                        },
                    ]);
                    const networkElem = networks.filter(el => el.name === network)[0];
                    const networkMin = parseFloat(networkElem.withdrawMin ?? networkElem.minWd ?? networkElem.minWithdrawAmt);
                    while (true) {
                        if (random) {
                            const { min } = await prompt({
                                type: "numeral",
                                name: "min",
                                message: "Введите минимальное кол-во токенов на вывод: ",
                            });
                            if (min < networkMin) {
                                console.log(chalk.redBright(`Минимальная сумма для вывода в сети ${networkElem.message.split(" (fee")[0]} на бирже составляет ${networkMin} ${ticker}!`));
                                continue;
                            }
                            const { max } = await prompt({
                                type: "numeral",
                                name: "max",
                                message: "Введите максимальное кол-во токенов на вывод: ",
                            });
                            if (min > max) {
                                console.log(chalk.redBright.bold("\nМинимальное кол-во токенов не может быть больше максимального\n"));
                                continue;
                            }
                            valuePrompts = { min_value: min, max_value: max };
                            break;
                        }
                        else {
                            valuePrompts = await prompt({
                                type: "numeral",
                                name: "value",
                                message: "Введите кол-во токенов на вывод: ",
                            });
                            if (valuePrompts.value < networkMin) {
                                console.log(chalk.redBright(`Минимальная сумма для вывода в сети ${networkElem.message.split(" (fee")[0]} на бирже составляет ${networkMin} ${ticker}!`));
                                continue;
                            }
                            break;
                        }
                    }
                    const { sleep } = await prompt({
                        type: "toggle",
                        name: "sleep",
                        message: "Установить задержку перед каждым выводом?",
                        enabled: "Да",
                        disabled: "Нет",
                    });
                    if (sleep) {
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
                    const { shuffle } = await prompt({
                        type: "toggle",
                        name: "shuffle",
                        message: "Перемешать адреса для вывода?",
                        enabled: "Да",
                        disabled: "Нет",
                        initial: true,
                    });
                    allPrompts = { exName: exName.name, ticker, ...valuePrompts, network, random, shuffle, ...(sleep ? { ...sleepPrompts, sleep: true } : { sleep: false }) };
                    const { save } = await prompt({
                        type: "toggle",
                        name: "save",
                        message: "Сохранить выбранные настройки?",
                        enabled: "Да",
                        disabled: "Нет",
                    });
                    if (save) {
                        saveConfigToFile(allPrompts);
                    }
                }
                else {
                    const exchangeName = config.exName.toLowerCase();
                    if (!apiKeys[exchangeName] || !apiKeys[exchangeName].apiSecret) {
                        console.log(chalk.red("Для вывода средств нужно добавить api-ключи для этой биржи!"));
                        continue;
                    }
                    exchange = new Exchange(config.exName.toLowerCase(), apiKeys[exchangeName].apiKey, apiKeys[exchangeName].apiSecret, apiKeys[exchangeName].password);
                    allPrompts = config;
                }
                if (!wallets) {
                    console.log(color("Не удалось загрузить адреса кошельков!"));
                    console.log(color(`Проверьте корректность ввода в файле ${chalk.cyan.italic("addresses.txt ")}`));
                }
                const accs = allPrompts.shuffle ? shuffleWallets(wallets) : wallets;
                console.log("\n", color(`
[Информация] Настройки: 
Биржа: ${chalk.cyan.bold(exName.name)}
Токен: ${chalk.cyan.bold(allPrompts.ticker)}
Сеть: ${chalk.cyan.bold(allPrompts.network)}
Кол-во токенов: ${allPrompts.value ? chalk.cyan.bold(allPrompts.value) : `${chalk.cyan.bold(allPrompts.min_value)} - ${chalk.cyan.bold(allPrompts.max_value)}`}
${allPrompts.sleep ? `Задержка между заявками: ${chalk.cyan.bold(allPrompts.min_sleep)} - ${chalk.cyan.bold(allPrompts.max_sleep)} секунд` : ""}
              `, "\n"));
                console.log(color("Начинаю вывод..."));
                for (let i = 0; i < accs.length; i++) {
                    const acc = accs[i];
                    const amount = +(allPrompts.value ?? +randomInt(allPrompts.min_value, allPrompts.max_value)).toFixed(8);
                    console.log(`(${chalk.green(allPrompts.exName)}) ${chalk.gray("=>")} ${chalk.cyan(acc)}: заявка на вывод ${amount} ${allPrompts.ticker}`);
                    if (allPrompts.exName === "OKX") {
                        await exchange.withdraw(amount, allPrompts.network, allPrompts.ticker, acc, 0);
                    }
                    else {
                        await exchange.withdraw(amount, allPrompts.network, allPrompts.ticker, acc);
                    }
                    if (allPrompts.sleep && i + 1 !== accs.length) {
                        await sleepFn(allPrompts.min_sleep, allPrompts.max_sleep);
                    }
                }
                break;
            case "Добавить/обновить api-ключи":
                const prompts = await prompt([
                    {
                        type: "select",
                        name: "exchange",
                        message: "Выберите биржу",
                        choices: ["Binance", "OKX", "Bybit", "MEXC", "Huobi"],
                    },
                    {
                        type: "password",
                        name: "apiKey",
                        message: "Введите api ключ (right click)",
                    },
                    {
                        type: "password",
                        name: "apiSecret",
                        message: "Введите api-secret ключ (right click)",
                    },
                ]);
                const { password } = prompts.exchange === "okx"
                    ? await prompt({
                        type: "password",
                        name: "password",
                        message: "Введите API passphrase (right click)",
                    })
                    : { password: null };
                apiKeys[prompts.exchange.toLowerCase()] = {
                    apiKey: prompts.apiKey,
                    apiSecret: prompts.apiSecret,
                    password,
                };
                const encryptedApiKeys = encryptData(JSON.stringify(apiKeys), pass.password);
                fs.writeFileSync("./encryptedKeys.txt", encryptedApiKeys);
                console.log(chalk.green("API-ключи сохранены!"));
                break;
            case "О скрипте":
                console.log(color.bold(`
Автор: https://t.me/coderv16

Скрипт для вывода средств на кошельки.
Для начала работы добавьте ваши кошельки в файл ${chalk.cyan.italic("./addresses.txt")} и запустите скрипт.
При первом выводе средств требуется внести API-ключи, после чего всегда есть возможность их обновить.
Для ввода ${chalk.cyan.italic("API-ключа")} в консоли используйте правую кнопку мыши, в IDE возможны другие комбинации клавиш.

Автор ${chalk.underline("НЕ НЕСЕТ")} ответственности за последствия использования скрипта, все риски всегда на Вас.
`));
                break;
        }
    }
};
main().catch(() => null);
