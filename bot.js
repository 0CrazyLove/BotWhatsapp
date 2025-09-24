const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class NekoBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "nekobot"
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.botName = '@NekoBot';
        this.imageStorage = this.loadImageStorage();
        this.processedMessages = new Set(); // Para evitar procesar mensajes duplicados
        this.setupEventHandlers();
    }

    // Cargar almacenamiento de imágenes
    loadImageStorage() {
        const storagePath = './image_storage.json';
        if (fs.existsSync(storagePath)) {
            try {
                const data = fs.readFileSync(storagePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading image storage:', error);
                return {};
            }
        }
        return {};
    }

    // Guardar almacenamiento de imágenes
    saveImageStorage() {
        try {
            fs.writeFileSync('./image_storage.json', JSON.stringify(this.imageStorage, null, 2));
        } catch (error) {
            console.error('Error saving image storage:', error);
        }
    }

    setupEventHandlers() {
        // Mostrar QR para conectar
        this.client.on('qr', (qr) => {
            console.log('Escanea este código QR con WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        // Bot listo
        this.client.on('ready', () => {
            console.log('NekoBot está listo!');
            console.log('Comandos disponibles:');
            console.log('- NekoBot save [nombre] (con imagen adjunta)');
            console.log('- NekoBot [nombre] @usuario');
            console.log('- NekoBot hi @usuario');
            console.log('- NekoBot list');
            console.log('- NekoBot help');
            console.log('');
            console.log('Para probar tus propios comandos, escríbelos en formato:');
            console.log('   "NekoBot help" o "@NekoBot help"');
        });

        // SOLUCIÓN: Usar solo el evento 'message_create' que captura TODOS los mensajes
        this.client.on('message_create', async (message) => {
            // Verificar si el mensaje ya fue procesado usando su ID
            if (message.id && this.processedMessages.has(message.id._serialized)) {
                console.log('Mensaje ya procesado, ignorando duplicado');
                return;
            }
            
            // Marcar mensaje como procesado
            if (message.id) {
                this.processedMessages.add(message.id._serialized);
                
                // Limpiar mensajes procesados antiguos (mantener solo los últimos 100)
                if (this.processedMessages.size > 100) {
                    const messagesToKeep = Array.from(this.processedMessages).slice(-100);
                    this.processedMessages = new Set(messagesToKeep);
                }
            }

            // Procesar el mensaje
            await this.handleMessage(message);
        });
    }

    async handleMessage(message) {
        // Ignorar si no hay body
        if (!message.body) return;
        
        const messageText = message.body.trim();
        const messageLower = messageText.toLowerCase();
        
        // Debug: imprimir todos los mensajes para ver qué está pasando
        console.log('Mensaje recibido:', messageText);
        console.log('De:', message.author || message.from);
        console.log('ID:', message.id?._serialized);
        
        // IMPORTANTE: No responder a mensajes que son claramente respuestas del bot
        if (messageText.startsWith('Bot') || 
            messageText.startsWith('Imagen guardada') || 
            messageText.startsWith('Hola') || 
            messageText.startsWith('Imágenes guardadas') ||
            messageText.startsWith('Error') ||
            messageText.startsWith('No entendí') ||
            messageText.includes('NekoBot - Comandos disponibles') ||
            messageText.includes('Tip: Guarda una imagen')) {
            console.log('Ignorando respuesta propia del bot');
            return;
        }
        
        // Solo responder si el mensaje menciona al bot
        if (!messageLower.includes('@nekobot') && !messageLower.includes('nekobot')) {
            return;
        }

        console.log('Mensaje para el bot detectado');

        try {
            // Comando para guardar imagen
            if (messageLower.includes('save ') && message.hasMedia) {
                console.log('Procesando comando save...');
                await this.saveImage(message);
            }
            // Comando hi con o sin mención
            else if (messageLower.includes('hi') || messageLower.includes('hello') || messageLower.includes('hola')) {
                console.log('Procesando saludo...');
                await this.sendGreeting(message);
            }
            // Comando para mostrar imagen guardada con mención
            else if (this.hasStoredImageCommand(messageLower)) {
                console.log('Procesando comando de imagen...');
                await this.sendStoredImage(message);
            }
            // Comando para listar imágenes
            else if (messageLower.includes('list')) {
                console.log('Procesando lista...');
                await this.listStoredImages(message);
            }
            // Comando de ayuda
            else if (messageLower.includes('help')) {
                console.log('Procesando ayuda...');
                await this.sendHelp(message);
            }
            // Si menciona el bot pero no reconoce comando
            else {
                console.log('Comando no reconocido, enviando ayuda...');
                await message.reply('No entendí el comando. Escribe "NekoBot help" para ver los comandos disponibles.');
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await message.reply('Ocurrió un error procesando tu comando.');
        }
    }

    // Guardar imagen con comando
    async saveImage(message) {
        const messageText = message.body.toLowerCase();
        const saveMatch = messageText.match(/save\s+(\w+)/);
        
        if (!saveMatch) {
            await message.reply('Uso: "NekoBot save [nombre]" (con imagen adjunta)');
            return;
        }

        const imageName = saveMatch[1];
        
        try {
            const media = await message.downloadMedia();
            
            // Crear directorio si no existe
            const mediaDir = './bot_media';
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir);
            }

            // Guardar archivo
            const fileName = `${imageName}.${media.mimetype.split('/')[1]}`;
            const filePath = path.join(mediaDir, fileName);
            
            const buffer = Buffer.from(media.data, 'base64');
            fs.writeFileSync(filePath, buffer);

            // Guardar referencia
            this.imageStorage[imageName] = {
                path: filePath,
                mimetype: media.mimetype,
                filename: fileName,
                savedAt: new Date().toISOString()
            };

            this.saveImageStorage();

            await message.reply(`Imagen guardada como "${imageName}"\nÚsala con: "NekoBot ${imageName} @usuario"`);

        } catch (error) {
            console.error('Error saving image:', error);
            await message.reply('Error guardando la imagen');
        }
    }

    // Enviar saludo con imagen
    async sendGreeting(message) {
        // Buscar menciones en el mensaje original (no en minúsculas)
        const mentionMatch = message.body.match(/@(\w+)/g);
        let targetUser = null;
        
        if (mentionMatch) {
            // Filtrar para excluir @nekobot
            targetUser = mentionMatch.find(m => !m.toLowerCase().includes('nekobot'));
        }
        
        const greetingText = targetUser ? 
            `Hola ${targetUser}!` : 
            'Hola!';

        // Buscar imagen de saludo
        if (this.imageStorage['hi'] || this.imageStorage['hello'] || this.imageStorage['greeting']) {
            const greetingImage = this.imageStorage['hi'] || this.imageStorage['hello'] || this.imageStorage['greeting'];
            await this.sendImageWithText(message, greetingImage, greetingText);
        } else {
            await message.reply(`${greetingText}\n\nTip: Guarda una imagen de saludo con:\n"NekoBot save hi" (adjunta imagen)`);
        }
    }

    // Verificar si hay comando de imagen guardada
    hasStoredImageCommand(messageText) {
        const words = messageText.toLowerCase().split(' ');
        return words.some(word => {
            const cleanWord = word.replace('@nekobot', '').replace('@', '').trim();
            return cleanWord && this.imageStorage.hasOwnProperty(cleanWord);
        });
    }

    // Enviar imagen guardada
    async sendStoredImage(message) {
        const messageText = message.body.toLowerCase();
        const words = messageText.split(' ');
        const mentionMatch = message.body.match(/@(\w+)/g);
        const targetUser = mentionMatch ? mentionMatch.find(m => !m.toLowerCase().includes('nekobot')) : null;

        // Encontrar comando de imagen
        let imageCommand = null;
        for (const word of words) {
            const cleanWord = word.replace('@nekobot', '').trim();
            if (this.imageStorage.hasOwnProperty(cleanWord)) {
                imageCommand = cleanWord;
                break;
            }
        }

        if (!imageCommand) {
            return;
        }

        const imageData = this.imageStorage[imageCommand];
        const responseText = targetUser ? 
            `${this.getActionText(imageCommand)} ${targetUser}!` : 
            `${imageCommand}!`;

        await this.sendImageWithText(message, imageData, responseText);
    }

    // Obtener texto de acción
    getActionText(command) {
        const actions = {
            'spank': 'Spanked',
            'hug': 'Abrazo para',
            'kiss': 'Beso para',
            'pat': 'Pat pat para',
            'poke': 'Poke para',
            'slap': 'Slap para',
            'bite': 'Mordida para',
            'kick': 'Patada para',
            'punch': 'Golpe para'
        };
        
        return actions[command] || `${command} para`;
    }

    // Enviar imagen con texto
    async sendImageWithText(message, imageData, text) {
        try {
            if (fs.existsSync(imageData.path)) {
                const media = MessageMedia.fromFilePath(imageData.path);
                await message.reply(media, null, { caption: text });
            } else {
                await message.reply(`${text}\n\nImagen no encontrada`);
            }
        } catch (error) {
            console.error('Error sending image:', error);
            await message.reply(text);
        }
    }

    // Listar imágenes guardadas
    async listStoredImages(message) {
        const images = Object.keys(this.imageStorage);
        
        if (images.length === 0) {
            await message.reply('No hay imágenes guardadas\n\nGuarda una con: "NekoBot save [nombre]"');
            return;
        }

        const imageList = images.map(name => `• ${name}`).join('\n');
        await message.reply(`Imágenes guardadas (${images.length}):\n\n${imageList}\n\nUso: "NekoBot [nombre] @usuario"`);
    }

    // Enviar ayuda
    async sendHelp(message) {
        const helpText = `**NekoBot - Comandos disponibles:**

**Guardar imagen:**
NekoBot save [nombre] (adjunta imagen)

**Usar imagen:**
NekoBot [nombre] @usuario

**Saludo:**
NekoBot hi @usuario

**Ver imágenes:**
NekoBot list

**Ayuda:**
NekoBot help

**Ejemplos:**
• NekoBot save spank
• NekoBot spank @juan
• NekoBot hi @maria

¡Diviértete usando el bot!`;

        await message.reply(helpText);
    }

    // Iniciar bot
    async start() {
        console.log('Iniciando NekoBot...');
        await this.client.initialize();
    }
}

// Inicializar y ejecutar bot
const bot = new NekoBot();
bot.start().catch(console.error);

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\nCerrando NekoBot...');
    process.exit(0);
});