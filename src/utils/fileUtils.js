const fs = require('fs');
const path = require('path');

class FileUtils {
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    fileExists(filePath) {
        return fs.existsSync(filePath);
    }

    readJSON(filePath, defaultValue = {}) {
        try {
            if (!this.fileExists(filePath)) {
                return defaultValue;
            }
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading JSON file ${filePath}:`, error);
            return defaultValue;
        }
    }

    writeJSON(filePath, data) {
        try {
            this.ensureDirectoryExists(path.dirname(filePath));
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing JSON file ${filePath}:`, error);
            return false;
        }
    }

    getFileExtension(filename) {
        return path.extname(filename).toLowerCase().slice(1);
    }

    generateUniqueFilename(originalName, directory) {
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        let counter = 1;
        let newName = originalName;

        while (this.fileExists(path.join(directory, newName))) {
            newName = `${baseName}_${counter}${ext}`;
            counter++;
        }

        return newName;
    }
}

module.exports = new FileUtils();