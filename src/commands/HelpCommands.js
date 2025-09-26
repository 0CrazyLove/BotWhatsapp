const BaseCommand = require('./BaseCommand');
const logger = require('../utils/logger');

class HelpCommands extends BaseCommand {
    constructor(sock, storageService) {
        super(sock, storageService);
    }

    async handleHelp(msg) {
        try {
            this.validateMessage(msg);
            const helpText = this.generateHelpText();
            await this.sendMessage(msg.key.remoteJid, { text: helpText });
        } catch (error) {
            logger.error('Error en handleHelp:', error);
            throw error;
        }
    }

    async handleList(msg) {
        try {
            this.validateMessage(msg);
            const storage = this.storageService.loadMediaStorage();
            const savedMedia = Object.keys(storage);
            
            if (savedMedia.length === 0) {
                await this.sendMessage(msg.key.remoteJid, {
                    text: 'No hay imágenes guardadas.\nUso: ".t save [nombre]" con imagen adjunta'
                });
                return;
            }

            let response = `Imágenes guardadas (${savedMedia.length}):\n`;
            savedMedia.forEach(mediaName => {
                response += `• ${mediaName}\n`;
            });
            response += 'Uso: "NekoBot [nombre] @usuario"';

            await this.sendMessage(msg.key.remoteJid, { text: response });
        } catch (error) {
            logger.error('Error en handleList:', error);
            throw error;
        }
    }

    generateHelpText() {
        return `NEKOBOT - Guía de Comandos

SINTAXIS
.t [comando] [@usuario]

GESTIÓN DE MEDIA
.t save [nombre]     Guarda imagen o GIF
.t savegif [nombre]  Guarda específicamente GIF
.t list              Muestra todos los comandos disponibles
.t help              Muestra esta guía

ROLEPLAY
.t kiss @usuario     Envía GIF animado de beso
.t hug @usuario      Envía GIF animado de abrazo
.t pat @usuario      Envía GIF animado de caricias
.t slap @usuario     Envía GIF animado de cachetada

EJEMPLOS
.t save foto         Guarda una imagen estática
.t savegif abrazo    Guarda un GIF animado
.t hug @juan         Usa GIF animado de abrazo con mención
.t dance             Acción sin mención específica

Para ver la lista completa de comandos disponibles usa .t list`;
    }
}

module.exports = HelpCommands;