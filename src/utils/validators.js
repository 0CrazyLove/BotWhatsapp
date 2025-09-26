class Validators {
    isValidJid(jid) {
        if (!jid) return false;
        return /^\d+@s\.whatsapp\.net$|^\d+@g\.us$/.test(jid);
    }

    isValidMediaName(name) {
        if (!name || typeof name !== 'string') return false;
        return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 50;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isImageMimetype(mimetype) {
        return mimetype && mimetype.startsWith('image/');
    }

    isVideoMimetype(mimetype) {
        return mimetype && mimetype.startsWith('video/');
    }

    isGifMimetype(mimetype) {
        return mimetype === 'image/gif';
    }

    isSupportedMediaMimetype(mimetype) {
        return this.isImageMimetype(mimetype) || 
               this.isVideoMimetype(mimetype) || 
               this.isGifMimetype(mimetype);
    }
}

module.exports = new Validators();