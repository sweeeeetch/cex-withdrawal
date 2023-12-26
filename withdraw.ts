// import { Spot } from "@binance/connector";

// const apiKey = process.env.binance_api_key;
// const apiSecret = process.env.binance_api_secret;
// const client = new Spot(apiKey, apiSecret);

// async function createWithdrawal(amount, asset, network, address) {
//   await client
//     .withdraw(asset, address, amount, {
//       network,
//     })
//     .then(response => response.data.id)
//     .catch(error => {
//       client.logger.error(error);
//       throw new Error(error);
//     });
// }

// (async () => {
//   const accounts = [
//     "0x06738c0034c27b54a7f8297453723465e3109544",
//     "0xe3c6a230ec4ed467b8125f1553743e6989693ad0",
//     "0xc974e219b89f9569a1ac892678e07597bb3a9241",
//     "0x7b0dc9af12be601d841b7c9c3b6c0ffbf65c83f5",
//     "0xea8399a9e9f83e7bb0af1c5b2500c335a2b1ef10",
//     "0xead39b927f21b7b1a36bbe4ade9cabd4cda97abe",
//     "0x6f4bda8482a14eccbff4f5a478b11f08f585e1f7",
//     "0x650b9f8406b65303fb71c13ffa5434842e65341e",
//     "0x8254f6a5d0e7367c06651c488a03fc05bdf91b71",
//     "0xd5953adc30357039d5de574fc1a1b0c0f6b83b2a",
//   ];
//   for (let i = 0; i < accounts.length; i++) {
//     try {
//       const acc = accounts[i];
//       console.log(`Withdarawal request Binnce -> ${acc}, ETH-Arbitrum`);
//       const amount = 0.01274512;
//       await createWithdrawal(amount, "ETH", "ARBITRUM", acc);
//     } catch (error) {
//       console.log(error);
//       return;
//     }
//   }
// })();

import { config } from "dotenv";
import axios from "axios";
import crypto from "crypto";
import pkg from "enquirer";
const { prompt } = pkg;
config();

const binanceWithdrawalEndpoint = "https://api.binance.com/sapi/v1/capital/withdraw/apply";
const okxWithdrawalEndpoint = "https://api.binance.com/sapi/v1/capital/withdraw/apply";

const main = async () => {
  try {
    const platform = await prompt({
      type: "select",
      name: "platform",
      message: "Выберите биржу",
      choices: ["Binance", "OKX"],
    });

    
    console.log(platform);

    const params = {
      coin: "BTC", // Replace with the desired cryptocurrency
      amount: 1.0, // Replace with the desired withdrawal amount
      address: "YOUR_WITHDRAWAL_ADDRESS", // Replace with the withdrawal address
      network: "BTC", // Replace with the desired network (e.g., BTC for Bitcoin)
    };

    // Set up the headers
    const timestamp = Date.now();
    // const signature = crypto.createHmac("sha256", apiSecret).update(`timestamp=${timestamp}`).digest("hex");

    const headers = {
      // "X-MBX-APIKEY": apiKey,
    };

    // Make the withdrawal request
    // axios
    //   .post(withdrawalEndpoint, null, {
    //     params: { ...params, timestamp, signature },
    //     headers,
    //   })
    //   .then(response => {
    //     console.log("Withdrawal successful:", response.data);
    //   })
    //   .catch(error => {
    //     console.error("Withdrawal error:", error.response ? error.response.data : error.message);
    //   });
  } catch (e) {
    console.log(e);
  }
};

main();
