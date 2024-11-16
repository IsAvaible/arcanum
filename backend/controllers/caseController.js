const { Cases }  = require('../models');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const nextCloud = require('./nextCloudUploaderController.js');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController');
const fs = require('fs');




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




exports.showCaseDetail = async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {
        const caseItem = await Cases.findByPk(caseId);

        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }

        res.json(caseItem);

    } catch (error) {
        console.error('Error fetching case detail:', error);
        res.status(500).json({ message: 'Error fetching case detail' });
    }
};



exports.showCaseList = async (req, res) => {
    try {
        const casesAll = await Cases.findAll();
        res.json(casesAll);
    } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ message: 'Error fetching cases' });
    }
};




exports.deleteCase = async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {

        const caseItemToDelete = await Cases.findByPk(caseId);

        if (!caseItemToDelete) {
          return res.status(404).json({ message: 'Case not found' });
      }

      const attachments = caseItemToDelete.attachment;
      if (Array.isArray(attachments)) {
          for (const remoteFilePath of attachments) {
              try {
                  await nextCloud.deleteFile(remoteFilePath);
                  console.log(`File deleted: ${remoteFilePath}`);
              } catch (error) {
                  console.error(`Error deleting file ${remoteFilePath}:`, error);
              }
          }
      }

        const deleted = await Cases.destroy({
            where: { id: caseId }
        });

        if (deleted) {
            res.redirect('/api/cases');
        } else {
            res.status(404).json({ message: 'Case not found' });
        }
    } catch (error) {
        console.error('Error deleting case:', error);
        res.status(500).json({ message: 'Error deleting case' });
    }
};




exports.createCase = [
    // **Validierungsregeln**
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    // Füge weitere Validierungen für andere Felder hinzu, falls nötig

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

  
      try {
        // **Eingabedaten aus dem Request extrahieren**
        const {
          title,
          description,
          solution,
          assignee,
          status,
          case_type,
          priority
        } = req.body;

        // **Array zum Speichern der Remote-Dateipfade**
        const attachment = [];

        // **Hochgeladene Dateien verarbeiten**
        if(req.files && req.files.length > 0){
            for(const file of req.files){
                const localFilePath = file.path;
                const remoteFilePath = "/test-folder/" + file.filename;

                try{
                    await nextCloud.uploadFile(localFilePath, "/test-folder/", file.filename);
                    attachment.push(remoteFilePath);
                }catch (error) {
                    console.error('Error uploading file to NextCloud:', error);
                    return res.status(500).json({ message: 'Error uploading files to NextCloud' });
                }        
            }
        }
  
        // **Neuen Fall erstellen**
        const newCase = await Cases.create({
          title,
          description,
          solution,
          assignee,
          status,
          case_type,
          priority,
          attachment,
          createdAt: new Date(),
          updatedAt: new Date()
        });
  
        // **Erfolgsantwort senden**
        res.status(201).json(newCase);
      } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({ message: 'Error creating case' });
      }
    }
  ];



  exports.updateCase = async (req, res) => {
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
  
      // **Case aktualisieren**
      const [updatedRows] = await Cases.update(updateData, {
        where: { id: caseId }
      });
  
      if (updatedRows === 0) {
        return res.status(404).json({ message: 'Case not found' });
      }
  
      // **Aktualisierten Fall abrufen**
      const updatedCase = await Cases.findByPk(caseId);
      res.json(updatedCase);
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ message: 'Error updating case' });
    }
  };




  exports.downloadAttachment = async (req, res) => {
    const { caseId, filename } = req.params;
  
    try {
      // **1. Fall abrufen**
      const caseItem = await Cases.findByPk(caseId);
      
  
      if (!caseItem) {
        return res.status(404).json({ message: 'Case not found' });
      }
  
      const attachments = caseItem.attachment;
  
      // **2. Überprüfen, ob die Datei zum Caseg gehört**
      const remoteFilePath = attachments.find(path => path.endsWith(filename));
  
      if (!remoteFilePath) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
  
      // **3. Datei aus Nextcloud abrufen**
      const fileContent = await nextCloud.downloadFileAndReturn(remoteFilePath);

  
      // **4. Datei an den Client senden**
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileContent);
      
  
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ message: 'Error downloading attachment' });
    }
  };