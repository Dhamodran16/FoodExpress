/**
 * Disables right-click context menu and common developer tools shortcuts
 * Note: This provides basic protection but can be bypassed by determined users
 */

export const disableRightClick = () => {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable common keyboard shortcuts for developer tools
  document.addEventListener('keydown', (e) => {
    // Disable F12 (Developer Tools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+I (Developer Tools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+P (Print - can be used to view source)
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+Shift+P (Command Palette in DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      return false;
    }
  });

  // Disable text selection (optional - can be commented out if you want users to select text)
  // document.addEventListener('selectstart', (e) => {
  //   e.preventDefault();
  //   return false;
  // });

  // Disable drag and drop (optional - can be commented out if you need drag functionality)
  // document.addEventListener('dragstart', (e) => {
  //   e.preventDefault();
  //   return false;
  // });
};

