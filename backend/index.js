const express = require('express');
const app = express();
const port = 3000;
const caseRoutes = require('./routes/caseRoutes');
const chatBotRoutes = require('./routes/chatBotRoutes');




// Middleware (optional)
const exampleMiddleware = require('./middlewares/exampleLogger');
app.use(exampleMiddleware);


app.use(express.json()); // Fügt die JSON-Parsing-Middleware hinzu
app.use(express.urlencoded({ extended: true })); 

//Routen verwenden

app.use('/api/cases', caseRoutes);
app.use('/api/chatBot', chatBotRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})