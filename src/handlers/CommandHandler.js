const MediaCommands = require('../commands/MediaCommands');
const RoleplayCommands = require('../commands/RoleplayCommands');
const HelpCommands = require('../commands/HelpCommands');
const logger = require('../utils/logger');

class CommandHandler {
    constructor(sock, storageService, apiService, conversionService) {
        this.sock = sock;
        
        // Inicializar comandos
        this.mediaCommands = new MediaCommands(sock, storageService);
        this.roleplayCommands = new RoleplayCommands(sock, storageService, apiService, conversionService);
        this.helpCommands = new HelpCommands(sock, storageService);
    }

    async handleCommand(msg, command, args) {
        try {
            logger.info(`Ejecutando comando: ${command}`);

            // Comandos de media
            if (['save', 'savegif'].includes(command)) {
                await this.mediaCommands.handleSave(msg, args[0], command === 'savegif');
                return;
            }

            if (command === 'list') {
                await this.helpCommands.handleList(msg);
                return;
            }

            if (command === 'help') {
                await this.helpCommands.handleHelp(msg);
                return;
            }

            // Comandos de roleplay
            if (this.roleplayCommands.isRoleplayCommand(command)) {
                await this.roleplayCommands.handleRoleplay(msg, command);
                return;
            }

            // Media guardada
            if (await this.mediaCommands.hasStoredMedia(command)) {
                await this.mediaCommands.sendStoredMedia(msg, command);
                return;
            }

            // Comando no reconocido
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'Comando no reconocido. Usa ".t help" para ver los comandos disponibles.'
            });

        } catch (error) {
            logger.error('Error handling command:', error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'Error procesando el comando.'
            });
        }
    }
}

module.exports = CommandHandler;