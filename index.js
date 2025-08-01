require('dotenv').config();

const { Client, GatewayIntentBits, Permissions, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder } = require('discord.js');
const fs = require("fs");

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const images = {
  controversial: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/craiyon_163915_two_people_having_a_debate_and_arguing_.png?v=1680381622086",
  intellectual: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/craiyon_164254_shakespeare_is_not_as_learned_in_gen_z_slang.png?v=1680381782356",
  humorous: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/Screenshot%202023-04-01%203.26.45%20PM.png?v=1680377235615",
  random: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/Screenshot%202023-04-01%203.28.03%20PM.png?v=1680377315509",
  wholesome: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/craiyon_155524_wholesome_champions_share_trophies__.png?v=1680381039503",
  both: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/craiyon_155524_wholesome_champions_share_trophies__.png?v=1680381039503",
  neither: "https://cdn.glitch.global/1a419221-c5e6-4ee0-be99-68139bac8dea/craiyon_162922_playing_chess_with_a_pigeon_that_knocks_the_pieces_over_.png?v=1680381033701"
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let data = {};
const dataPath = __dirname + '/.data/data.json';

try {
  const raw = fs.readFileSync(dataPath, { encoding: 'utf8' }).trim();
  if (raw) {
    data = JSON.parse(raw);
  } else {
    console.warn('data.json was empty, using default empty object.');
  }
} catch (err) {
  console.error('Error reading or parsing data.json:', err);
  data = {};
}

if (!data.servers) {
  data.servers = {};
}

const duels = Object.create(null);  

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('bot server started');
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN); 

client.on('guildCreate', async guild => {
  console.log("bot added to new server: " + guild.name);
  data.servers[guild.id] = {};
  data.servers[guild.id].members = {};
  fs.writeFileSync(__dirname + '/.data/data.json', JSON.stringify(data), {encoding: "utf8"});
})

