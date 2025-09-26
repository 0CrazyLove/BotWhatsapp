const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const config = require('../config/config');
const logger = require('../utils/logger');

class ConversionService {
    constructor() {
        if (ffmpegStatic) {
            ffmpeg.setFfmpegPath(ffmpegStatic);
        }
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
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .inputOptions(['-ignore_loop 0'])
                .outputOptions([
                    '-movflags +faststart',
                    '-pix_fmt yuv420p',
                    `-vf scale=${config.conversion.videoScale}`,
                    '-c:v libx264',
                    `-preset ${config.conversion.videoPreset}`,
                    `-crf ${config.conversion.videoCrf}`,
                    `-r ${config.conversion.frameRate}`,
                    '-an',
                    '-loop 0',
                    `-t ${config.conversion.maxDurationSeconds}`,
                    '-max_muxing_queue_size 1024'
                ])
                .format('mp4')
                .on('start', () => logger.info('Convirtiendo GIF a MP4...'))
                .on('error', (err) => {
                    logger.error('Error en conversión:', err);
                    reject(err);
                })
                .on('end', () => {
                    logger.info('Conversión completada');
                    resolve();
                })
                .save(outputPath);
        });
    }
}

module.exports = ConversionService;