const express = require('express')
const app = express()
const port = 3000

app.set("view engine", "ejs");

//Routen importieren
const exampleRoutes = require('./routes/example');

// Middleware (optional)
const exampleMiddleware = require('./middlewares/exampleLogger');
app.use(exampleMiddleware);

//Routen verwenden
app.use('/', exampleRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})