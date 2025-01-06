const express = require("express");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

// Da self-signed Zertifikat
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 8080;

// URL des Backends
const backendUrl = "https://localhost:443";



// Kleiner Hilfs-Wrapper für axios-Requests, um Ergebnisse sauber zu loggen
async function testRequest(method, url, data = null) {
  try {
    const res = await axios({
      method,
      url: backendUrl + url,
      data,
    });
    console.log(
      `Request ${method.toUpperCase()} ${url} => Status: ${res.status}`,
      res.data,
    );
    return res.data;
  } catch (error) {
    console.error(
      `Error in request ${method.toUpperCase()} ${url}`,
      error.response ? error.response.data : error.message,
    );
  }
}

// Nach Start 30s warten, dann Requests losschicken
setTimeout(async () => {
  console.log("Starting test requests...");
  console.log("Starting Glossary test requests...");


  // 5. Case erstellen und Dateien hochladen, die vom Backend evtl. 
  //    automatisch Glossar-Einträge anlegen oder verknüpfen
  try {
    console.log("Testing file upload for /createCaseFromFiles...");

    const formData = new FormData();
    // Beispiel: Du kannst andere Felder je nach Bedarf anhängen
    formData.append("someField", "Hello, I'm a test field");
    // Beispiel-Datei anfügen (Pfad anpassen!)
    formData.append("files", fs.createReadStream("./testfile.txt"));

    const res = await axios.post(
      backendUrl + `/api/createCaseFromFiles`,
      formData,
      {
        headers: formData.getHeaders(),
        httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
      },
    );

    console.log(
      "File upload => status:",
      res.status,
      JSON.stringify(res.data),
    );
  } catch (err) {
    console.error("Error uploading file:", err.message);
  }


    // 1. Alle Glossar-Einträge abrufen
    await testRequest("get", "/api/glossary");


  

    // 4. Glossar-Einträge suchen (Beispiel: MIG4300Pro)
   // await testRequest("get", `/api/glossary/find?term=MIG4300Pro`);


  console.log("All Glossary test requests done.");
  

  console.log("All test requests done.");
}, 5000);

app.get("/", (req, res) => {
  res.send("Frontend Mocker running...");
});

app.listen(PORT, () => {
  console.log(`Frontend Mocker running on http://localhost:${PORT}`);
});