const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const axios = require('axios');
const ffmpegStatic = require('ffmpeg-static');
let FFmpeggy;
const config = require('../config/config');
const logger = require('../utils/logger');

class ConversionService {
    constructor() {
        (async () => {
            try {
                const mod = await import('ffmpeggy');
                FFmpeggy = mod.FFmpeggy || mod.default || mod;
                if (ffmpegStatic && FFmpeggy && FFmpeggy.DefaultConfig) {
                    FFmpeggy.DefaultConfig = {
                        ...FFmpeggy.DefaultConfig,
                        ffmpegBin: ffmpegStatic
                    };
                }
            } catch (err) {
                logger.warn('No ffmpeggy available at runtime:', err && err.message);
            }
        })();
    }

    async convertToMp4File(url) {
        const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const tmpInPath = path.join(tmpdir(), `in-${uid}`);
        const tmpOutPath = path.join(tmpdir(), `out-${uid}.mp4`);

        try {
            // Descargar archivo
            await this.downloadFile(url, tmpInPath);

            // Convertir a MP4
            await this.convertWithFFmpeg(tmpInPath, tmpOutPath);

            return tmpOutPath;
        } finally {
            // Limpiar archivo temporal de entrada
            if (fs.existsSync(tmpInPath)) {
                fs.unlinkSync(tmpInPath);
            }
        }
    }

    async downloadFile(url, outputPath) {
        const res = await axios({
            method: 'GET',
            url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        res.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async convertWithFFmpeg(inputPath, outputPath) {
        const options = {
            input: inputPath,
            output: outputPath,
            autorun: true,
            inputOptions: ['-ignore_loop', '0'],
            outputOptions: [
                '-movflags +faststart',
                '-pix_fmt yuv420p',
                `-vf scale=${config.conversion.videoScale}`,
                '-c:v libx264',
                `-preset ${config.conversion.videoPreset}`,
                `-crf ${config.conversion.videoCrf}`,
                `-r ${config.conversion.frameRate}`,
                '-an',
                '-loop', '0',
                `-t ${config.conversion.maxDurationSeconds}`,
                '-max_muxing_queue_size', '1024'
            ],
            overwriteExisting: true,
            hideBanner: true
        };

        // Ensure FFmpeggy is available (in case dynamic import hasn't completed)
        if (!FFmpeggy) {
            try {
                const mod = await import('ffmpeggy');
                FFmpeggy = mod.FFmpeggy || mod.default || mod;
                if (ffmpegStatic && FFmpeggy && FFmpeggy.DefaultConfig) {
                    FFmpeggy.DefaultConfig = {
                        ...FFmpeggy.DefaultConfig,
                        ffmpegBin: ffmpegStatic
                    };
                }
            } catch (err) {
                logger.error('ffmpeggy no está disponible:', err && err.message);
                throw err;
            }
        }

        const ff = new FFmpeggy(options);

        return new Promise((resolve, reject) => {
            let finished = false;
            const onError = (err) => {
                if (finished) return;
                finished = true;
                logger.error('Error en conversión:', err);
                reject(err);
            };
            const onDone = () => {
                if (finished) return;
                finished = true;
                logger.info('Conversión completada');
                resolve();
            };

            ff.on('start', (args) => logger.info('Convirtiendo GIF a MP4...', args))
                .on('error', onError)
                .on('done', onDone);

            // trigger autorun if not already started
            ff.triggerAutorun();
        });
    }
}

module.exports = ConversionService;