const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActivityType
} = require("discord.js");

const Database = require("@replit/database");
const db = new Database();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= AYARLAR =================
const TOKEN = process.env.DISCORD_TOKEN; // TOKEN BURAYA YAZILMAZ
const SAHIP_ID = "1089450080643338282";
const DESTEK_LINKI = "https://discord.gg/kxbznWqZ66";
const RENK = "#5865F2";

// ================= KOMUTLAR =================
const commands = [
  new SlashCommandBuilder().setName("yardım").setDescription("Yardım menüsü"),
  new SlashCommandBuilder().setName("para").setDescription("Cüzdanını gör"),
  new SlashCommandBuilder().setName("günlük").setDescription("Günlük ödül al"),
  new SlashCommandBuilder().setName("çalış").setDescription("Çalış para kazan"),
  new SlashCommandBuilder().setName("invite").setDescription("Bot davet"),
  new SlashCommandBuilder().setName("bot").setDescription("Bot bilgileri"),
  new SlashCommandBuilder().setName("bakım")
    .setDescription("Bakım modu")
    .addStringOption(o =>
      o.setName("durum").setDescription("aç / kapat").setRequired(true)
    )
].map(c => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  client.user.setPresence({
    activities: [{ name: "/yardım", type: ActivityType.Listening }],
    status: "online"
  });

  console.log("✅ Bot hazır");
});

// ================= INTERACTION =================
client.on("interactionCreate", async interaction => {

  // ---- BAKIM MODU ----
  const bakim = await db.get("bakim") || "kapalı";
  if (
    interaction.isChatInputCommand() &&
    bakim === "açık" &&
    interaction.commandName !== "bakım" &&
    interaction.user.id !== SAHIP_ID
  ) {
    return interaction.reply({ content: "🛠 Bot şu anda bakımda.", ephemeral: true });
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  // PARA
  if (commandName === "para") {
    let para = await db.get(`para_${user.id}`) || 0;
    const embed = new EmbedBuilder()
      .setTitle("💳 Cüzdan")
      .setDescription(`Bakiyen: **${para} TL**`)
      .setColor(RENK);
    return interaction.reply({ embeds: [embed] });
  }

  // GÜNLÜK
  if (commandName === "günlük") {
    const cd = 86400000;
    const last = await db.get(`gunluk_${user.id}`) || 0;
    if (Date.now() - last < cd) {
      return interaction.reply({ content: "⏳ Günlük ödülünü zaten aldın.", ephemeral: true });
    }
    let para = await db.get(`para_${user.id}`) || 0;
    await db.set(`para_${user.id}`, para + 500);
    await db.set(`gunluk_${user.id}`, Date.now());
    return interaction.reply("✅ 500 TL cüzdanına eklendi!");
  }

  // ÇALIŞ
  if (commandName === "çalış") {
    const cd = 60000;
    const last = await db.get(`calis_${user.id}`) || 0;
    if (Date.now() - last < cd) {
      return interaction.reply({ content: "😴 Biraz dinlen.", ephemeral: true });
    }
    const kazanc = Math.floor(Math.random() * 200) + 100;
    let para = await db.get(`para_${user.id}`) || 0;
    await db.set(`para_${user.id}`, para + kazanc);
    await db.set(`calis_${user.id}`, Date.now());
    return interaction.reply(`💼 ${kazanc} TL kazandın!`);
  }

  // INVITE
  if (commandName === "invite") {
    const embed = new EmbedBuilder()
      .setTitle("🚀 AhetBot")
      .setDescription("Botu sunucuna ekle veya destek sunucumuza katıl")
      .setColor(RENK);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Botu Ekle")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`),
      new ButtonBuilder()
        .setLabel("Destek Sunucusu")
        .setStyle(ButtonStyle.Link)
        .setURL(DESTEK_LINKI)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // BOT
  if (commandName === "bot") {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Bilgileri")
      .setDescription("AhetBot\n7/24 Aktif\nDashboard yakında")
      .setColor(RENK);
    return interaction.reply({ embeds: [embed] });
  }

  // BAKIM
  if (commandName === "bakım") {
    if (user.id !== SAHIP_ID)
      return interaction.reply({ content: "⛔ Yetkin yok", ephemeral: true });

    const durum = interaction.options.getString("durum");
    await db.set("bakim", durum === "aç" ? "açık" : "kapalı");
    return interaction.reply(`🛠 Bakım modu **${durum}**`);
  }
});

client.login(TOKEN);