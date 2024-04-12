import _ from "lodash";
import { Telegraf, Context } from "telegraf";
import { ResponseData, States } from "./types";
import { checkForChanges, fetch, parseData } from "./utils";

const { WHERE_IS_MY_COROLLA_APITOKEN } = process.env;
const DEFAULT_INTERVAL = 60; // 60 * 60 * 1000 = 1h
let currentInterval = DEFAULT_INTERVAL;
let lastResponseData: ResponseData | undefined;
let state = States.NOT_STARTED;

// Initialize your bot with your bot token
const bot = new Telegraf(WHERE_IS_MY_COROLLA_APITOKEN as string);

let interval: NodeJS.Timeout;

// Middleware to log messages
bot.use((ctx: Context, next) => {
  console.log("Received:", JSON.stringify(ctx.message, null, 2));
  return next();
});

const pollData = async (ctx: Context) => {
  const responseData = await fetch() as ResponseData;
  if (!responseData) {
    const msg = 'There are no active orders to track';
    console.log(msg);
    return ctx.reply(msg);
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
};

// Commands
const startPolling = async (ctx: Context) => {
  if (state !== States.STARTED) {
    // Set polling interval
    interval = setInterval(async () => {
      await pollData(ctx);
    }, currentInterval * 60 * 1000);
    state = States.STARTED;
    ctx.reply(`Polling every ${currentInterval} min has started`);
    console.log("Fetching for the first time");
    return pollData(ctx);
  }
  return ctx.reply("Polling already started");
};

const stopPolling = (ctx: Context) => {
  if (state === States.STARTED) {
    clearInterval(interval);
    lastResponseData = undefined;
    state = States.STOPPED;
    console.log("Polling has stopped");
    return ctx.reply("Polling has stopped");
  }
  return ctx.reply("Polling hasn't started yet");
};

const fetchOnce = async (ctx: Context) => {
  const responseData = await fetch();
  if (!responseData) {
    const msg = 'There are no active orders to track';
    console.log(msg);
    return ctx.reply(msg);
  }
  return ctx.reply(parseData(responseData) as string, {
    parse_mode: "HTML",
  });
};

const setPollingInterval = async (ctx: Context) => {
  const msg = (ctx.message as any).text;
  const newInterval = msg.split(' ')[1];
  if (!newInterval) return ctx.reply(`Current interval is ${currentInterval} min`);
  if (Number.isNaN(parseInt(newInterval, 10))) return ctx.reply("Interval must be a number");
  console.log(`Setting polling interval to ${currentInterval} min`);
  currentInterval = newInterval;
  if (state === States.STARTED) {
    // Clear old interval
    clearInterval(interval);
    // Set new interval
    interval = setInterval(async () => {
      await pollData(ctx);
    }, currentInterval * 60 * 1000);
  }
  const intervalMsg = `Polling interval set to ${currentInterval} min`;
  console.log(intervalMsg);
  return ctx.reply(intervalMsg);
};

bot.command("start", startPolling);
bot.command("stop", stopPolling);
bot.command("fetch", fetchOnce);
bot.command("interval", setPollingInterval);

bot.on("message", (ctx: Context) => {
  return ctx.reply((ctx.message as any).text);
});

// Start the bot
bot.launch().then(async () => console.log("Welcome to Where is my Corolla!"));

// Handle errors
bot.catch((err: any) => console.error("Bot error", err));
