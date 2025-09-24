// ================== ENVIO VIA WEBHOOK ==================
async function sendWebhook() {
    if (state.isSending) return;

    const message = elements.textEditor.innerText.trim();
    if (!message) {
        showToast('Aviso', 'Digite uma mensagem antes de enviar', 'warning');
        return;
    }

    state.isSending = true;
    elements.sendBtn.disabled = true;

    const apiUrl = "https://webhook.fiqon.app/webhook/9fd68837-4f32-4ee3-a756-418a87beadc9/79c39a2c-225f-4143-9ca4-0d70fa92ee12";

    try {
        // 1️⃣ Sempre envia o texto
        const textPayload = {
            message: message,
            timestamp: Date.now()
        };

        const textRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(textPayload)
        });

        if (!textRes.ok) throw new Error("Erro ao enviar texto");

        console.log("Texto enviado com sucesso");
        showToast('Sucesso', 'Texto enviado com sucesso!', 'success');

        // 2️⃣ Se houver imagem selecionada, faz upload e envia separado
        if (_selectedImageFile) {
            const imageUrl = await uploadToImgbb(_selectedImageFile);

            const imagePayload = {
                message: message, // legenda opcional
                timestamp: Date.now(),
                media: {
                    url: imageUrl,
                    filename: _selectedImageFile.name
                }
            };

            const imgRes = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(imagePayload)
            });

            if (!imgRes.ok) throw new Error("Erro ao enviar imagem");

            console.log("Imagem enviada com sucesso");
            showToast('Sucesso', 'Imagem enviada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao acionar webhook:', error);
        showToast('Erro', 'Falha ao acionar webhook', 'error');
    } finally {
        state.isSending = false;
        elements.sendBtn.disabled = false;
    }
}
