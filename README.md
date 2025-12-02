# StoreCast - Sinalização Digital com Next.js e Firebase

O StoreCast é uma aplicação completa de sinalização digital (digital signage) projetada para rodar em qualquer Smart TV com um navegador web (como Android TV, Google TV ou Fire TV). Ele utiliza Next.js 15, TypeScript, Tailwind CSS e Firebase para oferecer uma experiência de conteúdo imersiva, gerenciada remotamente e em tempo real para ambientes de varejo.

## Funcionalidades

- **Tela Cheia Automática**: Entra em modo de tela cheia ao iniciar para uma exibição ininterrupta.
- **Playlist em Tempo Real**: O conteúdo é gerenciado no Firebase Firestore e atualiza na tela instantaneamente.
- **Suporte Multimídia**: Exibe vídeos, imagens e slides de texto formatado.
- **Interface Otimizada para Distância**: Todos os visuais são otimizados para visualização à distância (10-foot UI).
- **Relógio ao Vivo**: Exibição constante da hora e data atuais.
- **Zero Interação**: Roda automaticamente sem necessidade de intervenção do usuário. Entradas de controle remoto/teclado são desativadas para prevenir saídas acidentais.
- **Resiliente**: Pré-carrega as mídias, exibe estados de carregamento e de lista vazia de forma elegante, e tenta reconectar se a conexão com a internet cair.
- **Seguro**: Utiliza as regras de segurança do Firebase para proteger seus dados, sem expor chaves sensíveis no lado do cliente.
- **Pronto para Múltiplas Lojas**: Suporta diferentes playlists através de um parâmetro na URL (ex: `?loja=minha-loja`).

## Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS & shadcn/ui
- **Backend**: Firebase (Firestore para banco de dados, Storage para mídias)
- **Deployment**: Vercel

---

## 1. Configuração do Projeto Firebase

Antes de rodar a aplicação, você precisa configurar um projeto no Firebase.

### 1.1. Crie um Projeto Firebase

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Clique em **"Adicionar projeto"** e siga as instruções na tela para criar um novo projeto. Dê um nome como "StoreCast".

### 1.2. Crie um Banco de Dados Firestore

1.  No console do seu novo projeto, vá para a seção **Build > Firestore Database**.
2.  Clique em **"Criar banco de dados"**.
3.  Escolha **"Iniciar em modo de produção"**. Isso é crucial para a segurança.
4.  Selecione uma localização para seu banco de dados.
5.  Clique em **"Ativar"**.

### 1.3. Configure o Firebase Storage

1.  Navegue até **Build > Storage**.
2.  Clique em **"Começar"**.
3.  Siga as instruções para ativar o Cloud Storage. Você pode usar as regras de segurança padrão por enquanto; nós as atualizaremos mais tarde.

### 1.4. Obtenha as Chaves de Configuração do Firebase

1.  No console do Firebase, vá para **Visão geral do projeto** e clique no **ícone Web (`</>`)** para adicionar um aplicativo da web ao seu projeto.
2.  Dê um apelido para seu app (ex: "StoreCast Web") e clique em **"Registrar app"**.
3.  O Firebase fornecerá um objeto `firebaseConfig`. Copie essas chaves. Você precisará delas para o próximo passo.

---

## 2. Configuração do Projeto Local

### 2.1. Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do seu projeto e cole suas chaves de configuração do Firebase nele. As chaves devem ser prefixadas com `NEXT_PUBLIC_`.

```
NEXT_PUBLIC_FIREBASE_API_KEY="SUA_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="SEU_APP_ID"
```

### 2.2. Instale as Dependências

Se ainda não o fez, instale as dependências do projeto:

```bash
npm install
```

### 2.3. Rode o Servidor de Desenvolvimento

Inicie o servidor de desenvolvimento do Next.js:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:9002`.

---

## 3. Regras de Segurança do Firebase

Para que o app funcione de forma segura, você precisa aplicar as regras de segurança corretas ao Firestore e ao Storage.

### 3.1. Regras de Segurança do Firestore

1.  Vá para a aba **Firestore Database > Regras** no console do Firebase.
2.  Substitua as regras existentes pelas seguintes:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite acesso público de leitura à coleção de playlists
    match /playlists/{storeId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas usuários autenticados (admins) podem escrever
    }

    // Nega todos os outros acessos
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3.  Clique em **"Publicar"**. Isso permite que qualquer pessoa leia os dados da playlist, mas restringe a escrita a usuários autenticados (que você configuraria para um painel de administração).

### 3.2. Regras de Segurança do Storage

1.  Vá para a aba **Storage > Regras** no console do Firebase.
2.  Substitua as regras existentes por estas:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite acesso público de leitura a todos os arquivos
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas usuários autenticados podem fazer upload
    }
  }
}
```

