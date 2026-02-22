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
  SUPPORT_ROLE_ID,
  SUPPORT_USER_IDS
} =
  process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !BUG_CATEGORY_ID || !SUPPORT_CATEGORY_ID) {
  console.error(
    "Missing required env vars. Set DISCORD_TOKEN, GUILD_ID, BUG_CATEGORY_ID, SUPPORT_CATEGORY_ID."
  );
  process.exit(1);
}

const IDS = {
  openBugTicket: "open_bug_ticket",
  openSupportTicket: "open_support_ticket",
  closeTicket: "close_ticket",
  modalBug: "modal_bug_report",
  modalSupport: "modal_support_report",
  modalClose: "modal_close_ticket"
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
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
    new ButtonBuilder().setCustomId(IDS.closeTicket).setLabel("Закрыть тикет").setStyle(ButtonStyle.Secondary)
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
  const supportUserIds = (SUPPORT_USER_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (supportUserIds.includes(member.id)) return true;
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

async function resolveTicketCategoryId(guild, configuredId) {
  try {
    const ch = await guild.channels.fetch(configuredId);
    if (!ch) return null;
    if (ch.type === ChannelType.GuildCategory) return ch.id;
    if ("parentId" in ch && ch.parentId) return ch.parentId;
    return null;
  } catch (error) {
    return null;
  }
}

function ticketTypeLabel(type) {
  if (type === "bug") return "Краши / баги клиента";
  if (type === "support") return "Support";
  return "Неизвестно";
}

function getSupportUserIds(guild) {
  const fromEnv = (SUPPORT_USER_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const unique = new Set(fromEnv);
  if (guild?.ownerId) unique.add(guild.ownerId);
  return Array.from(unique);
}

function buildSupportOverwrites(guild) {
  const supportUsers = getSupportUserIds(guild);
  return supportUsers.map((id) => ({
    id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.ManageChannels
    ]
  }));
}

function cut(text, max = 1024) {
  const raw = String(text ?? "");
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 3)}...`;
}

async function showCloseReasonModal(interaction) {
  const modal = new ModalBuilder().setCustomId(IDS.modalClose).setTitle("Закрытие тикета");
  const reasonInput = new TextInputBuilder()
    .setCustomId("close_reason")
    .setLabel("Причина закрытия")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(700)
    .setPlaceholder("Например: не по форме, проблема решена, нарушитель наказан.");

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  await interaction.showModal(modal);
}

async function closeTicketWithReport(interaction, reason) {
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.editReply("Это действие доступно только в текстовом тикет-канале.");
    return;
  }

  const topic = parseTopic(channel.topic || "");
  if (!topic.ownerId) {
    await interaction.editReply("Не удалось определить владельца тикета.");
    return;
  }

  const ticketSummary = await getTicketSummary(channel, topic.type);

  let dmStatus = "не доставлен (закрыты ЛС или нет доступа)";
  try {
    const owner = await client.users.fetch(topic.ownerId);
    const dmEmbed = new EmbedBuilder()
      .setTitle("Ваш тикет закрыт")
      .setColor(0x57f287)
      .addFields(
        { name: "Сервер", value: interaction.guild?.name ?? "Неизвестно" },
        { name: "Тип тикета", value: ticketTypeLabel(topic.type) },
        { name: "Канал", value: `#${channel.name}` },
        { name: "Закрыл", value: `<@${interaction.user.id}>` },
        { name: "Причина", value: reason },
        { name: "Описание заявки", value: cut(ticketSummary, 1000) }
      )
      .setTimestamp();

    await owner.send({ embeds: [dmEmbed] });
    dmStatus = "отправлен";
  } catch (error) {
    console.error("Failed to DM ticket owner:", error);
  }

  await interaction.editReply("Тикет закрывается. Канал удалится через 8 секунд.");
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("Тикет закрыт")
        .setColor(0x5865f2)
        .addFields(
          { name: "Закрыл", value: `<@${interaction.user.id}>` },
          { name: "Причина", value: reason },
          { name: "Отчет в ЛС автору", value: dmStatus }
        )
        .setTimestamp()
    ]
  });

  setTimeout(async () => {
    try {
      await channel.delete(`Ticket closed by ${interaction.user.tag}`);
    } catch (error) {
      console.error("Failed to delete ticket channel:", error);
    }
  }, 8000);
}

async function getTicketSummary(channel, type) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const ticketMessage = messages.find(
      (m) =>
        m.author?.id === client.user.id &&
        m.embeds?.length > 0 &&
        (m.embeds[0].title === "Новый баг-репорт" || m.embeds[0].title === "Новый support-тикет")
    );

    if (!ticketMessage) return "Описание не найдено в текущем тикете.";

    const embed = ticketMessage.embeds[0];
    const fields = embed.fields ?? [];
    const getField = (name) => fields.find((f) => f.name === name)?.value ?? "Не указано";

    if (type === "bug") {
      return [
        `Версия лаунчера: ${getField("Версия лаунчера")}`,
        `Версия Minecraft: ${getField("Версия Minecraft")}`,
        `Загрузчик: ${getField("Загрузчик")}`,
        `Описание: ${getField("Описание проблемы")}`,
        `Скриншот: ${getField("Скриншот")}`
      ].join("\n");
    }

    if (type === "support") {
      return [
        `Тема: ${getField("Тема")}`,
        `Описание: ${getField("Описание")}`,
        `Доказательства: ${getField("Доказательства")}`
      ].join("\n");
    }

    return "Тип заявки не определен.";
  } catch (error) {
    console.error("Failed to get ticket summary:", error);
    return "Не удалось получить описание заявки.";
  }
}

