const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

        this.botTrigger = '.t';
        this.mediaStorage = this.loadMediaStorage();
        this.processedMessages = new Set();
        
        // Sistema de comandos de roleplay con APIs de GIFs REALES
        this.roleplayCommands = this.initializeRoleplayCommands();
        
        this.setupEventHandlers();
    }

    // Inicializar comandos de roleplay con APIs que devuelven GIFs animados
    initializeRoleplayCommands() {
        return {
            // Comandos de afecto
            hug: {
                apis: [
                    'https://nekos.best/api/v2/hug',
                    'https://api.otakugifs.xyz/gif?reaction=hug',
                    'https://g.tenor.com/v1/search?q=anime+hug+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            kiss: {
                apis: [
                    'https://nekos.best/api/v2/kiss',
                    'https://api.otakugifs.xyz/gif?reaction=kiss',
                    'https://g.tenor.com/v1/search?q=anime+kiss+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            pat: {
                apis: [
                    'https://nekos.best/api/v2/pat',
                    'https://api.otakugifs.xyz/gif?reaction=pat',
                    'https://g.tenor.com/v1/search?q=anime+headpat+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            cuddle: {
                apis: [
                    'https://nekos.best/api/v2/cuddle',
                    'https://api.otakugifs.xyz/gif?reaction=cuddle',
                    'https://g.tenor.com/v1/search?q=anime+cuddle+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            // Comandos de diversión
            poke: {
                apis: [
                    'https://nekos.best/api/v2/poke',
                    'https://api.otakugifs.xyz/gif?reaction=poke',
                    'https://g.tenor.com/v1/search?q=anime+poke+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            slap: {
                apis: [
                    'https://nekos.best/api/v2/slap',
                    'https://api.otakugifs.xyz/gif?reaction=slap',
                    'https://g.tenor.com/v1/search?q=anime+slap+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            bite: {
                apis: [
                    'https://nekos.best/api/v2/bite',
                    'https://api.otakugifs.xyz/gif?reaction=bite',
                    'https://g.tenor.com/v1/search?q=anime+bite+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            kick: {
                apis: [
                    'https://nekos.best/api/v2/kick',
                    'https://api.otakugifs.xyz/gif?reaction=kick',
                    'https://g.tenor.com/v1/search?q=anime+kick+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            // Comandos de saludo y emociones
            wave: {
                apis: [
                    'https://nekos.best/api/v2/wave',
                    'https://api.otakugifs.xyz/gif?reaction=wave',
                    'https://g.tenor.com/v1/search?q=anime+wave+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            dance: {
                apis: [
                    'https://nekos.best/api/v2/dance',
                    'https://api.otakugifs.xyz/gif?reaction=dance',
                    'https://g.tenor.com/v1/search?q=anime+dance+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            happy: {
                apis: [
                    'https://nekos.best/api/v2/happy',
                    'https://api.otakugifs.xyz/gif?reaction=happy',
                    'https://g.tenor.com/v1/search?q=anime+happy+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            wink: {
                apis: [
                    'https://nekos.best/api/v2/wink',
                    'https://api.otakugifs.xyz/gif?reaction=wink',
                    'https://g.tenor.com/v1/search?q=anime+wink+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            // Comandos adicionales
            smug: {
                apis: [
                    'https://nekos.best/api/v2/smug',
                    'https://api.otakugifs.xyz/gif?reaction=smug',
                    'https://g.tenor.com/v1/search?q=anime+smug+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            blush: {
                apis: [
                    'https://nekos.best/api/v2/blush',
                    'https://api.otakugifs.xyz/gif?reaction=blush',
                    'https://g.tenor.com/v1/search?q=anime+blush+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            cry: {
                apis: [
                    'https://nekos.best/api/v2/cry',
                    'https://api.otakugifs.xyz/gif?reaction=cry',
                    'https://g.tenor.com/v1/search?q=anime+cry+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            highfive: {
                apis: [
                    'https://nekos.best/api/v2/highfive',
                    'https://api.otakugifs.xyz/gif?reaction=highfive',
                    'https://g.tenor.com/v1/search?q=anime+highfive+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            nom: {
                apis: [
                    'https://nekos.best/api/v2/nom',
                    'https://api.otakugifs.xyz/gif?reaction=nom',
                    'https://g.tenor.com/v1/search?q=anime+nom+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            smile: {
                apis: [
                    'https://nekos.best/api/v2/smile',
                    'https://api.otakugifs.xyz/gif?reaction=smile',
                    'https://g.tenor.com/v1/search?q=anime+smile+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            bully: {
                apis: [
                    'https://nekos.best/api/v2/bully',
                    'https://g.tenor.com/v1/search?q=anime+bully+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            yeet: {
                apis: [
                    'https://nekos.best/api/v2/yeet',
                    'https://g.tenor.com/v1/search?q=anime+yeet+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            bonk: {
                apis: [
                    'https://nekos.best/api/v2/bonk',
                    'https://g.tenor.com/v1/search?q=anime+bonk+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            lick: {
                apis: [
                    'https://nekos.best/api/v2/lick',
                    'https://api.otakugifs.xyz/gif?reaction=lick',
                    'https://g.tenor.com/v1/search?q=anime+lick+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            kill: {
                apis: [
                    'https://nekos.best/api/v2/kill',
                    'https://g.tenor.com/v1/search?q=anime+kill+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            },
            cringe: {
                apis: [
                    'https://nekos.best/api/v2/cringe',
                    'https://g.tenor.com/v1/search?q=anime+cringe+gif&key=LIVDSRZULELA&limit=1'
                ],
                type: 'gif'
            }
        };
    }

    // Cargar almacenamiento de media (GIFs e imágenes)
    loadMediaStorage() {
        const storagePath = './media_storage.json';
        if (fs.existsSync(storagePath)) {
            try {
                const data = fs.readFileSync(storagePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error('Error loading media storage:', error);
                return {};
            }
        }
        return {};
    }

    // Guardar almacenamiento de media
    saveMediaStorage() {
        try {
            fs.writeFileSync('./media_storage.json', JSON.stringify(this.mediaStorage, null, 2));
        } catch (error) {
            console.error('Error saving media storage:', error);
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
            console.log('\n========== COMANDOS DISPONIBLES ==========');
            console.log('\nActivación del bot: .t [comando]');
            console.log('\nGestión de Media:');
            console.log('  .t save [nombre] (con imagen/GIF adjunto)');
            console.log('  .t savegif [nombre] (específico para GIFs)');
            console.log('  .t [nombre] @usuario');
            console.log('  .t list');
            
            console.log('\nComandos de roleplay (GIFs animados):');
            const roleplayList = Object.keys(this.roleplayCommands);
            const columns = 4;
            for (let i = 0; i < roleplayList.length; i += columns) {
                const row = roleplayList.slice(i, i + columns).map(cmd => cmd.padEnd(12)).join('');
                console.log('  ' + row);
            }
            
            console.log('\nGeneral:');
            console.log('  .t help');
            console.log('\n==========================================\n');
        });

        // Manejar mensajes
        this.client.on('message_create', async (message) => {
            // Control de duplicados
            if (message.id && this.processedMessages.has(message.id._serialized)) {
                return;
            }
            
            if (message.id) {
                this.processedMessages.add(message.id._serialized);
                
                if (this.processedMessages.size > 100) {
                    const messagesToKeep = Array.from(this.processedMessages).slice(-100);
                    this.processedMessages = new Set(messagesToKeep);
                }
            }

            await this.handleMessage(message);
        });
    }

    async handleMessage(message) {
        if (!message.body) return;
        
        const messageText = message.body.trim();
        
        // Solo responder si el mensaje empieza con .t
        if (!messageText.startsWith(this.botTrigger)) {
            return;
        }

        // Extraer el comando (quitar .t y espacios)
        const commandText = messageText.substring(2).trim();
        const commandLower = commandText.toLowerCase();
        const parts = commandLower.split(' ');
        const mainCommand = parts[0];

        console.log('Comando recibido:', commandText);

        try {
            // Comando para guardar media (imagen o GIF)
            if ((mainCommand === 'save' || mainCommand === 'savegif') && message.hasMedia) {
                await this.saveMedia(message, parts[1], mainCommand === 'savegif');
            }
            // Comandos de roleplay con API
            else if (this.roleplayCommands.hasOwnProperty(mainCommand)) {
                await this.handleRoleplayCommand(message, mainCommand);
            }
            // Comando para media guardada
            else if (this.mediaStorage.hasOwnProperty(mainCommand)) {
                await this.sendStoredMedia(message, mainCommand);
            }
            // Listar comandos
            else if (mainCommand === 'list') {
                await this.listCommands(message);
            }
            // Ayuda
            else if (mainCommand === 'help') {
                await this.sendHelp(message);
            }
            // Comando no reconocido
            else {
                await message.reply('Comando no reconocido. Usa ".t help" para ver los comandos disponibles.');
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await message.reply('Error procesando el comando.');
        }
    }

    // Manejar comando de roleplay
    async handleRoleplayCommand(message, command) {
        // Verificar primero si hay media guardada
        if (this.mediaStorage[command]) {
            console.log(`Usando media guardada para: ${command}`);
            await this.sendStoredMedia(message, command);
            return;
        }

        // Usar API para obtener GIF animado
        console.log(`Obteniendo GIF animado de API para: ${command}`);
        await this.sendRoleplayWithAPI(message, command);
    }

    // Obtener URL de GIF según la API
    extractGifUrl(apiUrl, data) {
        // Para nekos.best
        if (apiUrl.includes('nekos.best')) {
            if (data.results && data.results.length > 0) {
                // Priorizar formato GIF sobre estático
                return data.results[0].anime_gif || data.results[0].url;
            }
        }
        
        // Para otakugifs
        if (apiUrl.includes('otakugifs')) {
            return data.url;
        }
        
        // Para Tenor
        if (apiUrl.includes('tenor.com')) {
            if (data.results && data.results.length > 0) {
                // Obtener el GIF de mejor calidad
                const media = data.results[0].media[0];
                return media.gif?.url || media.mediumgif?.url || media.tinygif?.url;
            }
        }
        
        // Formato genérico
        return data.url || data.link || data.image || data.gif;
    }

    // Enviar roleplay con API (GIF animado)
    async sendRoleplayWithAPI(message, command) {
        const commandData = this.roleplayCommands[command];
        
        try {
            let gifUrl = null;
            
            for (const apiUrl of commandData.apis) {
                try {
                    console.log(`Intentando API: ${apiUrl}`);
                    const response = await axios.get(apiUrl, { 
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                    });
                    
                    gifUrl = this.extractGifUrl(apiUrl, response.data);
                    
                    if (gifUrl) {
                        // Verificar que sea un GIF animado
                        if (gifUrl.includes('.gif') || gifUrl.includes('tenor.com') || apiUrl.includes('gif')) {
                            console.log(`GIF encontrado: ${gifUrl}`);
                            break;
                        }
                    }
                } catch (apiError) {
                    console.log(`API ${apiUrl} falló:`, apiError.message);
                    continue;
                }
            }

            if (gifUrl) {
                try {
                    // Descargar y enviar el GIF animado
                    const media = await MessageMedia.fromUrl(gifUrl, { 
                        unsafeMime: true,
                        filename: `${command}.gif`
                    });
                    
                    // Forzar mimetype a GIF si es necesario
                    if (!media.mimetype.includes('gif') && gifUrl.includes('.gif')) {
                        media.mimetype = 'image/gif';
                    }
                    
                    // Enviar solo el GIF, sin texto
                    await message.reply(media);
                    console.log(`GIF animado de ${command} enviado exitosamente`);
                } catch (mediaError) {
                    console.error('Error descargando GIF:', mediaError);
                    await message.reply(`Error al cargar el GIF. Intenta de nuevo o guarda tu propio GIF con ".t savegif ${command}"`);
                }
            } else {
                console.log(`No se pudo obtener GIF para ${command}`);
                await message.reply(`No se pudo obtener el GIF animado. Puedes guardar uno propio con ".t savegif ${command}" (adjuntando un GIF)`);
            }

        } catch (error) {
            console.error(`Error en comando ${command}:`, error);
            await message.reply(`Error ejecutando ${command}. Inténtalo de nuevo.`);
        }
    }

    // Guardar media (imagen estática o GIF animado)
    async saveMedia(message, mediaName, forceGif = false) {
        if (!mediaName) {
            const tipo = forceGif ? 'GIF' : 'imagen/GIF';
            await message.reply(`Uso: ".t save${forceGif ? 'gif' : ''} [nombre]" (con ${tipo} adjunto)`);
            return;
        }

        try {
            const media = await message.downloadMedia();
            
            if (!media) {
                await message.reply('No se pudo descargar el archivo adjunto.');
                return;
            }

            // Verificar tipo de archivo
            const isGif = media.mimetype.includes('gif');
            const isVideo = media.mimetype.includes('video');
            const isImage = media.mimetype.includes('image');
            
            if (forceGif && !isGif && !isVideo) {
                await message.reply('Por favor adjunta un GIF animado o video corto.');
                return;
            }

            if (!isGif && !isVideo && !isImage) {
                await message.reply('Por favor adjunta una imagen, GIF o video corto.');
                return;
            }

            const mediaDir = './bot_media';
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir);
            }

            // Determinar extensión
            let extension = 'jpg';
            if (isGif) extension = 'gif';
            else if (isVideo) extension = 'mp4';
            else if (media.mimetype.includes('png')) extension = 'png';
            else if (media.mimetype.includes('jpeg') || media.mimetype.includes('jpg')) extension = 'jpg';
            else if (media.mimetype.includes('webp')) extension = 'webp';

            const fileName = `${mediaName}.${extension}`;
            const filePath = path.join(mediaDir, fileName);
            
            const buffer = Buffer.from(media.data, 'base64');
            fs.writeFileSync(filePath, buffer);

            this.mediaStorage[mediaName] = {
                path: filePath,
                mimetype: media.mimetype,
                filename: fileName,
                type: isGif || isVideo ? 'gif' : 'image',
                savedAt: new Date().toISOString()
            };

            this.saveMediaStorage();

            const isRoleplayCommand = this.roleplayCommands.hasOwnProperty(mediaName);
            const mediaType = isGif || isVideo ? 'GIF/Video' : 'Imagen';
            const message_text = isRoleplayCommand ? 
                `${mediaType} guardado como "${mediaName}". Tendrá prioridad sobre el GIF automático.` :
                `${mediaType} guardado como "${mediaName}".`;

            await message.reply(message_text);
            console.log(`Media guardada: ${mediaName} (${mediaType})`);

        } catch (error) {
            console.error('Error saving media:', error);
            await message.reply('Error guardando el archivo. Asegúrate de adjuntar una imagen o GIF.');
        }
    }

    // Enviar media guardada
    async sendStoredMedia(message, mediaName) {
        const mediaData = this.mediaStorage[mediaName];

        try {
            if (fs.existsSync(mediaData.path)) {
                const media = MessageMedia.fromFilePath(mediaData.path);
                // Solo enviar la media, sin texto
                await message.reply(media);
                console.log(`Media enviada: ${mediaName}`);
            } else {
                await message.reply(`Archivo no encontrado. El archivo puede haber sido eliminado.`);
            }
        } catch (error) {
            console.error('Error sending media:', error);
            await message.reply('Error enviando el archivo');
        }
    }

    // Listar comandos disponibles
    async listCommands(message) {
        const savedMedia = Object.keys(this.mediaStorage);
        const roleplayCommands = Object.keys(this.roleplayCommands);

        let response = '================ COMANDOS DISPONIBLES ================\n\n';

        response += '>> COMANDOS DE ROLEPLAY (GIFs animados) <<\n';
        response += '---------------------------------------------\n';
        
        // Organizar comandos por categorías
        const categories = {
            'Afecto': ['hug', 'kiss', 'pat', 'cuddle', 'lick'],
            'Acciones': ['poke', 'slap', 'bite', 'kick', 'bonk', 'bully', 'yeet', 'kill'],
            'Emociones': ['happy', 'smile', 'blush', 'cry', 'cringe', 'smug'],
            'Social': ['wave', 'dance', 'wink', 'highfive', 'nom']
        };

        for (const [category, commands] of Object.entries(categories)) {
            const availableCommands = commands.filter(cmd => roleplayCommands.includes(cmd));
            if (availableCommands.length > 0) {
                response += `\n[${category}]\n`;
                response += availableCommands.join(', ') + '\n';
            }
        }

        if (savedMedia.length > 0) {
            response += '\n\n>> MEDIA PERSONALIZADA <<\n';
            response += '---------------------------------------------\n';
            
            // Separar por tipo
            const gifs = savedMedia.filter(m => this.mediaStorage[m].type === 'gif');
            const images = savedMedia.filter(m => this.mediaStorage[m].type === 'image');
            
            if (gifs.length > 0) {
                response += '\n[GIFs/Videos]\n';
                response += gifs.join(', ') + '\n';
            }
            
            if (images.length > 0) {
                response += '\n[Imágenes]\n';
                response += images.join(', ') + '\n';
            }
        }

        response += '\n=====================================================\n';
        response += 'Uso: .t [comando] @usuario\n';
        response += 'Guardar: .t save [nombre] o .t savegif [nombre]\n';
        response += 'Ver ayuda: .t help';

        await message.reply(response);
    }

    // Ayuda
    async sendHelp(message) {
        const helpText = `==================== NEKOBOT AYUDA ====================

SINTAXIS BASICA:
  .t [comando] [@usuario]

COMANDOS PRINCIPALES:
  
  >> Gestión de Media:
  .t save [nombre]     - Guarda imagen o GIF
  .t savegif [nombre]  - Guarda específicamente GIF
  .t list              - Muestra todos los comandos
  .t help              - Muestra esta ayuda
  
  >> Roleplay (GIFs animados):
  .t kiss @usuario     - Envía GIF animado de beso
  .t hug @usuario      - Envía GIF animado de abrazo
  .t pat @usuario      - Envía GIF animado de caricias
  .t slap @usuario     - Envía GIF animado de cachetada
  
CARACTERISTICAS:
  - Soporta GIFs animados de anime
  - Soporta imágenes estáticas personalizadas
  - Los archivos guardados tienen prioridad
  - Múltiples APIs de respaldo para GIFs
  - Sin necesidad de mencionar al bot

EJEMPLOS DE USO:
  .t save foto         - Guarda una imagen estática
  .t savegif abrazo    - Guarda un GIF animado
  .t hug @juan         - Usa GIF animado de abrazo
  .t dance             - Acción sin mención
  .t list              - Ver todos los comandos

NOTA: Los comandos de roleplay usan GIFs animados de anime
      obtenidos de APIs especializadas.

========================================================`;

        await message.reply(helpText);
    }

    // Iniciar bot
    async start() {
        console.log('Iniciando NekoBot...');
        console.log('Configurado para responder a: .t [comando]');
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