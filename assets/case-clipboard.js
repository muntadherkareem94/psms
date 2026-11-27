// Local complete-case export. Use exactly one clipboard format per action.
// Some paste targets prefer plain text and drop images when both formats are present.
import { investigationCategories, cleanPreviousInvestigations, safeImageUrl } from './previous-investigations.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function collectCaseReports(record) {
    const entries = cleanPreviousInvestigations(record?.previousInvestigations);
    const reports = [];
    for (const category of investigationCategories) {
        for (const entry of entries.filter(e=>e.category===category.id)) {
            const title = [category.label,entry.type,entry.name,entry.date].filter(Boolean).join(' · ');
            entry.attachments.forEach((attachment,index)=>{
                reports.push({
                    label:'Report '+(reports.length+1)+' — '+title+(entry.attachments.length>1?' · Image '+(index+1):''),
                    data:attachment.data
                });
            });
        }
    }
    return reports;
}
function validReports(reports) {
    if (!Array.isArray(reports)) throw new Error('Missing case report list.');
    if (reports.some(r=>!safeImageUrl(r?.data))) throw new Error('One of the report images is invalid.');
    return reports;
}
export function buildCaseClipboardHTML(text,reports) {
    const images = validReports(reports).map(r=>
        '<figure style="margin:20px 0;break-inside:avoid"><figcaption style="font-weight:600;margin-bottom:8px">'+
        escape(r.label)+'</figcaption><img src="'+escape(r.data)+'" alt="'+escape(r.label)+
        '" style="display:block;max-width:100%;height:auto;object-fit:contain"></figure>').join('');
    return '<div style="font-family:Arial,sans-serif;color:#172033"><div style="white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45">'+
        escape(text).replace(/\r?\n/g,'<br>')+'</div>'+(images?'<h2>Previous investigation report images</h2>'+images:'')+'</div>';
}

// Keep full lines and original image aspect ratios. The layout uses consecutively
// numbered panels so a PNG-aware paste target can receive the complete case in one image.
export function wrapCaseText(ctx,text,maxWidth) {
    const lines=[];
    for (const raw of String(text).replace(/\r\n?/g,'\n').split('\n')) {
        if (!raw.trim()) { lines.push('');continue; }
        let line='';
        for(const word of raw.trim().split(/\s+/u)) {
            if(ctx.measureText(word).width>maxWidth) {
                if(line){lines.push(line);line='';}
                let segment='';
                for(const char of Array.from(word)) {
                    if(segment&&ctx.measureText(segment+char).width>maxWidth){lines.push(segment);segment='';}
                    segment+=char;
                }
                line=segment;continue;
            }
            const candidate=line?line+' '+word:word;
            if(line&&ctx.measureText(candidate).width>maxWidth){lines.push(line);line=word;}
            else line=candidate;
        }
        lines.push(line);
    }
    return lines;
}

