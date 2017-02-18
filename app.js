const http         = require('http'),
      fs           = require('fs'),
      path         = require('path'),
      contentTypes = require('./utils/content-types'),
      sysInfo      = require('./utils/sys-info'),
      env          = process.env,
      express = require('express'),
      passport = require('passport'),
      auth = require('auth/authenticate'),
      settings = require("settings"),
      bodyParser = require('body-parser');
      


var app = express();
auth(app);
app.get('/health', function(req, res) {
  res.writeHead(200);
  res.end();
});
app.use(bodyParser.json());
app.use(express.favicon());
app.use(express.static('./static'));
let info = function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.end(JSON.stringify(sysInfo[req.url.slice(6)]()));
};
app.get('/info/gen', info);
app.get('/info/poll', info);

app.post('/user/info', function(req, res) {
  req.user.id;
});


// let server = http.createServer(function (req, res) {
//   let url = req.url;
//   if (url == '/') {
//     url += 'index.html';
//   }

//   // IMPORTANT: Your application HAS to respond to GET /health with status 200
//   //            for OpenShift health monitoring

//   if (url == '/health') {
//     res.writeHead(200);
//     res.end();
//   } else if (url == '/info/gen' || url == '/info/poll') {
//     res.setHeader('Content-Type', 'application/json');
//     res.setHeader('Cache-Control', 'no-cache, no-store');
//     res.end(JSON.stringify(sysInfo[url.slice(6)]()));
//   } else {
//     fs.readFile('./static' + url, function (err, data) {
//       if (err) {
//         res.writeHead(404);
//         res.end('Not found');
//       } else {
//         let ext = path.extname(url).slice(1);
//         if (contentTypes[ext]) {
//           res.setHeader('Content-Type', contentTypes[ext]);
//         }
//         if (ext === 'html') {
//           res.setHeader('Cache-Control', 'no-cache, no-store');
//         }
//         res.end(data);
//       }
//     });
//   }
// });

// server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
//   console.log(`Application worker ${process.pid} started...`);
// });
