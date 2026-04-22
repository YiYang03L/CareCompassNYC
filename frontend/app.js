const API_BASE = 'http://localhost:8000';
let lang = 'en';
let autoVoice = false;

// Voice session state
let vsActive = false;
let vsRecording = false;
let vsMediaRecorder = null;
let vsAudioChunks = [];
let vsCurrentAudio = null;

// ── UI text translations ────────────────────────────────────────────
const UI_TEXT = {
    en: {
        navTagline:   "Healthcare Navigator for New York's Communities",
        panelTitle:   "AI Health Navigator",
        welcomeTitle: "How can I help you today?",
        welcomeSub:   "Ask me anything about healthcare resources, insurance, or clinics in New York City — in any language.",
        chips: [
            "I have no insurance. Where can I get free care in NYC?",
            "Am I eligible for Medicaid?",
            "What is NYC Care and how do I apply?",
            "I got a hospital bill I don't understand"
        ],
        inputPlaceholder: "Ask about healthcare resources...",
        vsDesc:       "Talk to CareCompass like a phone call. Ask in any language, get an instant spoken answer.",
        vsBtnLabel:   "Start Voice Session",
        vsRecLabel:   "Tap to speak",
        vsStopLabel:  "Tap to stop",
        uploadTitle:  "Insurance Card",
        uploadDesc:   "Upload your card — I'll decode every term (Premium, Deductible, Copay) with concrete examples.",
        uploadHint:   "Click to upload",
        analyzeLabel: "Analyze Card",
        resourcesTitle: "NYC Resources",
        resNycCare:   "Free/low-cost. No immigration check.",
        resMedicaid:  "Government insurance for low income.",
        resEmergency: "Emergency care regardless of status.",
        resFqhc:      "Community health centers, income-based fee.",
        disclaimer:   "Information only. Always consult a healthcare professional for medical advice.",
        loading:      "Processing...",
        lbl1: "Immigrant", lbl2: "Gig Worker", lbl3: "Uninsured", lbl4: "Senior", lbl5: "Low Income",
        illustNote:   "→ Replace with your own hand-drawn characters (see comments in index.html)",
        recStatus:    "Recording — tap mic to stop",
        vsStatusIdle: "Tap the mic to start speaking",
        vsStatusRec:  "Listening...",
        vsStatusProc: "Processing...",
        vsStatusSpeak:"Speaking...",
    },
    zh: {
        navTagline:   "纽约市社区医疗资源导航",
        panelTitle:   "AI 医疗导航助手",
        welcomeTitle: "今天我能为您做些什么？",
        welcomeSub:   "用您的语言询问纽约市的医疗资源、保险或诊所信息。",
        chips: [
            "我没有保险，哪里可以免费就医？",
            "我有资格申请 Medicaid 吗？",
            "什么是 NYC Care？如何申请？",
            "我收到了看不懂的医院账单"
        ],
        inputPlaceholder: "询问医疗资源...",
        vsDesc:       "像打电话一样和 CareCompass 对话，用任何语言提问，立即获得语音回答。",
        vsBtnLabel:   "开始语音会话",
        vsRecLabel:   "点击说话",
        vsStopLabel:  "点击停止",
        uploadTitle:  "保险卡分析",
        uploadDesc:   "上传保险卡，我用简单语言并附具体例子解释每个术语。",
        uploadHint:   "点击上传",
        analyzeLabel: "分析保险卡",
        resourcesTitle: "纽约医疗资源",
        resNycCare:   "免费/低价，不查移民身份。",
        resMedicaid:  "政府保险，适合低收入人群。",
        resEmergency: "紧急医疗，不论移民身份。",
        resFqhc:      "社区健康中心，按收入收费。",
        disclaimer:   "仅供参考，医疗建议请咨询专业医疗人员。",
        loading:      "处理中...",
        lbl1: "移民", lbl2: "打零工者", lbl3: "无保险", lbl4: "老年人", lbl5: "低收入",
        illustNote:   "→ 替换成您自己的手绘角色（见 index.html 注释说明）",
        recStatus:    "录音中 — 点击麦克风停止",
        vsStatusIdle: "点击麦克风开始说话",
        vsStatusRec:  "正在聆听...",
        vsStatusProc: "处理中...",
        vsStatusSpeak:"AI 正在回答...",
    },
    es: {
        navTagline:   "Navegador de salud para las comunidades de Nueva York",
        panelTitle:   "Navegador de Salud IA",
        welcomeTitle: "¿Cómo puedo ayudarte hoy?",
        welcomeSub:   "Pregúntame sobre recursos de salud, seguros o clínicas en Nueva York — en cualquier idioma.",
        chips: [
            "No tengo seguro. ¿Dónde puedo recibir atención gratuita?",
            "¿Soy elegible para Medicaid?",
            "¿Qué es NYC Care y cómo aplico?",
            "Recibí una factura del hospital que no entiendo"
        ],
        inputPlaceholder: "Pregunta sobre recursos de salud...",
        vsDesc:       "Habla con CareCompass como una llamada telefónica.",
        vsBtnLabel:   "Iniciar sesión de voz",
        vsRecLabel:   "Toca para hablar",
        vsStopLabel:  "Toca para parar",
        uploadTitle:  "Tarjeta de seguro",
        uploadDesc:   "Sube tu tarjeta y explico cada término con ejemplos concretos.",
        uploadHint:   "Haz clic para subir",
        analyzeLabel: "Analizar tarjeta",
        resourcesTitle: "Recursos de NYC",
        resNycCare:   "Gratis/bajo costo. Sin verificación de inmigración.",
        resMedicaid:  "Seguro gubernamental para bajos ingresos.",
        resEmergency: "Atención de emergencia sin importar el estatus.",
        resFqhc:      "Centros de salud comunitarios, tarifa según ingresos.",
        disclaimer:   "Solo información. Consulte a un profesional de la salud.",
        loading:      "Procesando...",
        lbl1: "Inmigrante", lbl2: "Trabajador gig", lbl3: "Sin seguro", lbl4: "Mayor", lbl5: "Bajos ingresos",
        illustNote:   "→ Reemplaza con tus propias ilustraciones dibujadas a mano",
        recStatus:    "Grabando — toca el mic para parar",
        vsStatusIdle: "Toca el mic para hablar",
        vsStatusRec:  "Escuchando...",
        vsStatusProc: "Procesando...",
        vsStatusSpeak:"Hablando...",
    },
    hi: {
        navTagline:   "न्यूयॉर्क के समुदायों के लिए स्वास्थ्य सेवा नेविगेटर",
        panelTitle:   "AI स्वास्थ्य नेविगेटर",
        welcomeTitle: "आज मैं आपकी कैसे मदद कर सकता हूँ?",
        welcomeSub:   "न्यूयॉर्क में स्वास्थ्य सेवाओं, बीमा या क्लीनिक के बारे में किसी भी भाषा में पूछें।",
        chips: [
            "मेरे पास बीमा नहीं है, मुझे मुफ्त में कहाँ देखभाल मिल सकती है?",
            "क्या मैं Medicaid के लिए पात्र हूँ?",
            "NYC Care क्या है और मैं कैसे आवेदन करूँ?",
            "मुझे अस्पताल का एक बिल मिला जो मुझे समझ नहीं आया"
        ],
        inputPlaceholder: "स्वास्थ्य सेवाओं के बारे में पूछें...",
        vsDesc:       "फोन कॉल की तरह CareCompass से बात करें।",
        vsBtnLabel:   "वॉइस सेशन शुरू करें",
        vsRecLabel:   "बोलने के लिए टैप करें",
        vsStopLabel:  "रोकने के लिए टैप करें",
        uploadTitle:  "बीमा कार्ड",
        uploadDesc:   "अपना कार्ड अपलोड करें — मैं हर शब्द को उदाहरण सहित समझाऊँगा।",
        uploadHint:   "अपलोड करने के लिए क्लिक करें",
        analyzeLabel: "कार्ड का विश्लेषण करें",
        resourcesTitle: "NYC संसाधन",
        resNycCare:   "मुफ्त/कम लागत। कोई आव्रजन जाँच नहीं।",
        resMedicaid:  "कम आय वालों के लिए सरकारी बीमा।",
        resEmergency: "किसी भी स्थिति में आपातकालीन देखभाल।",
        resFqhc:      "सामुदायिक स्वास्थ्य केंद्र, आय-आधारित शुल्क।",
        disclaimer:   "केवल जानकारी। चिकित्सा सलाह के लिए डॉक्टर से मिलें।",
        loading:      "प्रसंस्करण...",
        lbl1: "प्रवासी", lbl2: "गिग वर्कर", lbl3: "अबीमाकृत", lbl4: "वरिष्ठ", lbl5: "कम आय",
        illustNote:   "→ अपने हाथ से बनाए चित्रों से बदलें",
        recStatus:    "रिकॉर्डिंग हो रही है",
        vsStatusIdle: "बोलने के लिए mic टैप करें",
        vsStatusRec:  "सुन रहा है...",
        vsStatusProc: "प्रसंस्करण...",
        vsStatusSpeak:"बोल रहा है...",
    },
    ar: {
        navTagline:   "دليل الرعاية الصحية لمجتمعات نيويورك",
        panelTitle:   "مساعد الصحة الذكي",
        welcomeTitle: "كيف يمكنني مساعدتك اليوم؟",
        welcomeSub:   "اسألني عن الرعاية الصحية والتأمين والعيادات في نيويورك — بأي لغة.",
        chips: [
            "ليس لدي تأمين، أين يمكنني الحصول على رعاية مجانية؟",
            "هل أنا مؤهل لـ Medicaid؟",
            "ما هو NYC Care وكيف أتقدم له؟",
            "وصلتني فاتورة مستشفى لا أفهمها"
        ],
        inputPlaceholder: "اسأل عن الموارد الصحية...",
        vsDesc:       "تحدث مع CareCompass مثل مكالمة هاتفية.",
        vsBtnLabel:   "بدء جلسة صوتية",
        vsRecLabel:   "انقر للتحدث",
        vsStopLabel:  "انقر للإيقاف",
        uploadTitle:  "بطاقة التأمين",
        uploadDesc:   "ارفع بطاقتك وسأشرح كل مصطلح بأمثلة ملموسة.",
        uploadHint:   "انقر للرفع",
        analyzeLabel: "تحليل البطاقة",
        resourcesTitle: "موارد نيويورك",
        resNycCare:   "مجاني/بتكلفة منخفضة. لا يشترط وضع الإقامة.",
        resMedicaid:  "تأمين حكومي لمحدودي الدخل.",
        resEmergency: "رعاية طارئة بغض النظر عن الوضع.",
        resFqhc:      "مراكز صحة مجتمعية، رسوم حسب الدخل.",
        disclaimer:   "معلومات فقط. استشر طبيباً للحصول على نصيحة طبية.",
        loading:      "جارٍ المعالجة...",
        lbl1: "مهاجر", lbl2: "عامل جيج", lbl3: "بلا تأمين", lbl4: "مسن", lbl5: "دخل منخفض",
        illustNote:   "→ استبدل بشخصياتك المرسومة يدوياً",
        recStatus:    "جارٍ التسجيل",
        vsStatusIdle: "انقر على الميكروفون للتحدث",
        vsStatusRec:  "جارٍ الاستماع...",
        vsStatusProc: "جارٍ المعالجة...",
        vsStatusSpeak:"جارٍ الإجابة...",
    },
    ru: {
        navTagline:   "Навигатор здравоохранения для общин Нью-Йорка",
        panelTitle:   "ИИ-навигатор здоровья",
        welcomeTitle: "Чем я могу помочь вам сегодня?",
        welcomeSub:   "Спросите о медицинских ресурсах, страховке или клиниках Нью-Йорка — на любом языке.",
        chips: [
            "У меня нет страховки. Где получить бесплатную помощь?",
            "Имею ли я право на Medicaid?",
            "Что такое NYC Care и как подать заявку?",
            "Я получил счёт из больницы, который не понимаю"
        ],
        inputPlaceholder: "Спросите о медицинских ресурсах...",
        vsDesc:       "Говорите с CareCompass как по телефону.",
        vsBtnLabel:   "Начать голосовой сеанс",
        vsRecLabel:   "Нажмите, чтобы говорить",
        vsStopLabel:  "Нажмите, чтобы остановить",
        uploadTitle:  "Страховая карта",
        uploadDesc:   "Загрузите карту — объясню каждый термин на примерах.",
        uploadHint:   "Нажмите для загрузки",
        analyzeLabel: "Анализировать карту",
        resourcesTitle: "Ресурсы NYC",
        resNycCare:   "Бесплатно/дёшево. Без проверки статуса.",
        resMedicaid:  "Государственная страховка для малоимущих.",
        resEmergency: "Экстренная помощь вне зависимости от статуса.",
        resFqhc:      "Общественные центры здоровья, оплата по доходу.",
        disclaimer:   "Только информация. Обратитесь к врачу за медицинской консультацией.",
        loading:      "Обработка...",
        lbl1: "Иммигрант", lbl2: "Гиг-работник", lbl3: "Без страховки", lbl4: "Пожилой", lbl5: "Низкий доход",
        illustNote:   "→ Замените своими нарисованными от руки персонажами",
        recStatus:    "Идёт запись",
        vsStatusIdle: "Нажмите микрофон, чтобы говорить",
        vsStatusRec:  "Слушаю...",
        vsStatusProc: "Обработка...",
        vsStatusSpeak:"Отвечаю...",
    },
    fr: {
        navTagline:   "Navigateur de santé pour les communautés de New York",
        panelTitle:   "Navigateur de santé IA",
        welcomeTitle: "Comment puis-je vous aider aujourd'hui ?",
        welcomeSub:   "Posez vos questions sur la santé, l'assurance ou les cliniques à New York — dans n'importe quelle langue.",
        chips: [
            "Je n'ai pas d'assurance. Où puis-je obtenir des soins gratuits ?",
            "Suis-je éligible à Medicaid ?",
            "Qu'est-ce que NYC Care et comment faire une demande ?",
            "J'ai reçu une facture d'hôpital que je ne comprends pas"
        ],
        inputPlaceholder: "Posez des questions sur les ressources de santé...",
        vsDesc:       "Parlez à CareCompass comme lors d'un appel téléphonique.",
        vsBtnLabel:   "Démarrer session vocale",
        vsRecLabel:   "Appuyer pour parler",
        vsStopLabel:  "Appuyer pour arrêter",
        uploadTitle:  "Carte d'assurance",
        uploadDesc:   "Uploadez votre carte — j'explique chaque terme avec des exemples concrets.",
        uploadHint:   "Cliquer pour uploader",
        analyzeLabel: "Analyser la carte",
        resourcesTitle: "Ressources NYC",
        resNycCare:   "Gratuit/peu coûteux. Sans vérification d'immigration.",
        resMedicaid:  "Assurance gouvernementale pour faibles revenus.",
        resEmergency: "Soins d'urgence quel que soit le statut.",
        resFqhc:      "Centres de santé communautaires, tarif selon revenus.",
        disclaimer:   "Information uniquement. Consultez un professionnel de santé.",
        loading:      "Traitement en cours...",
        lbl1: "Immigrant", lbl2: "Travailleur gig", lbl3: "Non assuré", lbl4: "Senior", lbl5: "Faible revenu",
        illustNote:   "→ Remplacez par vos propres illustrations dessinées à la main",
        recStatus:    "Enregistrement en cours",
        vsStatusIdle: "Appuyez sur le micro pour parler",
        vsStatusRec:  "À l'écoute...",
        vsStatusProc: "Traitement...",
        vsStatusSpeak:"En train de répondre...",
    },
};

