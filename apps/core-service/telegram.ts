import axios from "axios";

export const sendTelegramMessage = async (chatId: string, text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return;
  }
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
};
