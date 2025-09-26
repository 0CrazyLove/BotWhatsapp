const config = require('../config/config');
const ConnectionManager = require('./ConnectionManager');
const MessageHandler = require('../handlers/MessageHandler');
const StorageService = require('../services/StorageService');
const ApiService = require('../services/ApiService');
const ConversionService = require('../services/ConversionService');
const logger = require('../utils/logger');

class NekoBot {
    constructor() {
        this.botTrigger = config.bot.trigger;
        this.processedMessages = new Set();
        
        // Inicializar servicios
        this.storageService = new StorageService();
        this.apiService = new ApiService();
        this.conversionService = new ConversionService();
        
        // Inicializar managers
        this.connectionManager = new ConnectionManager();
        this.messageHandler = null; // Se inicializa después de la conexión
    }

    async start() {
        try {
            logger.info('Iniciando NekoBot...');
            
            this.sock = await this.connectionManager.connect();
            
            // Inicializar message handler con la conexión establecida
            this.messageHandler = new MessageHandler(
                this.sock,
                this.botTrigger,
                this.processedMessages,
                this.storageService,
                this.apiService,
                this.conversionService
            );

            this.setupEventHandlers();
            
        } catch (error) {
            logger.error('Error starting bot:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg?.message || m.type !== 'notify') return;

            await this.messageHandler.handleMessage(msg);
        });
    }
}

module.exports = NekoBot;