// ── Language switch ─────────────────────────────────────────────────
function setLanguage(l) {
    lang = l;
    const t = UI_TEXT[l] || UI_TEXT.en;

    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    const ph  = (id, val) => { const el = document.getElementById(id); if(el) el.placeholder = val; };

    set('nav-tagline', t.navTagline);
    set('panel-title-text', t.panelTitle);
    set('welcome-title', t.welcomeTitle);
    set('welcome-sub', t.welcomeSub);
    set('vs-desc', t.vsDesc);
    set('vs-btn-label', t.vsBtnLabel);
    set('vs-record-label', t.vsRecLabel);
    set('upload-title', t.uploadTitle);
    set('upload-desc', t.uploadDesc);
    set('upload-hint-label', t.uploadHint);
    set('analyze-label', t.analyzeLabel);
    set('resources-title', t.resourcesTitle);
    set('res-nyc-care', t.resNycCare);
    set('res-medicaid', t.resMedicaid);
    set('res-emergency', t.resEmergency);
    set('res-fqhc', t.resFqhc);
    set('disclaimer-text', t.disclaimer);
    set('loading-text', t.loading);
    set('illus-note', t.illustNote);
    set('lbl-1', t.lbl1);
    set('lbl-2', t.lbl2);
    set('lbl-3', t.lbl3);
    set('lbl-4', t.lbl4);
    set('lbl-5', t.lbl5);
    ph('chat-input', t.inputPlaceholder);

    // Quick chips
    const chips = document.querySelectorAll('#quick-chips .chip');
    t.chips.forEach((text, i) => { if(chips[i]) chips[i].textContent = text; });

    // RTL for Arabic
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
}

