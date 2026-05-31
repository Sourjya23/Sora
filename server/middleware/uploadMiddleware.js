const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // PDFs and documents must use "raw" resource_type so Cloudinary
    // serves them at /raw/upload/ instead of /image/upload/
    const isRawFile = /\.(pdf|doc|docx)$/i.test(file.originalname);
    const isVideoFile = /\.(webm|mp4|mov|mkv|avi)$/i.test(file.originalname);
    return {
      folder: "interview-platform",
      resource_type: isRawFile ? "raw" : isVideoFile ? "video" : "auto",
      format: isRawFile ? undefined : isVideoFile ? "webm" : undefined,
      public_id: file.originalname.replace(/\.[^/.]+$/, "") + "_" + Date.now(),
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
