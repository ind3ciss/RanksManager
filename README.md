# 📈 RanksManager

RanksManager est un bot Discord en **Discord.JS** permettant de gérer des groupes de rôles, d'attribuer ou retirer des rôles à des utilisateurs, et de maintenir une blacklist (BLR) pour empêcher certains membres d'obtenir des rôles. Il est conçu pour les serveurs ayant une gestion avancée des rangs et des permissions staff.

## ⚙️ Fonctionnalités

- **Gestion de groupes de rôles** : Créez des groupes de rôles avec des rôles utilisateurs et staff.
- **Commandes Slash** : `/rank`, `/derank`, `/grouplist`, `/blr`, `/help`...
- **Blacklist (BLR)** : Empêchez certains membres d'obtenir des rôles.
- **Permissions avancées** : Seuls les membres avec les rôles staff configurés peuvent attribuer/retirer des rôles de groupe.
- **Présence personnalisée** : Configurez le statut et l'activité du bot.

## 📚 Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/ind3ciss/RanksManager.git
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer le bot**
   - Renommez `.env.example` en `.env` (ou créez un fichier `.env`) et renseignez :
     ```
     TOKEN=TOKEN_DU_BOT
     APP_ID=ID_DU_BOT
     ```
   - Modifiez `config.json` pour personnaliser le statut du bot et l'ID de l'owner :
     ```json
     {
       "owner": "VOTRE_ID", // Votre ID de votre compte Discord
       "presence": {
         "status": "online", // Online/Idle/DND/Invisible
         "activity": {
           "name": "en train de gérer vos tickets !", // Votre statut
           "type": "Playing", // Playing = Joue à / Listening = Ecoute / Watching = Regarde / Custom = Statut perso / Streaming = En direct (twitch)
           "url": "https://twitch.tv/your_channel" // Pour le statut "Streaming"
         }
       }
     }
     ```
   - Modifiez `ranksGroup.json` pour définir vos groupes de rôles :
     ```json
     [
       {
         "name": "Nom du Groupe",
         "roles": ["ID_ROLE1", "ID_ROLE2"],
         "StaffRoles": ["ID_ROLE_STAFF"]
       }
     ]
     ```
   - (Optionnel) Ajoutez les IDs de rôles autorisés dans les fichiers de commandes (`blr.js`, `grouplist.js`).

4. **Déployer les commandes slash**
   ```bash
   node deploy-commands.js
   ```

5. **Lancer le bot**
   ```bash
   node index.js
   ```

## 📊 Commandes principales

- `/help [commande]` : Affiche l'aide générale ou celle d'une commande.
- `/addrole <utilisateur> <raison>` : Permet d'attribuer des rôles à un utilisateur.
- `/removerole <utilisateur> <raison>` : Permet de retirer des rôles à un utilisateur.
- `/blr add/remove/list` : Gère la blacklist des membres interdits de rang.
- `/rank <utilisateur> <raison>` : Attribue un ou plusieurs rôles d'un groupe à un utilisateur.
- `/derank <utilisateur> <raison>` : Retire un ou plusieurs rôles d'un groupe à un utilisateur.
- `/grouplist` : Liste tous les groupes de rôles et leurs rôles associés.

## 🛠️ Configuration avancée

- **Présence personnalisée** : Modifiez le champ `presence` dans `config.json`.
- **Rôles staff** : Définissez les IDs dans `StaffRoles` pour chaque groupe dans `ranksGroup.json`.
- **Blacklist** : Le fichier `blr.json` contient la liste des IDs blacklistés.

## 🔑 Dépendances

- [discord.js](https://discord.js.org/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- Node.js 18+

## ☎️ Serveur Support

Vous pouvez rejoindre notre serveur de support si vous avez un problème concernant notre bot avec ce lien : https://discord.gg/beachbots

## 🤍 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request pour proposer des améliorations.

> 🌊 Bot développé par [@indeciss](https://github.com/ind3ciss) pour la gestion avancée des rôles Discord.
