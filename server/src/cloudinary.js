// server/src/cloudinary.js
// Wrapper sencillo sobre el SDK de Cloudinary
import { v2 as cloudinary } from 'cloudinary'
import { config } from './config.js'

if (config.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  })
}

// Sube un buffer a Cloudinary y devuelve la URL segura (https)
export function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    )
    stream.end(buffer)
  })
}
