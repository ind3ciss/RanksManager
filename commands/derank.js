const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ComponentType
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const GROUPS_FILE = path.resolve('./ranksGroup.json');

function readGroups() {
    if (!fs.existsSync(GROUPS_FILE)) return [];
    try {
        const text = fs.readFileSync(GROUPS_FILE, 'utf-8').trim();
        if (!text) return [];
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('derank')
        .setDescription('Retirer un ou plusieurs rôles de groupe à un utilisateur')
        .addUserOption(opt =>
            opt.setName('utilisateur')
                .setDescription('Utilisateur à modifier')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('raison')
                .setDescription('Raison du derank')
                .setRequired(true)
        ),
    usage: '/derank <@utilisateur>',
    permissions: 'Rôles autorisés',
    async execute(interaction) {
        // On ne check PLUS les perms Discord, seulement le JSON
        const target = interaction.options.getUser('utilisateur');
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({ content: "Utilisateur introuvable sur ce serveur.", ephemeral: true });
        }

        // Lecture groupes
        const groups = readGroups();

        // === Filtrage : seulement les groupes dont l'utilisateur a AU MOINS UN allowedRole ===
        const myRoleIds = interaction.member.roles.cache.map(r => r.id);
        const manageableGroups = groups.filter(group =>
            group.StaffRoles && group.StaffRoles.some(rid => myRoleIds.includes(rid))
        );

        if (!manageableGroups.length) {
            return interaction.reply({ content: "Aucun groupe de rôles que vous pouvez gérer.", ephemeral: true });
        }

        // Menu sélection du groupe
        const groupSelect = new StringSelectMenuBuilder()
            .setCustomId('derank_group')
            .setPlaceholder('Choisis un groupe de rôles')
            .addOptions(manageableGroups.map(g => ({
                label: g.name,
                value: g.name
            })));

        const row = new ActionRowBuilder().addComponents(groupSelect);

        let mainEmbed = new EmbedBuilder()
            .setDescription(`## Sélectionnez un groupe de rôles à retirer à <@${member.id}>`)
            .setColor("#393a41")
            .setThumbnail("https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png")
            .setFooter({ text: `🌊 BeachBots by @indeciss`, iconURL: `https://i.postimg.cc/K86SSL8j/b51a3959-0a27-4f8f-aed8-11950bdccf7c.png` });

        const msg = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            fetchReply: true
        });

        // 1. Collector sur le choix du groupe
        const groupCollector = msg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: i => i.user.id === interaction.user.id && i.customId === 'derank_group',
            time: 120_000,
            max: 1
        });

        groupCollector.on('collect', async selectInt => {
            const selectedGroupName = selectInt.values[0];
            const group = manageableGroups.find(g => g.name === selectedGroupName);

            if (!group || !group.roles.length) {
                return selectInt.update({
                    embeds: [mainEmbed.setDescription('Ce groupe ne contient aucun rôle.')],
                    components: []
                });
            }

            // Menu sélection des rôles du groupe (affiche SEULEMENT les rôles que le membre a)
            const roleOptions = group.roles
                .map(rid => {
                    const role = interaction.guild.roles.cache.get(rid);
                    if (!role) return null;
                    if (!member.roles.cache.has(role.id)) return null; // n'affiche que si membre a le rôle
                    return {
                        label: role.name,
                        value: role.id
                    };
                })
                .filter(Boolean);

            if (!roleOptions.length) {
                return selectInt.update({
                    embeds: [mainEmbed.setDescription(`<@${member.id}> n'a aucun rôle de ce groupe.`)],
                    components: []
                });
            }

            const roleSelect = new StringSelectMenuBuilder()
                .setCustomId('derank_roles')
                .setPlaceholder('Sélectionne le(s) rôle(s) à retirer')
                .setMinValues(1)
                .setMaxValues(roleOptions.length)
                .addOptions(roleOptions);

            const roleRow = new ActionRowBuilder().addComponents(roleSelect);

            mainEmbed
                .setDescription(
                    `### **${group.name}**\n\n> Rôles à retirer pour <@${member.id}> :\n${roleOptions.map(o => `- <@&${o.value}>`).join('\n')}`
                )
                .setColor("#393a41")
                .setFields([]);

            await selectInt.update({ embeds: [mainEmbed], components: [roleRow] });

            // 2. Collector sur les rôles à retirer
            const roleCollector = msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: i => i.user.id === interaction.user.id && i.customId === 'derank_roles',
                time: 120_000,
                max: 1
            });

            roleCollector.on('collect', async roleInt => {
                const selectedRoles = roleInt.values;

                // Affiche un récapitulatif + bouton confirmation
                mainEmbed
                    .setDescription(
                        `## Confirmer les rôles ci-dessous à retirer de <@${member.id}> :\n${selectedRoles.map(id => `- <@&${id}>`).join('\n')}`
                    )
                    .setColor("#393a41");

                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('derank_confirm').setLabel('Oui').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('derank_cancel').setLabel('Non').setStyle(ButtonStyle.Danger)
                );

                await roleInt.update({ embeds: [mainEmbed], components: [confirmRow] });

                // 3. Collector sur les boutons de confirmation
                const confirmCollector = msg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: i => i.user.id === interaction.user.id && ['derank_confirm', 'derank_cancel'].includes(i.customId),
                    time: 60_000,
                    max: 1
                });

                confirmCollector.on('collect', async btnInt => {
                    if (btnInt.customId === 'derank_confirm') {
                        // Retire les rôles sélectionnés
                        const toRemove = selectedRoles.filter(id => member.roles.cache.has(id));
                        try {
                            await member.roles.remove(toRemove);
                            mainEmbed
                                .setDescription(`## \`✅\` Rôles retirés à <@${member.id}> !`)
                                .setColor("#393a41");
                        } catch (e) {
                            mainEmbed.setDescription('❌ Une erreur est survenue lors du retrait des rôles.');
                        }
                        await btnInt.update({ embeds: [mainEmbed], components: [] });
                    } else {
                        await btnInt.update({
                            embeds: [mainEmbed.setDescription('❌ Action annulée.')],
                            components: []
                        });
                    }
                });
            });
        });
    }
};
