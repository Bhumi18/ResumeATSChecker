import { supabase } from './supabase';

/**
 * Upload a resume file to Supabase Storage
 */
export async function uploadResumeFile(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
      });
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Error in uploadResumeFile:', error);
    return null;
  }
}

/**
 * Generate a signed URL for a private resume file
 */
export async function getSignedResumeUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedResumeUrl:', error);
    return null;
  }
}

/**
 * Delete a resume file from storage
 */
export async function deleteResumeFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('resumes')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteResumeFile:', error);
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
    // This could be done using pdf.js on the client side
    // or via a server-side function/edge function
    
    // For now, return a placeholder or the PDF URL
    return null;
  } catch (error) {
    console.error('Error in generateResumeThumbnail:', error);
    return null;
  }
}
