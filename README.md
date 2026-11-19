# SASE Discord Bot

A Discord bot for the SASE community. This repository contains the bot source code, configuration, and deployment setup.

## Features

- Daily event reminders at 9 a.m. America/New_York, covering that calendar day.
- Sunday roundups at 9 a.m. America/New_York, covering the upcoming Monday through Sunday.
- Empty days/weeks produce no announcement. Daily posts mention the existing reminder role; weekly posts mention everyone once.
- Events are listed chronologically. Both schedules adjust for daylight saving time and no longer use the `events.reminded` flag.
- The bot must be running at the scheduled time; missed reminders are not replayed automatically.

- Responds to Discord slash commands and events
- Keeps configuration in environment variables
- Designed for local development and hosted deployment

## Requirements

### Local reminder tests

Run `npm test` on Node.js 22.3+ (module mocks require the experimental flag included in the script). Tests use fake Supabase data and a fake Discord channel with the real reminder scheduler callbacks and embed builder. They do not log in, send Discord messages, or access the database. Coverage includes daily/weekly boundaries, daylight saving changes, event ordering, mentions, empty results, and provider failures.

- Node.js 20 or later
- A Discord application and bot token
- The bot invited to a Discord server with the required permissions

## Setup

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repository-url>
   cd SASE-discord-bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   DISCORD_TOKEN=your-discord-bot-token
   CLIENT_ID=your-discord-application-id
   GUILD_ID=your-development-server-id
   ```

   Keep the token private and do not commit the `.env` file.

4. Start the bot in development mode:

   ```bash
   npm run dev
   ```

## Available Scripts

Update this table when the project scripts are added or changed.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the bot locally with development settings |
| `npm start` | Start the bot in production |
| `npm test` | Run the test suite |
| `npm run lint` | Check code style and lint rules |

## Discord Configuration

Create an application in the [Discord Developer Portal](https://discord.com/developers/applications), add a bot user, and copy its token into `.env`.

When generating an invite URL, select:

- **Scopes:** `bot`, `applications.commands`
- **Permissions:** only the permissions required by the bot's commands

For development, register commands against a test server using `GUILD_ID`. Global commands can take longer to appear.

## Project Structure

The structure may grow as features are added:

```text
SASE-discord-bot/
├── src/              # Bot source code
├── .env.example      # Environment variable template
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

## Deployment

Set the required environment variables in the hosting platform, install production dependencies, and run:

```bash
npm start
```

The bot process must stay running and have network access to Discord's gateway.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run the available tests and checks.
4. Open a pull request with a short description of the change.

## License

Add the project's license here when one is selected.
