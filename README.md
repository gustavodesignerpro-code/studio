# StoreCast - Sinalização Digital com Next.js e Google Drive

O StoreCast é uma aplicação completa de sinalização digital (digital signage) projetada para rodar em qualquer Smart TV com um navegador web. Ele utiliza Next.js 15, TypeScript, Tailwind CSS, e Firebase Firestore para gerenciamento de conteúdo, com todas as mídias (vídeos e imagens) hospedadas diretamente no Google Drive.

Esta versão implementa um sistema avançado de **pré-download e cache local**, garantindo que a reprodução seja sempre fluida, sem travamentos, e funcione perfeitamente mesmo com conexões de internet instáveis ou offline após o primeiro carregamento.

## Funcionalidades Principais

- **Cache Inteligente**: Baixa e armazena todas as mídias localmente antes de exibi-las. A reprodução é feita 100% a partir do cache, eliminando buffering.
- **Atualização Automática**: Qualquer alteração na playlist no Firestore (incluindo a mudança de `versao` de um item) dispara um novo download em segundo plano e atualiza o cache.
- **Operação Offline**: Após o primeiro carregamento completo, a aplicação funciona sem necessidade de conexão com a internet, usando os arquivos em cache.
- **Suporte a Google Drive**: Utiliza links diretos do Google Drive para buscar as mídias, simplificando o gerenciamento de arquivos.
- **Multi-Loja**: Suporta diferentes playlists para diferentes lojas através de um parâmetro na URL (ex: `?loja=minha-loja`).
- **Interface Otimizada para TV (10-foot UI)**: Visuais limpos, fontes grandes e transições suaves.
- **Resiliência**: Tenta reconectar ao Firestore automaticamente e lida de forma elegante com estados de erro, carregamento e playlists vazias.
- **Zero Interação**: Roda automaticamente em tela cheia, com entradas de teclado/controle remoto desativadas para prevenir saídas acidentais.

## Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS & shadcn/ui
- **Banco de Dados**: Firebase Firestore
- **Armazenamento de Mídia**: Google Drive
- **Cache**: Service Worker (Cache API)
- **Deployment**: Vercel

---

## 1. Configuração do Projeto Firebase

### 1.1. Crie um Projeto Firebase e um Banco de Dados Firestore

Siga os passos no [Firebase Console](https://console.firebase.google.com/) para criar um novo projeto e, dentro dele, ative o **Firestore Database** em **modo de produção**.

### 1.2. Obtenha as Chaves de Configuração

No seu projeto Firebase, adicione um **Aplicativo da Web** e copie o objeto `firebaseConfig` fornecido.

### 1.3. Crie o arquivo `.env.local`

Na raiz do projeto, crie um arquivo `.env.local` e cole suas chaves, prefixadas com `NEXT_PUBLIC_`:

```
NEXT_PUBLIC_FIREBASE_API_KEY="SUA_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="SEU_APP_ID"
```

### 1.4. Regras de Segurança do Firestore

Para permitir que a aplicação leia as playlists publicamente, vá até a aba **Firestore Database > Regras** e publique as seguintes regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura pública das coleções de playlists e configurações
    match /playlists/{storeId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas admins autenticados podem escrever
    }
    match /config/{storeId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas admins autenticados podem escrever
    }
  }
}
```

---

## 2. Configurando o Google Drive

### 2.1. Organize seus arquivos

Crie uma pasta no seu Google Drive para organizar as mídias da sua sinalização.

### 2.2. Obtenha o ID do Arquivo

Para cada arquivo (imagem ou vídeo) que você quer usar:
1.  Clique com o botão direito no arquivo e selecione **"Compartilhar"** > **"Compartilhar"**.
2.  Em **"Acesso geral"**, mude para **"Qualquer pessoa com o link"**. Isso é crucial para que o app possa baixar o arquivo.
3.  Clique em **"Copiar link"**. O link será algo como: `https://drive.google.com/file/d/ID_DO_ARQUIVO/view?usp=sharing`.
4.  O **ID do Arquivo** é a longa string de caracteres entre `d/` e `/view`. Copie apenas esse ID. É ele que você usará no Firestore.

