const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = 5500;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Your Telegram bot token
const token = "7547242393:AAH07hO32sjxqlKGVZ1pfi9gCwn3T8ao4Oo";

const bot = new TelegramBot(token, { polling: true });

// Suggested cities for user interaction
const suggestedCities = [
  "Comilla",
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
];

// Helper function to check if the message contains only emojis
const isEmoji = (message) => {
  const emojiRegex =
    /^([\u2700-\u27BF]|[\u1F600-\u1F64F]|[\u1F300-\u1F5FF]|[\u1F680-\u1F6FF]|[\u2600-\u26FF]|[\u1F1E6-\u1F1FF]|[\u1F900-\u1F9FF]|[\u1FA70-\u1FAFF]|[\u200D\uFE0F])+$/u;
  return emojiRegex.test(message);
};

// Handle all incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text?.trim();

  // Respond with the same emoji if the input is an emoji
  if (isEmoji(userInput)) {
    bot.sendMessage(chatId, userInput);
    return;
  }

  // Handle /start command
  if (userInput.toLowerCase() === "/start") {
    const cityButtons = {
      reply_markup: {
        inline_keyboard: suggestedCities.map((city) => [
          { text: city, callback_data: city },
        ]),
      },
    };

    bot.sendMessage(
      chatId,
      `Hello ${msg.chat.first_name || "User"}! Welcome to the Weather Bot.\n` +
        `You can type a city name to get the weather details.\n` +
        `Here are some cities you can try or click on a button below:`,
      cityButtons
    );
    return;
  }

  // Respond to a "Thank you" message
  if (userInput?.toLowerCase() === "thank you") {
    bot.sendMessage(
      chatId,
      `You're welcome, ${msg.chat.first_name || "friend"}!`
    );
    return;
  }

  // Handle /poll command
  if (userInput.toLowerCase() === "/poll") {
    bot.sendPoll(
      chatId,
      "Which city would you like to get the weather for?",
      suggestedCities,
      { is_anonymous: false }
    );
    return;
  }

  // Fetch weather information for typed city names
  await fetchWeather(userInput, chatId);
});

// Handle inline button clicks for cities
bot.on("callback_query", async (callbackQuery) => {
  const cityName = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  await fetchWeather(cityName, chatId);

  // Acknowledge the callback to avoid Telegram API warnings
  bot.answerCallbackQuery(callbackQuery.id);
});

// Function to fetch weather details
const fetchWeather = async (cityName, chatId) => {
  try {
    const apiKey = "b8c67f7acd80444ee2085a17b180b843"; // OpenWeather API key
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`
    );
    const data = response.data;
    const weather = data.weather[0].description;
    const temperature = data.main.temp - 273.15; // Convert from Kelvin to Celsius
    const city = data.name;
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind.speed;

    const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(
      2
    )}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(
      chatId,
      "City doesn't exist or there was an error processing your request."
    );
  }
};
