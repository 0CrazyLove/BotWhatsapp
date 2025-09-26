const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class ApiService {
    async getRandomGif(apis) {
        const randomApi = apis[Math.floor(Math.random() * apis.length)];
        
        try {
            const res = await axios.get(randomApi, { 
                timeout: config.api.timeout 
            });

            if (randomApi.includes('nekos.best')) {
                return res.data.results[0].url;
            }
            if (randomApi.includes('otakugifs.xyz')) {
                return res.data.url;
            }
            if (res.data && res.data.url) {
                return res.data.url;
            }

            throw new Error('Respuesta API inesperada');
        } catch (error) {
            logger.error(`Error fetching from API: ${randomApi}`, error);
            throw error;
        }
    }
}

module.exports = ApiService;