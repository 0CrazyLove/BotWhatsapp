const BaseCommand = require('./BaseCommand');
const roleplayConfig = require('../config/roleplayConfig');
const logger = require('../utils/logger');

class RoleplayCommands extends BaseCommand {
    constructor(sock, storageService, apiService, conversionService) {
        super(sock, storageService);
        this.apiService = apiService;
        this.conversionService = conversionService;
        this.roleplayCommands = roleplayConfig;
    }

    async handleRoleplay(msg, command) {
        try {
            this.validateMessage(msg);

            // Verificar primero si hay media guardada
            const storage = this.storageService.loadMediaStorage();
            if (storage[command]) {
                logger.info(`Usando media guardada para: ${command}`);
                await this.sendStoredMedia(msg, command);
                return;
            }

            // Usar API para obtener GIF animado
            await this.sendRoleplayWithAPI(msg, command);
        } catch (error) {
            logger.error('Error en handleRoleplay:', error);
            throw error;
        }
    }

    async sendRoleplayWithAPI(msg, command) {
        const commandData = this.roleplayCommands[command];
        if (!commandData) {
            throw new Error(`Comando no encontrado: ${command}`);
        }

        try {
            logger.info(`Solicitando GIF para comando: ${command}`);
            const gifUrl = await this.apiService.getRandomGif(commandData.apis);
            logger.info(`URL obtenida: ${gifUrl}`);

            logger.info(`Convirtiendo GIF a MP4...`);
            const mp4Path = await this.conversionService.convertToMp4File(gifUrl);

            const fs = require('fs');
            if (!fs.existsSync(mp4Path)) {
                throw new Error('No se pudo crear el archivo MP4');
            }

            const buffer = fs.readFileSync(mp4Path);
            const fileSize = buffer.length;
            logger.info(`Enviando video MP4 (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

            await this.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: this.capitalizeFirst(command),
                gifPlayback: true,
                mimetype: 'video/mp4'
            });

            logger.info(`GIF enviado correctamente como MP4 animado`);

            // Limpiar archivo temporal
            fs.unlinkSync(mp4Path);

        } catch (error) {
            logger.error(`Error procesando GIF:`, error);
            await this.sendMessage(msg.key.remoteJid, {
                text: `Error al procesar el GIF para "${command}". Intenta de nuevo o guarda tu propio GIF con ".t savegif ${command}"`
            });
        }
    }

    isRoleplayCommand(command) {
        return this.roleplayCommands.hasOwnProperty(command);
    }
}

module.exports = RoleplayCommands;