// ── Init ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setLanguage('en');
    const ta = document.getElementById('chat-input');
    ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
    });
    ta.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    // Zipcode enter key
    const zipInput = document.getElementById('zip-input');
    if (zipInput) zipInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') searchByZip();
    });

});

// ── Auto-voice toggle ───────────────────────────────────────────────
function toggleAutoVoice() {
    autoVoice = !autoVoice;
    document.getElementById('auto-voice-btn').classList.toggle('active', autoVoice);
}

// ── Quick chips ─────────────────────────────────────────────────────
function useChip(btn) {
    document.getElementById('chat-input').value = btn.textContent.trim();
    sendMessage();
}

// ── Message helpers ─────────────────────────────────────────────────
function clearWelcome() {
    const w = document.getElementById('welcome-screen');
    if (w) w.remove();
}

function addMessage(text, role, voiceTag = false) {
    clearWelcome();
    const container = document.getElementById('chat-messages');
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    if (role === 'ai') {
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
        row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (voiceTag && role === 'user') {
        const label = document.createElement('div');
        label.className = 'voice-label';
        label.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg> Voice`;
        bubble.appendChild(label);
    }
    const content = document.createElement('div');
    if (role === 'ai' && typeof marked !== 'undefined') {
        content.className = 'md-content';
        content.innerHTML = marked.parse(text);
    } else {
        content.textContent = text;
    }
    bubble.appendChild(content);
    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return row;
}

function addFacilityCards(facilities) {
    if (!facilities || facilities.length === 0) return;
    const container = document.getElementById('chat-messages');
    const row = document.createElement('div');
    row.className = 'facilities-row';
    facilities.forEach(f => {
        const card = document.createElement('a');
        card.className = 'fac-card';
        card.href = f.website || '#';
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        const typeLabel = f.type === 'public_hospital' ? 'Public Hospital' : 'Community Clinic';
        const langBadges = (f.languages || []).slice(0,4)
            .map(l => `<span style="font-size:9px;padding:1px 5px;background:rgba(26,145,130,.1);border-radius:10px;color:var(--primary)">${l.toUpperCase()}</span>`)
            .join(' ');
        card.innerHTML = `
            <div class="fac-type">${typeLabel} · ${f.borough}</div>
            <div class="fac-name">${f.name} <span style="font-size:10px;color:var(--primary)">↗</span></div>
            <div class="fac-addr">${f.address}</div>
            <div class="fac-cost">${f.cost}</div>
            <div style="margin-top:5px;display:flex;gap:3px;flex-wrap:wrap">${langBadges}</div>
            <div class="fac-phone">${f.phone}</div>`;
        row.appendChild(card);
    });
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
}

// ── Zipcode search ──────────────────────────────────────────────────
async function searchByZip() {
    const zip = document.getElementById('zip-input').value.trim();
    if (zip.length < 5) {
        document.getElementById('zip-input').focus();
        return;
    }
    const insurance = document.getElementById('zip-insurance').value;
    const btn = document.getElementById('zip-search-btn');
    const resultsDiv = document.getElementById('zip-results');

    btn.style.opacity = '0.6';
    resultsDiv.style.display = 'none';

    try {
        const params = new URLSearchParams({ zipcode: zip });
        if (insurance) params.set('insurance', insurance);
        const res = await fetch(`${API_BASE}/api/facilities/search?${params}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        if (data.facilities.length === 0) {
            resultsDiv.innerHTML = `<p style="font-size:12px;color:var(--t2)">No facilities found for this ZIP code.</p>`;
        } else {
            const insuranceNote = insurance === 'none'
                ? ' · <span style="color:#1a9182;font-weight:600">Free / sliding scale only</span>'
                : insurance === 'medicaid'
                ? ' · <span style="color:#3b82f6;font-weight:600">Accepts Medicaid</span>'
                : insurance === 'medicare'
                ? ' · <span style="color:#7c3aed;font-weight:600">Accepts Medicare</span>'
                : insurance === 'private'
                ? ' · <span style="color:#e07a52;font-weight:600">Private insurance</span>'
                : '';
            const boroughLabel = `<div class="zip-borough-label">📍 ${data.borough} — ${data.total} result${data.total !== 1 ? 's' : ''}${insuranceNote}</div>`;
            const cards = data.facilities.map(f => {
                const typeLabel = f.type === 'public_hospital' ? 'Public Hospital' : 'Community Clinic';
                const langBadges = (f.languages || []).slice(0,3)
                    .map(l => `<span style="font-size:9px;padding:1px 5px;background:rgba(26,145,130,.1);border-radius:10px;color:var(--primary)">${l.toUpperCase()}</span>`)
                    .join(' ');
                return `<a class="zip-fac-card" href="${f.website || '#'}" target="_blank" rel="noopener">
                    <div class="zip-fac-type">${typeLabel}</div>
                    <div class="zip-fac-name">${f.name} <span style="font-size:10px;color:var(--primary)">↗</span></div>
                    <div class="zip-fac-addr">${f.address}</div>
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px">
                        <span class="zip-fac-cost">${f.cost}</span>
                        <span style="font-size:10px;color:var(--t3)">${f.phone}</span>
                    </div>
                    <div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">${langBadges}</div>
                </a>`;
            }).join('');
            resultsDiv.innerHTML = `<div class="zip-result-list">${boroughLabel}${cards}</div>`;
        }
        resultsDiv.style.display = 'block';
        renderFacilityMap(data.facilities);
    } catch (err) {
        resultsDiv.innerHTML = `<p style="font-size:12px;color:#dc3545">Search failed. Is the backend running?</p>`;
        resultsDiv.style.display = 'block';
    } finally {
        btn.style.opacity = '1';
    }
}

// ── Facility map ────────────────────────────────────────────────────
let _map = null;

const PIN_COLORS = {
    public_hospital: '#1a9182',
    fqhc:            '#4caf82',
    private_hospital:'#3b82f6',
    urgent_care:     '#e07a52',
};

function makePinIcon(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
        <circle cx="14" cy="14" r="6" fill="white" opacity="0.95"/>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
    });
}

