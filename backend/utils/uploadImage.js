const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinaryConfig');
const streamifier = require('stream');

/**
 * Upload an image buffer or file path to Cloudinary with local storage fallback
 * @param {Buffer|string} fileSource - Buffer from multer memoryStorage, or file path
 * @param {string} folder - Destination folder on Cloudinary (e.g. 'campusfind/lost')
 * @param {object} req - Express request object (optional, used for fallback host URL)
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadImageCloudinary(fileSource, folder = 'campusfind', req = null) {
  // Try Cloudinary first
  try {
    const cloudinaryResult = await new Promise((resolve, reject) => {
      if (Buffer.isBuffer(fileSource)) {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            });
          }
        );

        const readable = new streamifier.Readable();
        readable._read = () => {};
        readable.push(fileSource);
        readable.push(null);
        readable.pipe(uploadStream);
      } else if (typeof fileSource === 'string') {
        cloudinary.uploader.upload(
          fileSource,
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            });
          }
        );
      } else {
        reject(new Error('Invalid image source provided for upload'));
      }
    });

    return cloudinaryResult;
  } catch (cloudinaryError) {
    console.warn(`[ImageUpload] Cloudinary upload returned (${cloudinaryError.message}). Falling back to local upload storage.`);

    // If buffer or file, save to local uploads/ directory as resilient fallback
    if (Buffer.isBuffer(fileSource)) {
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Determine extension from originalname or default to .jpg
      let ext = '.jpg';
      if (req && req.file && req.file.originalname) {
        ext = path.extname(req.file.originalname) || '.jpg';
      }

      const cleanFolder = folder.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanFolder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, fileSource);

      const host = req ? req.get('host') : `localhost:${process.env.PORT || 5000}`;
      const protocol = req ? req.protocol : 'http';
      const secure_url = `${protocol}://${host}/uploads/${filename}`;

      return {
        secure_url,
        public_id: `local_${filename}`
      };
    }

    // Re-throw if unable to fallback
    throw cloudinaryError;
  }
}

/**
 * Delete an image from Cloudinary or local storage by its public ID
 * @param {string} publicId
 * @returns {Promise<any>}
 */
async function deleteImageCloudinary(publicId) {
  if (!publicId) return null;
  try {
    if (publicId.startsWith('local_')) {
      const filename = publicId.replace('local_', '');
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { result: 'ok' };
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error.message);
    return null;
  }
}

module.exports = { uploadImageCloudinary, deleteImageCloudinary };
