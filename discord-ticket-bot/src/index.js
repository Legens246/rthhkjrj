import "dotenv/config";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

const {
  DISCORD_TOKEN,
  GUILD_ID,
  BUG_CATEGORY_ID,
  SUPPORT_CATEGORY_ID,
  SUPPORT_ROLE_ID
} = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !BUG_CATEGORY_ID || !SUPPORT_CATEGORY_ID) {
  console.error(
    "Missing required env vars. Check .env.example and set DISCORD_TOKEN, GUILD_ID, BUG_CATEGORY_ID, SUPPORT_CATEGORY_ID."
  );
  process.exit(1);
}

const IDS = {
  openBugTicket: "open_bug_ticket",
  openSupportTicket: "open_support_ticket",
  closeTicket: "close_ticket",
  modalBug: "modal_bug_report",
  modalSupport: "modal_support_report"
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Отправить панель создания тикетов в текущий канал.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("close-ticket")
    .setDescription("Закрыть текущий тикет (для модерации/админов).")
].map((c) => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
    body: commands
  });
}

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle("Техподдержка")
    .setDescription(
      [
        "Выберите тип заявки ниже.",
        "",
        "**1) Краши / баги клиента**",
        "При создании отчета укажите:",
        "- Версию лаунчера",
        "- Версию Minecraft",
        "- Загрузчик (Fabric / Forge и т.д.)",
        "- Описание проблемы",
        "- Скриншот (если возможно)",
        "",
        "**2) Support**",
        "Для других вопросов: жалобы, наказания, доказательства и т.д."
      ].join("\n")
    )
    .setColor(0x2f3136);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.openBugTicket)
      .setLabel("Краши / баги клиента")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(IDS.openSupportTicket)
      .setLabel("Support")
      .setStyle(ButtonStyle.Primary)
  );

  return { embed, row };
}

function buildCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.closeTicket)
      .setLabel("Закрыть тикет")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function findExistingTicket(guild, userId, ticketType) {
  const channels = await guild.channels.fetch();
  return channels.find(
    (ch) =>
      ch &&
      ch.type === ChannelType.GuildText &&
      ch.topic &&
      ch.topic.includes(`ticket_owner:${userId}`) &&
      ch.topic.includes(`ticket_type:${ticketType}`)
  );
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\- ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
}

function canManageTicket(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  if (SUPPORT_ROLE_ID && member.roles.cache.has(SUPPORT_ROLE_ID)) return true;
  return false;
}

function parseTopic(topic = "") {
  const get = (key) => {
    const match = topic.match(new RegExp(`${key}:([^|]+)`));
    return match ? match[1] : null;
  };
  return {
    ownerId: get("ticket_owner"),
    type: get("ticket_type")
  };
}

