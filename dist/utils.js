import figlet from "figlet";
import fs from "fs";
import chalk from "chalk";
import { config } from "dotenv";
import { SingleBar } from "cli-progress";
import ccxt, { AuthenticationError, InsufficientFunds, BadRequest } from "ccxt";
import crypto from "crypto";
config();
const colors = ["red", "yellow", "green", "cyan", "blue", "magenta", "white", "redBright", "yellowBright", "greenBright", "cyanBright", "blueBright", "magentaBright", "whiteBright"];
export const color = chalk.rgb(200, 162, 200);
export function displayAsciiTitle(titleText, secondaryTitle) {
    return new Promise((resolve, reject) => {
        figlet.text(titleText, {
            font: "Swamp Land",
            horizontalLayout: "default",
            verticalLayout: "default",
            whitespaceBreak: true,
        }, (err, data) => {
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
                    return chalk[color](line);
                })
                    .join("\n");
                console.clear();
                console.log(chalk[color](rainbowText));
                if (secondaryTitle) {
                    const secondaryPaddingSize = Math.max(0, Math.floor((terminalWidth - secondaryTitle.length) / 2));
                    const secondaryRightPaddingSize = Math.max(0, terminalWidth - secondaryTitle.length - secondaryPaddingSize);
                    const secondaryColorIndex = (currentIndex + secondaryPaddingSize) % colors.length;
                    const secondaryColor = colors[secondaryColorIndex];
                    const centeredSecondaryTitle = " ".repeat(secondaryPaddingSize) + chalk[secondaryColor](secondaryTitle) + " ".repeat(secondaryRightPaddingSize);
                    console.log(centeredSecondaryTitle);
                }
                currentIndex = (currentIndex + 1) % colors.length;
            }, 150);
            setTimeout(() => {
                clearInterval(interval);
                console.clear();
                resolve();
            }, 2000);
        });
    });
}
export function readAddressesFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n");
        const keys = lines.filter(line => line.trim() !== "").map(line => line.trim());
        return keys;
    }
    catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return [];
    }
}
export function randomInt(min, max) {
    if (Number.isInteger(min) && Number.isInteger(max)) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    else {
        let randomFloat = Math.random() * (max - min) + min;
        return parseFloat(randomFloat.toFixed(10));
    }
}
export function sleepFn(from, to) {
    return new Promise(resolve => {
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
export function getConfig() {
    try {
        const data = fs.readFileSync("./config.txt", "utf-8");
        if (!data)
            return null;
        const config = JSON.parse(data);
        return config;
    }
    catch (error) {
        return null;
    }
}
export function saveConfigToFile(config) {
    const jsonConfig = JSON.stringify(config);
    fs.writeFileSync("config.txt", jsonConfig, "utf-8");
}
export function makeUpCurrencies(currencies) {
    const currenciesSet = Object.keys(currencies).reduce((acc, symbol) => {
        const [base, quote] = symbol.split("/");
        acc.add(base);
        acc.add(quote);
        return acc;
    }, new Set());
    return [...currenciesSet].filter(Boolean);
}
export function encryptData(data, password) {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedData = cipher.update(data, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return `${iv.toString("hex")}:${encryptedData}`;
}
export function decryptData(encryptedData, password) {
    try {
        const algorithm = "aes-256-cbc";
        const key = crypto.scryptSync(password, "salt", 32);
        const [ivHex, encryptedText] = encryptedData.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decryptedData = decipher.update(encryptedText, "hex", "utf-8");
        decryptedData += decipher.final("utf-8");
        return decryptedData;
    }
    catch (e) {
        return null;
    }
}
function getErrorMessage(e) {
    const err = JSON.parse("{" + e.message.split("{")[1]);
    const keysToCheck = ["retMsg", "msg", "err-msg"];
    for (const key of keysToCheck) {
        if (err[key]) {
            return err[key];
        }
    }
}
export function shuffleWallets(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
export class Exchange {
    name;
    exchange;
    constructor(name, apiKey, secret, password) {
        this.name = name;
        this.exchange = new ccxt[name]({
            apiKey,
            secret,
            ...(password ? { password } : {}),
            enableRateLimit: true,
            options: {
                defaultType: "spot",
            },
        });
    }
    async fetchCurrencies() {
        try {
            const currencies = await this.exchange.fetchTickers();
            return makeUpCurrencies(currencies);
        }
        catch (e) {
            if (e instanceof AuthenticationError) {
                const errMsg = getErrorMessage(e);
                console.log(chalk.redBright("ОШИБКА АУТЕНТИФИКАЦИИ:"), color(errMsg));
            }
            else {
                delete e.stack;
                console.log(chalk.redBright("НЕИЗВЕСТНАЯ ОШИБКА:"), e);
            }
        }
    }
    async fetchNetworks(token) {
        try {
            let networks;
            const rawNetworks = await this.exchange.fetchCurrencies();
            const networkList = Object.values(rawNetworks[token].networks);
            switch (this.name) {
                case "binance":
                    networks = networkList.map((el) => ({ ...el, message: `${el.name} (fee: ${rawNetworks[token].fees[el.network]})`, name: el.network }));
                    break;
                case "okx":
                    networks = [];
                    for (let i = 0; i < networkList.length; i++) {
                        const network = networkList[i];
                        if (network.active) {
                            const infoObj = network.info;
                            delete network.info;
                            networks.push({
                                ...network,
                                ...infoObj,
                                message: `${network.network} (fee ${network.fee})`,
                                name: network.network,
                            });
                        }
                    }
                    break;
                case "bybit":
                    networks = networkList.map((el) => {
                        const infoObj = el.info;
                        delete el.info;
                        return {
                            ...el,
                            ...infoObj,
                            message: `${infoObj.chainType} (fee: ${infoObj.withdrawFee})`,
                            name: el.network,
                        };
                    });
                    break;
                case "mexc":
                    networks = networkList
                        .map((el) => {
                        if (el?.info?.withdrawEnable) {
                            const infoObj = el.info;
                            delete el.info;
                            return {
                                ...el,
                                ...infoObj,
                                message: `${el.id} (fee: ${infoObj.withdrawFee})`,
                                name: el.network,
                            };
                        }
                    })
                        .filter(Boolean);
                    break;
                case "huobi":
                    networks = networkList
                        .map((el) => {
                        if (el.withdraw) {
                            const infoObj = el.info;
                            delete el.info;
                            return {
                                ...el,
                                ...infoObj,
                                message: `${infoObj.fullName} (fee: ${el.fee})`,
                                name: el.network,
                            };
                        }
                    })
                        .filter(Boolean);
                    break;
            }
            return networks;
        }
        catch (e) {
            const errMsg = getErrorMessage(e);
            if (errMsg) {
                console.log(chalk.redBright("ОШИБКА ПОЛУЧЕНИЯ СЕТЕЙ:"), errMsg);
            }
            else {
                delete e.stack;
                console.log(chalk.redBright("НЕИЗВЕСТНАЯ ОШИБКА:"), e);
            }
        }
    }
    async withdraw(amount, network, token, address, fee = null) {
        try {
            let withdrawResponse;
            if (this.name === "okx") {
                withdrawResponse = await this.exchange.withdraw(token, amount, address, {
                    password: process.env.OKEX_API_PASSWORD,
                    network: `${token}-${network}`,
                    fee,
                });
            }
            else {
                withdrawResponse = await this.exchange.withdraw(token, amount, address, {
                    network,
                });
            }
            if (withdrawResponse.info.id) {
                console.log(`(${chalk.green(this.name.toUpperCase())}) ${chalk.gray("=>")} ${chalk.cyan(address)}: успешный вывод ${amount} ${token}`);
            }
        }
        catch (e) {
            const errMsg = getErrorMessage(e);
            if (errMsg) {
                if (e instanceof InsufficientFunds) {
                    console.log(chalk.redBright("ОШИБКА ВЫВОДА:"), color("Недостаточно средств"));
                    await sleepFn(10, 30);
                    return this.withdraw(amount, network, token, address, fee);
                }
                else if (e instanceof BadRequest) {
                    console.log(chalk.redBright("ОШИБКА ВЫВОДА:"), color(errMsg));
                    await sleepFn(10, 30);
                    return this.withdraw(amount, network, token, address, fee);
                }
            }
            delete e.stack;
            console.log(chalk.redBright("НЕИЗВЕСТНАЯ ОШИБКА:"), e);
        }
    }
}
