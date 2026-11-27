// PSMS previous investigation data contract and renderer.
// Attachments remain inside the doctor's existing patient record; no external upload service.
export const investigationCategories = [
    {id:'lab', label:'Laboratory investigations', types:['Complete blood count (CBC)','Biochemistry','Renal function','Liver function','Electrolytes','Hormonal assays','Glucose / HbA1c','Lipid profile','Urinalysis','Coagulation','Immunology / serology','Microbiology','Other laboratory test']},
    {id:'imaging', label:'Imaging studies', types:['X-ray','CT scan','MRI','Ultrasound','Doppler ultrasound','Mammography','Nuclear medicine / PET','Other imaging']},
    {id:'cardiac', label:'Cardiac investigations', types:['ECG','Echocardiography','Holter monitoring','Ambulatory blood pressure','Exercise / stress test','Coronary angiography','Other cardiac investigation']},
    {id:'other', label:'Other investigations', types:['Endoscopy','Histopathology / biopsy','Pulmonary function test','Neurophysiology','Other investigation']}
];
export const maxRecordBytes = 900000; // Conservative margin below Firestore's 1 MiB document limit.
export const maxImageCharacters = 340000;
export const maxAttachments = 20;
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const str = v => typeof v === 'string' ? v.trim() : '';
export const safeImageUrl = v => typeof v === 'string' && v.length <= maxImageCharacters && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v) ? v : '';
export const byteSize = v => new TextEncoder().encode(JSON.stringify(v)).length;
export function normalizePreviousInvestigations(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(x => x && typeof x === 'object').map(x => ({
        category: investigationCategories.some(c=>c.id===x.category) ? x.category : 'other',
        type: str(x.type),
        name: str(x.name),
        date: str(x.date),
        results: str(x.results),
        attachments: Array.isArray(x.attachments) ? x.attachments
            .filter(a=>a && safeImageUrl(a.data)).map(a=>({name:str(a.name),data:a.data})) : []
    }));
}
export function hasInvestigationContent(entry) {
    return Boolean(entry.type || entry.name || entry.results || entry.attachments.length);
}
export function cleanPreviousInvestigations(value) {
    return normalizePreviousInvestigations(value).filter(hasInvestigationContent);
}
export function recordWithPreviousInvestigations(record, entries) {
    const next = {...record,previousInvestigations:cleanPreviousInvestigations(entries)};
    if (next.previousInvestigations.length && byteSize(next)>maxRecordBytes) {
        throw new Error('This patient record is too large to save safely. Remove some report images or add the findings as text.');
    }
    return next;
}
export function renderPreviousInvestigations(record, {includeImages=true,hideDirectIdentifiers=false,copyImages=false}={}) {
    const entries=cleanPreviousInvestigations(record.previousInvestigations);
    const groups=investigationCategories.map(cat=>{
        const tests=entries.filter(e=>e.category===cat.id);
        if(!tests.length) return '';
        return '<div class="previous-summary-category"><h3 class="summary-subsection-title">'+esc(cat.label)+'</h3>'+tests.map((e,i)=>{
            const title=[e.type,e.name].filter(Boolean).join(' — ') || 'Investigation '+(i+1);
            let html='<article class="previous-summary-item"><h4 class="previous-summary-test">'+esc(title)+'</h4>';
            if(e.date) html+='<p class="summary-field"><strong>Date:</strong> '+esc(e.date)+'</p>';
            if(e.results) html+='<p class="summary-field"><strong>Findings / values:</strong> <span class="whitespace-pre-wrap">'+esc(e.results)+'</span></p>';
            if(e.attachments.length) {
                if (includeImages) html+=e.attachments.map((a,j)=>'<figure class="report-figure"><img class="report-image" src="'+esc(a.data)+'" alt="Investigation report '+(j+1)+'" decoding="sync"><figcaption>Report '+(j+1)+(a.name&&!hideDirectIdentifiers?' · '+esc(a.name):'')+'</figcaption>'+(copyImages?'<button type="button" class="report-copy-button no-print" data-copy-report>Copy image</button>':'')+'</figure>').join('');
                else html+='<p class="summary-field">'+e.attachments.length+' report image(s) attached — not included in text export.</p>';
            }
            return html+'</article>';
        }).join('')+'</div>';
    }).join('');
    return '<section class="summary-section previous-investigations-section"><h2 class="summary-section-title">Previous Investigations</h2><div class="summary-content">'+(groups||'<p class="text-gray-500">No previous investigations recorded.</p>')+'</div></section>';
}

// Rasterize locally to strip metadata and constrain the size. Never crop the report.
export async function prepareReportImage(file) {
    if(!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Please choose a JPG, PNG or WebP image.');
    if(file.size>20*1024*1024) throw new Error('Report image exceeds 20 MB. Please choose a smaller image.');
    const url=URL.createObjectURL(file);
    try {
        const img=new Image();
        img.src=url;
        await img.decode();
        if(!img.naturalWidth || !img.naturalHeight) throw new Error('Could not read the image.');
        const canvas=document.createElement('canvas');
        const ctx=canvas.getContext('2d');
        if(!ctx) throw new Error('Image processing is unavailable in this browser.');
        const long=Math.max(img.naturalWidth,img.naturalHeight);
        for (const size of [2200,1800,1500,1200]) {
            const scale=Math.min(1,size/long);
            canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
            canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
            ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
            for(const quality of [.88,.78,.68]) {
                const data=canvas.toDataURL('image/jpeg',quality);
                if(safeImageUrl(data)) return {name:file.name.slice(0,180),data};
            }
        }
        throw new Error('This report is too large to preserve within the current record size. Choose a smaller image or enter its findings as text.');
    } finally {URL.revokeObjectURL(url);}
}
export function ageInYears(dob, now=new Date()) {
    if(typeof dob!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
    const [y,m,d]=dob.split('-').map(Number);
    const t=new Date(Date.UTC(y,m-1,d));
    if(t.getUTCFullYear()!==y||t.getUTCMonth()!==m-1||t.getUTCDate()!==d) return null;
    let age=now.getFullYear()-y;
    if(now.getMonth()+1<m || (now.getMonth()+1===m&&now.getDate()<d)) age--;
    return age>=0&&age<=130?age:null;
}
export function copyReportImage(img) {
    if(!navigator.clipboard?.write || typeof ClipboardItem==='undefined') throw new Error('Image clipboard is unavailable. Right-click the report and choose Copy image, or use Export PDF.');
    const imageData = new Promise((resolve,reject)=>{
        const convert=()=>{
            try {
                const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
                if(!c.width || !c.height) return reject(new Error('Image is not loaded.'));
                c.getContext('2d').drawImage(img,0,0);
                c.toBlob(blob=>blob?resolve(blob):reject(new Error('Unable to copy image.')),'image/png');
            } catch(error){reject(error);}
        };
        if(img.complete) convert(); else img.decode().then(convert,reject);
    });
    return navigator.clipboard.write([new ClipboardItem({'image/png':imageData})]);
}
