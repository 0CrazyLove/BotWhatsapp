const MediaCommands = require('../commands/MediaCommands');
const RoleplayCommands = require('../commands/RoleplayCommands');
const HelpCommands = require('../commands/HelpCommands');
const logger = require('../utils/logger');

class CommandHandler {
    constructor(sock, storageService, apiService, conversionService) {
        this.sock = sock;
        this.storageService = storageService;
        
        // Inicializar comandos
        this.mediaCommands = new MediaCommands(sock, storageService);
        this.roleplayCommands = new RoleplayCommands(sock, storageService, apiService, conversionService);
        this.helpCommands = new HelpCommands(sock, storageService);
    }

    async handleCommand(msg, command, args) {
        try {
            logger.info(`Ejecutando comando: ${command} con args:`, args);
            
            const hasImage = !!msg.message.imageMessage;
            logger.info(`¿Tiene imagen adjunta?: ${hasImage}`);

            // COMANDOS SAVE - deben tener imagen adjunta
            if (command === 'save' || command === 'savegif') {
                if (!hasImage) {
                    await this.sock.sendMessage(msg.key.remoteJid, {
                        text: `**Uso correcto de .t save:**\n\n1. Selecciona una imagen\n2. Escribe como pie de foto: ".t save nombre"\n3. Envía el mensaje\n\nEjemplo: ".t save miimagen"`
                    });
                    return;
                }
                
                const mediaName = args[0];
                if (!mediaName) {
                    await this.sock.sendMessage(msg.key.remoteJid, {
                        text: `❌ **Falta el nombre:**\n\nUsa: ".t save nombre"\n\nEjemplo: ".t save gatito"`
                    });
                    return;
                }

                logger.info(`Guardando imagen como: ${mediaName}`);
                await this.mediaCommands.handleSave(msg, mediaName, command === 'savegif');
                return;
            }

            // Comandos de ayuda
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

            // Media guardada - ESTA ES LA PARTE IMPORTANTE
            if (await this.mediaCommands.hasStoredMedia(command)) {
                logger.info(`Enviando media guardada: ${command}`);
                await this.mediaCommands.sendStoredMedia(msg, command);
                return;
            }

            // Comando no reconocido
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Comando no reconocido: "${command}"\n\nUsa ".t help" para ver comandos disponibles.\nUsa ".t list" para ver imágenes guardadas.`
            });

        } catch (error) {
            logger.error('Error handling command:', error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error procesando el comando.'
            });
        }
    }
}

module.exports = CommandHandler;