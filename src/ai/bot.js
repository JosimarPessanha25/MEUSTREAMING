const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Função para processar a mensagem do usuário usando a IA da Groq.
 * @param {string} systemPrompt O prompt de sistema com as instruções para a IA.
 * @param {string} userMessage A mensagem enviada pelo usuário.
 * @returns {Promise<string>} A resposta gerada pela IA.
 */
async function getAiResponse(systemPrompt, userMessage) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            // Você pode trocar o modelo, ex: llama-3.3-70b-versatile ou llama-3.1-8b-instant
            model: 'llama-3.3-70b-versatile', 
            temperature: 0.7,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";
    } catch (error) {
        console.error('Erro na API da Groq:', error);
        return "Desculpe, estou enfrentando problemas técnicos no momento. Tente novamente mais tarde.";
    }
}

module.exports = {
    getAiResponse
};
