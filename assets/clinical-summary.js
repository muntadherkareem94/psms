// Shared PSMS read-only clinical summary renderer. All record values are escaped.
const extendedExams = [{"key":"neurologicalExam","title":"Neurological Examination","sections":[{"key":"cranialNerves","title":"1. Cranial Nerves (CN I–XII)","groups":[{"key":"cn1","label":"CN I — Olfactory","fields":[{"key":"smell","label":"Olfaction","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn2","label":"CN II — Optic","fields":[{"key":"visualAcuity","label":"Visual acuity","bilateral":true},{"key":"visualFields","label":"Visual fields (confrontation)","bilateral":true},{"key":"fundoscopy","label":"Fundoscopy","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn346","label":"CN III, IV & VI — Oculomotor, Trochlear and Abducens","fields":[{"key":"pupilSize","label":"Pupil size (mm)","bilateral":true},{"key":"directLightReflex","label":"Direct light reflex","bilateral":true},{"key":"consensualLightReflex","label":"Consensual light reflex","bilateral":true},{"key":"ptosis","label":"Ptosis","bilateral":true},{"key":"ocularMovements","label":"Extraocular movements","bilateral":true},{"key":"diplopia","label":"Diplopia","bilateral":false},{"key":"nystagmus","label":"Nystagmus","bilateral":false},{"key":"accommodation","label":"Accommodation / convergence","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn5","label":"CN V — Trigeminal","fields":[{"key":"v1Sensation","label":"V1 (ophthalmic) sensation","bilateral":true},{"key":"v2Sensation","label":"V2 (maxillary) sensation","bilateral":true},{"key":"v3Sensation","label":"V3 (mandibular) sensation","bilateral":true},{"key":"mastication","label":"Muscles of mastication","bilateral":true},{"key":"cornealReflex","label":"Corneal reflex (eye stimulated)","bilateral":true},{"key":"jawDeviation","label":"Jaw opening","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn7","label":"CN VII — Facial","fields":[{"key":"forehead","label":"Forehead wrinkling","bilateral":true},{"key":"eyeClosure","label":"Eye closure","bilateral":true},{"key":"lowerFace","label":"Smile / lower facial movement","bilateral":true},{"key":"facialPattern","label":"Facial weakness pattern","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn8","label":"CN VIII — Vestibulocochlear","fields":[{"key":"hearing","label":"Hearing","bilateral":true},{"key":"rinne","label":"Rinne test","bilateral":true},{"key":"weber","label":"Weber test","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn910","label":"CN IX & X — Glossopharyngeal and Vagus","fields":[{"key":"palate","label":"Palatal elevation","bilateral":false},{"key":"uvula","label":"Uvula","bilateral":false},{"key":"voice","label":"Voice","bilateral":false},{"key":"swallow","label":"Swallowing (if assessed)","bilateral":false},{"key":"gagReflex","label":"Gag reflex (if tested)","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn11","label":"CN XI — Accessory","fields":[{"key":"shoulderShrug","label":"Shoulder shrug","bilateral":true},{"key":"headTurn","label":"Head rotation toward side tested","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"cn12","label":"CN XII — Hypoglossal","fields":[{"key":"tongueProtrusion","label":"Tongue protrusion","bilateral":false},{"key":"tongueWasting","label":"Tongue wasting","bilateral":true},{"key":"fasciculations","label":"Tongue fasciculations","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]}]},{"key":"upperLimbs","title":"2. Upper Limbs","groups":[{"key":"inspection","label":"Inspection & muscle bulk","fields":[{"key":"muscleBulk","label":"Muscle bulk","bilateral":true},{"key":"fasciculations","label":"Fasciculations","bilateral":true},{"key":"involuntaryMovements","label":"Involuntary movements / tremor","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"tone","label":"Tone","fields":[{"key":"tone","label":"Muscle tone","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"power","label":"Power — MRC grading (0–5)","fields":[{"key":"shoulderAbduction","label":"Shoulder abduction (C5)","bilateral":true},{"key":"elbowFlexion","label":"Elbow flexion (C5–C6)","bilateral":true},{"key":"elbowExtension","label":"Elbow extension (C7)","bilateral":true},{"key":"wristExtension","label":"Wrist extension (C6–C7)","bilateral":true},{"key":"wristFlexion","label":"Wrist flexion","bilateral":true},{"key":"fingerExtension","label":"Finger extension (C7–C8)","bilateral":true},{"key":"fingerFlexion","label":"Finger flexion (C8)","bilateral":true},{"key":"fingerAbduction","label":"Finger abduction (T1)","bilateral":true},{"key":"thumbAbduction","label":"Thumb abduction","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"reflexes","label":"Deep tendon reflexes","fields":[{"key":"biceps","label":"Biceps (C5–C6)","bilateral":true},{"key":"supinator","label":"Brachioradialis (C5–C6)","bilateral":true},{"key":"triceps","label":"Triceps (C7–C8)","bilateral":true},{"key":"hoffmann","label":"Hoffmann sign","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"sensation","label":"Sensation","fields":[{"key":"lightTouch","label":"Light touch","bilateral":true},{"key":"pinprick","label":"Pinprick","bilateral":true},{"key":"temperature","label":"Temperature","bilateral":true},{"key":"vibration","label":"Vibration","bilateral":true},{"key":"jointPosition","label":"Joint position sense","bilateral":true},{"key":"distribution","label":"Sensory distribution / level","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"coordination","label":"Coordination & drift","fields":[{"key":"pronatorDrift","label":"Pronator drift","bilateral":true},{"key":"fingerNose","label":"Finger–nose test","bilateral":true},{"key":"rapidAlternating","label":"Rapid alternating movements","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]}]},{"key":"lowerLimbs","title":"3. Lower Limbs","groups":[{"key":"inspection","label":"Inspection & muscle bulk","fields":[{"key":"muscleBulk","label":"Muscle bulk","bilateral":true},{"key":"fasciculations","label":"Fasciculations","bilateral":true},{"key":"involuntaryMovements","label":"Involuntary movements / tremor","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"tone","label":"Tone","fields":[{"key":"tone","label":"Muscle tone","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"power","label":"Power — MRC grading (0–5)","fields":[{"key":"hipFlexion","label":"Hip flexion (L2–L3)","bilateral":true},{"key":"hipExtension","label":"Hip extension","bilateral":true},{"key":"hipAbduction","label":"Hip abduction","bilateral":true},{"key":"hipAdduction","label":"Hip adduction","bilateral":true},{"key":"kneeExtension","label":"Knee extension (L3–L4)","bilateral":true},{"key":"kneeFlexion","label":"Knee flexion (L5–S1)","bilateral":true},{"key":"ankleDorsiflexion","label":"Ankle dorsiflexion (L4–L5)","bilateral":true},{"key":"anklePlantarflexion","label":"Ankle plantarflexion (S1–S2)","bilateral":true},{"key":"greatToeExtension","label":"Great toe extension (L5)","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"reflexes","label":"Reflexes & plantar response","fields":[{"key":"knee","label":"Patellar (L3–L4)","bilateral":true},{"key":"ankle","label":"Achilles (S1–S2)","bilateral":true},{"key":"clonus","label":"Ankle clonus","bilateral":true},{"key":"plantar","label":"Plantar response","bilateral":true},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"sensation","label":"Sensation","fields":[{"key":"lightTouch","label":"Light touch","bilateral":true},{"key":"pinprick","label":"Pinprick","bilateral":true},{"key":"temperature","label":"Temperature","bilateral":true},{"key":"vibration","label":"Vibration","bilateral":true},{"key":"jointPosition","label":"Joint position sense","bilateral":true},{"key":"distribution","label":"Sensory distribution / level","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"coordination","label":"Coordination, gait & balance","fields":[{"key":"heelShin","label":"Heel–shin test","bilateral":true},{"key":"gait","label":"Gait","bilateral":false},{"key":"tandem","label":"Tandem gait","bilateral":false},{"key":"romberg","label":"Romberg test","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]}]}]},{"key":"abdominalExam","title":"Abdominal Examination","sections":[{"key":"","title":"","groups":[{"key":"inspection","label":"Inspection","fields":[{"key":"contour","label":"Abdominal contour","bilateral":false},{"key":"respiratoryMovement","label":"Movement with respiration","bilateral":false},{"key":"umbilicus","label":"Umbilicus","bilateral":false},{"key":"findings","label":"Visible findings","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"auscultation","label":"Auscultation","fields":[{"key":"bowelSounds","label":"Bowel sounds","bilateral":false},{"key":"bruits","label":"Bruits heard","bilateral":false},{"key":"bruitStatus","label":"Bruit assessment","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"percussion","label":"Percussion & ascites","fields":[{"key":"generalPercussion","label":"Percussion note","bilateral":false},{"key":"liverSpan","label":"Liver span at right midclavicular line (cm)","bilateral":false},{"key":"splenicDullness","label":"Splenic percussion","bilateral":false},{"key":"shiftingDullness","label":"Shifting dullness","bilateral":false},{"key":"fluidThrill","label":"Fluid thrill / wave","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"palpation","label":"Superficial & deep palpation","fields":[{"key":"consistency","label":"Abdominal wall","bilateral":false},{"key":"tenderness","label":"Tenderness","bilateral":false},{"key":"tenderRegions","label":"Site(s) of tenderness","bilateral":false},{"key":"guarding","label":"Guarding","bilateral":false},{"key":"rebound","label":"Rebound tenderness (if tested)","bilateral":false},{"key":"mass","label":"Palpable mass","bilateral":false},{"key":"massDetails","label":"Mass description","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"organs","label":"Organ palpation","fields":[{"key":"liver","label":"Liver","bilateral":false},{"key":"liverDetails","label":"Liver findings","bilateral":false},{"key":"spleen","label":"Spleen","bilateral":false},{"key":"spleenDetails","label":"Spleen findings","bilateral":false},{"key":"kidneys","label":"Kidneys (ballotment)","bilateral":true},{"key":"renalAngle","label":"Renal angle tenderness","bilateral":true},{"key":"kidneyDetails","label":"Kidney findings","bilateral":false},{"key":"aorta","label":"Abdominal aortic pulsation","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]},{"key":"specialSigns","label":"Special signs & hernial orifices","fields":[{"key":"murphy","label":"Murphy sign","bilateral":false},{"key":"mcburney","label":"McBurney point tenderness","bilateral":false},{"key":"rovsing","label":"Rovsing sign","bilateral":false},{"key":"psoas","label":"Psoas sign","bilateral":false},{"key":"obturator","label":"Obturator sign","bilateral":false},{"key":"inguinalHernia","label":"Inguinal hernia","bilateral":true},{"key":"femoralHernia","label":"Femoral hernia","bilateral":true},{"key":"umbilicalHernia","label":"Umbilical hernia","bilateral":false},{"key":"incisionalHernia","label":"Incisional hernia","bilateral":false},{"key":"otherExamination","label":"Other examination findings (if performed)","bilateral":false},{"key":"notes","label":"Additional findings","bilateral":false}]}]}]}];

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
function scalar(value) {
    if (typeof value === 'string') return value.trim() && value.trim() !== '--' ? value.trim() : '';
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return '';
}
const labels = {
    hpi:'History of presenting illness', dob:'Date of birth', gender:'Sex', bp:'Blood pressure (mmHg)',
    hr:'Heart rate (bpm)', rr:'Respiratory rate (breaths/min)', temp:'Temperature (°C)', spo2:'SpO₂ (%)', pain:'Pain (0–10)',
    height:'Height (cm)', weight:'Weight (kg)', bmi:'BMI (kg/m²)', gcs:'Glasgow Coma Scale', jvp:'JVP',
    abiResult:'Ankle-brachial index (ABI)', cvSigns:'Cardiovascular signs', bedsideEquipments:'Bedside equipment',
    lmp:'Last menstrual period', hadMenstrualCycle:'Ever menstruated', isPregnant:'Currently pregnant',
    isBreastfeeding:'Currently breastfeeding', isUsingOCP:'Using oral contraceptives', hasCondition:'Family medical conditions',
    hadPet:'Pet exposure', cigsPerDay:'Cigarettes per day', packYears:'Pack-years',
    abv:'Alcohol by volume (%)', 'drug-dose':'Dose', 'freq-select':'Frequency', 'route-select':'Route',
    'comp-select':'Adherence', 'drug-indication':'Indication', 'drug-side-effects':'Side effects',
    'drug-current-use':'Current use', 'drug-abuse-freq':'Frequency of use', 'route-abuse-select':'Routes',
    'drug-needle-sharing':'Needle sharing', 'drug-rehab':'Rehabilitation', 'drug-dependency-symptoms':'Dependency symptoms',
    'drug-allergy-severity':'Allergic reaction / severity', ga:'Gestational age', mod:'Mode of delivery',
    stdHistory:'STI history', stdWhat:'STIs', stdTreated:'STI treated', stdTreatmentKind:'STI treatment',
    stdPartnerTreated:'Partner treated', edHistory:'Erectile dysfunction', takenHrt:'Hormone replacement therapy',
    right:'Right',left:'Left', radialR:'Right radial',radialL:'Left radial',brachialR:'Right brachial',brachialL:'Left brachial',
    femoralR:'Right femoral',femoralL:'Left femoral',poplitealR:'Right popliteal',poplitealL:'Left popliteal',
    dorsalisPedisR:'Right dorsalis pedis',dorsalisPedisL:'Left dorsalis pedis',
    posteriorTibialR:'Right posterior tibial',posteriorTibialL:'Left posterior tibial'
};
function label(key) {
    return Object.hasOwn(labels,key) ? labels[key] : (String(key).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/^./, c=>c.toUpperCase()));
}
function line(name, value) {
    const text = scalar(value);
    return text ? '<p class="summary-field"><strong>'+escape(name)+':</strong> <span class="whitespace-pre-wrap">'+escape(text)+'</span></p>' : '';
}
function valueRows(value, name) {
    if (Array.isArray(value)) {
        const simple = value.every(v => v === null || typeof v !== 'object');
        if (simple) return line(name, value.map(scalar).filter(Boolean).join(', '));
        const rows = value.map((v, i) => {
            const content = valueRows(v, 'Item '+(i+1));
            return content ? '<div class="summary-item">'+content+'</div>' : '';
        }).join('');
        return rows ? '<div class="summary-group">'+(name ? '<strong>'+escape(name)+'</strong>' : '')+rows+'</div>' : '';
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length && entries.every(([k]) => k === 'right' || k === 'left')) {
            const side = v => Array.isArray(v) ? v.map(scalar).filter(Boolean).join(', ') : scalar(v);
            return line(name, ['right','left'].map(k => side(value[k]) ? label(k)+': '+side(value[k]) : '').filter(Boolean).join(' | '));
        }
        const rows = entries.map(([k,v]) => valueRows(v, label(k))).join('');
        return rows ? '<div class="summary-group">'+(name ? '<strong>'+escape(name)+'</strong>' : '')+rows+'</div>' : '';
    }
    return line(name, value);
}
function group(title, value) {
    const nested = value && typeof value === 'object' && (!Array.isArray(value) || value.some(v => v && typeof v === 'object'));
    const content = nested ? valueRows(value, '') : valueRows(value, title);
    if (!content) return '';
    return '<div class="summary-block">'+(nested ? '<h3 class="summary-subsection-title">'+escape(title)+'</h3>' : '')+content+'</div>';
}
function section(title, body, empty) {
    return '<section class="summary-section"><h2 class="summary-section-title">'+escape(title)+'</h2><div class="summary-content">'+(body || '<p class="text-gray-500">'+escape(empty)+'</p>')+'</div></section>';
}
export function demographicsOf(record) {
    const d = object(object(record.history).demographics);
    return {...d,name:d.name ?? record.name,dob:d.dob ?? record.dateOfBirth,gender:d.gender ?? record.gender,phoneNumber:d.phoneNumber ?? record.phone};
}
export function renderPatientHeader(record, fallback = 'Patient Summary') {
    const d = demographicsOf(record);
    const facts = [d.dob && 'DOB: '+d.dob,d.gender && 'Sex: '+d.gender,d.bloodGroup && 'Blood group: '+d.bloodGroup].filter(Boolean);
    return '<div class="summary-header"><h1 class="text-3xl font-bold text-gray-900">'+escape(d.name || fallback)+'</h1>'+(facts.length ? '<p class="text-md text-gray-600 mt-2">'+escape(facts.join(' | '))+'</p>' : '')+'</div>';
}
function renderHistory(record) {
    const h = object(record.history);
    const d = demographicsOf(record);
    const social = object(h.socioeconomic);
    const smoking = {...object(social.smoking)};
    if (!scalar(smoking.cigsPerDay) || !scalar(smoking.yearsSmoked)) delete smoking.packYears;
    if (smoking.status === 'non-smoker') { delete smoking.cigsPerDay; delete smoking.yearsSmoked; delete smoking.packYears; }
    const petHistory = {...object(social.petHistory)};
    if (petHistory.hadPet === 'no') delete petHistory.pets;
    const family = {...object(h.family)};
    if (family.hasCondition === 'no') delete family.members;
    if (family.consanguinity === 'no') delete family.degree;
    const gyn = {...object(h.gocms)};
    // The form saves hidden controls too. Do not present those as assessed.
    if (String(d.gender || '').toLowerCase() === 'male') {
        for (const key of Object.keys(gyn)) delete gyn[key];
    } else if (gyn.hadMenstrualCycle !== 'yes') {
        for (const key of Object.keys(gyn)) if (key !== 'hadMenstrualCycle') delete gyn[key];
    } else {
        if (!Array.isArray(gyn.symptoms) || !gyn.symptoms.includes('vaginal discharge')) delete gyn.dischargeDetails;
        if (gyn.obstetrical?.everPregnant !== 'yes') gyn.obstetrical = {everPregnant:gyn.obstetrical?.everPregnant};
        if (gyn.contraception?.everUsed !== 'yes') gyn.contraception = {everUsed:gyn.contraception?.everUsed};
        if (gyn.menopausalHistory?.takenHrt !== 'yes') gyn.menopausalHistory = {symptoms:gyn.menopausalHistory?.symptoms,takenHrt:gyn.menopausalHistory?.takenHrt};
    }
    const sex = {...object(h.sexual)};
    if (sex.active !== 'yes') for (const k of ['partnersMale','partnersFemale','practice','protection','protectionType']) delete sex[k];
    if (sex.protection !== 'yes') delete sex.protectionType;
    if (sex.stdHistory !== 'yes') for (const k of ['stdWhat','stdTreated','stdTreatmentKind','stdPartnerTreated']) delete sex[k];
    const groups = [
        ['Patient demographics',{maritalStatus:d.maritalStatus,occupation:d.occupation,address:d.address,phoneNumber:d.phoneNumber}],
        ['Chief Complaint',h.chiefComplaint],['History of Presenting Complaint',h.hpi],
        ['Systemic Review — recorded symptoms',h.systemicReview],['Past Medical History',h.pastMedical],
        ['Past Surgical History',h.pastSurgical],['Drug and Allergy History',h.drugHistory],
        ['Socioeconomic History',{smoking,alcohol:social.alcohol,petHistory}],
        ['Occupational History',h.occupational],['Gynecological and Obstetrical History',gyn],
        ['Family History',family],['Travel History',h.travel],['Sexual History',sex],['ENT History',h.ent],['Visual History',h.visual],
        ['Medical history (previous notes)',record.medicalHistory],['Medication (previous notes)',record.currentMedication],
        ['Allergies (previous notes)',record.allergies],['Previous history text',typeof record.history === 'string' ? record.history : record.legacyHistoryText]
    ];
    return section('History',groups.map(([title,value])=>group(title,value)).join(''),'No history findings recorded.');
}
function extendedExam(exam) {
    let html = '';
    for (const system of extendedExams) {
        let sections = '';
        for (const part of system.sections) {
            const data = part.key ? exam[system.key]?.[part.key] : exam[system.key];
            const groups = part.groups.map(g => {
                const fields = g.fields.map(f => valueRows(data?.[g.key]?.[f.key],f.label)).join('');
                return fields ? '<div class="summary-group"><strong>'+escape(g.label)+'</strong>'+fields+'</div>' : '';
            }).join('');
            if (groups) sections += (part.title ? '<h4 class="font-semibold mt-3 mb-2">'+escape(part.title)+'</h4>' : '')+groups;
        }
        if (sections) html += '<div class="summary-block"><h3 class="summary-subsection-title">'+escape(system.title)+'</h3>'+sections+'</div>';
    }
    return html;
}
function renderExamination(record) {
    const e = object(record.examination);
    const generalSurvey = {...object(e.generalSurvey)};
    const gcs = {...object(generalSurvey.gcs)};
    for (const k of ['eyes','verbal','motor']) if (String(gcs[k]) === '0') delete gcs[k];
    if (!gcs.eyes || !gcs.verbal || !gcs.motor) delete gcs.total;
    generalSurvey.gcs = gcs;
    const anthro = {...object(e.anthropometrics)};
    if (!scalar(anthro.height) || !scalar(anthro.weight)) delete anthro.bmi;
    const cv = {...object(e.cardiovascularExam)};
    if (cv.auscultation) cv.auscultation = {...object(cv.auscultation),murmur:cv.auscultation.murmurPresent === 'Yes' ? cv.auscultation.murmur : undefined};
    const nodes = {...object(e.lymphNodes)};
    if (nodes.palpable !== 'Local LAP') delete nodes.group;
    if (!nodes.palpable || /^no/i.test(nodes.palpable)) delete nodes.consistency;
    const groups = [
        ['General Survey',generalSurvey],['Vital Signs',e.vitals],['Anthropometric Measurements',anthro],
        ['Hand Examination',e.hand],['Eyes Examination',e.eyes],['Mouth Examination',e.mouth],
        ['Leg Edema',e.legEdema],['Lymph Nodes',nodes],['Jugular Venous Pressure',e.jvp],
        ['Cardiovascular System',cv],['Peripheral Vascular Examination',e.peripheralVascularExam],['Respiratory System',e.respiratoryBrief]
    ];
    const legacy = group('Physical examination (previous notes)',record.physicalExam);
    return section('Physical Examination',groups.map(([title,value])=>group(title,value)).join('')+extendedExam(e)+legacy,'No examination findings recorded.');
}
export function renderClinicalSections(record) {
    return renderHistory(record)+renderExamination(record);
}

// Full summary only: display all documented orders and treatment information,
// but never serialize raw base64 attachments into HTML.
function withoutAttachmentData(value) {
    if (Array.isArray(value)) return value.map(withoutAttachmentData);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([k])=>!['data','base64','dataUrl'].includes(k)).map(([k,v])=>[k,withoutAttachmentData(v)]));
    return value;
}
export function renderInvestigationAndTreatmentSections(record) {
    const i = object(record.investigation), t = object(record.treatment);
    const investigation = [
        ['Laboratory investigations',i.labTests],['Imaging studies',i.imaging],['Specialized investigations',i.specialtyTests],
        ['Attached results',withoutAttachmentData(i.uploadedFiles)],['General investigation notes',i.generalNotes],
        ['Hematology notes',i.generalHemNotes],['Histopathology notes',i.generalHistoNotes],
        ['Previously recorded investigation notes',typeof record.investigation === 'string' ? record.investigation : record.legacyInvestigationText]
    ];
    const treatment = [
        ['Diagnosis',t.diagnosis],['Pharmacological Plan',t.pharmacological],
        ['Interventional Plan',withoutAttachmentData(t.interventions)],['Medical Instructions',t.instructions],
        ['Previously recorded treatment notes',typeof record.treatment === 'string' ? record.treatment : record.legacyTreatmentText]
    ];
    return section('Investigations',investigation.map(([title,value])=>group(title,value)).join(''),'No investigations recorded.')+
        section('Final Diagnosis & Treatment',treatment.map(([title,value])=>group(title,value)).join(''),'No diagnosis or treatment recorded.');
}
