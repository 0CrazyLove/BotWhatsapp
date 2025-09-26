const BaseCommand = require('./BaseCommand');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');

class MediaCommands extends BaseCommand {
    constructor(sock, storageService) {
        super(sock, storageService);
        this.botTrigger = '.t'; // Agregar el trigger aquí
    }

    async handleSave(msg, mediaName, forceGif = false) {
        try {
            logger.info(`Intentando guardar imagen como: "${mediaName}"`);
            
            this.validateMessage(msg);

            const imageMessage = msg.message.imageMessage;
            if (!imageMessage) {
                logger.error('No se encontró imageMessage en el mensaje');
                await this.sendMessage(msg.key.remoteJid, {
                    text: 'Error: No se detectó la imagen adjunta.'
                });
                return;
            }

            logger.info('Descargando media...');
            const buffer = await downloadMediaMessage(msg, 'buffer', {});
            
            if (!buffer) {
                logger.error('No se pudo descargar el buffer');
                await this.sendMessage(msg.key.remoteJid, {
                    text: 'Error descargando la imagen.'
                });
                return;
            }

            logger.info(`Buffer descargado: ${buffer.length} bytes`);

            const mimetype = imageMessage.mimetype || 'image/jpeg';
            logger.info(`Mimetype: ${mimetype}`);

            // Guardar la imagen
            const mediaInfo = this.storageService.saveMedia(mediaName, buffer, mimetype);
            
            // Actualizar almacenamiento
            const storage = this.storageService.loadMediaStorage();
            storage[mediaName] = mediaInfo;
            this.storageService.saveMediaStorage(storage);

            const mediaType = mimetype.includes('gif') || mimetype.includes('video') ? 'GIF/Video' : 'Imagen';
            const messageText = `${mediaType} guardado como: "${mediaName}"\n\nAhora puedes usar: ".t ${mediaName}"`;

            await this.sendMessage(msg.key.remoteJid, { text: messageText });
            logger.info(`Media guardada exitosamente: ${mediaName}`);

        } catch (error) {
            logger.error('Error en handleSave:', error);
            await this.sendMessage(msg.key.remoteJid, {
                text: 'Error guardando la imagen. Intenta de nuevo.'
            });
        }
    }

    async sendStoredMedia(msg, mediaName) {
        try {
            logger.info(`Intentando enviar media: "${mediaName}"`);
            
            this.validateMessage(msg);
            
            const storage = this.storageService.loadMediaStorage();
            const mediaData = storage[mediaName];

            if (!mediaData || !mediaData.filename) {
                logger.error(`Media no encontrada en almacenamiento: ${mediaName}`);
                await this.sendMessage(msg.key.remoteJid, {
                    text: `No se encontró "${mediaName}" en las imágenes guardadas.`
                });
                return;
            }

            const filePath = this.storageService.getMediaPath(mediaData);
            const fs = require('fs');
            
            if (!fs.existsSync(filePath)) {
                logger.error(`Archivo no existe: ${filePath}`);
                await this.sendMessage(msg.key.remoteJid, {
                    text: `El archivo de "${mediaName}" fue eliminado.`
                });
                return;
            }

            logger.info(`Enviando archivo: ${filePath}`);
            const buffer = fs.readFileSync(filePath);
            const mimetype = mediaData.mimetype;

            if (mimetype.includes('video') || mimetype.includes('gif')) {
                await this.sendMessage(msg.key.remoteJid, {
                    video: buffer,
                    mimetype: mimetype,
                    gifPlayback: mimetype.includes('gif')
                });
            } else {
                await this.sendMessage(msg.key.remoteJid, {
                    image: buffer,
                    mimetype: mimetype
                });
            }

            logger.info(`Media enviada: ${mediaName}`);

        } catch (error) {
            logger.error('Error en sendStoredMedia:', error);
            await this.sendMessage(msg.key.remoteJid, {
                text: 'Error enviando la imagen.'
            });
        }
    }

    async hasStoredMedia(mediaName) {
        const storage = this.storageService.loadMediaStorage();
        const exists = storage.hasOwnProperty(mediaName);
        logger.info(`Verificando si existe "${mediaName}": ${exists}`);
        return exists;
    }
}

module.exports = MediaCommands;