**URLs geradas pelo código:**
- **Imagens**: `https://drive.google.com/uc?export=download&id={ID_DO_ARQUIVO}`
- **Vídeos**: `https://drive.google.com/uc?export=view&id={ID_DO_ARQUIVO}`

---

## 3. Gerenciando o Conteúdo no Firestore

O conteúdo é gerenciado em duas coleções principais: `playlists` e `config`.

### 3.1. Coleção `playlists`

- Cada **documento** nesta coleção representa uma loja. O ID do documento é o ID da loja (ex: `main`, `filial-sp`).
- Cada documento deve ter um campo `items` do tipo `array`.

**Estrutura de um item no array `items`:**

- **ordem**: `number` (ex: 1, 2, 3) - Ordem de exibição.
- **tipo**: `string` - `"imagem"`, `"video"`, ou `"texto"`.
- **driveId**: `string` - O ID do arquivo do Google Drive (obrigatório para imagem/vídeo).
- **duracao**: `number` - Duração em segundos (ignorado para vídeos).
- **texto**: `string` - Conteúdo para slides do tipo `texto`.
- **ativo**: `boolean` - `true` para exibir, `false` para ocultar.
- **versao**: `number` - **MUITO IMPORTANTE!** Comece com `1`. Sempre que você alterar este item (ex: trocar a imagem), incremente este número (para `2`, `3`, etc.). Isso força o app a limpar o cache antigo e baixar a nova versão.

### 3.2. Coleção `config` (Opcional)

- Usada para configurações globais por loja.
- O ID do documento também é o ID da loja.
- **logoDriveId**: `string` - ID do arquivo da logo da loja no Google Drive. Se presente, a logo será exibida no canto inferior esquerdo.

### Exemplo de Documento `playlists/main`:

```json
{
  "items": [
    {
      "ordem": 1,
      "tipo": "imagem",
      "driveId": "1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT",
      "duracao": 15,
      "ativo": true,
      "versao": 1
    },
    {
      "ordem": 2,
      "tipo": "texto",
      "texto": "Grande promoção! 50% de desconto em toda a loja!",
      "driveId": "",
      "duracao": 10,
      "ativo": true,
      "versao": 1
    },
    {
      "ordem": 3,
      "tipo": "video",
      "driveId": "2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU",
      "duracao": 0, // Ignorado
      "ativo": true,
      "versao": 2 // Este vídeo foi atualizado
    }
  ]
}
```

---

## 4. Rodando e Fazendo Deploy

### 4.1. Rodando Localmente

1.  Instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm run dev`
3.  Abra `http://localhost:9002` no seu navegador. Para testar a playlist de uma loja, use `http://localhost:9002/?loja=main`.

### 4.2. Deploy na Vercel

1.  Envie seu código para um repositório Git (GitHub, GitLab, etc.).
2.  Crie uma conta na [Vercel](https://vercel.com) e importe seu projeto.
3.  Nas configurações do projeto na Vercel, adicione as mesmas variáveis de ambiente do seu arquivo `.env.local`.
4.  Clique em **"Deploy"**.

### 4.3. Usando na Smart TV

1.  Abra o navegador da sua TV (Android TV, Google TV, Fire TV, etc.).
2.  Navegue para a URL da sua aplicação na Vercel (ex: `https://meu-storecast.vercel.app`).
3.  Use o parâmetro `?loja=` para especificar a playlist (ex: `?loja=filial-sp`). Se omitido, o padrão é `main`.
4.  Clique em "Iniciar" para entrar em modo de tela cheia.

**Dica para Android TV/Google TV**: Use apps como o ["Website Shortcut"](https://play.google.com/store/apps/details?id=com.deltacdev.websiteshortcut) para criar um atalho na tela inicial que abre a URL diretamente, simulando um app nativo.
