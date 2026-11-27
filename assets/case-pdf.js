// Client-only case export. Never sends case data to a PDF service.
// pdf-lib 1.17.1 is bundled locally (MIT, see assets/vendor/pdf-lib.LICENSE.md).
import { PDFDocument, StandardFonts, rgb, PDFOperator, PDFName, PDFHexString } from './vendor/pdf-lib.esm.min.js';
import { safeImageUrl } from './previous-investigations.js';

const A4 = [595.28, 841.89];
const MARGIN = 42;
const WIDTH = A4[0] - 2 * MARGIN;
const INK = rgb(0.09, 0.13, 0.2);
const TEAL = rgb(0.02, 0.43, 0.42);
const MUTED = rgb(0.35, 0.40, 0.45);
const BOTTOM = 56;
const TOP = A4[1] - 72;
const BODY_SIZE = 11;
const LEADING = 16;
const headings = new Set(['History','Physical Examination','Previous Investigations']);

function encodable(font, value) {
    try { font.encodeText(value); return true; } catch { return false; }
}
function canvasFor(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    return canvas;
}
function measure(font, text, size, bold = false) {
    if (encodable(font, text)) return font.widthOfTextAtSize(text, size);
    const ctx = canvasFor(1, 1).getContext('2d');
    ctx.font = (bold ? 'bold ' : '') + size + 'px Arial, sans-serif';
    return ctx.measureText(text).width;
}
function wrap(text, font, size, bold = false) {
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/u)) {
        const candidate = line ? line + ' ' + word : word;
        if (measure(font, candidate, size, bold) <= WIDTH) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        for (const ch of Array.from(word)) {
            if (line && measure(font, line + ch, size, bold) > WIDTH) {
                lines.push(line); line = '';
            }
            line += ch;
        }
    }
    if (line) lines.push(line);
    return lines;
}
function bytesFromDataUrl(data) {
    return Uint8Array.from(atob(data.slice(data.indexOf(',') + 1)), c => c.charCodeAt(0));
}
async function embedReport(pdf, data) {
    if (!safeImageUrl(data)) throw new Error('Invalid report image.');
    if (/^data:image\/png;/i.test(data)) return pdf.embedPng(bytesFromDataUrl(data));
    if (/^data:image\/jpe?g;/i.test(data)) return pdf.embedJpg(bytesFromDataUrl(data));
    // WebP and other supported image formats are decoded locally, without cropping.
    const img = new Image();
    img.src = data;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('Unreadable report.');
    const canvas = canvasFor(img.naturalWidth, img.naturalHeight);
    canvas.getContext('2d').drawImage(img, 0, 0);
    return pdf.embedPng(bytesFromDataUrl(canvas.toDataURL('image/png')));
}

// Standard-font English/Latin lines are true PDF text. For scripts and medical
// symbols beyond WinAnsi, use local high-resolution rendering plus a searchable
// Unicode ActualText layer so the original wording is preserved for extraction.
async function drawLine(pdf, page, text, y, font, size, color = INK, bold = false) {
    if (encodable(font, text)) {
        page.drawText(text, { x: MARGIN, y, size, font, color });
        return;
    }
    const scale = 3;
    const h = size + 7;
    const canvas = canvasFor(Math.ceil(WIDTH * scale), Math.ceil(h * scale));
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.font = (bold ? 'bold ' : '') + size + 'px Arial, sans-serif';
    ctx.fillStyle = '#172033';
    ctx.textBaseline = 'alphabetic';
    ctx.direction = 'ltr';
    ctx.fillText(text, 0, h - 4);
    const lineImage = await pdf.embedPng(bytesFromDataUrl(canvas.toDataURL('image/png')));
    page.drawImage(lineImage, { x: MARGIN, y: y - 4, width: canvas.width / scale, height: canvas.height / scale });
    page.pushOperators(PDFOperator.of('BDC', [PDFName.of('Span'), pdf.context.obj({ ActualText: PDFHexString.fromText(text) })]));
    page.drawText('x', { x: MARGIN, y, size, font, opacity: 0 });
    page.pushOperators(PDFOperator.of('EMC', []));
}

export async function buildClinicalCasePdf(text, reports = []) {
    if (!String(text).trim()) throw new Error('Missing case summary.');
    if (!Array.isArray(reports)) throw new Error('Missing reports.');
    const pdf = await PDFDocument.create();
    pdf.setTitle('PSMS clinical case');
    pdf.setSubject('Clinical summary and previous investigation reports');
    pdf.setCreator('PSMS');
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page, y;
    function addPage(section) {
        page = pdf.addPage(A4);
        page.drawText('PSMS  |  ' + section, { x: MARGIN, y: A4[1] - 40, font: bold, size: 12, color: TEAL });
        page.drawLine({ start: {x:MARGIN,y:A4[1]-50}, end: {x:A4[0]-MARGIN,y:A4[1]-50}, thickness: 1.1, color: TEAL });
        y = TOP;
    }
    addPage('Clinical summary');
    for (const raw of String(text).replace(/\r\n?/g,'\n').split('\n')) {
        const value = raw.trim();
        if (!value) { y -= 7; continue; }
        const heading = headings.has(value) || value.startsWith('CLINICAL SUMMARY');
        const font = heading ? bold : regular;
        const size = heading ? 13 : BODY_SIZE;
        const lines = wrap(value, font, size, heading);
        if (heading && y - 2 * LEADING < BOTTOM) addPage('Clinical summary - continued');
        for (const line of lines) {
            if (y < BOTTOM) addPage('Clinical summary - continued');
            await drawLine(pdf, page, line, y, font, size, heading ? TEAL : INK, heading);
            y -= heading ? 19 : LEADING;
        }
    }
    // Every attachment gets its own page. Fit inside page bounds with the
    // original aspect ratio, never slice/crop or drop a report.
    for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const image = await embedReport(pdf, report.data);
        addPage('Previous investigation reports');
        const label = String(report.label || 'Report ' + (i + 1)).trim();
        for (const line of wrap(label, bold, 12, true)) {
            if (y < BOTTOM + 70) addPage('Previous investigation reports - continued');
            await drawLine(pdf, page, line, y, bold, 12, INK, true);
            y -= 18;
        }
        y -= 12;
        const fit = Math.min(WIDTH/image.width, (y-BOTTOM)/image.height);
        if (!(fit > 0)) throw new Error('Report cannot fit the page.');
        const w = image.width * fit, h = image.height * fit;
        page.drawImage(image, { x: MARGIN + (WIDTH-w)/2, y: y-h, width:w, height:h });
    }
    const pages = pdf.getPages();
    pages.forEach((p, i) => {
        p.drawLine({ start:{x:MARGIN,y:43}, end:{x:A4[0]-MARGIN,y:43}, thickness:0.6, color:MUTED });
        p.drawText('Clinical case  |  Review findings and images before sharing', {x:MARGIN,y:28,font:regular,size:8,color:MUTED});
        const number = (i+1) + ' / ' + pages.length;
        p.drawText(number, {x:A4[0]-MARGIN-regular.widthOfTextAtSize(number,8),y:28,font:regular,size:8,color:MUTED});
    });
    return pdf.save();
}

export function downloadClinicalCasePdf(bytes) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PSMS-clinical-case.pdf';
    document.body.append(link);
    try { link.click(); } finally {
        link.remove();
        // Allow enough time for the browser download to consume the Blob.
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
}
