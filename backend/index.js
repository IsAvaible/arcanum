const https = require('https');
const hostname =  "192.168.0.114";
const express = require('express');
const fs = require('fs');
const app = express();
const port = 443;
const caseRoutes = require('./routes/caseRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');
const uploadRoutes = require('./routes/exampleFileUpload');
const env = require('dotenv').config();

// for development only
app.set('view engine', 'ejs');


// Middleware (optional)
const exampleMiddleware = require('./middlewares/exampleLogger');
const { DEFAULT_MIN_VERSION } = require('tls');
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

/* try{
  const server = https.createServer(options, app).listen(port, function(req, res){

  console.log(`Example app listening on port ${port}`)
});
}catch(err){
  console.error(err);
}
 */


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})