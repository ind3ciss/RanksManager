const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Retirer des rôles à un membre avec confirmation.')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('Utilisateur à modifier')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('raison')
                .setDescription('Raison du retrait')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison');
        const member = await interaction.guild.members.fetch(target.id);

        // Filtrer les rôles que le bot peut retirer (pas gérés, pas @everyone, pas au-dessus du bot, et QUE ceux que l'utilisateur possède)
        const botMember = await interaction.guild.members.fetchMe();
        const removableRoles = member.roles.cache
            .filter(r =>
                r.id !== interaction.guild.id &&
                !r.managed &&
                r.position < botMember.roles.highest.position
            )
            .map(role => ({
                label: role.name,
                value: role.id
            }))
            .slice(0, 25);

        if (!removableRoles.length) {
            return interaction.reply({ content: "Aucun rôle à retirer pour cet utilisateur.", ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('removerole_select')
            .setPlaceholder('Sélectionne les rôles à retirer')
            .setMinValues(1)
            .setMaxValues(removableRoles.length)
            .addOptions(removableRoles);

        const embed = new EmbedBuilder()
            .setTitle('Retrait de rôles')
            .setDescription(`Sélectionne les rôles à retirer à <@${target.id}>.\n\n**Raison :** \`${reason}\``)
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
            filter: i => i.customId === 'removerole_select' && i.user.id === interaction.user.id,
            time: 60000,
            max: 1
        });

        collector.on('collect', async selectInteraction => {
            const selectedRoleIds = selectInteraction.values;
            const selectedRoles = selectedRoleIds.map(rid => `- <@&${rid}>\n`).join(' ');

            // Embed de confirmation
            const confirmEmbed = new EmbedBuilder()
                .setDescription(`## \`🎭\` Tu vas retirer les rôles suivants à <@${target.id}> :\n\n${selectedRoles}### \`📜\` **Raison :** \`${reason}\`\n## \`⚠️\` Confirmer ?`)
                .setColor("#03e3fc")
                .setThumbnail("https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png")
                .setFooter({ text: `🌊 BeachBots by @indeciss`, iconURL: `https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png` });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('removerole_confirm')
                    .setLabel('Oui')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('removerole_cancel')
                    .setLabel('Non')
                    .setStyle(ButtonStyle.Danger)
            );

            await selectInteraction.update({
                embeds: [confirmEmbed],
                components: [buttons]
            });

            // Collecteur de boutons
            const btnCollector = selectInteraction.channel.createMessageComponentCollector({
                filter: btnI => ['removerole_confirm', 'removerole_cancel'].includes(btnI.customId) && btnI.user.id === interaction.user.id,
                time: 60000,
                max: 1
            });

            btnCollector.on('collect', async btnInteraction => {
                if (btnInteraction.customId === 'removerole_confirm') {
                    // Retire les rôles
                    try {
                        await member.roles.remove(selectedRoleIds, `[/removerole] Retiré par ${interaction.user.tag} : ${reason}`);
                        await btnInteraction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#393a41")
                                    .setDescription(`## \`✅\` Rôles retirés à <@${target.id}> :\n${selectedRoles}`)
                            ],
                            components: []
                        });
                    } catch (e) {
                        await btnInteraction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#393a41")
                                    .setDescription(`\`❌\` Erreur lors du retrait des rôles :\n\`${e.message}\``)
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
                                .setDescription(`\`❌\` Action annulée. Aucun rôle retiré.`)
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