client.on('interactionCreate', async interaction => {
  const serverId = interaction.guildId;
  const userId = interaction.user.id;
  
  if(interaction.isMessageContextMenuCommand()){
    // https://discord.js.org/#/docs/discord.js/main/class/MessageContextMenuCommandInteraction
    const message = interaction.targetMessage;
    const posterId = interaction.targetMessage.author.id;
   
    
    if(!data.servers[serverId].members[userId]){
      data.servers[serverId].members[userId] = {
        cards: [],
        score: 0,
        name: message.member.nickname || message.author.username
      }
    }
    
    const messageText = message.toString().replace(/[^\x00-\x7F]/g, "");
    
    if(messageText.length < 5){
      await interaction.reply({
        content: "Could not generate a card from this message.",
        ephemeral: true
      });
      return;
    }
    
    const shortText = messageText.length > 100 ? messageText.slice(0, 100) + "..." : messageText;
    
    const response = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  prompt: '"' + shortText + '"\nWhich adjective best describes the message above?\nA. Controversial\nB. Intellectual\nC. Wholesome\nD. Random\nE. Humorous\n\nAnswer:',
  temperature: 0.3,
  max_tokens: 1,
  top_p: 1,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  stop: ["\n"],
});
    
    const typeList = {"A": "controversial", "B":"intellectual", "C":"wholesome", "D":"random", "E":"humorous"}
    const cardType = typeList[response.data.choices[0].text.trim()];
    const cardValue = 20 + Math.floor(Math.random() * 51);
    
    data.servers[serverId].members[userId].cards.push({
      creator: message.author.username,
      message: shortText,
      type: cardType,
      value: cardValue,
      date: Date.now()
    });
    fs.writeFileSync(__dirname + '/.data/data.json', JSON.stringify(data), {encoding: "utf8"});
    const typeEmojis = {"random": "🎲", "controversial": "🤬", "wholesome": "🤗", "intellectual": "🤓", "humorous": "😂"};
    await interaction.reply({
      content: "Created card '" + shortText + "' (" + typeEmojis[cardType] + cardType.toUpperCase() + " " + cardValue + ") and added to your deck"
    });
    console.log(data);
    return;
  }
  
  if(interaction.isButton() && interaction.customId.startsWith("cardA-")){
    if(!data.servers[serverId].members[userId]){
      await interaction.reply({
        content: "You don't have any cards to play.",
        ephemeral: true
      });
      return;
    }
    
    const cardA = data.servers[serverId].members[userId].cards[interaction.customId.slice(6)];
    
    if(!cardA){
      await interaction.reply({
        content: "Failed to load card.",
        ephemeral: true
      });
      return;
    }
    
    const duelId = Math.random().toString(36).slice(-6);
    
    duels[duelId] = {
      id: duelId,
      playerA: userId,
      playerAName: interaction.member.nickname || interaction.user.username,
      cardA: cardA
    }
    
    const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('duel-' + duelId)
                    .setLabel('Enter Duel')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ content: interaction.user.username + ' is starting a duel', components: [row] });
    return;
  }
  
  if(interaction.isButton() && interaction.customId.startsWith("duel-")){
    if(!data.servers[serverId].members[userId]){
      await interaction.reply({
        content: "You don't have any cards to play.",
        ephemeral: true
      });
      return;
    }
    
    const duelId = interaction.customId.slice(5);
    
    if(!duels[duelId]){
      await interaction.reply({
        content: "Duel not found",
        ephemeral: true
      });
      return;
    }
    
    if(duels[duelId].playerB){
      await interaction.reply({
        content: "Duel already has second player",
        ephemeral: true
      });
      return;
    }
    
    if(duels[duelId].playerA === userId){
      await interaction.reply({
        content: "You can't duel yourself, silly.",
        ephemeral: true
      });
      return;
    }
    
    if(!data.servers[serverId].members[userId] || data.servers[serverId].members[userId].cards.length < 3){
      await interaction.reply({
        content: "You don't have enough cards to play.",
        ephemeral: true
      });
      return;
    }
    
    duels[duelId].playerB = userId;
    duels[duelId].playerBName = interaction.member.nickname || interaction.user.username;
    
    const bList = data.servers[serverId].members[userId].cards;
    
    var cards = [];
    while (cards.length < 3) {
      const randomCard = Math.floor(Math.random() * bList.length);
      if(!cards.includes(randomCard)){
        cards.push(randomCard);
      }
    }
    
    const row = new ActionRowBuilder();
    cards.forEach(id => {
      const card = data.servers[serverId].members[userId].cards[id];
      console.log(card)
      row.addComponents(
                new ButtonBuilder()
                    .setCustomId('cardB-' + id + '-duel-' + duelId)
                    .setLabel("'" + card.message.replace(/[^\x00-\x7F]/g, "") + "' (" + card.type.toUpperCase() + " " + card.value + ")".slice(0, 80))
                    .setStyle(ButtonStyle.Primary),
            );
    })

        await interaction.reply({ content: 'Choose a card to play', components: [row], ephemeral: true });
    return;
  }
  
  if(interaction.isButton() && interaction.customId.startsWith("cardB-")){
    const duelAttr = interaction.customId.split("-");
    if(duelAttr.length !== 4 || duelAttr[2] !== "duel"){
      await interaction.reply({
        content: "Error parsing duel.",
        ephemeral: true
      });
      return;
    }
    
    const duelId = duelAttr[3];
    
    if(!duels[duelId]){
      await interaction.reply({
        content: "Duel not found.",
        ephemeral: true
      });
      return;
    }
    
    duels[duelId].cardB = data.servers[serverId].members[duels[duelId].playerB].cards[duelAttr[1]];
    
    if(!duels[duelId].cardB){
      await interaction.reply({
        content: "Failed to load card.",
        ephemeral: true
      });
      return;
    }
    
    const outcome = determineWinner(duels[duelId].cardA, duels[duelId].cardB);
    
    var winText;
    var winType;
    if(outcome.winner === "a"){
      winText = duels[duelId].playerAName + " wins!";
      winType = duels[duelId].cardA.type;
      data.servers[serverId].members[duels[duelId].playerA].score += 1;
    }else if(outcome.winner === "b"){
      winText = (interaction.member.nickname || interaction.user.username) + " wins!";
      winType = duels[duelId].cardB.type;
      data.servers[serverId].members[userId].score += 1;
    }else if(outcome.winner === "both"){
      winText = "Both duelists win!";
      winType = "both";
      data.servers[serverId].members[duels[duelId].playerA].score += 1;
      data.servers[serverId].members[userId].score += 1;
    }else{
      winType = "neither";
      winText = "Neither duelist wins!"
    }
    
    fs.writeFileSync(__dirname + '/.data/data.json', JSON.stringify(data), {encoding: "utf8"});
    
    const typeEmojis = {"random": "🎲", "controversial": "🤬", "wholesome": "🤗", "intellectual": "🤓", "humorous": "😂"};
    const outcomeEmbed = new EmbedBuilder()
      .setColor(0xFDFB7F)
        .setTitle(duels[duelId].playerAName + " is dueling against " + (interaction.member.nickname || interaction.user.username))
      .addFields(
        { name: duels[duelId].playerAName + " brings", value: duels[duelId].cardA.message + " (" + typeEmojis[duels[duelId].cardA.type] + " " + duels[duelId].cardA.type.toUpperCase() + " " + duels[duelId].cardA.value +  ")", inline: true },
        { name: (interaction.member.nickname || interaction.user.username) + " brings", value: duels[duelId].cardB.message + " (" + typeEmojis[duels[duelId].cardB.type] + duels[duelId].cardB.type.toUpperCase() + " " + duels[duelId].cardB.value + ")", inline: true },
        { name: winText, value: "*" + outcome.desc + "*" }
      );
    
    if(images[winType]){
      outcomeEmbed.setImage(images[winType]);
    }
    
    await interaction.reply({
      embeds: [outcomeEmbed]
    });
    
    delete duels[duelId];
    return;
  }
  
  if (!interaction.isCommand()) return;
    const { commandName } = interaction;
  
    if (commandName === 'play') {
    if(!data.servers[serverId].members[userId] || data.servers[serverId].members[userId].cards.length < 3){
      await interaction.reply({
        content: "You don't have enough cards to play.",
        ephemeral: true
      });
      return;
    }
    
    const aList = data.servers[serverId].members[userId].cards;
    
    var cards = [];
    while (cards.length < 3) {
      const randomCard = Math.floor(Math.random() * aList.length);
      if(!cards.includes(randomCard)){
        cards.push(randomCard);
      }
    }
    
    const row = new ActionRowBuilder();
    
    cards.forEach(id => {
      const card = data.servers[serverId].members[userId].cards[id];
      row.addComponents(
                new ButtonBuilder()
                    .setCustomId('cardA-' + id)
                    .setLabel("'" + card.message.replace(/[^\x00-\x7F]/g, "") + "' (" + card.type.toUpperCase() + " " + card.value + ")")
                    .setStyle(ButtonStyle.Primary),
            );
    })

        await interaction.reply({ content: 'Choose a card to play', components: [row], ephemeral: true });
    
  } else if (commandName === 'leaderboards') {
      const players = Object.keys(data.servers[serverId].members);
      if(players.length == 0) {
        await interaction.reply("No one on the leaderboards yet...");
        return;
      }
      console.log(players);
      const playerScorePairs = [];
      for(let i = 0; i < players.length; i++) {
        playerScorePairs.push([players[i], data.servers[serverId].members[players[i]].score, data.servers[serverId].members[players[i]].name]);
      }
      console.log(playerScorePairs);
      function compareScore(a, b) {
        return b[1] - a[1];
      }
    
      var msg = "";
      
      const ranked = playerScorePairs.sort(compareScore);
      console.log(ranked);
      for(let i = 0; i < ranked.length; i++) {
        if (!ranked[i][1]) {
          ranked[i][1] = 0
        }
        msg = msg + ranked[i][2] + " has " + ranked[i][1] + " points\n"
      }
      console.log(msg);
        const leaderboards = new EmbedBuilder()
      .setColor(0xFDFB7F)
      .addFields(
        { name: "Leaderboard", value: msg }
      );
    
    await interaction.reply({
      embeds: [leaderboards]
    });
    
  } else if (commandName === 'deck') {
    if(!data.servers[serverId].members[userId]){
      await interaction.reply({
        content: "You don't have any cards.",
        ephemeral: true
      });
      return;
    }
    
    const aList = data.servers[serverId].members[userId].cards;
    var cards = [];
    const typeEmojis = {"random": "🎲", "controversial": "🤬", "wholesome": "🤗", "intellectual": "🤓", "humorous": "😂"};
    aList.forEach(card => {
      cards.push("- '" + card.message + "' (" + typeEmojis[card.type] + " " + card.type.toUpperCase() + " " + card.value + "), from a message by " + card.creator + " on " + new Date(card.date).toDateString())
    });
    
    await interaction.reply("**Your Cards:**\n" + cards.join('\n'));
  } else if(commandName === "reload"){
    if(false && data.servers[serverId]){
      await interaction.reply("Server is already in database");
    }else{
      data.servers[serverId] = {};
      data.servers[serverId].members = {};
      fs.writeFileSync(__dirname + '/.data/data.json', JSON.stringify(data), {encoding: "utf8"});
      await interaction.reply("Server added to database!");
    }
  }else {
    await interaction.reply("Sorry, that command was not found.");
    }
});