client.once("ready", async () => {
  await registerCommands();
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket-panel") {
        const { embed, row } = buildTicketPanel();
        await interaction.reply({
          embeds: [embed],
          components: [row]
        });
        return;
      }

      if (interaction.commandName === "close-ticket") {
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: "Команда доступна только в текстовом тикет-канале.",
            ephemeral: true
          });
          return;
        }

        if (!canManageTicket(interaction.member)) {
          await interaction.reply({
            content: "Недостаточно прав для закрытия тикета.",
            ephemeral: true
          });
          return;
        }

        await interaction.reply("Тикет будет закрыт через 5 секунд...");
        setTimeout(async () => {
          await interaction.channel.delete("Ticket closed");
        }, 5000);
        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === IDS.openBugTicket) {
        const modal = new ModalBuilder()
          .setCustomId(IDS.modalBug)
          .setTitle("Заявка: Краши / баги клиента");

        const launcherVersion = new TextInputBuilder()
          .setCustomId("launcher_version")
          .setLabel("Версия лаунчера")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80);

        const mcVersion = new TextInputBuilder()
          .setCustomId("minecraft_version")
          .setLabel("Версия Minecraft")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80);

        const loader = new TextInputBuilder()
          .setCustomId("loader")
          .setLabel("Загрузчик (Fabric / Forge / и т.д.)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(80);

        const description = new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Описание проблемы")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

        const screenshot = new TextInputBuilder()
          .setCustomId("screenshot")
          .setLabel("Скриншот ссылкой (необязательно)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(300);

        modal.addComponents(
          new ActionRowBuilder().addComponents(launcherVersion),
          new ActionRowBuilder().addComponents(mcVersion),
          new ActionRowBuilder().addComponents(loader),
          new ActionRowBuilder().addComponents(description),
          new ActionRowBuilder().addComponents(screenshot)
        );

        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === IDS.openSupportTicket) {
        const modal = new ModalBuilder()
          .setCustomId(IDS.modalSupport)
          .setTitle("Заявка: Support");

        const reason = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Тема обращения")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(120);

        const details = new TextInputBuilder()
          .setCustomId("details")
          .setLabel("Описание ситуации")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1200);

        const proof = new TextInputBuilder()
          .setCustomId("proof")
          .setLabel("Доказательства (ссылки, если есть)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(300);

        modal.addComponents(
          new ActionRowBuilder().addComponents(reason),
          new ActionRowBuilder().addComponents(details),
          new ActionRowBuilder().addComponents(proof)
        );

        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === IDS.closeTicket) {
        if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
          await interaction.reply({
            content: "Эта кнопка работает только в тикет-канале.",
            ephemeral: true
          });
          return;
        }

        const topic = parseTopic(interaction.channel.topic || "");
        const isOwner = topic.ownerId && topic.ownerId === interaction.user.id;
        if (!isOwner && !canManageTicket(interaction.member)) {
          await interaction.reply({
            content: "Закрыть тикет может автор или модератор.",
            ephemeral: true
          });
          return;
        }

        await interaction.reply("Тикет будет закрыт через 5 секунд...");
        setTimeout(async () => {
          await interaction.channel.delete("Ticket closed");
        }, 5000);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (!interaction.guild) return;

      if (interaction.customId === IDS.modalBug) {
        const existing = await findExistingTicket(interaction.guild, interaction.user.id, "bug");
        if (existing) {
          await interaction.reply({
            content: `У тебя уже есть открытый тикет: ${existing}`,
            ephemeral: true
          });
          return;
        }

        const launcherVersion = interaction.fields.getTextInputValue("launcher_version");
        const minecraftVersion = interaction.fields.getTextInputValue("minecraft_version");
        const loader = interaction.fields.getTextInputValue("loader");
        const description = interaction.fields.getTextInputValue("description");
        const screenshot = interaction.fields.getTextInputValue("screenshot") || "Не указан";

        const channelName = `bug-${normalize(interaction.user.username)}`;
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: BUG_CATEGORY_ID,
          topic: `ticket_owner:${interaction.user.id}|ticket_type:bug`,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
              ]
            },
            ...(SUPPORT_ROLE_ID
              ? [
                  {
                    id: SUPPORT_ROLE_ID,
                    allow: [
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                      PermissionFlagsBits.ReadMessageHistory,
                      PermissionFlagsBits.ManageChannels
                    ]
                  }
                ]
              : [])
          ]
        });

        const embed = new EmbedBuilder()
          .setTitle("Новый баг-репорт")
          .setColor(0xed4245)
          .addFields(
            { name: "Пользователь", value: `<@${interaction.user.id}>` },
            { name: "Версия лаунчера", value: launcherVersion },
            { name: "Версия Minecraft", value: minecraftVersion },
            { name: "Загрузчик", value: loader },
            { name: "Описание проблемы", value: description },
            { name: "Скриншот", value: screenshot }
          )
          .setTimestamp();

        const rolePing = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : "@here";
        await ticketChannel.send({
          content: `${rolePing} новый тикет по клиенту.`,
          embeds: [embed],
          components: [buildCloseRow()]
        });

        await interaction.reply({
          content: `Тикет создан: ${ticketChannel}`,
          ephemeral: true
        });
        return;
      }

      if (interaction.customId === IDS.modalSupport) {
        const existing = await findExistingTicket(interaction.guild, interaction.user.id, "support");
        if (existing) {
          await interaction.reply({
            content: `У тебя уже есть открытый тикет: ${existing}`,
            ephemeral: true
          });
          return;
        }

        const reason = interaction.fields.getTextInputValue("reason");
        const details = interaction.fields.getTextInputValue("details");
        const proof = interaction.fields.getTextInputValue("proof") || "Не указано";

        const channelName = `support-${normalize(interaction.user.username)}`;
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: SUPPORT_CATEGORY_ID,
          topic: `ticket_owner:${interaction.user.id}|ticket_type:support`,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles
              ]
            },
            ...(SUPPORT_ROLE_ID
              ? [
                  {
                    id: SUPPORT_ROLE_ID,
                    allow: [
                      PermissionFlagsBits.ViewChannel,
                      PermissionFlagsBits.SendMessages,
                      PermissionFlagsBits.ReadMessageHistory,
                      PermissionFlagsBits.ManageChannels
                    ]
                  }
                ]
              : [])
          ]
        });

        const embed = new EmbedBuilder()
          .setTitle("Новый support-тикет")
          .setColor(0x5865f2)
          .addFields(
            { name: "Пользователь", value: `<@${interaction.user.id}>` },
            { name: "Тема", value: reason },
            { name: "Описание", value: details },
            { name: "Доказательства", value: proof }
          )
          .setTimestamp();

        const rolePing = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : "@here";
        await ticketChannel.send({
          content: `${rolePing} новый тикет поддержки.`,
          embeds: [embed],
          components: [buildCloseRow()]
        });

        await interaction.reply({
          content: `Тикет создан: ${ticketChannel}`,
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Произошла ошибка при обработке запроса.",
        ephemeral: true
      });
    }
  }
});

client.login(DISCORD_TOKEN);
