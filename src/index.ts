import _ from "lodash";
import { Telegraf, Context } from "telegraf";
import { ResponseData, States } from "./types";
import { checkForChanges, fetch, parseData } from "./utils";

const { WHERE_IS_MY_COROLLA_TELEGRAM_APITOKEN } = process.env;
const INTERVAL = 60; // 60 * 60 * 1000 = 1h
let lastResponseData: ResponseData | undefined;
let state = States.NOT_STARTED;

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
  if (state !== States.STARTED) {
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
    }, INTERVAL * 60 * 1000);
    await ctx.reply(`Polling every ${INTERVAL} min has started`);
    state = States.STARTED;
    return ctx.reply(parseData(responseData) as string, {
      parse_mode: "HTML",
    });
  }
  return ctx.reply("Polling already started");
});

bot.command("fetch", async (ctx: Context) => {
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

bot.command("interval", async (ctx: Context) => {
  if (state === States.STARTED) {
    const msg = (ctx.message as any).text;
    const newInterval = parseInt(msg.split(' ').length ? msg.split(' ')[1] : INTERVAL, 10);
    // Check interval value
    if (Number.isNaN(newInterval)) return ctx.reply("Interval must be a number");
    console.log(`Setting polling interval to ${newInterval} min`);
    // Clear old interval
    clearInterval(interval);
    // Fetching after prior to interval change
    const responseData = await fetch();
    if (!responseData) {
      const msg = 'There are no active orders to track';
      console.log(msg);
      return ctx.reply(msg);
    }
    // Set most recent response for comparison
    lastResponseData = _.cloneDeep(responseData);
    // Set new interval
    interval = setInterval(async () => {
      await pollData(ctx);
    }, newInterval * 60 * 1000);
    console.log(`Polling interval set to ${newInterval} min`);
    await ctx.reply(`Polling interval set to ${newInterval} min`);
    return ctx.reply(parseData(responseData) as string, {
      parse_mode: "HTML",
    });
  }
  return ctx.reply("Polling hasn't started yet");
});

bot.command("stop", (ctx: Context) => {
  if (state === States.STARTED) {
    clearInterval(interval);
    lastResponseData = undefined;
    state = States.STOPPED;
    console.log("Polling has stopped");
    return ctx.reply("Polling has stopped");
  }
  return ctx.reply("Polling hasn't started yet");
});

bot.on("message", (ctx: Context) => {
  return ctx.reply((ctx.message as any).text);
});

// Start the bot
bot.launch().then(async () => console.log("Welcome to Where is my Corolla!"));

// Handle errors
bot.catch((err: any) => console.error("Bot error", err));
