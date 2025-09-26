const { useMultiFileAuthState, DisconnectReason, makeWASocket } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('../config/config');
const logger = require('../utils/logger');

class ConnectionManager {
    constructor() {
        this.authDirectory = config.bot.authDirectory;
    }

    async connect() {
        try {
            logger.info('Iniciando conexión con WhatsApp...');
            
            const { state, saveCreds } = await useMultiFileAuthState(this.authDirectory);
            
            const sock = makeWASocket({
                auth: state,
                printQRInTerminal: false
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));

            return sock;
        } catch (error) {
            logger.error('Error en ConnectionManager:', error);
            throw error;
        }
    }

    handleConnectionUpdate(update) {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            logger.info('QR generado — escanéalo:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            logger.info(`Conexión cerrada, código: ${code}`);

            if (code !== DisconnectReason.loggedOut) {
                logger.info('Reintentando conexión en 5 segundos...');
                setTimeout(() => this.connect(), 5000);
            } else {
                logger.error('Sesión cerrada desde el dispositivo. Borra la carpeta de autenticación y vuelve a escanear QR.');
            }
        }

        if (connection === 'open') {
            logger.info('✅ NekoBot conectado a WhatsApp!');
            this.logAvailableCommands();
        }
    }

    logAvailableCommands() {
        logger.info('\n========== COMANDOS DISPONIBLES ==========');
        logger.info('Activación del bot: .t [comando]');
        logger.info('==========================================\n');
    }
}

module.exports = ConnectionManager;