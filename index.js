import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';
import http from 'http';
import fs from 'fs';

// Создаем сервер-заглушку, чтобы Render видел порт
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(Port ${PORT} is open);
});

// Подключаем ключи из Render
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

// Читаем нашу базу знаний (data.json)
let guideData = {};
try {
    const rawData = fs.readFileSync('./data.json', 'utf8');
    guideData = JSON.parse(rawData);
    console.log('База данных успешно загружена!');
} catch (error) {
    console.error('Ошибка при чтении data.json:', error);
}

bot.on('text', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    
    const userText = ctx.message.text.toLowerCase().trim();

    // 1. ПРОВЕРЯЕМ, ЕСТЬ ЛИ ОТВЕТ В НАШЕМ ПУТЕВОДИТЕЛЕ
    let foundInGuide = false;
    
    for (const key in guideData) {
        if (userText.includes(key.toLowerCase())) {
            foundInGuide = true;
            
            // Отправляем картинку
            if (guideData[key].image_url) {
                await ctx.replyWithPhoto(guideData[key].image_url);
            }
            
            // Отправляем текст с адресом
            const replyText = 📍 **${key}**\n\nАдрес: ${guideData[key].address};
            await ctx.reply(replyText, { parse_mode: 'Markdown' });
            
            break; // Нашли совпадение, выходим из цикла
        }
    }

    // 2. ЕСЛИ В ПУТЕВОДИТЕЛЕ НЕТ, ИДЕМ В GEMINI
    if (!foundInGuide) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash", 
          contents: Ты — полезный ассистент. Отвечай кратко. Вопрос: ${ctx.message.text},
        });

        await ctx.reply(response.text);
    }

  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Упс, произошла ошибка при обработке вашего сообщения.');
  }
});

bot.launch().then(() => {
  console.log('Бот успешно запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