function loadReport(report) {
    const img = new Image();
    img.src=report.data;
    return img.decode().then(()=>{
        if(!img.naturalWidth||!img.naturalHeight)throw new Error('Unable to read a report image.');
        return {...report,img,width:img.naturalWidth,height:img.naturalHeight};
    });
}
export async function buildCompleteCasePNG(text,reports,{includeText=true}={}) {
    const decoded = await Promise.all(validReports(reports).map(loadReport));
    if(!includeText && decoded.length===1){
        // The reports-only action preserves a single report at its exact stored resolution.
        const report=decoded[0],canvas=document.createElement('canvas');
        canvas.width=report.width;canvas.height=report.height;
        const ctx=canvas.getContext('2d');
        if(!ctx)throw new Error('Canvas is unavailable.');
        ctx.drawImage(report.img,0,0);
        return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not copy the report.')),'image/png'));
    }
    const padding=38, gap=28, fontSize=30, lineHeight=44, minWidth=includeText?1540:700;
    const panelWidth=Math.max(minWidth,...decoded.map(r=>Math.min(r.width,2400)+padding*2));
    const innerWidth=panelWidth-padding*2;
    const scratch=document.createElement('canvas');
    const measure=scratch.getContext('2d');
    if(!measure)throw new Error('Canvas is unavailable.');
    const panels=[];
    if(includeText){
        measure.font=fontSize+'px Arial, sans-serif';
        const lines=wrapCaseText(measure,text,innerWidth);
        const perPanel=46;
        const pageCount=Math.max(1,Math.ceil(lines.length/perPanel));
        for(let i=0;i<pageCount;i++){
            const pageLines=lines.slice(i*perPanel,(i+1)*perPanel);
            panels.push({kind:'text',title:'Clinical summary · '+(i+1)+' / '+pageCount,
                lines:pageLines,height:padding*2+100+pageLines.length*lineHeight});
        }
    }
    for(const report of decoded) {
        measure.font='bold 28px Arial, sans-serif';
        const titleLines=wrapCaseText(measure,report.label,innerWidth);
        const fit=Math.min(1,innerWidth/report.width,2400/report.height);
        const drawW=Math.max(1,Math.round(report.width*fit));
        const drawH=Math.max(1,Math.round(report.height*fit));
        panels.push({kind:'image',titleLines,img:report.img,drawW,drawH,height:padding*2+titleLines.length*40+26+drawH});
    }
    if(!panels.length)throw new Error("No report images attached.");
    // A near-square panel grid avoids a single excessively tall image. Scale only
    // when browser canvas limits require it; every panel is retained, never cropped.
    const columns=Math.min(5,Math.max(1,Math.ceil(Math.sqrt(panels.length))));
    const rows=[];
    for(let i=0;i<panels.length;i+=columns){
        const row=panels.slice(i,i+columns);
        rows.push({panels:row,height:Math.max(...row.map(p=>p.height))});
    }
    const width=columns*panelWidth+(columns+1)*gap;
    const height=rows.reduce((sum,row)=>sum+row.height,0)+(rows.length+1)*gap;
    const scale=Math.min(1,12000/width,12000/height,Math.sqrt(30000000/(width*height)));
    if(!Number.isFinite(scale)||scale<=0)throw new Error('Invalid complete-case dimensions.');
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(width*scale));canvas.height=Math.max(1,Math.ceil(height*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas is unavailable.');
    ctx.scale(scale,scale);
    ctx.fillStyle='#e2e8f0';ctx.fillRect(0,0,width,height);
    ctx.textBaseline='top';
    let y=gap;
    for(const row of rows){
        for(let i=0;i<row.panels.length;i++){
            const panel=row.panels[i],x=gap+i*(panelWidth+gap);
            ctx.fillStyle='#fff';ctx.fillRect(x,y,panelWidth,panel.height);
            ctx.fillStyle='#0f766e';ctx.fillRect(x,y,panelWidth,9);
            ctx.fillStyle='#0f172a';
            if(panel.kind==='text'){
                ctx.font='bold 34px Arial, sans-serif';
                ctx.fillText(panel.title,x+padding,y+padding);
                ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;
                ctx.beginPath();ctx.moveTo(x+padding,y+padding+58);ctx.lineTo(x+panelWidth-padding,y+padding+58);ctx.stroke();
                ctx.font=fontSize+'px Arial, sans-serif';
                panel.lines.forEach((line,j)=>ctx.fillText(line,x+padding,y+padding+100+j*lineHeight));
            }else{
                ctx.font='bold 28px Arial, sans-serif';
                panel.titleLines.forEach((line,j)=>ctx.fillText(line,x+padding,y+padding+j*40));
                // Use the whole image, centered at its original aspect ratio.
                const dx=x+(panelWidth-panel.drawW)/2;
                const dy=y+padding+panel.titleLines.length*40+26;
                ctx.drawImage(panel.img,dx,dy,panel.drawW,panel.drawH);
            }
        }
        y+=row.height+gap;
    }
    return new Promise((resolve,reject)=>{
        canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not generate the complete case image.')),'image/png');
    });
}

export function copyCompleteCase(text,reports,{reportsOnly=false,stillAuthorized=()=>true}={}) {
    if(!stillAuthorized())throw new Error('Patient session changed.');
    validReports(reports);
    if(!reports.length){
        if(reportsOnly)throw new Error('No report images attached.');
        if(!navigator.clipboard?.writeText)throw new Error('Clipboard access is unavailable.');
        return navigator.clipboard.writeText(text);
    }
    if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error('This browser does not support copying report images.');
    // IMPORTANT: only write image/png when reports are present. A multi-format
    // item offers text as an alternative; ChatGPT may choose it and omit images.
    // The PNG contains both the reviewed summary and all full report images,
    // or just report images when explicitly requested for a second paste.
    const png=buildCompleteCasePNG(text,reports,{includeText:!reportsOnly}).then(blob=>{
        if(!stillAuthorized())throw new Error('Patient session changed.');
        return blob;
    });
    png.catch(()=>{});
    return navigator.clipboard.write([new ClipboardItem({'image/png':png})]);
}
