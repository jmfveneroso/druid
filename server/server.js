const http = require('http');
const fs = require('fs');
const path = require('path');

// Set the port to 8000
const port = 8002;

const viewsDirectory = path.join(__dirname, '../views');

// Create the server
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/list-views') {
    // Read the views directory
    fs.readdir(viewsDirectory, (err, files) => {
      if (err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Unable to read directory'}));
        return;
      }

      // Filter only .html or .whatever extension views you want to list
      const filteredFiles = files.filter(file => path.extname(file) === '.txt');

      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(filteredFiles));  // Send list of files as JSON
    });
    // If the request is POST and targeting "/write-json"
  } else if (req.method === 'POST' && req.url === '/write-json') {
    let body = '';

    // Listen to the data event to receive the POSTed data
    req.on('data', chunk => {
      body += chunk.toString();  // Convert the buffer to string
    });

    // When the data is fully received, parse and write it
    req.on('end', () => {
      try {
        const data = JSON.parse(body);  // Parse the JSON
        const filePath = path.join(
            path.join(__dirname, '../saves'), 'save.json');  // File to write the data

        // Write the JSON data to a file
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
          if (err) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Failed to write file'}));
            return;
          }
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(
              {success: true, message: 'File written successfully'}));
        });
      } catch (error) {
        // If there was an error parsing the JSON
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Invalid JSON format'}));
      }
    });
  } else {
    // Construct the file path
    let filePath = '';
    if (req.url === '/') {
      filePath = path.join(__dirname, 'index.html');
    } else {
      filePath = path.join(path.join(__dirname, '../'), req.url);
    }

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
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end(content404, 'utf8');
          });
        } else {
          // For other errors, serve a 500 status
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        // Success, serve the file
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf8');
      }
    });
  }
});

// Listen on port 8000
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
