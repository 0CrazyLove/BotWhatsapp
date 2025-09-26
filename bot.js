const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const qrcode = require('qrcode-terminal');

// Configurar FFmpeg
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic);

const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');

class NekoBot {
    constructor() {
        this.botTrigger = '.t';
        this.mediaStorage = this.loadMediaStorage();
        this.processedMessages = new Set();

        // Sistema de comandos de roleplay con APIs de GIFs REALES
        this.roleplayCommands = this.initializeRoleplayCommands();
        this.sock = null;
    }

    // Inicializar comandos de roleplay con APIs que devuelven GIFs animados
    initializeRoleplayCommands() {
        return {
            // Comandos de afecto
            hug: {
                apis: [
                    'https://nekos.best/api/v2/hug',
                    'https://api.otakugifs.xyz/gif?reaction=hug'
                ],
                type: 'gif'
            },
            kiss: {
                apis: [
                    'https://nekos.best/api/v2/kiss',
                    'https://api.otakugifs.xyz/gif?reaction=kiss'
                ],
                type: 'gif'
            },
            pat: {
                apis: [
                    'https://nekos.best/api/v2/pat',
                    'https://api.otakugifs.xyz/gif?reaction=pat'
                ],
                type: 'gif'
            },
            cuddle: {
                apis: [
                    'https://nekos.best/api/v2/cuddle',
                    'https://api.otakugifs.xyz/gif?reaction=cuddle'
                ],
                type: 'gif'
            },
            // Comandos de diversión
            poke: {
                apis: [
                    'https://nekos.best/api/v2/poke',
                    'https://api.otakugifs.xyz/gif?reaction=poke'
                ],
                type: 'gif'
            },
            slap: {
                apis: [
                    'https://nekos.best/api/v2/slap',
                    'https://api.otakugifs.xyz/gif?reaction=slap'
                ],
                type: 'gif'
            },
            bite: {
                apis: [
                    'https://nekos.best/api/v2/bite',
                    'https://api.otakugifs.xyz/gif?reaction=bite'
                ],
                type: 'gif'
            },
            kick: {
                apis: [
                    'https://nekos.best/api/v2/kick',
                    'https://api.otakugifs.xyz/gif?reaction=kick'
                ],
                type: 'gif'
            },
            // Comandos de saludo y emociones
            wave: {
                apis: [
                    'https://nekos.best/api/v2/wave',
                    'https://api.otakugifs.xyz/gif?reaction=wave'
                ],
                type: 'gif'
            },
            dance: {
                apis: [
                    'https://nekos.best/api/v2/dance',
                    'https://api.otakugifs.xyz/gif?reaction=dance'
                ],
                type: 'gif'
            },
            happy: {
                apis: [
                    'https://nekos.best/api/v2/happy',
                    'https://api.otakugifs.xyz/gif?reaction=happy'
                ],
                type: 'gif'
            },
            wink: {
                apis: [
                    'https://nekos.best/api/v2/wink',
                    'https://api.otakugifs.xyz/gif?reaction=wink'
                ],
                type: 'gif'
            },
            // Comandos adicionales
            smug: {
                apis: [
                    'https://nekos.best/api/v2/smug',
                    'https://api.otakugifs.xyz/gif?reaction=smug'
                ],
                type: 'gif'
            },
            blush: {
                apis: [
                    'https://nekos.best/api/v2/blush',
                    'https://api.otakugifs.xyz/gif?reaction=blush'
                ],
                type: 'gif'
            },
            cry: {
                apis: [
                    'https://nekos.best/api/v2/cry',
                    'https://api.otakugifs.xyz/gif?reaction=cry'
                ],
                type: 'gif'
            },
            highfive: {
                apis: [
                    'https://nekos.best/api/v2/highfive',
                    'https://api.otakugifs.xyz/gif?reaction=highfive'
                ],
                type: 'gif'
            },
            nom: {
                apis: [
                    'https://nekos.best/api/v2/nom',
                    'https://api.otakugifs.xyz/gif?reaction=nom'
                ],
                type: 'gif'
            },
            smile: {
                apis: [
                    'https://nekos.best/api/v2/smile',
                    'https://api.otakugifs.xyz/gif?reaction=smile'
                ],
                type: 'gif'
            },
            bully: {
                apis: [
                    'https://nekos.best/api/v2/bully'
                ],
                type: 'gif'
            },
            yeet: {
                apis: [
                    'https://nekos.best/api/v2/yeet'
                ],
                type: 'gif'
            },
            bonk: {
                apis: [
                    'https://nekos.best/api/v2/bonk'
                ],
                type: 'gif'
            },
            lick: {
                apis: [
                    'https://nekos.best/api/v2/lick',
                    'https://api.otakugifs.xyz/gif?reaction=lick'
                ],
                type: 'gif'
            },
            kill: {
                apis: [
                    'https://nekos.best/api/v2/kill'
                ],
                type: 'gif'
            },
            cringe: {
                apis: [
                    'https://nekos.best/api/v2/cringe'
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

    // Función para obtener GIF aleatorio de APIs (del bot 2)
    async getRandomGif(apis) {
        const randomApi = apis[Math.floor(Math.random() * apis.length)];
        const res = await axios.get(randomApi, { timeout: 10000 });

        if (randomApi.includes('nekos.best')) return res.data.results[0].url;
        if (randomApi.includes('otakugifs.xyz')) return res.data.url;
        if (res.data && res.data.url) return res.data.url;

        throw new Error('Respuesta API inesperada');
    }

    // Función para convertir GIF a MP4 (del bot 2)
    async convertToMp4File(url) {
        const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const tmpInPath = path.join(tmpdir(), `in-${uid}`);
        const tmpOutPath = path.join(tmpdir(), `out-${uid}.mp4`);

        try {
            const res = await axios({ method: 'GET', url, responseType: 'stream' });

            // Escribir el archivo de entrada
            const writer = fs.createWriteStream(tmpInPath);
            res.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Convertir a MP4 optimizado para WhatsApp
            await new Promise((resolve, reject) => {
                ffmpeg(tmpInPath)
                    .inputOptions(['-ignore_loop 0']) // Forzar loop infinito para GIFs
                    .outputOptions([
                        '-movflags +faststart',
                        '-pix_fmt yuv420p',
                        '-vf scale=480:-2:flags=lanczos',
                        '-c:v libx264',
                        '-preset veryfast',
                        '-crf 25',
                        '-r 15', // Reducir framerate para mejor compatibilidad
                        '-an', // Sin audio
                        '-loop 0', // Loop infinito (importante para GIFs)
                        '-t 10', // Máximo 10 segundos
                        '-max_muxing_queue_size 1024'
                    ])
                    .format('mp4')
                    .on('start', (cmd) => console.log('Convirtiendo GIF a MP4...'))
                    .on('error', (err) => {
                        console.error('Error en conversión:', err);
                        reject(err);
                    })
                    .on('end', () => {
                        console.log('Conversión completada');
                        resolve();
                    })
                    .save(tmpOutPath);
            });

            return tmpOutPath;
        } finally {
            // Limpiar archivo temporal de entrada si existe
            if (fs.existsSync(tmpInPath)) {
                fs.unlinkSync(tmpInPath);
            }
        }
    }

    // Manejar mensajes
    async handleMessage(msg) {
        // Control de duplicados
        const msgId = msg.key.id;
        if (this.processedMessages.has(msgId)) {
            return;
        }

        this.processedMessages.add(msgId);

        if (this.processedMessages.size > 100) {
            const messagesToKeep = Array.from(this.processedMessages).slice(-100);
            this.processedMessages = new Set(messagesToKeep);
        }

        const text = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.buttonsResponseMessage?.selectedDisplayText || '';

        if (!text.startsWith(this.botTrigger)) return;

        // Extraer el comando (quitar .t y espacios)
        const commandText = text.substring(2).trim();
        const commandLower = commandText.toLowerCase();
        const parts = commandLower.split(' ');
        const mainCommand = parts[0];

        console.log('Comando recibido:', commandText);

        try {
            // Comando para guardar media (imagen o GIF)
            if ((mainCommand === 'save' || mainCommand === 'savegif') && msg.message.imageMessage) {
                await this.saveMedia(msg, parts[1], mainCommand === 'savegif');
            }
            // Comandos de roleplay con API
            else if (this.roleplayCommands.hasOwnProperty(mainCommand)) {
                await this.handleRoleplayCommand(msg, mainCommand);
            }
            // Comando para media guardada
            else if (this.mediaStorage.hasOwnProperty(mainCommand)) {
                await this.sendStoredMedia(msg, mainCommand);
            }
            // Listar comandos
            else if (mainCommand === 'list') {
                await this.listCommands(msg);
            }
            // Ayuda - CORREGIDO: cambiar sendHelp para usar sock.sendMessage
            else if (mainCommand === 'help') {
                await this.sendHelp(msg);
            }
            // Comando no reconocido
            else {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'Comando no reconocido. Usa ".t help" para ver los comandos disponibles.'
                });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'Error procesando el comando.'
            });
        }
    }

    // Manejar comando de roleplay
    async handleRoleplayCommand(msg, command) {
        // Verificar primero si hay media guardada
        if (this.mediaStorage[command]) {
            console.log(`Usando media guardada para: ${command}`);
            await this.sendStoredMedia(msg, command);
            return;
        }

        // Usar API para obtener GIF animado (método del bot 2)
        console.log(`Obteniendo GIF animado de API para: ${command}`);
        await this.sendRoleplayWithAPI(msg, command);
    }

    // Enviar roleplay con API (método del bot 2 mejorado)
    async sendRoleplayWithAPI(msg, command) {
        const commandData = this.roleplayCommands[command];

        try {
            console.log(`Solicitando GIF para comando: ${command}`);
            const gifUrl = await this.getRandomGif(commandData.apis);
            console.log(`URL obtenida: ${gifUrl}`);

            console.log(`Convirtiendo GIF a MP4...`);
            const mp4Path = await this.convertToMp4File(gifUrl);

            if (!fs.existsSync(mp4Path)) {
                throw new Error('No se pudo crear el archivo MP4');
            }

            const buffer = fs.readFileSync(mp4Path);
            const fileSize = buffer.length;
            console.log(`Enviando video MP4 (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

            await this.sock.sendMessage(msg.key.remoteJid, {
                video: buffer,
                caption: `${command.charAt(0).toUpperCase() + command.slice(1)}`,
                gifPlayback: true, // Crucial para que WhatsApp lo muestre como GIF
                mimetype: 'video/mp4'
            });

            console.log(`GIF enviado correctamente como MP4 animado`);

            // Limpiar archivo temporal
            fs.unlinkSync(mp4Path);

        } catch (error) {
            console.error(`Error procesando GIF:`, error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: `Error al procesar el GIF para "${command}". Intenta de nuevo o guarda tu propio GIF con ".t savegif ${command}"`
            });
        }
    }

    // Guardar media - CORREGIDO: directorio bot_media
    async saveMedia(msg, mediaName, forceGif = false) {
        if (!mediaName) {
            const tipo = forceGif ? 'GIF' : 'imagen/GIF';
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: `Uso: ".t save${forceGif ? 'gif' : ''} [nombre]" (con ${tipo} adjunto)`
            });
            return;
        }

        try {
            const imageMessage = msg.message.imageMessage;
            if (!imageMessage) {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'No se encontró imagen adjunta.'
                });
                return;
            }

            // Descargar el archivo usando Baileys
            const buffer = await downloadMediaMessage(msg, 'buffer', {});

            if (!buffer) {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'No se pudo descargar el archivo adjunto.'
                });
                return;
            }

            // Verificar tipo de archivo basado en mimetype
            const mimetype = imageMessage.mimetype || 'image/jpeg';
            const isGif = mimetype.includes('gif');
            const isVideo = mimetype.includes('video');
            const isImage = mimetype.includes('image');

            if (forceGif && !isGif && !isVideo) {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'Por favor adjunta un GIF animado o video corto.'
                });
                return;
            }

            if (!isGif && !isVideo && !isImage) {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: 'Por favor adjunta una imagen, GIF o video corto.'
                });
                return;
            }

            // CAMBIO: Crear directorio bot_media si no existe
            const mediaDir = './bot_media';
            if (!fs.existsSync(mediaDir)) {
                fs.mkdirSync(mediaDir);
            }

            // Determinar extensión
            let extension = 'jpg';
            if (isGif) extension = 'gif';
            else if (isVideo) extension = 'mp4';
            else if (mimetype.includes('png')) extension = 'png';
            else if (mimetype.includes('jpeg') || mimetype.includes('jpg')) extension = 'jpg';
            else if (mimetype.includes('webp')) extension = 'webp';

            const fileName = `${mediaName}.${extension}`;
            const filePath = path.join(mediaDir, fileName);

            // Guardar archivo físicamente
            fs.writeFileSync(filePath, buffer);

            // Actualizar storage
            this.mediaStorage[mediaName] = {
                path: filePath,
                mimetype: mimetype,
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

            await this.sock.sendMessage(msg.key.remoteJid, { text: message_text });
            console.log(`Media guardada: ${mediaName} (${mediaType})`);

        } catch (error) {
            console.error('Error saving media:', error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'Error guardando el archivo. Asegúrate de adjuntar una imagen o GIF.'
            });
        }
    }

    // Enviar media guardada
    async sendStoredMedia(msg, mediaName) {
        const mediaData = this.mediaStorage[mediaName];

        try {
            if (mediaData.path && fs.existsSync(mediaData.path)) {
                const buffer = fs.readFileSync(mediaData.path);
                const mimetype = mediaData.mimetype;

                if (mimetype.includes('video') || mimetype.includes('gif')) {
                    // Enviar como video/GIF
                    await this.sock.sendMessage(msg.key.remoteJid, {
                        video: buffer,
                        mimetype: mimetype,
                        gifPlayback: mimetype.includes('gif')
                    });
                } else {
                    // Enviar como imagen
                    await this.sock.sendMessage(msg.key.remoteJid, {
                        image: buffer,
                        mimetype: mimetype
                    });
                }
                console.log(`Media enviada: ${mediaName}`);
            } else {
                await this.sock.sendMessage(msg.key.remoteJid, {
                    text: `Archivo no encontrado. El archivo puede haber sido eliminado.`
                });
            }
        } catch (error) {
            console.error('Error sending media:', error);
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'Error enviando el archivo'
            });
        }
    }

    // CORREGIDO: Listar comandos - formato simplificado como solicitas
    async listCommands(msg) {
        const savedMedia = Object.keys(this.mediaStorage);

        if (savedMedia.length === 0) {
            await this.sock.sendMessage(msg.key.remoteJid, {
                text: 'No hay imágenes guardadas.\nUso: ".t save [nombre]" con imagen adjunta'
            });
            return;
        }

        let response = `Imágenes guardadas (${savedMedia.length}):\n`;

        // Agregar cada imagen con bullet point
        for (const mediaName of savedMedia) {
            response += `• ${mediaName}\n`;
        }

        response += 'Uso: "NekoBot [nombre] @usuario"';

        await this.sock.sendMessage(msg.key.remoteJid, { text: response });
    }

    // CORREGIDO: Ayuda - formato sin líneas en blanco extra
    async sendHelp(msg) {
        const helpText = `NEKOBOT - Guía de Comandos

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

        await this.sock.sendMessage(msg.key.remoteJid, { text: helpText });
    }

    // Iniciar bot
    async start() {
        console.log('Iniciando NekoBot con Baileys...');
        console.log('Configurado para responder a: .t [comando]');

        if (ffmpegStatic) {
            console.log('FFmpeg detectado - Conversión GIF→MP4 habilitada');
        } else {
            console.log('FFmpeg no disponible - Bot no funcionará correctamente');
            return;
        }

        const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');

        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', (update) => {
            const { qr, connection, lastDisconnect } = update;

            if (qr) {
                console.log('QR generado — escanéalo:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode;
                console.log('Conexión cerrada, code:', code);

                if (code !== DisconnectReason.loggedOut) {
                    console.log('Reintentando conexión...');
                    setTimeout(() => this.start(), 5000);
                } else {
                    console.log('Sesión cerrada desde el dispositivo. Borra baileys_auth_info y vuelve a escanear QR.');
                }
            }

            if (connection === 'open') {
                console.log('NekoBot conectado a WhatsApp!');
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
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg?.message || m.type !== 'notify') return;

            await this.handleMessage(msg);
        });
    }
}

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada no manejada:', err);
});

// Inicializar y ejecutar bot
const bot = new NekoBot();
bot.start().catch(console.error);

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\nCerrando NekoBot...');
    process.exit(0);
});