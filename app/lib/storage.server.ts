import { promises as fs } from 'fs';
import path from 'path';
import { safeConsole } from './logging';

/**
 * Upload a resume file to local storage
 * Note: In production, consider using cloud storage like AWS S3, Cloudinary, or similar
 */
export async function uploadResumeFile(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const userDir = path.join(process.cwd(), 'public', 'uploads', userId);
    const filePath = path.join(userDir, fileName);
    const publicPath = `/uploads/${userId}/${fileName}`;

    // Create directory if it doesn't exist
    await fs.mkdir(userDir, { recursive: true });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    return {
      url: publicPath,
      path: publicPath,
    };
  } catch (error) {
    safeConsole.error('Error in uploadResumeFile:', error);
    return null;
  }
}

/**
 * Generate a signed URL for a private resume file
 * Note: With local storage, we just return the path
 */
export async function getSignedResumeUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    // For local storage, just return the public path
    return filePath;
  } catch (error) {
    safeConsole.error('Error in getSignedResumeUrl:', error);
    return null;
  }
}

/**
 * Delete a resume file from storage
 */
export async function deleteResumeFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    safeConsole.error('Error in deleteResumeFile:', error);
    return false;
  }
}

/**
 * Generate a thumbnail URL for a resume (first page)
 * This would require server-side processing
 */
export async function generateResumeThumbnail(
  userId: string,
  pdfFile: File
): Promise<string | null> {
  try {
    // TODO: Implement thumbnail generation
    // This would require a PDF processing library on the server
    return null;
  } catch (error) {
    safeConsole.error('Error in generateResumeThumbnail:', error);
    return null;
  }
}
