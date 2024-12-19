const crypto = require("crypto");
const fs = require("fs");

let nextcloudClient;

// Initializes the connection to the Nextcloud client.
// Uses WebDAV with credentials provided via environment variables.
const nextcloudClientPromise = (async () => {
  const { createClient } = await import("webdav");

  nextcloudClient = createClient(process.env.NEXTCLOUD_URL, {
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
  });
})();

/**
 * Lists files in the specified directory on Nextcloud.
 *
 * @param {string} remoteFilePath - The path to the remote directory on Nextcloud.
 * @returns {Promise<Array>} Array of directory contents or `undefined` in case of an error.
 */
async function listFiles(remoteFilePath) {
  try {
    return await nextcloudClient.getDirectoryContents(remoteFilePath);
  } catch (error) {
    console.error("Error listing files:", error);
  }
}

/**
 * Lists files in a specific folder and checks if a given file exists.
 *
 * @param {string} remoteFolder - The path to the remote folder on Nextcloud.
 * @param {string} fileName - The name of the file to check.
 */
async function listFilesSpec(remoteFolder, fileName) {
  try {
    const directoryItems =
      await nextcloudClient.getDirectoryContents(remoteFolder);
    console.log(directoryItems);
  } catch (error) {
    console.error("Error listing files:", error);
  }
}

/**
 * Uploads a file to a specific folder on Nextcloud, categorizing it based on its file type.
 *
 * @param {string} localFilePath - The local path to the file being uploaded.
 * @param {string} remoteFilePath - The remote directory path on Nextcloud.
 * @param {string} fileName - The name of the file being uploaded.
 * @returns {string|number} The remote path of the uploaded file, or `-1` if the file type is unsupported.
 */
async function uploadFile(localFilePath, remoteFilePath, fileName) {
  await nextcloudClientPromise;
  const fileContent = fs.readFileSync(localFilePath);
  let hashedFileContent = "";

  // Generate a hash for the file content for uniqueness.
  try {
    hashedFileContent = crypto
      .createHash("sha256")
      .update(fileContent)
      .digest("hex");
    console.log("Hashed file content:", hashedFileContent);
  } catch (error) {
    console.error("Error hashing file content:", error);
  }

  // Define folder categories based on file type.
  const folder = ["Audio/", "Images/", "Text/", "Videos/"];
  const fileExtension = fileName.split(".").pop().toLowerCase();
  let folderPath = "";

  console.log("File type: " + fileExtension);
  switch (fileExtension) {
    case "mp3":
    case "wav":
      folderPath = folder[0]; // Audio/
      break;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      folderPath = folder[1]; // Images/
      break;
    case "txt":
    case "doc":
    case "pdf":
      folderPath = folder[2]; // Text/
      break;
    case "mp4":
      folderPath = folder[3]; // Videos/
      break;
  }

  if (folderPath === "") {
    console.log("File type not supported");
    return -1;
  }

  try {
    // Check if the file already exists in the target folder.
    const directoryItems = await listFiles(remoteFilePath + folderPath);
    remoteFilePath =
      remoteFilePath +
      folderPath +
      hashedFileContent.toString() +
      "." +
      fileExtension;

    if (directoryItems !== undefined) {
      for (const item of directoryItems) {
        if (
          item.basename ===
          hashedFileContent.toString() + "." + fileExtension
        ) {
          console.log("File already exists, skipping upload");
          return remoteFilePath;
        }
      }
    } else {
      console.log("Cannot list folder content");
    }

    // Upload the file to Nextcloud.
    await nextcloudClient.putFileContents(remoteFilePath, fileContent);
    console.log("File uploaded successfully");
  } catch (error) {
    console.error("Error uploading file:", error);
  } finally {
    // Delete the local file after uploading.
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
  }

  return remoteFilePath;
}

/**
 * Downloads a file from Nextcloud and saves it locally.
 *
 * @param {string} remoteFilePath - The remote path to the file on Nextcloud.
 * @param {string} localFilePath - The local path where the file will be saved.
 */
async function downloadFile(remoteFilePath, localFilePath) {
  try {
    const fileContent = await nextcloudClient.getFileContents(remoteFilePath);
    fs.writeFileSync(localFilePath, fileContent);
    console.log("File downloaded successfully");
  } catch (error) {
    console.error("Error downloading file:", error);
  }
}

/**
 * Downloads a file from Nextcloud and returns its content.
 *
 * @param {string} remoteFilePath - The remote path to the file on Nextcloud.
 * @returns {Buffer} The content of the downloaded file.
 */
async function downloadFileAndReturn(remoteFilePath) {
  try {
    const fileContent = await nextcloudClient.getFileContents(remoteFilePath);
    console.log("File downloaded successfully");
    return fileContent;
  } catch (error) {
    console.error("Error downloading file:", error);
  }
}

/**
 * Creates a readable stream for a file on Nextcloud.
 *
 * @param {string} remoteFilePath - The remote path to the file on Nextcloud.
 * @returns {Stream} A readable stream representing the file.
 */
async function streamFile(remoteFilePath) {
  return nextcloudClient.createReadStream(remoteFilePath);
}

/**
 * Deletes a file from Nextcloud.
 *
 * @param {string} remoteFilePath - The remote path to the file on Nextcloud.
 */
async function deleteFile(remoteFilePath) {
  try {
    await nextcloudClient.deleteFile(remoteFilePath);
    console.log("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

module.exports = {
  downloadFileAndReturn,
  streamFile,
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
};
