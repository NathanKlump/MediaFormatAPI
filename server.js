const express = require('express');
const multer = require('multer');
const fs = require('fs');
const child_process = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const app = express();
const port = 3000;

const storage = multer.memoryStorage(); // store the file in memory
const upload = multer({ storage: storage });

app.post('/convert', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('file attachment not found.');
    }

    const inputVideoBuffer = req.file.buffer;
    const inputPath = 'temp_input.mp4';  // you might want to generate unique filenames
    const outputPath = 'temp_output.avi'; // and also support different output formats

    fs.writeFileSync(inputPath, inputVideoBuffer);

    // Execute FFmpeg
    child_process.execFile(ffmpegPath, ['-i', inputPath, outputPath], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error during conversion.');
        }

        const outputVideoBuffer = fs.readFileSync(outputPath);

        // Cleanup temporary files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.contentType('video/avi');
        res.send(outputVideoBuffer);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});