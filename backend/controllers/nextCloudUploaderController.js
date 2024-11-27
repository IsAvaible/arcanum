const crypto = require('crypto');
const fs = require('fs');

let nextcloudClient;
const nextcloudClientPromise = (async () => {
    const { createClient } = await import('webdav');
  
    nextcloudClient = createClient(
        process.env.NEXTCLOUD_URL,
        {
            username: process.env.NEXTCLOUD_USERNAME,
            password: process.env.NEXTCLOUD_PASSWORD
        }
    );
  })();

// Example function to list files in the root directory
async function listFiles() {
    try {
        const directoryItems = await nextcloudClient.getDirectoryContents('/test-folder/');
        console.log(directoryItems);
    } catch (error) {
        console.error('Error listing files:', error);
    }
}

// Example function to upload a file
async function uploadFile(localFilePath, remoteFilePath, fileName) {
    await nextcloudClientPromise;
    const fileContent = fs.readFileSync(localFilePath);
    
    try{
        const hashedFileContent = crypto.createHash('sha256').update(fileContent).digest('hex');
        console.log('Hashed file content:', hashedFileContent);
    } catch (error) {   
        console.error('Error hashing file content:', error);
    }
    
    
    
    const folder = ["Audio/", "Bilder/","Text/" ];
    const fileExtension = fileName.split('.').pop().toLowerCase();
    let folderPath = '';

    console.log("Fieltype: " + fileExtension);
    switch (fileExtension) {
        case 'mp3':
        case 'wav':
            folderPath = folder[0]; // Audio/
            break;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            folderPath = folder[1]; // Bilder/
            break;
        case 'txt':
        case 'doc':
        case 'pdf':
            folderPath = folder[2]; // Text/
            break;
    }
    if(folderPath === ''){
        console.log('File type not found');
        return -1;
    }
    remoteFilePath = remoteFilePath + folderPath + hashedFileContent;
    console.log('Uploading file:', localFilePath + ' to ' + remoteFilePath);
    
    

    try {
        await nextcloudClient.putFileContents(remoteFilePath, fileContent);
        console.log('File uploaded successfully');

        fs.unlink(localFilePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('File deleted successfully');
            }
          });
    } catch (error) {
        console.error('Error uploading file:', error);
    }

    return remoteFilePath;
}

// Example function to download a file
async function downloadFile(remoteFilePath, localFilePath) {

    try {
        const fileContent = await nextcloudClient.getFileContents(remoteFilePath);
        fs.writeFileSync(localFilePath, fileContent);
        console.log('File downloaded successfully');
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}


async function downloadFileAndReturn(remoteFilePath) {

    try {
        const fileContent = await nextcloudClient.getFileContents(remoteFilePath);
        console.log('File downloaded successfully');
        return fileContent
    } catch (error) {
        console.error('Error downloading file:', error);
    }
    
}

async function deleteFile(remoteFilePath) {
    try {
        await nextcloudClient.deleteFile(remoteFilePath);
        console.log('File deleted successfully');
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}


module.exports = {
    downloadFileAndReturn,
    listFiles,
    uploadFile,
    downloadFile,
    deleteFile
};