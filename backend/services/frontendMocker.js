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


  let createdGlossaryId = null;

  // 1) CREATE a new Glossary entry
  console.log("\n--- Creating a new Glossary entry ---");
  const newGlossaryData = {
    term: "TestTermFromMocker"
  };
  const createdGlossary = await testRequest("post", "/api/glossary", newGlossaryData);

  // If created successfully, store the new ID
  if (createdGlossary && createdGlossary.id) {
    createdGlossaryId = createdGlossary.id;
  }

  // 2) GET all Glossary entries
  console.log("\n--- Fetching all Glossary entries ---");
  await testRequest("get", "/api/glossary");

  // 3) FIND glossary entries by term (e.g., "fakeGlossaryTerm2" or "TestTermFromMocker")
  console.log("\n--- Searching for Glossary entries with 'TestTermFromMocker' ---");
  await testRequest("get", `/api/glossary/find?term=TestTermFromMocker`);

  // 4) If we have a createdGlossaryId, GET that single entry
  if (createdGlossaryId) {
    console.log(`\n--- Fetching Glossary entry ID=${createdGlossaryId} ---`);
    await testRequest("get", `/api/glossary/${createdGlossaryId}`);
  }


   // 5) UPDATE the Glossary entry (e.g., change its definition)
   if (createdGlossaryId) {
    console.log(`\n--- Updating Glossary entry ID=${createdGlossaryId} ---`);
    const updatedData = {
      term: "UpdatedTermFromMocker",
      definition: "Updated definition from mocker."
    };
    await testRequest("put", `/api/glossary/${createdGlossaryId}`, updatedData);
  }

  // 6) (Optional) Let's assume an existing Attachment ID=5 to test association
  // Add an attachment to the Glossary (n:m link)
  const testAttachmentId = 5; // Adjust to a valid existing Attachment in your DB
  if (createdGlossaryId && testAttachmentId) {
    console.log(`\n--- Adding Attachment ID=${testAttachmentId} to Glossary ID=${createdGlossaryId} ---`);
    await testRequest("post", `/api/glossary/${createdGlossaryId}/attachments/${testAttachmentId}`);
  }

  // 7) Remove the attachment from the Glossary
  if (createdGlossaryId && testAttachmentId) {
    console.log(`\n--- Removing Attachment ID=${testAttachmentId} from Glossary ID=${createdGlossaryId} ---`);
    await testRequest("delete", `/api/glossary/${createdGlossaryId}/attachments/${testAttachmentId}`);
  }

  // 8) DELETE the Glossary entry
  if (createdGlossaryId) {
    console.log(`\n--- Deleting Glossary entry ID=${createdGlossaryId} ---`);
    await testRequest("delete", `/api/glossary/${createdGlossaryId}`);
  }

  // 9. Case erstellen und Dateien hochladen, die vom Backend evtl. 
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


    //  Alle Glossar-Einträge abrufen
    await testRequest("get", "/api/glossary");


  

    //  Glossar-Einträge suchen (Beispiel: MIG4300Pro)
    await testRequest("get", `/api/glossary/find?term=fakeGlossaryTerm2`);

      //  Glossar-Eintrag anzeigen
      await testRequest("get", `/api/glossary/1`);


  console.log("All Glossary test requests done.");
  

  console.log("All test requests done.");
}, 5000);

app.get("/", (req, res) => {
  res.send("Frontend Mocker running...");
});

app.listen(PORT, () => {
  console.log(`Frontend Mocker running on http://localhost:${PORT}`);
});