const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

class StorageService {
    constructor() {
        this.storagePath = config.bot.storageFile;
        this.mediaDirectory = config.bot.mediaDirectory;
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            path.dirname(this.storagePath),
            this.mediaDirectory
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    loadMediaStorage() {
        if (!fs.existsSync(this.storagePath)) {
            return {};
        }

        try {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Error loading media storage:', error);
            return {};
        }
    }

    saveMediaStorage(storage) {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(storage, null, 2));
        } catch (error) {
            logger.error('Error saving media storage:', error);
            throw error;
        }
    }

    saveMedia(mediaName, buffer, mimetype) {
        const extension = this.getExtensionFromMimetype(mimetype);
        const fileName = `${mediaName}.${extension}`;
        const filePath = path.join(this.mediaDirectory, fileName);

        fs.writeFileSync(filePath, buffer);

        return {
            path: filePath,
            mimetype: mimetype,
            filename: fileName,
            type: this.getMediaType(mimetype),
            savedAt: new Date().toISOString()
        };
    }

    getExtensionFromMimetype(mimetype) {
        if (mimetype.includes('gif')) return 'gif';
        if (mimetype.includes('video')) return 'mp4';
        if (mimetype.includes('png')) return 'png';
        if (mimetype.includes('webp')) return 'webp';
        return 'jpg';
    }

    getMediaType(mimetype) {
        return mimetype.includes('gif') || mimetype.includes('video') ? 'gif' : 'image';
    }
}

module.exports = StorageService;