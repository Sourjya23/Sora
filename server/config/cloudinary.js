const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    // Extract public_id from URL: e.g. https://res.cloudinary.com/.../image/upload/v1234/folder/filename.ext
    const urlParts = fileUrl.split('/');
    const fileWithExt = urlParts[urlParts.length - 1];
    const folderPath = urlParts.slice(urlParts.indexOf('upload') + 2, -1).join('/'); // Account for versions (v1234)
    const publicIdWithExt = folderPath ? `${folderPath}/${fileWithExt}` : fileWithExt;
    const publicId = publicIdWithExt.split('.')[0]; // Remove extension

    // Recordings are often resource_type: "video" in Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    console.log(`Deleted video from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

module.exports = { cloudinary, deleteFromCloudinary };
