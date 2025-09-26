const CommandHandler = require('./CommandHandler');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');

class MediaHandler {
    constructor(sock, botTrigger, processedMessages, storageService, apiService, conversionService) {
        this.sock = sock;
        this.botTrigger = botTrigger;
        this.processedMessages = processedMessages;
        this.storageService = storageService;
        this.apiService = apiService;
        this.conversionService = conversionService;
        this.commandHandler = new CommandHandler(sock, storageService, apiService, conversionService);
    }

    async handleMessage(msg) {
        const msgId = msg.key.id;
        
        // Control de duplicados
        if (this.processedMessages.has(msgId)) {
            logger.debug(`Mensaje duplicado ignorado: ${msgId}`);
            return;
        }

        this.processedMessages.add(msgId);
        this.cleanProcessedMessages();

        // Extraer texto del mensaje - CORREGIDO para incluir caption de imágenes
        const text = this.extractMessageText(msg);
        const hasImage = !!msg.message.imageMessage;
        
        logger.info(`Mensaje recibido: "${text}" | ¿Tiene imagen?: ${hasImage}`);
        
        // Si tiene imagen Y texto que empieza con el trigger, es un comando save
        if (hasImage && text.startsWith(this.botTrigger)) {
            logger.info('Mensaje con imagen y comando detectado');
            const commandText = text.substring(this.botTrigger.length).trim();
            const commandLower = commandText.toLowerCase();
            const parts = commandLower.split(' ');
            const mainCommand = parts[0];
            const args = parts.slice(1);

            logger.info(`Procesando comando con imagen: "${mainCommand}", args:`, args);
            
            try {
                await this.commandHandler.handleCommand(msg, mainCommand, args);
            } catch (error) {
                logger.error('Error procesando comando con imagen:', error);
            }
            return;
        }

        // Si es solo texto con trigger, es un comando normal
        if (text.startsWith(this.botTrigger)) {
            const commandText = text.substring(this.botTrigger.length).trim();
            const commandLower = commandText.toLowerCase();
            const parts = commandLower.split(' ');
            const mainCommand = parts[0];
            const args = parts.slice(1);

            logger.info(`Comando de texto detectado: "${mainCommand}", args:`, args);

            try {
                await this.commandHandler.handleCommand(msg, mainCommand, args);
            } catch (error) {
                logger.error('Error en MediaHandler:', error);
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'Error procesando el comando.'
                });
            }
            return;
        }

        logger.debug('Mensaje no reconocido como comando, ignorando');
    }

    extractMessageText(msg) {
        // Buscar texto en diferentes partes del mensaje
        return msg.message.conversation ||
               msg.message.extendedTextMessage?.text ||
               msg.message.imageMessage?.caption || // ← ¡IMPORTANTE! Caption de imágenes
               msg.message.buttonsResponseMessage?.selectedDisplayText || '';
    }

    cleanProcessedMessages() {
        if (this.processedMessages.size > 100) {
            const messagesToKeep = Array.from(this.processedMessages).slice(-100);
            this.processedMessages.clear();
            messagesToKeep.forEach(msgId => this.processedMessages.add(msgId));
        }
    }
}

module.exports = MediaHandler;