const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
require('dotenv').config();

// fetch بدون تثبيت مكتبة (Node 18+)
const fetch = global.fetch;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Proxy RSS (يتجاوز حظر الجزيرة)
const RSS_FEED = "https://api.rss2json.com/v1/api.json?rss_url=https://www.aljazeera.net/news/rss.xml";
const CHECK_INTERVAL = '*/1 * * * *'; // every minute

let lastGuid = null;

client.once('ready', () => {
  console.log("Bot running:");
  console.log(`Logged in as ${client.user.tag}`);

  checkRSS(); // أول تشغيل
  cron.schedule(CHECK_INTERVAL, checkRSS);
});

async function checkRSS() {
  try {
    const res = await fetch(RSS_FEED);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return;

    const latestItem = data.items[0];
    const currentGuid = latestItem.guid || latestItem.link;

    if (lastGuid === currentGuid) return;

    await postToDiscord(latestItem);
    lastGuid = currentGuid;

  } catch (error) {
    console.error("RSS fetch error:", error.message);
  }
}

async function postToDiscord(item) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL);
    if (!channel) return;

    let description = item.description || '';
    description = description.replace(/<[^>]*>?/gm, '');
    description = description.split('\n')[0] || description;
    if (description.length > 200) description = description.substring(0, 200) + '...';

    let imageUrl = item.thumbnail || null;

    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    const timeString = pubDate.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const embed = new EmbedBuilder()
      .setColor(0xE31B23)
      .setTitle("🛑 Breaking | Al Jazeera")
      .setDescription(`**${item.title}**\n\n${description}`)
      .addFields(
        { name: '🕒', value: timeString, inline: true },
        { name: '🔗', value: `[Read more](${item.link})`, inline: true }
      )
      .setTimestamp();

    if (imageUrl) embed.setImage(imageUrl);

    await channel.send({ embeds: [embed] });
    console.log("Posted:", item.title);

  } catch (error) {
    console.error("Discord post error:", error.message);
  }
}

client.login(process.env.TOKEN);
