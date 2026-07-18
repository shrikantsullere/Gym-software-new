import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, folder) => {
  try {
    const fileObj = Array.isArray(file) ? file[0] : file;

    const isImage = fileObj.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    // Extract file extension (e.g., ".pdf")
    let extension = "";
    if (fileObj.name && fileObj.name.includes(".")) {
      extension = fileObj.name.substring(fileObj.name.lastIndexOf("."));
    } else if (isImage) {
      extension = ".jpg";
    } else {
      extension = ".pdf"; // default fallback for announcements
    }

    const randomName = Math.random().toString(36).substring(2, 10) + "_" + Date.now();

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      public_id: randomName + extension
    };

    const upload = await cloudinary.uploader.upload(fileObj.tempFilePath, uploadOptions);

    // delete temp file after upload
    if (fileObj.tempFilePath && fs.existsSync(fileObj.tempFilePath)) {
      fs.unlinkSync(fileObj.tempFilePath);
    }

    return upload.secure_url;
  } catch (err) {
    console.log("Cloudinary error =>", err);
    try { fs.writeFileSync('cloudinary-error.log', JSON.stringify(err, null, 2)); } catch (e) {}
    return null;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Cloudinary image deleted: ${publicId}`);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

export default cloudinary;
