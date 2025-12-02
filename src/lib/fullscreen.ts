'use client';

// A simple utility for requesting fullscreen, as the AI-based one was overly complex.
export async function requestFullscreen() {
  const element = document.documentElement;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      /* Safari */
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      /* IE11 */
      await (element as any).msRequestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen request failed:", error);
    // Fail silently, as it's not critical if fullscreen fails.
  }
}
