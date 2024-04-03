import _ from "lodash";
import { Telegraf, Context } from "telegraf";
import { ResponseData } from "./types";
import { fetch, parseData } from "./utils";

const { WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN } = process.env;
const INTERVAL = 300000;

// Initialize your bot with your bot token
const bot = new Telegraf(WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN as string);

let lastResponseData: ResponseData | undefined;
let interval: NodeJS.Timeout;

// Middleware to log messages
bot.use((ctx: Context, next) => {
  console.log("Received:", ctx.message);
  return next();
});

async function pollData(ctx: Context) {
  const responseData = await fetch();
  if (responseData && !_.isEqual(lastResponseData, responseData)) {
    console.log("Changes!");
    lastResponseData = _.cloneDeep(responseData);
    return ctx.reply(parseData(lastResponseData) as string, {
      parse_mode: "HTML",
    });
  }
  console.log("No changes");
}

// Command handler
bot.command("start", async (ctx: Context) => {
  console.log("Fetching for the first time");
  lastResponseData = await fetch();
  if (!lastResponseData) {
    console.log("There are no active orders to track");
    return ctx.reply("There are no active orders to track");
  }
  interval = setInterval(async () => {
    await pollData(ctx);
  }, INTERVAL);
  ctx.reply("Polling has started");
  return ctx.reply(parseData(lastResponseData) as string, {
    parse_mode: "HTML",
  });
});

bot.command("stop", (ctx: Context) => {
  clearInterval(interval);
  console.log("Polling has stopped");
  return ctx.reply("Polling has stopped");
});

// Start the bot
bot.launch().then(async () => console.log("Welcome to Where is my Corolla!"));

// Handle errors
bot.catch((err: any) => console.error("Bot error", err));
