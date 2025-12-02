# StoreCast - Sinalização Digital com Next.js e DatoCMS

O StoreCast é uma aplicação de sinalização digital (digital signage) para Smart TVs, construída com Next.js 15, TypeScript, Tailwind CSS e **DatoCMS** para gerenciamento de conteúdo e hospedagem de mídias.

Esta versão é otimizada para um cenário de **loja única**, com um sistema avançado de **pré-download e cache local**, garantindo que a reprodução seja sempre fluida, sem travamentos, e funcione perfeitamente mesmo com conexões de internet instáveis ou totalmente offline após o primeiro carregamento.

## Funcionalidades Principais

- **Cache Inteligente**: Baixa e armazena todas as mídias (vídeos e imagens) localmente no navegador antes da exibição. A reprodução é feita 100% a partir do cache, eliminando buffering.
- **Atualização em Tempo Real (via Polling)**: O app verifica por novas atualizações no DatoCMS a cada 2 minutos. Se encontrar uma nova versão da playlist, baixa o conteúdo novo em segundo plano.
- **Operação Offline**: Após o primeiro carregamento completo, a aplicação funciona sem necessidade de conexão com a internet, usando os arquivos em cache.
- **Gerenciamento Centralizado via DatoCMS**: Todo o conteúdo (playlist, mídias, logo) é gerenciado de forma centralizada em uma única tela no DatoCMS.
- **Interface Otimizada para TV (10-foot UI)**: Visuais limpos, fontes grandes e transições suaves.
- **Resiliência**: Lida de forma elegante com estados de erro, carregamento e playlists vazias.
- **Zero Interação**: Roda automaticamente em tela cheia, com entradas de teclado desativadas para prevenir saídas acidentais.

## Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS & shadcn/ui
- **CMS & Armazenamento de Mídia**: [DatoCMS](https://www.datocms.com/)
- **Comunicação com API**: GraphQL (`graphql-request`)
- **Cache**: IndexedDB (`idb`) e Cache API
- **Deployment**: Vercel

---

## 1. Configuração do Projeto DatoCMS (Estrutura Simplificada)

A estrutura foi ultra-simplificada para ser gerenciada em um único lugar, sem relações complexas.

### 1.1. Crie o Modelo `Item de Mídia` (Bloco Modular)

Este bloco definirá os campos para cada item da sua playlist.

1.  Vá em **"Settings" > "Modular content"** e clique no `+` para criar um novo "Block Model".
2.  **Block name**: `Item de Mídia`
3.  **API key**: `media_item`

**Campos do Bloco `Item de Mídia`:**

Adicione os seguintes campos a este bloco:

1.  **Tipo**: `Menu suspenso` (Single-line string, presentation: Dropdown)
    -   **Label**: `Tipo`
    -   **Chave da API**: `tipo`
    -   **Valores**: `imagem`, `video`, `texto`
    -   **Validação**: Obrigatório.
2.  **Mídia**: `Upload de arquivo único` (Single asset)
    -   **Label**: `Mídia (para Imagem/Vídeo)`
    -   **Chave da API**: `media`
    -   **Validação**: Exigir que o valor corresponda a um padrão específico -> **Tipo de arquivo**: Imagem ou Vídeo.
3.  **Texto**: `Texto de Múltiplas Linhas` (Text, presentation: Multi-line text)
    -   **Label**: `Conteúdo do Texto`
    -   **Chave da API**: `texto`
4.  **Duração**: `Número Inteiro` (Integer)
    -   **Label**: `Duração (segundos)`
    -   **Chave da API**: `duracao`
    -   **Observação**: *Para vídeos, a duração real do arquivo será usada. Este campo serve principalmente para imagens e textos.*
    -   **Validação**: Obrigatório.
    -   **Valor Padrão**: `10`
5.  **Ativo**: `Booleano` (Boolean)
    -   **Label**: `Ativo?`
    -   **Chave da API**: `ativo`
    -   **Valor Padrão**: `true`

### 1.2. Crie o Modelo `Configuração da TV` (Single Instance)

Este modelo será a tela principal para gerenciar toda a sua playlist.

1.  Vá em **"Settings" > "Models"** e clique no `+` para criar um novo modelo.
2.  Escolha **"Single instance model"**.
3.  **Model name**: `Configuração da TV`
4.  **API key**: `configuracao_da_tv`

**Campos da `Configuração da TV`:**

Adicione os seguintes campos a este modelo:

1.  **Logo**: `Upload de arquivo único` (Single asset)
    -   **Label**: `Logo da Loja`
    -   **Chave da API**: `logo`
    -   **Validação**: Exigir que o valor corresponda a um padrão específico -> **Tipo de arquivo**: Imagem.
2.  **Itens da Playlist**: `Conteúdo Modular` (Modular content)
    -   **Label**: `Itens da Playlist`
    -   **Chave da API**: `items`
    -   **Validação**: Em "Choose which blocks can be created", selecione apenas o bloco `Item de Mídia` que você criou no passo anterior.

### 1.3. Adicione seu Conteúdo

1.  No menu lateral do DatoCMS, você verá **"Configuração da TV"** na seção "Single instances". Clique nele.
2.  No campo **"Logo da Loja"**, faça o upload da imagem do seu logo.
3.  No campo **"Itens da Playlist"**, clique em "Adicionar novo bloco" e selecione "Item de Mídia" para cada item que deseja exibir.
4.  Preencha os campos para cada item diretamente ali:
    -   Para **vídeos/imagens**: selecione o tipo, faça upload do arquivo no campo `Mídia` e defina a `duração` (para imagens).
    -   Para **texto**: selecione o tipo, escreva o conteúdo em `Conteúdo do Texto` e defina a `duração`.
    -   Marque como `Ativo` para que o item apareça.
5.  **Importante**: Cada vez que você editar e salvar, o campo `_updatedAt` (usado internamente como a `versao`) é atualizado. Isso invalida o cache antigo e força o download do novo conteúdo. Você pode reordenar os itens arrastando-os.

### 1.4. Obtenha as Chaves da API

1.  No seu projeto DatoCMS, vá para **"Settings" > "API Tokens"**.
2.  Copie o seu token de **"Read-only API token"**.

---

## 2. Configuração do Projeto Local

### 2.1. Crie o arquivo `.env.local`

Na raiz do projeto, crie um arquivo `.env.local` e cole seu token da API:

```
# Substitua pelo seu token de API de somente leitura do DatoCMS
NEXT_PUBLIC_DATO_API_TOKEN="SEU_TOKEN_AQUI"
```

---

## 3. Rodando e Fazendo Deploy

### 3.1. Rodando Localmente

1.  Instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm run dev`
3.  Abra `http://localhost:9002` no seu navegador.

### 3.2. Deploy na Vercel

1.  Envie seu código para um repositório Git (GitHub, GitLab, etc.).
2.  Crie uma conta na [Vercel](https://vercel.com) e importe seu projeto.
3.  Nas configurações do projeto na Vercel, adicione a variável de ambiente do seu arquivo `.env.local` (`NEXT_PUBLIC_DATO_API_TOKEN`).
4.  Clique em **"Deploy"**.

### 3.3. Usando na Smart TV

1.  Abra o navegador da sua TV (Android TV, Google TV, Fire TV, etc.).
2.  Navegue para a URL da sua aplicação na Vercel (ex: `meu-storecast.vercel.app`).
3.  Clique em "Iniciar" para entrar em modo de tela cheia.

**Dica para Android TV/Google TV**: Use apps como o ["Website Shortcut"](https://play.google.com/store/apps/details?id=com.deltacdev.websiteshortcut) para criar um atalho na tela inicial que abre a URL diretamente, simulando um app nativo.
