const express = require('express');
const app = express();
const port = 3000;
const caseRoutes = require('./routes/caseRoutes');
const uploadRoutes = require('./routes/exampleFileUpload');
const env = require('dotenv').config();

// for development only
app.set('view engine', 'ejs');


// Middleware (optional)
const exampleMiddleware = require('./middlewares/exampleLogger');
app.use(exampleMiddleware);


app.use(express.json()); // Fügt die JSON-Parsing-Middleware hinzu
app.use(express.urlencoded({ extended: true })); 

//Routen verwenden
app.use('/api/cases', caseRoutes);
app.use('/', uploadRoutes);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})