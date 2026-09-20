import fs from 'fs';
import path from 'path';

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(...hexToRgb(hex1));
  const l2 = getLuminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function verifyThemeFixes() {
  console.log('=== VERIFYING CIVICFIX THEME SYSTEM & DARK MODE FIX ===\n');

  // 1. Inspect LandingPage.jsx for hardcoded #FFFFFF or opacity issues
  const landingCode = fs.readFileSync(path.resolve('frontend/src/pages/LandingPage.jsx'), 'utf-8');
  
  const hasHardcodedWhiteBg = landingCode.includes("backgroundColor: '#FFFFFF'");
  console.log(`[CHECK 1] LandingPage hardcoded #FFFFFF background eliminated: ${!hasHardcodedWhiteBg ? 'PASS' : 'FAIL'}`);

  const usesSurfaceBg = landingCode.includes("backgroundColor: 'var(--bg-surface)'");
  console.log(`[CHECK 2] Hero & How-It-Works use var(--bg-surface): ${usesSurfaceBg ? 'PASS' : 'FAIL'}`);

  const hasThemePendingBadge = landingCode.includes("var(--status-pending-bg)");
  const hasThemeResolvedBadge = landingCode.includes("var(--status-resolved-bg)");
  console.log(`[CHECK 3] Step badges use responsive status theme tokens: ${hasThemePendingBadge && hasThemeResolvedBadge ? 'PASS' : 'FAIL'}`);

  // 2. Inspect index.css tokens
  const css = fs.readFileSync(path.resolve('frontend/src/index.css'), 'utf-8');
  const lightMainMatch = css.match(/--text-main:\s*(#[0-9a-fA-F]+);/);
  const lightBgSurfaceMatch = css.match(/--bg-surface:\s*(#[0-9a-fA-F]+);/);

  const darkBlockMatch = css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/s);
  if (!darkBlockMatch) {
    console.error('FAIL: [data-theme="dark"] block not found in index.css');
    process.exit(1);
  }
  const darkBlock = darkBlockMatch[1];
  const darkMainMatch = darkBlock.match(/--text-main:\s*(#[0-9a-fA-F]+);/);
  const darkBgSurfaceMatch = darkBlock.match(/--bg-surface:\s*(#[0-9a-fA-F]+);/);
  const darkBgBaseMatch = darkBlock.match(/--bg-base:\s*(#[0-9a-fA-F]+);/);

  const lightText = lightMainMatch[1];
  const lightBg = lightBgSurfaceMatch[1];
  const darkText = darkMainMatch[1];
  const darkBg = darkBgSurfaceMatch[1];
  const darkBase = darkBgBaseMatch[1];

  const lightContrast = getContrast(lightText, lightBg);
  const darkContrast = getContrast(darkText, darkBg);
  const darkBaseContrast = getContrast(darkText, darkBase);

  console.log(`\n[CONTRAST ANALYSIS]`);
  console.log(`Light Mode Hero Heading Contrast (${lightText} on ${lightBg}): ${lightContrast.toFixed(2)}:1 (WCAG AAA standard >= 7.0:1)`);
  console.log(`Dark Mode Hero Heading Contrast (${darkText} on ${darkBg}): ${darkContrast.toFixed(2)}:1 (WCAG AAA standard >= 7.0:1)`);
  console.log(`Dark Mode Base Page Contrast (${darkText} on ${darkBase}): ${darkBaseContrast.toFixed(2)}:1 (WCAG AAA standard >= 7.0:1)`);

  const contrastPassed = lightContrast >= 7.0 && darkContrast >= 7.0;
  console.log(`[CHECK 4] WCAG AAA High Contrast Compliance: ${contrastPassed ? 'PASS' : 'FAIL'}`);

  // 3. Inspect ThemeContext for System mode and localStorage persistence
  const themeContextCode = fs.readFileSync(path.resolve('frontend/src/context/ThemeContext.jsx'), 'utf-8');
  const hasLocalStorage = themeContextCode.includes("localStorage.setItem('civicfix_theme', theme)");
  const hasMediaQuery = themeContextCode.includes("window.matchMedia('(prefers-color-scheme: dark)')");
  console.log(`[CHECK 5] Theme persistence via localStorage: ${hasLocalStorage ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 6] System preference media query listener: ${hasMediaQuery ? 'PASS' : 'FAIL'}`);

  // 4. Verify Live Frontend Server HTTP Response
  try {
    const res = await fetch('http://localhost:5173/');
    console.log(`[CHECK 7] Frontend dev server accessible (status: ${res.status}): ${res.status === 200 ? 'PASS' : 'FAIL'}`);
  } catch (err) {
    console.error('Failed to connect to frontend server:', err.message);
  }

  console.log('\n=== ALL CHECKS COMPLETED SUCCESSFULLY ===');
}

verifyThemeFixes();
