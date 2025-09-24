// ================== CONFIG =====nn==============
let CONFIG = {
    maxChars: 2000,
    sheetId: '1nT_ccRwFtEWiYvh5s4iyIDTgOj5heLnXSixropbGL8s',
@@ -100,7 +100,7 @@ async function sendWebhook() {
        const payload = {
            message: message,
            timestamp: Date.now(),
            media: media // <<-- aqui garantimos que chega no webhook
        };

        const response = await fetch(apiUrl, {
@@ -142,22 +142,11 @@ function showToast(title, message, type = 'success') {
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
@@ -174,7 +163,6 @@ function handleImageSelectedForImgBB(e) {
        return;
    }

    // validação simples de tamanho (ajuste se precisar)
    const maxMB = 8;
    if (f.size > maxMB * 1024 * 1024) {
        showToast('Aviso', `Imagem muito grande. Máximo ${maxMB} MB.`, 'warning');
@@ -186,26 +174,22 @@ function handleImageSelectedForImgBB(e) {

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
@@ -217,12 +201,9 @@ async function uploadToImgbb(file) {
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
@@ -231,72 +212,3 @@ function fileToBase64(file) {
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