client.once("clientReady", async () => {
  await registerCommands();
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket-panel") {
        const { embed, row } = buildTicketPanel();
        await interaction.reply({
          content: "Пробую отправить панель тикетов в этот канал...",
          ephemeral: true
        });

        if (!interaction.channel || !interaction.channel.isTextBased()) {
          await interaction.editReply("Не удалось определить текстовый канал для панели.");
          return;
        }

        try {
          await interaction.channel.send({ embeds: [embed], components: [row] });
          await interaction.editReply("Панель тикетов отправлена.");
        } catch (error) {
          console.error("Failed to post ticket panel:", error);
          await interaction.editReply(
            "Не смог отправить панель в канал. Проверь права бота: View Channels, Send Messages, Embed Links."
          );
        }
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

        await showCloseReasonModal(interaction);
        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === IDS.openBugTicket) {
        const modal = new ModalBuilder().setCustomId(IDS.modalBug).setTitle("Заявка: Краши / баги клиента");

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
          .setMaxLength(900);

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
        const modal = new ModalBuilder().setCustomId(IDS.modalSupport).setTitle("Заявка: Support");

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
          .setMaxLength(900);

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
        if (canManageTicket(interaction.member)) {
          await showCloseReasonModal(interaction);
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        await closeTicketWithReport(interaction, "Закрыто пользователем.");
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (!interaction.guild) return;
      await interaction.deferReply({ ephemeral: true });

      if (interaction.customId === IDS.modalBug) {
        const bugCategoryId = await resolveTicketCategoryId(interaction.guild, BUG_CATEGORY_ID);
        if (!bugCategoryId) {
          await interaction.editReply(
            "Не удалось найти категорию для bug-тикетов. Укажи ID категории или канал внутри категории в BUG_CATEGORY_ID."
          );
          return;
        }

        const existing = await findExistingTicket(interaction.guild, interaction.user.id, "bug");
        if (existing) {
          await interaction.editReply(`У тебя уже есть открытый тикет: ${existing}`);
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
          parent: bugCategoryId,
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
              : []),
            ...buildSupportOverwrites(interaction.guild)
          ]
        });

        const embed = new EmbedBuilder()
          .setTitle("Новый баг-репорт")
          .setColor(0xed4245)
          .addFields(
            { name: "Пользователь", value: `<@${interaction.user.id}>` },
            { name: "Версия лаунчера", value: cut(launcherVersion, 256) },
            { name: "Версия Minecraft", value: cut(minecraftVersion, 256) },
            { name: "Загрузчик", value: cut(loader, 256) },
            { name: "Описание проблемы", value: cut(description, 1000) },
            { name: "Скриншот", value: cut(screenshot, 1000) }
          )
          .setTimestamp();

        const rolePing = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : "@here";
        await ticketChannel.send({
          content: `${rolePing} новый тикет по клиенту.`,
          embeds: [embed],
          components: [buildCloseRow()]
        });

        await interaction.editReply(`Тикет создан: ${ticketChannel}`);
        return;
      }

      if (interaction.customId === IDS.modalSupport) {
        const supportCategoryId = await resolveTicketCategoryId(interaction.guild, SUPPORT_CATEGORY_ID);
        if (!supportCategoryId) {
          await interaction.editReply(
            "Не удалось найти категорию для support-тикетов. Укажи ID категории или канал внутри категории в SUPPORT_CATEGORY_ID."
          );
          return;
        }

        const existing = await findExistingTicket(interaction.guild, interaction.user.id, "support");
        if (existing) {
          await interaction.editReply(`У тебя уже есть открытый тикет: ${existing}`);
          return;
        }

        const reason = interaction.fields.getTextInputValue("reason");
        const details = interaction.fields.getTextInputValue("details");
        const proof = interaction.fields.getTextInputValue("proof") || "Не указано";

        const channelName = `support-${normalize(interaction.user.username)}`;
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: supportCategoryId,
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
              : []),
            ...buildSupportOverwrites(interaction.guild)
          ]
        });

        const embed = new EmbedBuilder()
          .setTitle("Новый support-тикет")
          .setColor(0x5865f2)
          .addFields(
            { name: "Пользователь", value: `<@${interaction.user.id}>` },
            { name: "Тема", value: cut(reason, 256) },
            { name: "Описание", value: cut(details, 1000) },
            { name: "Доказательства", value: cut(proof, 1000) }
          )
          .setTimestamp();

        const rolePing = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : "@here";
        await ticketChannel.send({
          content: `${rolePing} новый тикет поддержки.`,
          embeds: [embed],
          components: [buildCloseRow()]
        });

        await interaction.editReply(`Тикет создан: ${ticketChannel}`);
        return;
      }

      if (interaction.customId === IDS.modalClose) {
        const topic = parseTopic(interaction.channel?.topic || "");
        const isOwner = topic.ownerId && topic.ownerId === interaction.user.id;
        if (!isOwner && !canManageTicket(interaction.member)) {
          await interaction.editReply("Закрыть тикет может автор или модератор.");
          return;
        }

        const closeReason = interaction.fields.getTextInputValue("close_reason");
        await closeTicketWithReport(interaction, closeReason);
      }
    }
  } catch (error) {
    console.error(error);
    const errorText = error?.message ? String(error.message).slice(0, 180) : "Unknown error";
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `Произошла ошибка при обработке запроса: ${errorText}`,
        ephemeral: true
      });
    } else if (interaction.isRepliable() && interaction.deferred && !interaction.replied) {
      await interaction.editReply(`Произошла ошибка при обработке запроса: ${errorText}`);
    }
  }
});

client.login(DISCORD_TOKEN);