3.  Clique em **"Publicar"**. Isso torna todas as mídias enviadas publicamente legíveis.

---

## 4. Gerenciando o Conteúdo

Seu conteúdo é gerenciado em uma coleção do Firestore chamada `playlists`.

### 4.1. Estrutura da Playlist

Cada documento na coleção `playlists` representa a playlist de uma loja específica. O ID do documento deve corresponder ao ID da loja (ex: `main`, `filial-2`).

O documento deve conter um único campo:
- **items**: `array`

Cada objeto no array `items` representa um slide e deve ter os seguintes campos:

- **ordem**: `number` (ex: 1, 2, 3) - A ordem de exibição.
- **tipo**: `string` - O tipo de conteúdo. Deve ser `"video"`, `"imagem"`, ou `"texto"`.
- **url**: `string`
    - Para `video` ou `imagem`, esta é a URL de download direto do Firebase Storage.
    - Para `texto`, este é o texto plano que você deseja exibir.
- **duracao**: `number` - O tempo em segundos que o item permanece na tela. Para vídeos, isso é ignorado e a duração real do vídeo é usada.
- **ativo**: `boolean` - Defina como `true` para exibir o item, `false` para ocultá-lo sem deletar.
- **criadoEm**: `timestamp` (Opcional) - A data de criação.

### 4.2. Exemplo de Documento

**Coleção**: `playlists`
**ID do Documento**: `main`

**Campo**:
- `items` (Array):
  ```json
  [
    {
      "ordem": 1,
      "tipo": "imagem",
      "url": "https://firebasestorage.googleapis.com/...",
      "duracao": 15,
      "ativo": true
    },
    {
      "ordem": 2,
      "tipo": "texto",
      "url": "Grande promoção! Todos os itens com 50% de desconto!",
      "duracao": 10,
      "ativo": true
    },
    {
      "ordem": 3,
      "tipo": "video",
      "url": "https://firebasestorage.googleapis.com/...",
      "duracao": 0,
      "ativo": true
    }
  ]
  ```

### 4.3. Fazendo Upload de Mídias e Obtendo URLs

1.  Vá para a seção **Storage** no console do Firebase.
2.  Faça o upload dos seus arquivos de imagem ou vídeo.
3.  Clique no arquivo enviado para ver seus detalhes.
4.  Copie a **URL de Download** do painel de detalhes do arquivo. Esta é a URL que você usará no seu documento do Firestore.

---

## 5. Deployment

Fazer o deploy da sua aplicação StoreCast é simples com a Vercel.

1.  Envie seu código para um repositório Git (GitHub, GitLab, Bitbucket).
2.  Acesse [Vercel](https://vercel.com/new) e cadastre-se com sua conta Git.
3.  Clique em **"Add New... > Project"**.
4.  Importe o repositório Git que contém seu projeto.
5.  Na seção **Environment Variables**, adicione as mesmas chaves do Firebase que você usou no seu arquivo `.env.local`.
6.  Clique em **"Deploy"**.

A Vercel irá construir e implantar sua aplicação. Você receberá uma URL pública que pode abrir na sua Smart TV.

---

## 6. Usando em uma Smart TV

1.  Abra o navegador web na sua Android TV, Google TV ou outra Smart TV.
2.  Navegue para a URL fornecida pela Vercel.
3.  Para exibir o conteúdo de uma loja específica, adicione o parâmetro `?loja=` à URL. Por exemplo: `https://seu-app.vercel.app/?loja=filial-2`. Se omitido, o padrão é `?loja=main`.
4.  Clique no botão "Iniciar" para lançar a aplicação em tela cheia.
5.  **Para Android/Google TV**: Você pode usar um app como o "Website Shortcut" da Play Store para criar um atalho na sua tela inicial que abre a URL diretamente, fazendo com que pareça um aplicativo nativo.