function renderFacilityMap(facilities) {
    const mapDiv = document.getElementById('zip-map');
    const withCoords = facilities.filter(f => f.lat && f.lng);
    if (withCoords.length === 0) { mapDiv.style.display = 'none'; return; }

    mapDiv.style.display = 'block';

    // destroy previous map instance
    if (_map) { _map.remove(); _map = null; }

    const center = [
        withCoords.reduce((s, f) => s + f.lat, 0) / withCoords.length,
        withCoords.reduce((s, f) => s + f.lng, 0) / withCoords.length,
    ];

    _map = L.map(mapDiv, { zoomControl: true, scrollWheelZoom: false }).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
    }).addTo(_map);

    withCoords.forEach(f => {
        const color = PIN_COLORS[f.type] || '#888';
        const typeLabel = {
            public_hospital: 'Public Hospital',
            fqhc: 'Free Clinic (FQHC)',
            private_hospital: 'Private Hospital',
            urgent_care: 'Urgent Care',
        }[f.type] || f.type;

        const popup = `
            <div style="font-family:Inter,sans-serif;min-width:180px">
                <div style="font-size:10px;font-weight:600;color:${color};text-transform:uppercase;margin-bottom:3px">${typeLabel}</div>
                <div style="font-size:13px;font-weight:700;margin-bottom:4px">${f.name}</div>
                <div style="font-size:11px;color:#666;margin-bottom:4px">${f.address}</div>
                <div style="font-size:11px;font-weight:600;color:#1a9182;margin-bottom:6px">${f.cost}</div>
                <a href="${f.website || '#'}" target="_blank"
                   style="font-size:11px;background:${color};color:#fff;padding:3px 10px;border-radius:20px;text-decoration:none;display:inline-block">
                   Visit website ↗
                </a>
            </div>`;

        L.marker([f.lat, f.lng], { icon: makePinIcon(color) })
            .addTo(_map)
            .bindPopup(popup);
    });

    // fit map to all markers
    const bounds = L.latLngBounds(withCoords.map(f => [f.lat, f.lng]));
    _map.fitBounds(bounds, { padding: [24, 24] });
}

