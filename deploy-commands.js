const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { REST, Routes } = require('discord.js');

const commands = [
	new SlashCommandBuilder()
    .setName('play')
    .setDescription('Start a game of Discard'),
  new ContextMenuCommandBuilder()
    .setName('Make Card')
    .setType(ApplicationCommandType.Message),
  new SlashCommandBuilder()
    .setName('deck')
    .setDescription('See your Discards on this server'),
  new SlashCommandBuilder()
    .setName('leaderboards')
    .setDescription('See the leading Discarders on this server'),
  new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Adds this server to the database if it isn\'t already.'),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);