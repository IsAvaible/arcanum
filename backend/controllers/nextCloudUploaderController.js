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
    
    console.log('Uploading file:', localFilePath + ' to ' + remoteFilePath);
    
    try {
        await nextcloudClient.putFileContents(remoteFilePath+fileName, fileContent);
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

module.exports = {
    listFiles,
    uploadFile,
    downloadFile
};