function addThinking() {
    clearWelcome();
    const container = document.getElementById('chat-messages');
    const row = document.createElement('div');
    row.className = 'thinking-row';
    row.innerHTML = `
        <div class="ai-avatar" style="width:30px;height:30px;flex-shrink:0;background:var(--primary-lt);border:1.5px solid var(--border-p);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary);margin-top:2px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div class="thinking-bubble"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return row;
}

// ── Send message ────────────────────────────────────────────────────
async function sendMessage() {
    const ta = document.getElementById('chat-input');
    const message = ta.value.trim();
    if (!message) return;

    ta.value = '';
    ta.style.height = 'auto';
    addMessage(message, 'user');

    const thinking = addThinking();
    document.getElementById('send-btn').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, language: lang })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        thinking.remove();
        addMessage(data.response, 'ai');
        if (data.facilities && data.facilities.length > 0) addFacilityCards(data.facilities);
        if (autoVoice) playTTS(data.response);
    } catch (err) {
        thinking.remove();
        const t = UI_TEXT[lang] || UI_TEXT.en;
        addMessage(`Error: ${err.message}. Please ensure the backend server is running.`, 'ai');
    } finally {
        document.getElementById('send-btn').disabled = false;
    }
}

// ── TTS ─────────────────────────────────────────────────────────────
async function playTTS(text) {
    if (!text) return;
    try {
        if (vsCurrentAudio) { vsCurrentAudio.pause(); vsCurrentAudio = null; }
        const res = await fetch(`${API_BASE}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text.slice(0, 400), language: lang })
        });
        if (!res.ok) return;
        const data = await res.json();
        const raw = atob(data.audio);
        const buf = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
        const blob = new Blob([buf], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        vsCurrentAudio = new Audio(url);
        vsCurrentAudio.onended = () => { URL.revokeObjectURL(url); vsCurrentAudio = null; };
        vsCurrentAudio.play();
        return vsCurrentAudio;
    } catch (_) { return null; }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ── Voice Session ───────────────────────────────────────────────────
