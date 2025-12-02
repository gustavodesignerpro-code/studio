# StoreCast - Digital Signage with Next.js and Firebase

StoreCast is a complete digital signage application designed to run on any Smart TV with a web browser (like Android TV, Google TV, or Fire TV). It leverages Next.js 15, TypeScript, Tailwind CSS, and Firebase to deliver a remotely managed, real-time, and immersive content experience for retail environments.

## Features

- **Automatic Fullscreen**: Enters fullscreen mode on launch for an uninterrupted display.
- **Real-time Playlist**: Content is managed in Firebase Firestore and updates on-screen instantly.
- **Multimedia Support**: Display videos, images, and formatted text slides.
- **10-foot UI**: All visuals are optimized for viewing from a distance.
- **Live Clock**: Always-on display of the current time and date.
- **Zero Interaction**: Runs automatically without any need for user input. Remote/keyboard inputs are disabled to prevent accidental exits.
- **Resilient**: Pre-caches media, shows elegant loading/empty states, and attempts to reconnect if the internet connection drops.
- **Secure**: Uses Firebase security rules to protect your data, with no sensitive keys exposed on the client-side.
- **Multi-Store Ready**: Supports different playlists via a URL parameter (e.g., `?loja=minha-loja`).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Backend**: Firebase (Firestore for database, Storage for media)
- **Deployment**: Vercel

---

## 1. Firebase Project Setup

Before you can run this application, you need to set up a Firebase project.

### 1.1. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the on-screen instructions to create a new project. Give it a name like "StoreCast".

### 1.2. Create a Firestore Database

1.  In your new project's console, go to the **Build > Firestore Database** section.
2.  Click **"Create database"**.
3.  Choose **"Start in production mode"**. This is crucial for security.
4.  Select a location for your database.
5.  Click **"Enable"**.

### 1.3. Set Up Firebase Storage

1.  Navigate to **Build > Storage**.
2.  Click **"Get started"**.
3.  Follow the prompts to enable Cloud Storage. You can use the default security rules for now; we will update them later.

### 1.4. Get Firebase Configuration Keys

1.  In the Firebase console, go to **Project Overview** and click the **Web icon (`</>`)** to add a web app to your project.
2.  Give your app a nickname (e.g., "StoreCast Web") and click **"Register app"**.
3.  Firebase will provide you with a `firebaseConfig` object. Copy these keys. You will need them for the next step.

---

## 2. Local Project Configuration

### 2.1. Environment Variables

Create a file named `.env.local` in the root of your project directory and paste your Firebase configuration keys into it. The keys must be prefixed with `NEXT_PUBLIC_`.

```
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
```

### 2.2. Install Dependencies

If you haven't already, install the project dependencies:

```bash
npm install
```

### 2.3. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The app will be available at `http://localhost:9002`.

---

## 3. Firebase Security Rules

For the app to work securely, you need to apply the correct security rules to Firestore and Storage.

### 3.1. Firestore Security Rules

1.  Go to the **Firestore Database > Rules** tab in the Firebase console.
2.  Replace the existing rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to the playlists collection
    match /playlists/{storeId} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users (admins) can write
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3.  Click **"Publish"**. This allows anyone to read the playlist data but restricts writing to authenticated users (which you would set up for an admin panel).

### 3.2. Storage Security Rules

1.  Go to the **Storage > Rules** tab in the Firebase console.
2.  Replace the existing rules with these:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can upload
    }
  }
}
```

3.  Click **"Publish"**. This makes all uploaded media publicly readable.

---

## 4. Managing Content

Your content is managed in a Firestore collection named `playlists`.

### 4.1. Playlist Structure

Each document in the `playlists` collection represents a specific store's playlist. The ID of the document should match the store's ID (e.g., `main`, `store-branch-2`).

The document should contain a single field:
- **items**: `array`

Each object in the `items` array represents a slide and must have the following fields:

- **ordem**: `number` (e.g., 1, 2, 3) - The display order.
- **tipo**: `string` - The content type. Must be `"video"`, `"imagem"`, or `"texto"`.
- **url**: `string`
    - For `video` or `imagem`, this is the direct download URL from Firebase Storage.
    - For `texto`, this is the plain text you want to display.
- **duracao**: `number` - The time in seconds the item stays on screen. For videos, this is ignored, and the video's actual duration is used.
- **ativo**: `boolean` - Set to `true` to display the item, `false` to hide it without deleting.
- **criadoEm**: `timestamp` (Optional) - The creation date.

### 4.2. Example Document

**Collection**: `playlists`
**Document ID**: `main`

**Field**:
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

### 4.3. Uploading Media and Getting URLs

1.  Go to the **Storage** section in the Firebase console.
2.  Upload your image or video files.
3.  Click on the uploaded file to view its details.
4.  Copy the **Download URL** from the file details panel. This is the URL you will use in your Firestore document.

---

## 5. Deployment

Deploying your StoreCast app is simple with Vercel.

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Go to [Vercel](https://vercel.com/new) and sign up with your Git account.
3.  Click **"Add New... > Project"**.
4.  Import the Git repository containing your project.
5.  In the **Environment Variables** section, add the same Firebase keys you used in your `.env.local` file.
6.  Click **"Deploy"**.

Vercel will build and deploy your application. You'll be given a public URL that you can open on your Smart TV.

---

## 6. Using on a Smart TV

1.  Open the web browser on your Android TV, Google TV, or other Smart TV.
2.  Navigate to the URL provided by Vercel.
3.  To display content for a specific store, add the `?loja=` parameter to the URL. For example: `https://your-app-name.vercel.app/?loja=branch-2`. If omitted, it defaults to `?loja=main`.
4.  Click the "Iniciar" button to launch the application in fullscreen mode.
5.  **For Android/Google TV**: You can use an app like "Website Shortcut" from the Play Store to create a shortcut on your home screen that opens the URL directly, making it feel like a native app.
