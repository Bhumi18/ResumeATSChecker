import { getResumeWithAnalysis } from "../lib/database/resumes.server";
import * as docx from 'docx';

interface TextSegment {
  text: string;
  bold: boolean;
}

// Parse HTML and create text segments with formatting info
function parseHtmlToTextSegments(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Clean up HTML entities
  let content = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  
  // Split by bold/strong tags while preserving them
  const boldPattern = /<(strong|b)>(.*?)<\/(strong|b)>/gi;
  let lastIndex = 0;
  let match;
  
  while ((match = boldPattern.exec(content)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      const beforeText = content.substring(lastIndex, match.index).replace(/<[^>]*>/g, '').trim();
      if (beforeText) {
        segments.push({ text: beforeText, bold: false });
      }
    }
    
    // Add bold text
    const boldText = match[2].replace(/<[^>]*>/g, '').trim();
    if (boldText) {
      segments.push({ text: boldText, bold: true });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex).replace(/<[^>]*>/g, '').trim();
    if (remainingText) {
      segments.push({ text: remainingText, bold: false });
    }
  }
  
  // If no segments created, just add plain text
  if (segments.length === 0) {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText) {
      segments.push({ text: plainText, bold: false });
    }
  }
  
  return segments;
}

// Create a professional resume format with consistent styling
function createProfessionalResume(html: string): docx.Document {
  const paragraphs: docx.Paragraph[] = [];
  
  // Clean HTML
  let content = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '');
  
  // Split by paragraph-level elements
  const blocks = content.split(/(<(?:h[1-6]|p|div|li|br)[^>]*>.*?<\/(?:h[1-6]|p|div|li)>|<br\s*\/?>)/gis)
    .filter(block => block.trim());
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    
    // Check what type of element this is
    const isH1 = /<h1[^>]*>/i.test(trimmedBlock);
    const isH2 = /<h2[^>]*>/i.test(trimmedBlock);
    const isH3 = /<h3[^>]*>/i.test(trimmedBlock);
    const isListItem = /<li[^>]*>/i.test(trimmedBlock);
    const isBr = /<br\s*\/?>/i.test(trimmedBlock) && trimmedBlock.length < 20;
    
    // Skip empty breaks
    if (isBr) {
      paragraphs.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: '', size: 22 })],
        spacing: { after: 100 },
      }));
      continue;
    }
    
    // Get text segments with formatting
    const segments = parseHtmlToTextSegments(trimmedBlock);
    if (segments.length === 0) continue;
    
    // Create text runs from segments
    let textRuns: docx.TextRun[];
    
    if (isH1) {
      textRuns = segments.map(seg => new docx.TextRun({
        text: seg.text,
        bold: true,
        size: 28, // 14pt
        font: 'Calibri',
      }));
    } else if (isH2) {
      textRuns = segments.map(seg => new docx.TextRun({
        text: seg.text,
        bold: true,
        size: 24, // 12pt
        font: 'Calibri',
      }));
    } else if (isH3) {
      textRuns = segments.map(seg => new docx.TextRun({
        text: seg.text,
        bold: true,
        size: 22, // 11pt
        font: 'Calibri',
      }));
    } else {
      // Regular paragraph - respect original bold/non-bold
      textRuns = segments.map(seg => new docx.TextRun({
        text: seg.text,
        bold: seg.bold,
        size: 22, // 11pt
        font: 'Calibri',
      }));
    }
    
    // Create paragraph configuration
    const paragraphConfig: any = {
      children: textRuns,
      spacing: {
        before: 0,
        after: 100,
        line: 276,
      },
    };
    
    // Apply element-specific spacing
    if (isH1) {
      paragraphConfig.spacing.before = 240;
      paragraphConfig.spacing.after = 120;
    } else if (isH2) {
      paragraphConfig.spacing.before = 200;
      paragraphConfig.spacing.after = 100;
    } else if (isH3) {
      paragraphConfig.spacing.before = 160;
      paragraphConfig.spacing.after = 80;
    } else if (isListItem) {
      paragraphConfig.bullet = { level: 0 };
      paragraphConfig.spacing.after = 60;
    }
    
    paragraphs.push(new docx.Paragraph(paragraphConfig));
  }
  
  // Fallback if no paragraphs created
  if (paragraphs.length === 0) {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const lines = plainText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      paragraphs.push(
        new docx.Paragraph({
          children: [new docx.TextRun({ 
            text: line.trim(), 
            font: 'Calibri',
            size: 22,
          })],
          spacing: { after: 100, line: 276 },
        })
      );
    }
  }
  
  // Create document with professional formatting
  return new docx.Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
              before: 0,
              after: 100,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: docx.convertInchesToTwip(0.75),
              right: docx.convertInchesToTwip(0.75),
              bottom: docx.convertInchesToTwip(0.75),
              left: docx.convertInchesToTwip(0.75),
            },
            size: {
              width: docx.convertInchesToTwip(8.5),
              height: docx.convertInchesToTwip(11),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });
}

export async function action({ request }: { request: Request }) {
  try {
    const { resumeId, editedHtml, originalFileName, useOriginal } = await request.json();

    if (!resumeId || !originalFileName) {
      return Response.json(
        { error: 'Resume ID and filename are required' },
        { status: 400 }
      );
    }

    // Get the resume record
    const { resume } = await getResumeWithAnalysis(resumeId);
    if (!resume) {
      return Response.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    let htmlContent = editedHtml;
    
    // If no edited HTML provided or useOriginal flag, extract from original file
    if (useOriginal || !editedHtml) {
      try {
        const mammoth = await import('mammoth');
        const fs = await import('fs');
        const path = await import('path');
        
        const filePath = path.join(process.cwd(), 'public', resume.resume_file_url);
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        htmlContent = result.value;
      } catch (err) {
        console.error('Error reading original file:', err);
        return Response.json(
          { error: 'Failed to read original resume file' },
          { status: 500 }
        );
      }
    }

    if (!htmlContent) {
      return Response.json(
        { error: 'No content available to generate resume' },
        { status: 400 }
      );
    }

    // Create professionally formatted Word document
    const doc = createProfessionalResume(htmlContent);

    // Generate the Word file
    const docBuffer = await docx.Packer.toBuffer(doc);

    // Determine filename
    const fileName = useOriginal 
      ? originalFileName 
      : originalFileName.replace(/\.(docx|doc)$/i, '_modified.docx');

    // Return the Word file
    return new Response(new Uint8Array(docBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating resume:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
