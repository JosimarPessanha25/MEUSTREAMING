# 🤖 Projeto Robô de WhatsApp com IA

Este documento registra a ideia estrutural para a criação de um novo projeto: um Robô de Atendimento via WhatsApp integrado com Inteligência Artificial, projetado para operar em sincronia perfeita com a Landing Page do "Meu Stream".

## 🎯 Objetivo
Automatizar 100% do atendimento receptivo gerado pela Landing Page. O robô vai assumir o controle do contato baseado nos "Gatilhos" (textos pré-definidos) gerados pelos formulários do site.

---

## ⚡ Gatilhos e Fluxos de Atendimento

A Landing Page foi programada para enviar mensagens padronizadas. A IA deverá fazer a leitura dessas mensagens para disparar os fluxos corretos:

### 1️⃣ Fluxo de Vendas (Assinatura e Teste)
**Gatilho (Texto inicial da mensagem):**
> *"Olá! Tenho interesse em assinar e acabei de preencher a triagem no site."*

**Ações da IA:**
- Identifica que é um "Lead Quente".
- Faz a leitura das variáveis que vêm logo abaixo no texto: `*Dispositivo:*`, `*Telas:*`, `*Internet:*`, etc.
- **Automação:** Se houver integração com o painel de IPTV/Streaming, a IA já gera o login de teste automaticamente de acordo com o dispositivo do cliente (ex: manda link do app para Android, ou DNS para Smart TV).
- **Fechamento:** Conduz a venda caso o cliente já tenha respondido `*Pretende assinar hoje:* Sim`.

### 2️⃣ Fluxo de Solicitação de Conteúdo (Filmes/Séries)
**Gatilho (Texto inicial da mensagem):**
> *"Olá! Tenho uma solicitação enviada pelo site:"* e contém a tag `*Tipo:* Solicitação de Conteúdo`

**Ações da IA:**
- Agradece o cliente pela sugestão.
- Lê o `*Título:*` informado.
- **Automação:** Pode fazer uma busca automática na API do TMDB para confirmar se o filme/série existe, e registrar o pedido em uma planilha do Google Sheets, Trello ou banco de dados interno da equipe responsável por subir o conteúdo.
- Responde ao cliente com uma estimativa (ex: "Registrei seu pedido para 'A Casa do Dragão'! Nossa equipe vai adicionar em breve.").

### 3️⃣ Fluxo de Suporte e Chamados (Bugs)
**Gatilho (Texto inicial da mensagem):**
> *"Olá! Tenho uma solicitação enviada pelo site:"* e contém a tag `*Tipo:* Reportar Bug`

**Ações da IA:**
- Entra em modo de Suporte Técnico.
- Lê o `*Título:*` e a `*Descrição:*` para entender o erro.
- **Automação:** Cruza o problema com uma base de conhecimento (FAQ da IA). Por exemplo, se na descrição tiver "travando", a IA sugere reiniciar o roteador ou trocar de servidor.
- Se a IA não conseguir resolver, ela transfere a conversa para um atendente humano e cria um "Ticket" no sistema interno.

---

## 🛠️ Possíveis Tecnologias a Utilizar (Stack do Novo Projeto)

Quando o projeto for iniciado, estas são algumas das melhores opções no mercado:

**1. Opção via Código Puro (Maior controle e sem mensalidades):**
- **Linguagem:** Node.js
- **Biblioteca WhatsApp:** `whatsapp-web.js` ou `Baileys` (usa o QR Code, grátis).
- **IA:** API do OpenAI (GPT) ou Google Gemini.

**2. Opção via Plataformas No-Code/Low-Code (Rápido e visual):**
- **n8n** ou **Make:** Para automatizar o fluxo (ligar WhatsApp -> Planilha -> Painel -> IA).
- **Evolution API** ou **Z-API:** Para conectar o WhatsApp.
- **Typebot** ou **Chatwoot:** Para desenhar o funil de conversa e gerenciar os tickets humanos se a IA não der conta.

---
*Nota: Este arquivo serve como mapa mental. Quando estiver pronto para começar, basta abrir uma nova pasta no VS Code e iniciar o projeto baseando-se nestas regras de negócio.*
