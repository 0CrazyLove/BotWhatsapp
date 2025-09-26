const NekoBot = require('./src/bot/NekoBot');
const logger = require('./src/utils/logger');

// Manejo de errores globales
process.on('uncaughtException', (err) => {
    logger.error('Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Promesa rechazada no manejada:', err);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    logger.info('Cerrando NekoBot...');
    process.exit(0);
});

// Inicializar y ejecutar bot
async function main() {
    try {
        const bot = new NekoBot();
        await bot.start();
        logger.info('NekoBot iniciado correctamente');
    } catch (error) {
        logger.error('Error iniciando el bot:', error);
        process.exit(1);
    }
}

main();