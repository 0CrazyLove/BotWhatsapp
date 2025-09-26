module.exports = {
    bot: {
        trigger: '.t',
        maxProcessedMessages: 100,
        mediaDirectory: './data/bot_media',
        authDirectory: './data/baileys_auth_info',
        storageFile: './data/media_storage.json'
    },
    conversion: {
        maxDurationSeconds: 10,
        frameRate: 15,
        videoScale: '480:-2:flags=lanczos',
        videoPreset: 'veryfast',
        videoCrf: 20
    },
    api: {
        timeout: 10000,
        maxRetries: 3
    }
};