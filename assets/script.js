// ================== CONFIG ===================
let CONFIG = {
    maxChars: 2000,
    sheetId: '1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s/edit?gid=1933645899#gid=1933645899'
};

// ================== ELEMENTOS ==================
const elements = {
    textEditor: document.getElementById('textEditor'),
    charCount: document.getElementById('charCount'),
    clearBtn: document.getElementById('clearBtn'),
    sendBtn: document.getElementById('sendBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    toastContainer: document.getElementById('toastContainer')
};

// ================== ESTADO ==================
let state = {
    isSending: false
};

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateCharCount();
});

function initializeEventListeners() {
    elements.textEditor.addEventListener('input', updateCharCount);
    elements.clearBtn.addEventListener('click', clearEditor);
    elements.sendBtn.addEventListener('click', sendWebhook);

    // 👉 Botão para abrir planilha
    elements.uploadBtn.addEventListener('click', () => {
        window.open(CONFIG.sheetUrl, '_blank');
        showToast('Sucesso', 'Abrindo planilha do Google Sheets...', 'success');
    });

    // 👉 Detectar teclas para formatação rápida
    elements.textEditor.addEventListener('keydown', handleFormatting);
}

// ================== EDITOR ==================
function updateCharCount() {
    const content = elements.textEditor.innerText || '';
    const count = content.length;
    elements.charCount.textContent = count;
    elements.sendBtn.disabled = count === 0 || count > CONFIG.maxChars;
}

function clearEditor() {
    elements.textEditor.innerHTML = '';
    updateCharCount();
    showToast('Sucesso', 'Editor limpo com sucesso', 'success');
}

// ================== FORMATAÇÃO ==================
function handleFormatting(e) {
    if (e.ctrlKey) { // Ctrl + tecla
        if (e.key.toLowerCase() === 'n') {
            document.execCommand('bold');
            e.preventDefault();
        } else if (e.key.toLowerCase() === 's') {
            document.execCommand('underline');
            e.preventDefault();
        } else if (e.key.toLowerCase() === 'i') {
            document.execCommand('italic');
            e.preventDefault();
        }
    }
}

