const logger = require('../utils/logger');

class BaseCommand {
    constructor(sock, storageService) {
        if (new.target === BaseCommand) {
            throw new Error("BaseCommand no puede ser instanciada directamente");
        }
        this.sock = sock;
        this.storageService = storageService;
    }

    async execute(msg, args = []) {
        throw new Error("Método execute debe ser implementado por subclases");
    }

    async sendMessage(jid, content) {
        try {
            await this.sock.sendMessage(jid, content);
        } catch (error) {
            logger.error('Error enviando mensaje:', error);
            throw error;
        }
    }

    validateMessage(msg) {
        if (!msg.key || !msg.key.remoteJid) {
            throw new Error('Mensaje inválido: falta remoteJid');
        }
        return true;
    }

    extractMentionedUser(text) {
        const mentionMatch = text.match(/@(\d+)/);
        return mentionMatch ? mentionMatch[1] + '@s.whatsapp.net' : null;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

module.exports = BaseCommand;