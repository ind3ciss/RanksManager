const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Ajouter des rôles à un membre avec confirmation.')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('Utilisateur à modifier')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('raison')
                .setDescription('Raison de l\'ajout')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison');
        const member = await interaction.guild.members.fetch(target.id);

        // Filtrer les rôles que le bot peut gérer (pas gérés, pas @everyone, pas au-dessus du bot)
        const botMember = await interaction.guild.members.fetchMe();
        const availableRoles = interaction.guild.roles.cache
            .filter(r =>
                r.id !== interaction.guild.id &&
                !r.managed &&
                r.position < botMember.roles.highest.position
            )
            .map(role => ({
                label: role.name,
                value: role.id
            }))
            .slice(0, 25); // Limite Discord.js (25 max dans le select menu)

        if (!availableRoles.length) {
            return interaction.reply({ content: "Aucun rôle disponible à attribuer.", ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('addrole_select')
            .setPlaceholder('Sélectionne les rôles à ajouter')
            .setMinValues(1)
            .setMaxValues(availableRoles.length)
            .addOptions(availableRoles);

        const embed = new EmbedBuilder()
            .setTitle('Ajout de rôles')
            .setDescription(`Sélectionne les rôles à ajouter à <@${target.id}>.\n\n**Raison :** \`${reason}\``)
            .setColor("#03e3fc")
            .setThumbnail("https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png")
            .setFooter({ text: `🌊 BeachBots by @indeciss`, iconURL: `https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png` });

        await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(selectMenu)],
            ephemeral: true
        });

        // Collecteur pour le select menu
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'addrole_select' && i.user.id === interaction.user.id,
            time: 60000,
            max: 1
        });

        collector.on('collect', async selectInteraction => {
            const selectedRoleIds = selectInteraction.values;
            const selectedRoles = selectedRoleIds.map(rid => `- <@&${rid}>\n`).join(' ');

            // Embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setDescription(`## \`🎭\` Tu vas ajouter les rôles suivants à <@${target.id}> :\n\n${selectedRoles}### \`📜\` **Raison :** \`${reason}\`\n## \`⚠️\` Confirmer ?`)
                .setColor("#03e3fc")
                .setThumbnail("https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png")
                .setFooter({ text: `🌊 BeachBots by @indeciss`, iconURL: `https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png` });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('addrole_confirm')
                    .setLabel('Oui')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('addrole_cancel')
                    .setLabel('Non')
                    .setStyle(ButtonStyle.Danger)
            );

            await selectInteraction.update({
                embeds: [confirmEmbed],
                components: [buttons]
            });

            // Collecteur de boutons
            const btnCollector = selectInteraction.channel.createMessageComponentCollector({
                filter: btnI => ['addrole_confirm', 'addrole_cancel'].includes(btnI.customId) && btnI.user.id === interaction.user.id,
                time: 60000,
                max: 1
            });

            btnCollector.on('collect', async btnInteraction => {
                if (btnInteraction.customId === 'addrole_confirm') {
                    // Ajoute les rôles
                    try {
                        await member.roles.add(selectedRoleIds, `[/addrole] Ajouté par ${interaction.user.tag} : ${reason}`);
                        await btnInteraction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#393a41")
                                    .setDescription(`## \`✅\` Rôles ajoutés à <@${target.id}> :\n${selectedRoles}`)
                            ],
                            components: []
                        });
                    } catch (e) {
                        await btnInteraction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#393a41")
                                    .setDescription(`\`❌\` Erreur lors de l'ajout des rôles :\n\`${e.message}\``)
                            ],
                            components: []
                        });
                    }
                } else {
                    // Annulé
                    await btnInteraction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#393a41")
                                .setDescription(`\`❌\` Action annulée. Aucun rôle ajouté.`)
                        ],
                        components: []
                    });
                }
            });
        });

        collector.on('end', collected => {
            // Si aucune interaction, retire les menus
            if (!collected.size) {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#393a41")
                            .setDescription('⏰ Temps écoulé. Aucune sélection effectuée.')
                    ],
                    components: []
                }).catch(() => {});
            }
        });
    }
};
