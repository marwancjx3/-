# Al Jazeera News Discord Bot

Automatically posts the latest news from Al Jazeera RSS feed to a Discord channel.

## Features
- Checks for new articles every minute
- Never posts duplicates
- Rich Discord embeds with title, summary, image, link, and publish time
- 24/7 deployment ready for Render

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Run locally: `npm start`

## Environment Variables

- `TOKEN`: Your Discord bot token (from Discord Developer Portal)
- `CHANNEL`: The ID of the channel where news will be posted

## Deploy to Render

1. Push code to a Git repository
2. Create a new **Worker** on Render
3. Connect your repository
4. Add environment variables
5. Deploy!

The bot will start automatically and run continuously.
