import _ from "lodash";
import { Telegraf, Context } from "telegraf";
import { ResponseData } from "./types";
import { checkForChanges, fetch, parseData } from "./utils";

const { WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN } = process.env;
const INTERVAL = 3600000; // 1h
let lastResponseData: ResponseData | undefined;

// Initialize your bot with your bot token
const bot = new Telegraf(WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN as string);

let interval: NodeJS.Timeout;

// Middleware to log messages
bot.use((ctx: Context, next) => {
  console.log("Received:", JSON.stringify(ctx.message, null, 2));
  return next();
});

async function pollData(ctx: Context) {
  const responseData = await fetch() as ResponseData;
  if (!responseData) {
    console.log("There are no active orders to track");
    return ctx.reply("There are no active orders to track");
  }
  if (checkForChanges(responseData, lastResponseData)) {
    console.log('Changes!');
    // Set most recent response for comparison
    lastResponseData = _.cloneDeep(responseData);
    return ctx.reply(parseData(responseData) as string, {
      parse_mode: "HTML",
    });
  }
  console.log('No Changes');
}

// Command handler
bot.command("start", async (ctx: Context) => {
  console.log("Fetching for the first time");
  const responseData = await fetch();
  if (!responseData) {
    const msg = 'There are no active orders to track';
    console.log(msg);
    return ctx.reply(msg);
  }
  // Set most recent response for comparison
  lastResponseData = _.cloneDeep(responseData);
  // Set polling interval
  interval = setInterval(async () => {
    await pollData(ctx);
  }, INTERVAL);
  ctx.reply("Polling has started");
  return ctx.reply(parseData(responseData) as string, {
    parse_mode: "HTML",
  });
});

bot.command("fetchonce", async (ctx: Context) => {
  const responseData = await fetch();
  if (!responseData) {
    const msg = 'There are no active orders to track';
    console.log(msg);
    return ctx.reply(msg);
  }
  return ctx.reply(parseData(responseData) as string, {
    parse_mode: "HTML",
  });
});

bot.command("stop", (ctx: Context) => {
  clearInterval(interval);
  lastResponseData = undefined;
  console.log("Polling has stopped");
  return ctx.reply("Polling has stopped");
});

bot.on("message", (ctx: Context) => {
  return ctx.reply((ctx.message as any).text);
});

// Start the bot
bot.launch().then(async () => console.log("Welcome to Where is my Corolla!"));

// Handle errors
bot.catch((err: any) => console.error("Bot error", err));
