import { getResumeWithAnalysis } from "../lib/database/index.server";
import { getUserBySession } from "../lib/auth.server";
import { execute } from "../lib/neon.server";
import * as docx from 'docx';
import { promises as fs } from 'fs';
import path from 'path';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

interface TextSegment {
  text: string;
  bold: boolean;
}

function parseHtmlToTextSegments(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  const boldPattern = /<(strong|b)>(.*?)<\/(strong|b)>/gi;
  let lastIndex = 0;
  let match;

  while ((match = boldPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = content.substring(lastIndex, match.index).replace(/<[^>]*>/g, '').trim();
      if (beforeText) segments.push({ text: beforeText, bold: false });
    }
    const boldText = match[2].replace(/<[^>]*>/g, '').trim();
    if (boldText) segments.push({ text: boldText, bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex).replace(/<[^>]*>/g, '').trim();
    if (remainingText) segments.push({ text: remainingText, bold: false });
  }

  if (segments.length === 0) {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText) segments.push({ text: plainText, bold: false });
  }

  return segments;
}

function createDocxFromHtml(html: string): docx.Document {
  const paragraphs: docx.Paragraph[] = [];
  let content = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '');

  const blocks = content.split(/(<(?:h[1-6]|p|div|li|br)[^>]*>.*?<\/(?:h[1-6]|p|div|li)>|<br\s*\/?>)/gis)
    .filter(block => block.trim());

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const isH1 = /<h1[^>]*>/i.test(trimmedBlock);
    const isH2 = /<h2[^>]*>/i.test(trimmedBlock);
    const isH3 = /<h3[^>]*>/i.test(trimmedBlock);
    const isListItem = /<li[^>]*>/i.test(trimmedBlock);
    const isBr = /<br\s*\/?>/i.test(trimmedBlock) && trimmedBlock.length < 20;

    if (isBr) {
      paragraphs.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '', size: 22 })], spacing: { after: 100 } }));
      continue;
    }

    const segments = parseHtmlToTextSegments(trimmedBlock);
    if (segments.length === 0) continue;

    let textRuns: docx.TextRun[];
    if (isH1) {
      textRuns = segments.map(seg => new docx.TextRun({ text: seg.text, bold: true, size: 28, font: 'Calibri' }));
    } else if (isH2) {
      textRuns = segments.map(seg => new docx.TextRun({ text: seg.text, bold: true, size: 24, font: 'Calibri' }));
    } else if (isH3) {
      textRuns = segments.map(seg => new docx.TextRun({ text: seg.text, bold: true, size: 22, font: 'Calibri' }));
    } else {
      textRuns = segments.map(seg => new docx.TextRun({ text: seg.text, bold: seg.bold, size: 22, font: 'Calibri' }));
    }

    const paragraphConfig: any = { children: textRuns, spacing: { before: 0, after: 100, line: 276 } };
    if (isH1) { paragraphConfig.spacing.before = 240; paragraphConfig.spacing.after = 120; }
    else if (isH2) { paragraphConfig.spacing.before = 200; paragraphConfig.spacing.after = 100; }
    else if (isH3) { paragraphConfig.spacing.before = 160; paragraphConfig.spacing.after = 80; }
    else if (isListItem) { paragraphConfig.bullet = { level: 0 }; paragraphConfig.spacing.after = 60; }

    paragraphs.push(new docx.Paragraph(paragraphConfig));
  }

  if (paragraphs.length === 0) {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    for (const line of plainText.split('\n').filter(l => l.trim())) {
      paragraphs.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: line.trim(), font: 'Calibri', size: 22 })],
        spacing: { after: 100, line: 276 },
      }));
    }
  }

  return new docx.Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276, before: 0, after: 100 } } } } },
    sections: [{
      properties: { page: { margin: { top: docx.convertInchesToTwip(0.75), right: docx.convertInchesToTwip(0.75), bottom: docx.convertInchesToTwip(0.75), left: docx.convertInchesToTwip(0.75) }, size: { width: docx.convertInchesToTwip(8.5), height: docx.convertInchesToTwip(11) } } },
      children: paragraphs,
    }],
  });
}

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Authenticate user
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const authUser = await getUserBySession(sessionToken);
    if (!authUser) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { resumeId, editedHtml } = await request.json();

    if (!resumeId || !editedHtml) {
      return Response.json({ error: 'Resume ID and edited content are required' }, { status: 400 });
    }

    // Get the resume and verify ownership
    const { resume } = await getResumeWithAnalysis(resumeId);
    if (!resume) {
      return Response.json({ error: 'Resume not found' }, { status: 404 });
    }
    if (resume.user_id !== authUser.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate the Word document from the edited HTML
    const doc = createDocxFromHtml(editedHtml);
    const docBuffer = await docx.Packer.toBuffer(doc);

    // Save the new file to the user's upload directory
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.docx`;
    const userDir = path.join(process.cwd(), 'public', 'uploads', authUser.id);
    const filePath = path.join(userDir, fileName);
    const publicPath = `/uploads/${authUser.id}/${fileName}`;

    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(docBuffer));

    // Build the new file name: append "_v2", "_v3", etc.
    const originalName = resume.resume_file_name || 'resume.docx';
    const baseName = originalName.replace(/(_v\d+)?\.(docx|doc)$/i, '');
    const versionMatch = originalName.match(/_v(\d+)\.(docx|doc)$/i);
    const nextVersion = versionMatch ? parseInt(versionMatch[1]) + 1 : 2;
    const newDisplayName = `${baseName}_v${nextVersion}.docx`;

    // Update the database record with new file URL and name
    await execute(
      `UPDATE resumes SET resume_file_url = $1, resume_file_name = $2, updated_at = NOW() WHERE id = $3`,
      [publicPath, newDisplayName, resumeId]
    );

    return Response.json({
      success: true,
      resumeFileUrl: publicPath,
      resumeFileName: newDisplayName,
    });
  } catch (error) {
    console.error('Error saving resume:', error);
    return Response.json({ error: 'Failed to save resume' }, { status: 500 });
  }
}
