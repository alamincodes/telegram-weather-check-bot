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

// Handle all incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text?.trim();
  console.log(msg);
  // Handle /start command
  if (userInput === "/start") {
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
      `You're welcome, ${msg.chat.first_name} ${msg.chat.last_name}!`
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
