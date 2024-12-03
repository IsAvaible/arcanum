const { Cases, Attachments }  = require('../models');
const nextCloud = require('./nextCloudUploaderController.js');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const attachmentService = require('../services/attachmentService');
const multerMiddleware = require('../middlewares/multerMiddleware');
const axios = require('axios')




exports.createCaseFromFiles = [



    // **Multer-Middleware**
    multerMiddleware,


    // **Anfrage-Handler**
    async (req, res) => {

        //const socket_id = req.body.socket_id;
        const socket_id = 123;

        // **Hochgeladene Dateien verarbeiten**
        const attachmentInstances = await attachmentService.uploadFilesAndCreateAttachments(req.files);

  
            // Daten für das LLM vorbereiten
        const llmRequestData = {
        socket_id: socket_id,
        attachments: attachmentInstances,
      };

      console.log( "Sende ans LLM: ",JSON.stringify(llmRequestData));
      //Daten an das LLM senden 
      try{

        
        const llmResponse = await axios.post('http://host.docker.internal:5001/generate_case', llmRequestData);   
        

        const responseData = llmResponse.data;
        console.log( "Empange vom LLM: ", JSON.stringify(llmResponse.data));


        const allowedFields = [
          'title',
          'description',
          'solution',
          'assignee',
          'status',
          'case_type',
          'priority',
          'attachments'
        ];


        if (responseData.cases) {
          // Sicherstellen, dass cases ein Array ist
          const casesArray = Array.isArray(responseData.cases) ? responseData.cases : [responseData.cases];
          let newIds = [];
          for (const caseData of casesArray) {
            // Attachments aus caseData extrahieren
            let attachments = [];
            let extrCase = {};
            allowedFields.forEach((field) => {
              if (caseData[field] !== undefined) {
                if (field === 'attachments') {
                    attachments = caseData[field];
                } else if(field === 'assignee' && typeof caseData[field] === 'string'){
                  extrCase[field] = JSON.parse(caseData[field]);
                }else {
                    extrCase[field] = caseData[field];
                }
              }
            });

            extrCase['draft'] = true;
            // Neuen Case erstellen
            const newCase = await Cases.create(extrCase);
            newIds.push(newCase.id);
  
            // Attachments zuordnen
            if (attachments && attachments.length > 0) {

              const attachmentInstances = await Attachments.findAll({
                where: {
                  id: attachments
                }
              });
            
              await newCase.addAttachments(attachmentInstances)
            }  
          }
          
          const casesAll = await Cases.findAll({
            where: {
              id: newIds
            },
            include: [{
              model: Attachments,
              as: 'attachments',
              through: { attributes: [] }
            }]
          });

          console.log( "Erstellter Case: ", JSON.stringify(casesAll));
            // Antwort an das Frontend senden
            res.status(201).json(casesAll);
        } else if(responseData.message){
            res.status(200).json({ message: responseData.message });
        } else {
            res.status(500).json({ error: 'Error creating case.' });
          }
        } catch (error) {
          res.status(500).json({ error: 'Error creating case.' });
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
      const updatedCaseWithAttachments = await Cases.findByPk(caseId, {
        include: [{
            model: Attachments,
            as: 'attachments',
            through: { attributes: [] }
        }]
    });
  


      const llmResponse = await axios.post('host.docker.internal:5001/safe_case', updatedCaseWithAttachments);
      res.json(updatedCaseWithAttachments);
      //res.json(llmResponse);
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ message: 'Error updating case' });
    }
  }
  ];