function openVoiceSession() {
    vsActive = true;
    document.getElementById('voice-session').classList.add('active');
    vsSetStatus('idle');
}

function closeVoiceSession() {
    if (vsRecording) vsStopRecord();
    if (vsCurrentAudio) { vsCurrentAudio.pause(); vsCurrentAudio = null; }
    vsActive = false;
    document.getElementById('voice-session').classList.remove('active');
}

function vsSetStatus(state) {
    const t = UI_TEXT[lang] || UI_TEXT.en;
    const orb    = document.getElementById('vs-orb');
    const status = document.getElementById('vs-status');
    const micIcon= document.getElementById('vs-mic-icon');
    const wave   = document.getElementById('vs-wave');
    const recBtn = document.getElementById('vs-record-btn');
    const recLbl = document.getElementById('vs-record-label');

    orb.classList.remove('listening', 'speaking', 'processing');

    if (state === 'idle') {
        status.textContent  = t.vsStatusIdle;
        micIcon.style.display = 'flex';
        wave.style.display    = 'none';
        recBtn.style.background = 'var(--primary)';
        recLbl.textContent = t.vsRecLabel;
    } else if (state === 'recording') {
        status.textContent  = t.vsStatusRec;
        orb.classList.add('listening');
        micIcon.style.display = 'none';
        wave.style.display    = 'flex';
        recBtn.style.background = '#dc3545';
        recLbl.textContent = t.vsStopLabel;
    } else if (state === 'processing') {
        status.textContent  = t.vsStatusProc;
        micIcon.style.display = 'flex';
        wave.style.display    = 'none';
        recBtn.style.background = 'var(--t3)';
        recLbl.textContent = '...';
    } else if (state === 'speaking') {
        status.textContent  = t.vsStatusSpeak;
        orb.classList.add('speaking');
        micIcon.style.display = 'flex';
        wave.style.display    = 'none';
        // change wave color to accent
        document.querySelectorAll('.vs-bar').forEach(b => b.style.background = 'var(--accent)');
        recBtn.style.background = 'var(--accent)';
        recLbl.textContent = '⏹ Interrupt';
    }
    if (state !== 'speaking') {
        document.querySelectorAll('.vs-bar').forEach(b => b.style.background = 'var(--primary)');
    }
}

