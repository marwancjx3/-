const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const Parser = require('rss-parser');
const cron = require('node-cron');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const parser = new Parser();
parser.parseURL("https://www.aljazeera.net/aljazeera/rss.xml");
const CHECK_INTERVAL = '*/1 * * * *'; // every minute

let lastGuid = null;

client.once('ready', () => {
  console.log(`Bot running:`);
  console.log(`Logged in as ${client.user.tag}`);
  
  // Check immediately on startup
  checkRSS();
  
  // Schedule regular checks
  cron.schedule(CHECK_INTERVAL, checkRSS);
});

async function checkRSS() {
  try {
    const feed = await parser.parseURL(RSS_FEED);
    
    if (!feed.items || feed.items.length === 0) return;
    
    const latestItem = feed.items[0];
    const currentGuid = latestItem.guid || latestItem.link;
    
    // Skip if we've already posted this
    if (lastGuid === currentGuid) return;
    
    // Check if it's actually new (guid changed)
    if (lastGuid === null || lastGuid !== currentGuid) {
      await postToDiscord(latestItem);
      lastGuid = currentGuid;
    }
  } catch (error) {
    console.error('RSS fetch error:', error.message);
  }
}

async function postToDiscord(item) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL);
    if (!channel) return;
    
    // Extract description without images and limit to ~2 lines
    let description = item.contentSnippet || item.description || '';
    description = description.replace(/<[^>]*>?/gm, ''); // strip HTML
    description = description.split('\n')[0] || description;
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }
    
    // Extract image
    let imageUrl = null;
    if (item.content) {
      const match = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (match) imageUrl = match[1];
    }
    if (!imageUrl && item.enclosure && item.enclosure.url) {
      imageUrl = item.enclosure.url;
    }
    
    // Format publish time
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    const timeString = pubDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const embed = new EmbedBuilder()
      .setColor(0xE31B23)
      .setTitle('🛑 Breaking | Al Jazeera')
      .setDescription(`**${item.title}**\n\n${description}`)
      .addFields(
        { name: '🕒', value: timeString, inline: true },
        { name: '🔗', value: `[Read more](${item.link})`, inline: true }
      )
      .setTimestamp();
    
    if (imageUrl) {
      embed.setImage(imageUrl);
    }
    
    await channel.send({ embeds: [embed] });
    console.log(`Posted: ${item.title}`);
  } catch (error) {
    console.error('Discord post error:', error.message);
  }
}

client.login(process.env.TOKEN);
