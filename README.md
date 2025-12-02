# StoreCast - Sinalização Digital com Next.js e DatoCMS

O StoreCast é uma aplicação completa de sinalização digital (digital signage) projetada para rodar em qualquer Smart TV com um navegador web. Ele utiliza Next.js 15, TypeScript, Tailwind CSS, e **DatoCMS** para gerenciamento de conteúdo e hospedagem de mídias.

Esta versão implementa um sistema avançado de **pré-download e cache local**, garantindo que a reprodução seja sempre fluida, sem travamentos, e funcione perfeitamente mesmo com conexões de internet instáveis ou offline após o primeiro carregamento.

## Funcionalidades Principais

- **Cache Inteligente**: Baixa e armazena todas as mídias localmente antes de exibi-las. A reprodução é feita 100% a partir do cache, eliminando buffering.
- **Atualização em Tempo Real (via Polling)**: O app verifica por novas atualizações no DatoCMS periodicamente e, se encontrar uma nova versão da playlist, baixa o conteúdo novo em segundo plano.
- **Operação Offline**: Após o primeiro carregamento completo, a aplicação funciona sem necessidade de conexão com a internet, usando os arquivos em cache.
- **Gerenciamento via DatoCMS**: Todo o conteúdo, incluindo playlists, mídias e configurações, é gerenciado de forma centralizada no DatoCMS.
- **Multi-Loja**: Suporta diferentes playlists para diferentes lojas através de um parâmetro na URL (ex: `?loja=minha-loja`).
- **Interface Otimizada para TV (10-foot UI)**: Visuais limpos, fontes grandes e transições suaves.
- **Resiliência**: Lida de forma elegante com estados de erro, carregamento e playlists vazias.
- **Zero Interação**: Roda automaticamente em tela cheia, com entradas de teclado/controle remoto desativadas para prevenir saídas acidentais.

## Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS & shadcn/ui
- **CMS & Armazenamento de Mídia**: [DatoCMS](https://www.datocms.com/)
- **Comunicação com API**: GraphQL (`graphql-request`)
- **Cache**: IndexedDB (`idb`)
- **Deployment**: Vercel

---

## 1. Configuração do Projeto DatoCMS

### 1.1. Crie os Modelos (Models)

No seu projeto DatoCMS, crie os seguintes modelos:

**A) Modelo `Item de Mídia` (Modular Content)**

Este modelo será usado para definir os itens dentro de uma playlist.

- **Título do Modelo**: `Item de Mídia`
- **Chave da API**: `media_item`
- Marque a opção **"Permitir que este modelo seja usado em campos de Conteúdo Modular"**.

**Campos do `Item de Mídia`:**

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
    -   **Validação**: Obrigatório.
    -   **Valor Padrão**: `10`
5.  **Ativo**: `Booleano` (Boolean)
    -   **Label**: `Ativo?`
    -   **Chave da API**: `ativo`
    -   **Valor Padrão**: `true`

**B) Modelo `Playlist` (Coleção)**

Este modelo representará a playlist de cada loja.

- **Título do Modelo**: `Playlist`
- **Chave da API**: `playlist`

**Campos da `Playlist`:**

1.  **Nome da Loja**: `Texto de Linha Única` (Single-line string)
    -   **Label**: `Nome da Loja`
    -   **Chave da API**: `nome_da_loja`
    -   **Validação**: Obrigatório, Único.
2.  **ID da Loja (Slug)**: `Slug`
    -   **Label**: `ID da Loja (para URL)`
    -   **Chave da API**: `id_da_loja`
    -   **Validação**: Obrigatório, Único.
    -   Gerado a partir do campo `Nome da Loja`.
3.  **Itens da Playlist**: `Conteúdo Modular` (Modular content)
    -   **Label**: `Itens da Playlist`
    -   **Chave da API**: `items`
    -   **Validação**: Permitir apenas o modelo `Item de Mídia`.
4.  **Logo da Loja**: `Upload de arquivo único` (Single asset)
    -   **Label**: `Logo da Loja`
    -   **Chave da API**: `logo`
    -   **Validação**: Exigir que o valor corresponda a um padrão específico -> **Tipo de arquivo**: Imagem.

### 1.2. Crie o Conteúdo

1.  Vá para a seção "Conteúdo" e crie um novo registro do tipo `Playlist`.
2.  Preencha o **Nome da Loja** (ex: "Loja Principal"). O **ID da Loja** será gerado automaticamente (ex: "loja-principal"). É este ID que você usará no parâmetro `?loja=` da URL.
3.  No campo **Itens da Playlist**, clique em "Adicionar novo bloco" e selecione "Item de Mídia".
4.  Preencha os campos para cada item:
    -   Para **vídeos/imagens**: selecione o tipo, faça upload do arquivo no campo `Mídia` e defina a `duração` (para imagens).
    -   Para **texto**: selecione o tipo, escreva o conteúdo em `Conteúdo do Texto` e defina a `duração`.
    -   **Importante**: O campo `_updatedAt` de cada item da playlist é usado como a `versao` para o cache. Cada vez que você editar um item, o cache será invalidado e o novo conteúdo será baixado.

### 1.3. Obtenha as Chaves da API

1.  No seu projeto DatoCMS, vá para **Configurações > Ambientes e Tokens de API**.
2.  Na aba **Tokens de API**, copie o seu token de **Acesso somente leitura (read-only)**.

---

## 2. Configuração do Projeto Local

### 2.1. Crie o arquivo `.env.local`

Na raiz do projeto, crie um arquivo `.env.local` e cole seu token da API:

```
# Substitua pelo seu token de API de somente leitura do DatoCMS
NEXT_PUBLIC_DATO_API_TOKEN="SEU_TOKEN_AQUI"

# ID da loja padrão se nenhum for passado na URL (ex: main, loja-principal)
NEXT_PUBLIC_DEFAULT_STORE_ID="main"
```

---

## 3. Rodando e Fazendo Deploy

### 3.1. Rodando Localmente

1.  Instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm run dev`
3.  Abra `http://localhost:9002` no seu navegador. Para testar a playlist de uma loja, use `http://localhost:9002/?loja=loja-principal`.

### 3.2. Deploy na Vercel

1.  Envie seu código para um repositório Git (GitHub, GitLab, etc.).
2.  Crie uma conta na [Vercel](https://vercel.com) e importe seu projeto.
3.  Nas configurações do projeto na Vercel, adicione as mesmas variáveis de ambiente do seu arquivo `.env.local` (`NEXT_PUBLIC_DATO_API_TOKEN` e `NEXT_PUBLIC_DEFAULT_STORE_ID`).
4.  Clique em **"Deploy"**.

### 3.3. Usando na Smart TV

1.  Abra o navegador da sua TV (Android TV, Google TV, Fire TV, etc.).
2.  Navegue para a URL da sua aplicação na Vercel (ex: `https://meu-storecast.vercel.app`).
3.  Use o parâmetro `?loja=` para especificar a playlist (ex: `?loja=filial-sp`). Se omitido, o padrão definido em `NEXT_PUBLIC_DEFAULT_STORE_ID` será usado.
4.  Clique em "Iniciar" para entrar em modo de tela cheia.

**Dica para Android TV/Google TV**: Use apps como o ["Website Shortcut"](https://play.google.com/store/apps/details?id=com.deltacdev.websiteshortcut) para criar um atalho na tela inicial que abre a URL diretamente, simulando um app nativo.