function vsToggleRecord() {
    // If TTS is speaking, interrupt it and start a new recording
    if (vsCurrentAudio) {
        vsCurrentAudio.pause();
        vsCurrentAudio.onended = null;
        vsCurrentAudio = null;
    }
    if (vsRecording) vsStopRecord();
    else vsStartRecord();
}

// Web Speech API recognition instance (reused)
let vsRecognition = null;

function vsGetLangCode() {
    const map = { en:'en-US', zh:'zh-CN', es:'es-ES', hi:'hi-IN', ar:'ar-SA', ru:'ru-RU', fr:'fr-FR' };
    return map[lang] || 'en-US';
}

function vsStartRecord() {
    if (vsRecording) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        alert('Your browser does not support voice input. Please use Chrome.');
        return;
    }

    vsRecognition = new SR();
    vsRecognition.lang = '';  // auto-detect spoken language
    vsRecognition.interimResults = false;
    vsRecognition.maxAlternatives = 1;
    vsRecording = true;
    vsSetStatus('recording');

    vsRecognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        console.log('[Voice] recognized:', text);
        vsRecording = false;
        vsSetStatus('processing');
        await vsProcessText(text);
    };

    vsRecognition.onerror = (event) => {
        console.error('[Voice] recognition error:', event.error);
        vsRecording = false;
        const msg = event.error === 'no-speech' ? 'No speech detected — try again'
                  : event.error === 'not-allowed' ? 'Microphone blocked — allow access in browser'
                  : 'Voice error: ' + event.error;
        document.getElementById('vs-transcript').textContent = msg;
        vsSetStatus('idle');
    };

    vsRecognition.onend = () => {
        if (vsRecording) { vsRecording = false; vsSetStatus('idle'); }
    };

    vsRecognition.start();
}