// ================== ENVIO VIA WEBHOOK ==================
async function sendWebhook() {
    if (state.isSending) return;

    const message = elements.textEditor.innerText.trim(); // preserva quebras
    if (!message) {
        showToast('Aviso', 'Digite uma mensagem antes de enviar', 'warning');
        return;
    }

    state.isSending = true;
    elements.sendBtn.disabled = true;

    const apiUrl = "https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12";

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                timestamp: Date.now()
            })
        });

        const text = await response.text();
        console.log("Resposta do Webhook:", text);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} - ${text}`);
        }

        showToast('Sucesso', 'Mensagem enviada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao acionar webhook:', error);
        showToast('Erro', 'Falha ao acionar webhook', 'error');
    } finally {
        state.isSending = false;
        elements.sendBtn.disabled = false;
    }
}

// ================== HELPERS ==================
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
/* ============================
   ADICIONAL: upload -> imgbb -> enviar webhook com media.url
   ============================ */

/* CONFIG (já preenchido com os dados que você informou) */
const IMGBB_KEY = 'babc90a7ab9bddc78a89ebe1108ff464';
const WEBHOOK_WITH_MEDIA_URL = 'https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12';

// Informações Z-API (incluídas no payload para uso do servidor/webhook se necessário)
const ZAPI_INFO = {
    instanceId: '3DF2EE19A630504B2B138E66062CE0C1',
    securityToken: 'Fba907eb583fd4fcda5c9b30c52a6edadS'
};

// Estado local e elementos (usa os mesmos elementos do seu HTML)
let _selectedImageFile = null; // já presente no outro snippet, reforço aqui
const imageInputEl = document.getElementById('imageInput');
const imagePreviewEl = document.getElementById('imagePreview');
const previewImgEl = document.getElementById('previewImg');

if (imageInputEl) {
    imageInputEl.addEventListener('change', handleImageSelectedForImgBB);
}

function handleImageSelectedForImgBB(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
        _selectedImageFile = null;
        if (imagePreviewEl) { imagePreviewEl.style.display = 'none'; previewImgEl.src = ''; }
        return;
    }

    // validação simples de tamanho (ajuste se precisar)
    const maxMB = 8;
    if (f.size > maxMB * 1024 * 1024) {
        showToast('Aviso', `Imagem muito grande. Máximo ${maxMB} MB.`, 'warning');
        imageInputEl.value = '';
        _selectedImageFile = null;
        if (imagePreviewEl) { imagePreviewEl.style.display = 'none'; previewImgEl.src = ''; }
        return;
    }

    _selectedImageFile = f;

    // preview (opcional)
    const reader = new FileReader();
    reader.onload = (ev) => {
        if (previewImgEl) { previewImgEl.src = ev.target.result; imagePreviewEl.style.display = 'block'; }
    };
    reader.readAsDataURL(f);
}

/* Faz upload para imgbb (retorna a URL pública da imagem) */
async function uploadToImgbb(file) {
    // imgBB aceita base64 via field 'image' ou multipart; aqui convertemos para base64 e enviamos como FormData
    const base64 = await fileToBase64(file); // retorna "data:image/...;base64,XXXX"
    // remover prefixo "data:...;base64," para API imgbb
    const commaIndex = base64.indexOf(',');
    const pureBase64 = commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;

    const form = new FormData();
    form.append('key', IMGBB_KEY);
    form.append('image', pureBase64);
    form.append('name', file.name.replace(/\.[^/.]+$/, "")); // opcional: nome sem extensão

    const res = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: form
    });

    const json = await res.json();
    if (!res.ok || !json || !json.data) {
        throw new Error('Falha upload imgbb: ' + (JSON.stringify(json) || res.statusText));
    }

    // imgbb retorna propriedades em json.data (ex: url, display_url)
    // vamos priorizar data.url ou data.display_url
    return json.data.display_url || json.data.url || json.data.thumb.url;
}

/* Utilitário: File -> dataURL */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

/* Listener que, caso haja imagem selecionada, faz upload -> imgbb -> envia ao webhook com campo media.url */
if (elements && elements.sendBtn) {
    elements.sendBtn.addEventListener('click', async function uploadImageAndNotify(event) {
        // se não tiver imagem selecionada, NÃO FAZ NADA (deixa o fluxo do sendWebhook original continuar)
        if (!_selectedImageFile) return;

        // evita concorrência de envios de imagem
        if (state.isUploadingImage) {
            showToast('Aguarde', 'Envio de imagem em progresso...', 'warning');
            return;
        }
        state.isUploadingImage = true;

        try {
            showToast('Enviando imagem', 'Fazendo upload da imagem para o servidor de imagens...', 'success');

            // 1) upload para imgbb
            const imageUrl = await uploadToImgbb(_selectedImageFile);
            console.log('Imagem no imgbb:', imageUrl);
            showToast('Upload OK', 'Imagem hospedada com sucesso.', 'success');

            // 2) enviar ao seu webhook a mesma estrutura que seu servidor já entende
            //    montamos um payload com message (caption possível) + media.url + info z-api (para o webhook usar)
            const caption = (elements.textEditor && elements.textEditor.innerText.trim()) || '';
            const payload = {
                message: caption,
                timestamp: Date.now(),
                media: {
                    url: imageUrl,
                    filename: _selectedImageFile.name
                },
                zapi: {
                    instanceId: ZAPI_INFO.instanceId,
                    securityToken: ZAPI_INFO.securityToken
                }
                // você pode adicionar aqui: phone: '55119XXXXXXX' se quiser direcionar para número específico
            };

            // envia para o mesmo webhook que seu código de texto usa
            const res = await fetch(WEBHOOK_WITH_MEDIA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            console.log('Resposta webhook (após upload):', res.status, text);

            if (!res.ok) {
                // mostramos erro, mas não interrompemos o fluxo do cliente (seu sendWebhook continua)
                throw new Error(`Webhook retornou ${res.status} - ${text}`);
            }

            showToast('Enviado', 'Payload com imagem enviado ao webhook.', 'success');

            // opcional: limpar seleção visual da imagem ao final
            // imageInputEl.value = ''; _selectedImageFile = null; if (imagePreviewEl) { imagePreviewEl.style.display = 'none'; previewImgEl.src = ''; }

        } catch (err) {
            console.error('Erro no fluxo imagem -> imgbb -> webhook:', err);
            showToast('Erro', 'Falha ao enviar imagem: ' + (err.message || err), 'error');
            // não interromper o envio de texto: o sendWebhook original seguirá em frente
        } finally {
            state.isUploadingImage = false;
        }
    }, { capture: true }); // capture para rodar antes do handler padrão, mas sem impedir o fluxo padrão
}