function determineWinner(a, b){
  if(a.type === "controversial" && b.type === "controversial"){
    return {
      winner: "Neither",
      desc: "The controversial players engage each other in an eternal, intense, trivial debate. Both lose."
    };
  }else if(a.type === "controversial" && b.type === "intellectual"){
    return {
      winner: (a.value > b.value + 25) ? "a" : "b",
      desc: "The intellectual brings FACTS and LOGIC (read: a peer-reviewed study) to the table, giving them a moderate boost of +25."
    };
  }else if(a.type === "controversial" && b.type === "wholesome"){
    return {
      winner: (a.value > b.value + 15) ? "a" : "b",
      desc: "Despite the best efforts of the wholesome player, the controversial succeeds in stirring drama and tearing apart relationships, giving them a small boost of +15."
    }
    
  }else if(a.type === "controversial" && b.type === "random"){
    return {
      winner: (a.value + 10 < b.value) ? "a" : "b",
      desc: "\"You can't spell controversy without entropy\" - Isaac Newton. Newton's Fourth Law states that the player with the lower value wins, and the controversial player gets a slight boost of +10."
    }
  }else if(a.type === "controversial" && b.type === "humorous"){
    return {
      winner: (a.value > b.value * 2) ? "a" : "b",
      desc: "\"Controversial humor is the best type of humor\" - Sun Zoo. The humorous player has their card value doubled."
    }
  }else if(a.type === "intellectual" && b.type === "intellectual"){
    return {
      winner: (a.value < b.value) ? "a" : "b",
      desc: "Two scholars—\"based men of culture\"—join in a hearty but equitable debate, considering only the merits of their arguments."
    }
  }else if(a.type === "intellectual" && b.type === "wholesome"){
    return {
      winner: (a.value + 10 > b.value) ? "a" : "b",
      desc: "The intellectual player is immune to wholesome, mortal \"feelings;\" his sole drive is cold, pristine knowledge (and a slight boost of +10)."
    }
  }else if(a.type === "intellectual" && b.type === "random"){
    return {
      winner: (a.value > b.value * 1.5) ? "a" : "b",
      desc: "Despite the intellectual’s best-executed arguments, debating the random player is like trying to play chess with a pigeon; it knocks the pieces over, defecates on the board, and flies back to its flock to claim a multiplier of 1.5."
    }
  }else if(a.type === "intellectual" && b.type === "humorous"){
    return {
      winner: (a.value > b.value + 15) ? "a" : "b",
      desc: "The intellectual, though well-versed in Shakespeare, Latin, and metaphysics, is not as learned in “yo mama” comebacks and Gen Z slang, which give the humorous player a small boost of +15."
    }
  }else if(a.type === "wholesome" && b.type === "wholesome"){
    return {
      winner: "both",
      desc: "The two wholesome players share participation trophies, warm milk, and cookies."
    }
  }else if(a.type === "wholesome" && b.type === "random"){
    return {
      winner: (a.value + 15 > b.value) ? "a" : "b",
      desc: "The most wholesome rules with encouraging and cheerful messages, making the random seem like an irrelevant oddball and getting a small boost of +15."
    }
  }else if(a.type === "wholesome" && b.type === "humorous"){
    return {
      winner: (a.value > b.value + 20) ? "a" : "b",
      desc: "\"The best way to make people smile is a joke, not a compliment\" - Confucius. The humorous player gets a decent boost of +20."
    }
  }else if(a.type === "random" && b.type === "random"){
    var x = Math.random();
    return {
      winner: x > 0.5 ? "a" : "b",
      desc: "The two random players revert to their primal, chance-obsessed nature and use a coin toss to settle the duel."
    }
  }else if(a.type === "random" && b.type === "humorous"){
    return {
      winner: (a.value + 10 < b.value) ? "a" : "b",
      desc: "Humor is temporary, randomness is eternal. The random player gets a slight boost of +10."
    }
  }else if(a.type === "humorous" && b.type === "humorous"){
    return {
      winner: (a.value < b.value) ? "a" : "b",
      desc: "In a battle of wits, the two jokers engage in a comedic standoff to try and woo the audience."
    }
  }else{
    var outcome = determineWinner(b, a);
    if(outcome.winner === "a"){
      outcome.winner = "b";
    }else if(outcome.winner === "b"){
      outcome.winner = "a";
    }
    return outcome;
  }
}