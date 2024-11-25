const { Cases, Attachments }  = require('../models');
const nextCloud = require('./nextCloudUploaderController.js');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');


const upload = multer({
    storage: multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 1000000 }, // Dateigrößenbeschränkung pro Datei
    fileFilter: function (req, file, cb) {
        fileUploadController.checkFileName(file);
        fileUploadController.checkFileType(file, cb);
        //try {
        //    fileUploadController.scanFileWithAzure(file);
        //    cb(null, true);
        //} catch (error) {
        //    cb(error);
        //}
    }
}).array('files', 10); // 'files' ist der Feldname, bis zu 10 Dateien



exports.createCaseFromFiles = [
    // **Validierungsregeln**


    // **Multer-Middleware**
    (req, res, next) => {
        upload(req, res, function (err) {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            
        next();
    });
  },


    // **Anfrage-Handler**
    async (req, res) => {
      // **Validierungsergebnisse prüfen**
      //const errors = validationResult(req);

      //if (!errors.isEmpty()) {
      //  return res.status(400).json({ errors: errors.array() });
      //}

        const files = req.files;
        const socket_id = req.body.socket_id;

        // **Array zum Speichern der Attachment Objects**
        const attachmentInstances = [];

        // **Hochgeladene Dateien verarbeiten**
        if(files && files.length > 0){
            for(const file of files){
                const localFilePath = file.path;
                const remoteFilePath = "/test-folder/" + file.filename;

                try{
                    await nextCloud.uploadFile(localFilePath, "/test-folder/", file.filename);

                    //Code wenn Max den Filename, path, mimetype, hash usw. in uploadFile definiert 
                    //const attachmentData = await nextCloud.uploadFile(file);
                    //const attachment = await Attachments.create(attachmentData);
                    //attachmentInstances.push(attachment);
                    
                        // Attachment-Datensatz erstellen
                        const attachmentData = {
                          filename: file.filename,
                          filepath: remoteFilePath,
                          mimetype: file.mimetype,
                          size: file.size,
                          description: '', // Optional: aus req.body
                          uploadedAt: new Date(),
                          filehash: '', // Optional: Hash berechnen
                      };

                      const attachment = await Attachments.create(attachmentData);

                      //Attachment.Instanzen sammeln
                      attachmentInstances.push(attachment);

                }catch (error) {
                    console.error('Error uploading file to NextCloud:', error);
                    return res.status(500).json({ message: 'Error uploading files to NextCloud' });
                }        
            }
        }
  
            // Daten für das LLM vorbereiten
        const llmRequestData = {
        socket_id: socket_id,
        attachments: attachmentInstances,
      };

      //Daten an das LLM senden 
      try{
        const llmResponse = await axios.post('URL_ZUM_LLM_ENDPOINT', llmRequestData);
        
        const responseData = llmResponse.data;

        const newCases = [];


        if(responseData.cases){
            for(const caseData of responseData.cases){

                const newCase = await Cases.create(caseData);
                newCases.push(newCase);
            }
            
            // Antwort an das Frontend senden
            res.status(200).json(newCases);
        } else if(responseData.message){
            res.status(200).json({ message: responseData.message });
        } else {
            res.status(500).json({ error: 'Unerwartete Antwort vom LLM' });
          }
        } catch (error) {
          res.status(500).json({ error: 'Fehler beim Senden der Daten an das LLM' });
        }

      
    }
  ];



  exports.confirmCase = [ 
  async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
  
    try {
      // **Zulässige Felder definieren**
      const allowedFields = [
        'title',
        'description',
        'solution',
        'assignee',
        'status',
        'case_type',
        'priority'//,
        //'attachment'
      ];
  
      // **Eingabedaten filtern**
      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      updateData['draft'] = false;
      // **Case aktualisieren**
      const [updatedRows] = await Cases.update(updateData, {
        where: { id: caseId }
      });
  
      if (updatedRows === 0) {
        return res.status(404).json({ message: 'Case not found' });
      }

 


  
      // **Aktualisierten Case abrufen**
      const updatedCase = await Cases.findByPk(caseId);

      const llmResponse = await axios.post('URL_ZUM_LLM_ENDPOINT', { cases: [updatedCase] });

      res.json(llmResponse);
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ message: 'Error updating case' });
    }
  }
  ];