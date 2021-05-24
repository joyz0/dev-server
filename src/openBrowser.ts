import path from 'path';
import open from 'open';
import { execSync } from 'child_process';

// https://github.com/sindresorhus/open#app
const OSX_CHROME = 'google chrome';

export function openBrowser(url: string) {
  // The browser executable to open.
  // See https://github.com/sindresorhus/open#app for documentation.
  const browser = process.env.BROWSER || '';
  if (browser.toLowerCase() !== 'none') {
    return startBrowserProcess(browser, url);
  }
  return false;
}
/**
 * https://github.com/vitejs/vite/blob/24178b0582/packages/vite/src/node/server/openBrowser.ts
 *
 */
function startBrowserProcess(browser: string | undefined, url: string) {
  // If we're on OS X, the user hasn't specifically
  // requested a different browser, we can try opening
  // Chrome with AppleScript. This lets us reuse an
  // existing tab when possible instead of creating a new one.
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' && (browser === '' || browser === OSX_CHROME);

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      // Try our best to reuse existing tab
      // on OS X Google Chrome with AppleScript
      execSync('ps cax | grep "Google Chrome"');
      execSync('osascript openChrome.applescript "' + encodeURI(url) + '"', {
        cwd: path.dirname(require.resolve('vite/bin/openChrome.applescript')),
        stdio: 'ignore',
      });
      return true;
    } catch (err) {
      // Ignore errors
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing the string `open` to `open` function (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebook/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined;
  }

  // Fallback to open
  // (It will always open new tab)
  try {
    const options = { app: browser, url: true };
    open(url, options).catch(() => {}); // Prevent `unhandledRejection` error.
    return true;
  } catch (err) {
    return false;
  }
}
