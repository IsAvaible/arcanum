const { Cases, Attachments }  = require('../models');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const nextCloud = require('./nextCloudUploaderController.js');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController');
const upload = require('../configs/multerConfig.js');




exports.showCaseDetail = async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {
        const caseItem = await Cases.findByPk(caseId, {
          include: [{
            model: Attachments,
            as: 'attachments',
            through: { attributes: [] } //Daten aus der Zwischentabelle ausblenden
          }]
        });

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
        const casesAll = await Cases.findAll({
          include: [{
            model: Attachments,
            as: 'attachments',
            through: { attributes: [] }
          }]
        });
        res.json(casesAll);
    } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ message: 'Error fetching cases' });
    }
};




exports.deleteCase = async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {

      const caseItemToDelete = await Cases.findByPk(caseId, {
        include: [{
          model: Attachments,
          as: 'attachments',
          through: { attributes: [] } //Daten aus der Zwischentabelle ausblenden
        }]
      });

        if (!caseItemToDelete) {
          return res.status(404).json({ message: 'Case not found' });
      }

      const attachments = caseItemToDelete.attachments;
      console.log(`attachemtens From Case to delete${attachments}`);

      if(attachments && attachments.length > 0){
        for(const attachment of attachments){
          try {
            console.log(`attachemt From Case to delete${attachment}`);
            // Überprüfen, ob das Attachment mit anderen Cases verknüpft ist
            const attachmentCases = await attachment.getCases();
            if (attachmentCases.length <= 1) { // Nur mit diesem Case verknüpft
                // Datei aus NextCloud löschen
                const remoteFilePath = attachment.filepath;
                await nextCloud.deleteFile(remoteFilePath);
                console.log(`File deleted: ${remoteFilePath}`);
                // Attachment aus der Datenbank löschen
                await attachment.destroy();
          }else {
            // Nur die Verknüpfung entfernen
            await caseItemToDelete.removeAttachment(attachment)
          }
        } catch(error){
          console.error(`Error processing attachment ${attachment.id}:`, error);
        }
      }
    }

        await caseItemToDelete.destroy()
        res.status(204).send();
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

        const caseDetails = { title, description, solution, assignee, status, case_type, priority };

        // **Array zum Speichern der Remote-Dateipfade**
        const attachmentInstances = [];

        // **Hochgeladene Dateien verarbeiten**
        if(req.files && req.files.length > 0){
            for(const file of req.files){
                const localFilePath = path.resolve(file.path);
                const uploadsDir = path.resolve('./uploads');
                if (!localFilePath.startsWith(uploadsDir)) {
                    return res.status(400).json({ message: 'Invalid file path' });
                }

                

                try{
                  
                  const remoteFilePath =  await nextCloud.uploadFile(localFilePath, "/test-folder/", file.filename);

                  let attachment =  await Attachments.findOne({
                    where: {
                      filepath: remoteFilePath
                    }
                  });
                
                    if(!attachment){
                    // Attachment-Datensatz erstellen
                    const attachmentData = {
                      filename: file.filename,
                      filepath: remoteFilePath,
                      mimetype: file.mimetype,
                      size: file.size,
                      uploadedAt: new Date(),
                      filehash: remoteFilePath.substring(remoteFilePath.lastIndexOf('/') +1, remoteFilePath.lastIndexOf('.')), 
                  };

                  attachment = await Attachments.create(attachmentData);
                }

                      //Attachment.Instanzen sammeln
                  attachmentInstances.push(attachment);

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
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // **Attachments mit dem Case verknüpfen**
        if (attachmentInstances.length > 0) {
          await newCase.addAttachments(attachmentInstances);
      }


  
        // **Erfolgsantwort senden**
        const caseWithAttachments = await Cases.findByPk(newCase.id, {
          include: [{
              model: Attachments,
              as: 'attachments',
              through: { attributes: [] }
          }]
      });
        res.status(201).json(caseWithAttachments);
      } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({ message: 'Error creating case' });
      }
    }
  ];



  exports.updateCase = [
  // **Multer-Middleware**
  (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
},
  
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
  
      // **Case aktualisieren**
      const [updatedRows] = await Cases.update(updateData, {
        where: { id: caseId }
      });
  
      if (updatedRows === 0) {
        return res.status(404).json({ message: 'Case not found' });
      }
  
      // **Aktualisierten Case abrufen**
      const updatedCase = await Cases.findByPk(caseId);

      // **Neue Attachments verarbeiten (falls vorhanden)**
      if (req.files && req.files.length > 0) {
          const attachmentInstances = [];
          for (const file of req.files) {
              const localFilePath = file.path;
              const uploadsDir = path.resolve('./uploads');
              if (!localFilePath.startsWith(uploadsDir)) {
                  return res.status(404);
              }
              

              try {
                  // Datei zu NextCloud hochladen
                  const remoteFilePath =  await nextCloud.uploadFile(localFilePath, "/test-folder/", file.filename);

                  let attachment =  await Attachments.findOne({
                    where: {
                      filepath: remoteFilePath
                    }
                  });
                
                    if(!attachment){
                    // Attachment-Datensatz erstellen
                    const attachmentData = {
                      filename: file.filename,
                      filepath: remoteFilePath,
                      mimetype: file.mimetype,
                      size: file.size,
                      uploadedAt: new Date(),
                      filehash: remoteFilePath.substring(remoteFilePath.lastIndexOf('/') +1, remoteFilePath.lastIndexOf('.')), // Optional: Hash berechnen
                  };

                  attachment = await Attachments.create(attachmentData);
                }

                  // Attachment-Instanz sammeln
                  attachmentInstances.push(attachment);

              } catch (error) {
                  console.error('Error uploading file to NextCloud:', error);
                  return res.status(500).json({ message: 'Error uploading files to NextCloud' });
              }
          }

          // **Attachments mit dem Case verknüpfen**
          if (attachmentInstances.length > 0) {
              await updatedCase.addAttachments(attachmentInstances);
          }
      }

       // **Case mit Attachments abrufen und zurückgeben**
       const caseWithAttachments = await Cases.findByPk(caseId, {
        include: [{
            model: Attachments,
            as: 'attachments',
            through: { attributes: [] }
        }]
    });


      res.json(caseWithAttachments);
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ message: 'Error updating case' });
    }
  }
  ];



  exports.downloadAttachment = async (req, res) => {
    const { caseId, filename } = req.params;
    caseId = parseInt(caseId, 10);
  
    try {
      // **1. Case mit Attachments abrufen**
      const caseItem = await Cases.findByPk(caseId, {
        include: [{
            model: Attachments,
            as: 'attachments',
            through: { attributes: [] }
        }]
    });
      
  
      if (!caseItem) {
        return res.status(404).json({ message: 'Case not found' });
      }
  
      const attachments = caseItem.attachments;
  
      // **2. Attachment mit passendem Dateinamen finden**
      const attachment = attachments.find(att => att.filename === filename);
  
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

  
      // **3. Datei aus Nextcloud abrufen**
      const fileContent = await nextCloud.downloadFileAndReturn(attachment.filepath);

  
      // **4. Datei an den Client senden**
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', attachment.mimetype);
      res.send(fileContent);
      
  
    } catch (error) {
      console.error('Error downloading attachment:', error);
      res.status(500).json({ message: 'Error downloading attachment' });
    }
  };