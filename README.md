# StoreCast - Sinalização Digital com Next.js e DatoCMS

O StoreCast é uma aplicação de sinalização digital (digital signage) para Smart TVs, construída com Next.js 15, TypeScript, Tailwind CSS e **DatoCMS** para gerenciamento de conteúdo e hospedagem de mídias.

Esta versão é otimizada para um cenário de **loja única**, com um sistema de cache via **Service Worker**, garantindo que a reprodução seja sempre fluida, sem travamentos, e funcione perfeitamente mesmo com conexões de internet instáveis ou totalmente offline após o primeiro carregamento.

## Funcionalidades Principais

- **Cache Inteligente (Service Worker)**: Na primeira vez que uma mídia é carregada, ela é salva no cache do navegador. Nas vezes seguintes, é carregada instantaneamente do cache, garantindo operação offline e zero buffering.
- **Atualização em Tempo Real (via Polling)**: O app verifica por novas atualizações no DatoCMS a cada 2 minutos. Se encontrar uma nova versão da playlist, baixa o conteúdo novo em segundo plano.
- **Operação Offline**: Após o primeiro carregamento completo, a aplicação funciona sem necessidade de conexão com a internet.
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
- **Cache**: Service Worker (PWA)
- **Deployment**: Vercel

---

## 1. Configuração do Projeto DatoCMS (Estrutura Ultra-Simplificada)

A estrutura foi projetada para ser extremamente simples, usando um único modelo de "Instância Única".

### 1.1. Crie o Modelo `Items de Midia` (Instância Única)

1. Vá em **"Settings" > "Models"** e clique no `+` para criar um novo modelo.
2. **Model name**: `Items de Midia`
3. **API key**: `items_de_midia` (**IMPORTANTE**: A API key deve ser exatamente esta para que a aplicação funcione!)
4. Marque a opção **"Single instance (e.g. 'homepage')"**.

**Campos do Modelo `Items de Midia`:**

Adicione os seguintes campos a este modelo:

1.  **Logo**: `Upload de arquivo único` (Single asset)
    -   **Label**: `Logo da Loja`
    -   **Chave da API**: `logo`
    -   **Validação**: Exigir que o valor corresponda a um padrão específico -> **Tipo de arquivo**: Imagem.

2.  **Itens da Playlist**: `Conteúdo Modular` (Modular content)
    -   **Label**: `Itens da Playlist`
    -   **Chave da API**: `items`
    -   Na configuração do campo, clique em **"Create new block"**.
        -   **Block name**: `Item de Mídia`
        -   **API key**: `media_item`
    -   Agora, adicione os seguintes campos **DENTRO** deste bloco `Item de Mídia`:
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
    - Salve o bloco e depois salve o campo.

### 1.2. Adicione seu Conteúdo

1. No menu lateral do DatoCMS, você verá **"Items de Midia"** na seção "Content". Clique nele.
2. Você será levado diretamente para a única tela de edição.
3. No campo **"Logo da Loja"**, faça o upload da imagem do seu logo.
4. No campo **"Itens da Playlist"**, clique em "Adicionar novo bloco" e selecione "Item de Mídia" para cada item que deseja exibir.
5. Preencha os campos para cada item diretamente ali.
6. **Importante**: Cada vez que você editar e salvar, o campo `_updatedAt` (usado internamente como a `versao`) é atualizado. Isso invalida o cache antigo e força o download do novo conteúdo. Você pode reordenar os itens arrastando-os.
7. Clique em **"Save"** e depois em **"Publish"**.

### 1.3. Obtenha as Chaves da API

1. No seu projeto DatoCMS, vá para **"Settings" > "API Tokens"**.
2. Copie o seu token de **"Read-only API token"**.

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
