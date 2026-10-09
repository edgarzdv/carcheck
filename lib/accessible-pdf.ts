import PDFDocument from 'pdfkit';
import { createVisualRuns, resolveDirection, type RtlPdfOptions, type TextBlock, type DocumentBlock } from 'rtl-pdf';

// rtl-pdf provides the BiDi shaping but does not create a PDF structure tree.
// Keep its text layout while tagging headings, paragraphs, and decorative rules.
export type AccessibleDocumentBlock = DocumentBlock | (TextBlock & { headingLevel?: 1 | 2 | 3; minFollowingHeight?: number });
type Options = Omit<RtlPdfOptions, 'blocks'> & { blocks: AccessibleDocumentBlock[] };
type Margins = { top: number; right: number; bottom: number; left: number };
const defaultMargins: Margins = { top: 56, right: 56, bottom: 56, left: 56 };

function visualWidth(doc: PDFKit.PDFDocument, text: string, direction: 'auto' | 'ltr' | 'rtl') {
  return createVisualRuns(text, direction).reduce((sum, run) => {
    doc.font(run.level % 2 ? 'rtl' : 'ltr');
    return sum + doc.widthOfString(run.text);
  }, 0);
}

function wrap(doc: PDFKit.PDFDocument, text: string, width: number, direction: 'auto' | 'ltr' | 'rtl'): string[] {
  if (!text.trim()) return [];
  const lines: string[] = [];
  let line = '';
  for (const word of text.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (visualWidth(doc, candidate, direction) <= width) { line = candidate; continue; }
    if (line) lines.push(line);
    if (visualWidth(doc, word, direction) <= width) { line = word; continue; }
    const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)].map(item => item.segment);
    let piece = '';
    for (const grapheme of graphemes) {
      if (piece && visualWidth(doc, piece + grapheme, direction) > width) {
        lines.push(piece);
        piece = grapheme;
      } else piece += grapheme;
    }
    line = piece;
  }
  if (line) lines.push(line);
  return lines;
}

function drawLine(doc: PDFKit.PDFDocument, text: string, left: number, top: number, width: number,
  direction: 'auto' | 'ltr' | 'rtl', align: 'auto' | 'left' | 'right' | 'center') {
  const runs = createVisualRuns(text, direction).map(run => {
    const font = run.level % 2 ? 'rtl' : 'ltr';
    doc.font(font);
    return { ...run, font, width: doc.widthOfString(run.text), x: 0 };
  });
  const totalWidth = runs.reduce((sum, run) => sum + run.width, 0);
  const resolvedAlign = align === 'auto' ? resolveDirection(text, direction) === 'rtl' ? 'right' : 'left' : align;
  let x = resolvedAlign === 'right' ? left + width - totalWidth : resolvedAlign === 'center' ? left + (width - totalWidth) / 2 : left;
  for (const run of runs) { run.x = x; x += run.width; }
  // ActualText keeps the logical Hebrew sentence available to assistive software.
  doc.markContent('Span', { actual: text } as Parameters<PDFKit.PDFDocument['markContent']>[1]);
  for (const run of runs.filter(item => !item.whitespace).sort((a, b) => a.start - b.start)) {
    doc.font(run.font);
    doc.text(run.text, run.x, top, { lineBreak: false });
  }
  doc.endMarkedContent();
}

export async function createAccessiblePdf(options: Options): Promise<Uint8Array> {
  const margins = { ...defaultMargins, ...options.page?.margins };
  const info: Record<string, string> = { Title: options.metadata?.title ?? 'RehevNet', Author: options.metadata?.author ?? 'RehevNet' };
  if (options.metadata?.subject) info.Subject = options.metadata.subject;
  if (options.metadata?.keywords?.length) info.Keywords = options.metadata.keywords.join(', ');
  const doc = new PDFDocument({
    autoFirstPage: false, bufferPages: true, compress: options.compress ?? true,
    displayTitle: true, pdfVersion: '1.7ext3', tagged: true,
    lang: options.metadata?.language ?? 'he-IL',
    info,
  });
  doc.registerFont('rtl', typeof options.fonts.rtl === 'string' ? options.fonts.rtl : Buffer.from(options.fonts.rtl));
  const ltrFont = options.fonts.ltr ?? options.fonts.rtl;
  doc.registerFont('ltr', typeof ltrFont === 'string' ? ltrFont : Buffer.from(ltrFont));
  const chunks: Buffer[] = [];
  doc.on('data', chunk => chunks.push(chunk));
  const completed = new Promise<Uint8Array>((resolve, reject) => {
    doc.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on('error', reject);
  });
  const pageSize = options.page?.size ?? 'A4';
  doc.addPage({ size: pageSize, margins });
  let y = margins.top;
  const width = () => doc.page.width - margins.left - margins.right;
  const ensureSpace = (height: number) => {
    if (y + height <= doc.page.height - margins.bottom) return;
    doc.addPage({ size: pageSize, margins });
    y = margins.top;
  };
  const structure = doc.struct('Document');
  doc.addStructure(structure);

  for (const block of options.blocks) {
    if (block.type === 'spacer') { ensureSpace(block.height); y += block.height; continue; }
    if (block.type === 'rule') {
      const top = block.marginTop ?? 4;
      const bottom = block.marginBottom ?? 12;
      const strokeWidth = block.width ?? 1;
      ensureSpace(top + strokeWidth + bottom);
      y += top;
      doc.markContent('Artifact', { type: 'Layout' });
      doc.save().lineWidth(strokeWidth).strokeColor(block.color ?? '#d1d5db')
        .moveTo(margins.left, y).lineTo(doc.page.width - margins.right, y).stroke().restore();
      doc.endMarkedContent();
      y += strokeWidth + bottom;
      continue;
    }
    const fontSize = block.fontSize ?? options.defaults?.fontSize ?? 12;
    if ('minFollowingHeight' in block && block.minFollowingHeight) ensureSpace(block.minFollowingHeight);
    const lineHeight = fontSize * (block.lineHeight ?? options.defaults?.lineHeight ?? 1.45);
    const direction = block.direction ?? options.defaults?.direction ?? 'auto';
    const align = block.align ?? 'auto';
    const semantic = 'headingLevel' in block && block.headingLevel ? `H${block.headingLevel}` : 'P';
    const paragraph = doc.struct(semantic);
    structure.add(paragraph);
    doc.fontSize(fontSize).fillColor(block.color ?? options.defaults?.color ?? '#111827');
    const parts = block.text.split(/\r?\n/u);
    for (let index = 0; index < parts.length; index++) {
      for (const line of wrap(doc, parts[index], width(), direction)) {
        ensureSpace(lineHeight);
        const content = doc.markStructureContent(semantic);
        paragraph.add(content);
        drawLine(doc, line, margins.left, y, width(), direction, align);
        doc.endMarkedContent();
        y += lineHeight;
      }
      if (index < parts.length - 1) y += lineHeight * 0.25;
    }
    y += block.marginBottom ?? fontSize * 0.65;
  }
  doc.end();
  return completed;
}
