# **App Name**: StoreCast

## Core Features:

- Real-time Playlist Synchronization: Dynamically load and update the playlist from Firestore using onSnapshot, ensuring near real-time synchronization of content displayed on the screen with any changes made in the Firebase console.
- Automated Fullscreen Display: Automatically trigger fullscreen mode upon loading the application in the web browser, providing an uninterrupted and immersive viewing experience on any Smart TV or device with a web browser, without displaying any address bar or browser controls. The LLM is a tool that uses user agent sniffing, among other techniques, to reliably switch into fullscreen.
- Multimedia Content Support: Seamlessly play videos in full screen with automatic looping and transition to the next item, alongside displaying images and text-based slides according to pre-defined durations, ensuring varied content delivery.
- On-Screen Clock & Date: Display a live clock showing current time, alongside the full date (e.g., Monday, 01 December 2025), designed with a discreet style and semi-transparent background for continuous visibility without obstructing primary content.
- Remote Control Lockout: Disable remote control or keyboard interactions to prevent accidental exit from the fullscreen digital signage, guaranteeing uninterrupted display of content within retail locations.
- Robust Media Caching: Employ aggressive caching strategies for both video and image assets, preloading content when possible, and auto reconnect if the internet drops, decreasing buffering.
- Adaptive Content Display: Show a simple and clear 'No content configured' message when no active playlist items are available. When multiple stores are supported, this features displays different messages according to the url parameter or subdomain (e.g. ?store=storeName).

## Style Guidelines:

- Primary color: Deep blue (#2E3192) to convey professionalism and trust in the content displayed.
- Background color: Light grey (#E5E7EB), a heavily desaturated near-neutral matching the hue of the primary color; this creates a subtle contrast and is ideal for long periods of screen display.
- Accent color: Purple (#6639B6), adding a touch of modernity, is placed about 30 degrees to the left of the primary color on the color wheel; make it different enough to create a visual hierarchy.
- Body and headline font: 'Inter', a sans-serif typeface with a modern, machined, objective, neutral look.
- Minimalist icons for error states and loading screens. Consider using icons with rounded corners to match the clean aesthetic.
- Ensure all elements are easily readable from a distance, adhering to 10-foot UI principles.
- Use subtle fade-in/out transitions for playlist items. Avoid any distracting or unnecessary animations.