function vsStopRecord() {
    if (!vsRecording) return;
    vsRecognition?.stop();
    vsRecording = false;
    vsSetStatus('processing');
}

async function vsProcessText(text) {
    try {
        if (!text.trim()) { vsSetStatus('idle'); return; }

        document.getElementById('vs-transcript').textContent = `"${text}"`;

        addMessage(text, 'user', true);

        const chatRes = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, language: 'auto' })
        });
        if (!chatRes.ok) throw new Error('Chat failed');
        const chatData = await chatRes.json();

        addMessage(chatData.response, 'ai');
        if (chatData.facilities?.length > 0) addFacilityCards(chatData.facilities);

        // Play response in voice session
        vsSetStatus('speaking');
        document.getElementById('vs-transcript').textContent = chatData.response.slice(0, 120) + (chatData.response.length > 120 ? '...' : '');

        const audio = await playTTS(chatData.response);
        if (audio) {
            audio.onended = () => {
                if (vsActive) {
                    vsSetStatus('idle');
                    document.getElementById('vs-transcript').textContent = '';
                }
            };
        } else {
            vsSetStatus('idle');
        }

    } catch (err) {
        console.error('[Voice] Error:', err);
        document.getElementById('vs-transcript').textContent = 'Error: ' + err.message;
        vsSetStatus('idle');
    }
}

// Legacy alias — not used anymore (STT now via Web Speech API)
async function vsProcessAudio() {}

// ── Image upload & analysis ─────────────────────────────────────────
function onFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    window._cardMime = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = e => {
        window._cardImage = e.target.result.split(',')[1];
        document.getElementById('upload-hint').style.display = 'none';
        const preview = document.getElementById('card-preview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        document.getElementById('analyze-btn').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

async function analyzeCard() {
    if (!window._cardImage) return;
    showLoading(true);
    try {
        const res = await fetch(`${API_BASE}/api/analyze-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: window._cardImage, mime_type: window._cardMime || 'image/jpeg', language: lang })
        });
        if (!res.ok) throw new Error('Analysis failed');
        const data = await res.json();
        addMessage(data.response, 'ai');
        if (autoVoice) playTTS(data.response);
    } catch (err) {
        addMessage('Image analysis failed. Please try again.', 'ai');
    } finally {
        showLoading(false);
    }
}

// ── Loading ─────────────────────────────────────────────────────────
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}
