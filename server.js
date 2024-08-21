const http = require('http');
const fs = require('fs');
const path = require('path');

// Set the port to 8000
const port = 8001;

// Create the server
const server = http.createServer((req, res) => {
    // Construct the file path
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Get the file's extension
    const extname = path.extname(filePath);
    
    // Set the content type based on the file extension
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    // Read the file from the filesystem
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If file not found, serve a 404 page
                fs.readFile(path.join(__dirname, '404.html'), (error, content404) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content404, 'utf8');
                });
            } else {
                // For other errors, serve a 500 status
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success, serve the file
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// Listen on port 8000
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
