const express = require('express');
const multer = require('multer');
const fs = require('fs');
const child_process = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/convert', upload.single('video'), (req, res) => {
    !req.file ? res.status(400).send('File attachment not found.') : (() => {})();

    const { format } = req.body;

    const inputVideoBuffer = req.file.buffer;
    const inputFileType = fileType(inputVideoBuffer);

    !inputFileType ? res.status(400).send('File type not recognized by parser.') : (() => {})();

    const uid = uuidv4();
    const inputPath = `input_${uid}.${inputFileType.ext}`; 
    const outputPath = `output_${uid}.${format}`; 

    fs.writeFileSync(inputPath, inputVideoBuffer);

    // Execute FFmpeg
    child_process.execFile(ffmpegPath, ['-i', inputPath, outputPath], (error) => {
        error ? (console.error(error), res.status(500).send('Error during conversion.')) : (() => {})();

        const outputVideoBuffer = fs.readFileSync(outputPath);

        // Cleanup temporary files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        let resContentType = '';

        const supportedAudioFormats = new Set(['mp3', 'ogg', 'wav', 'aac']);
        const supportedVideoFormats = new Set(['mp4', 'avi', 'mkv']);
    
        if (supportedAudioFormats.has(format.toLowerCase())) {
            resContentType = 'audio/' + format.toLowerCase();
        } else if (supportedVideoFormats.has(format.toLowerCase())) {
            resContentType = 'video/' + format.toLowerCase();
        } else {
            res.status(400).send('File type not accepted.');
        }

        res.contentType(resContentType);
        res.send(outputVideoBuffer);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});