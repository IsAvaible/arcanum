const express = require('express')
const https = require('https');
const app = express();
const port = 3000;
const cors = require('cors');
//const port = 443;
const caseRoutes = require('./routes/caseRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');
const uploadRoutes = require('./routes/exampleFileUpload');
const env = require('dotenv').config();
const fs = require('fs');
const { DEFAULT_MIN_VERSION } = require('tls');
app.use(cors({
  origin: [
    'http://localhost:8080', // Frontend (Docker)
    'http://localhost:4173', // Frontend (Production)
    'http://localhost:5173', // Frontend (Development)
    'http://localhost:63342' // PHPStorm
  ],
}));


// for development only
app.set('view engine', 'ejs');

// Use CORS middleware, see: https://expressjs.com/en/resources/middleware/cors.html
app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:5173'], // Allow only these origins
  allowedHeaders: '*',
  exposedHeaders: '*',
  credentials: true,
}));

// Middleware (optional)
const exampleMiddleware = require('./middlewares/exampleLogger');
app.use(exampleMiddleware);


app.use(express.json()); // Fügt die JSON-Parsing-Middleware hinzu
app.use(express.urlencoded({ extended: true })); 

//Routen verwenden
app.use('/api/cases', caseRoutes);
app.use('/api', chatBotRoutes);
app.use('/', uploadRoutes);




app.get('/', (req, res) => {
  res.send('Hello World!')
})


const options = {
  key: fs.readFileSync('./certs/localhost-dev-key.pem'),
  cert: fs.readFileSync('./certs/localhost.pem'),
  //ca: fs.readFileSync('./certs/ca.pem')
};

// for https uncomment the following lines
/* try{
  const server = https.createServer(options, app).listen(port, function(req, res){
  console.log(`Example app listening on port ${port}`)
});
}catch(err){
  console.error(err);
}
 */

// for https comment the following line

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})