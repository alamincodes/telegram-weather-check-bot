const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const app = express();
const port = 5000;

const token = "6991503389:AAFOuZgAWKhLjNJ4XP1w9PaSU6Y72uX0Bmw";
const webhookUrl = `https://telegram-weather-check-bot.vercel.app/webhook/${token}`;
const bot = new TelegramBot(token, { webHook: { port: port } });

bot.setWebHook(webhookUrl);

app.post(`/webhook/${token}`, async (req, res) => {
  await bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;
  if (userInput === "Thank you".toLocaleLowerCase()) {
    bot.sendMessage(
      chatId,
      `Welcome ${msg.chat.first_name} ${msg.chat.last_name}`
    );
    return;
  }
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${userInput}&appid=b8c67f7acd80444ee2085a17b180b843`
    );
    const data = response.data;
    const weather = data.weather[0].description;
    const temperature = data.main.temp - 273.15;
    const city = data.name;
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind.speed;
    const message = `The weather in ${city} is ${weather} with a temperature of ${temperature.toFixed(
      2
    )}°C. The humidity is ${humidity}%, the pressure is ${pressure}hPa, and the wind speed is ${windSpeed}m/s.`;

    bot.sendMessage(chatId, message);
  } catch (error) {
    bot.sendMessage(chatId, "City doesn't exist.");
  }
});
