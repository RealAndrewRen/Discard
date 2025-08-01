require('dotenv').config();

const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v10');

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Start a game of Discard'),
  new SlashCommandBuilder()
    .setName('deck')
    .setDescription('See your Discards on this server'),
  new SlashCommandBuilder()
    .setName('leaderboards')
    .setDescription('See the leading Discarders on this server'),
  new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Adds this server to the database if it isn\'t already.'),
  new ContextMenuCommandBuilder()
    .setName('Make Card')
    .setType(ApplicationCommandType.Message)
].map(command => command.toJSON());

// Replace with your real client and guild ID
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Refreshing application (guild) commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully registered guild commands.');
  } catch (error) {
    console.error(error);
  }
})();
