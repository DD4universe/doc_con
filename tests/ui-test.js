const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();

    const aiPath = 'file://' + path.join(process.cwd(), 'ai-generator.html').replace(/\\/g, '/');
    console.log('Opening', aiPath);
    await page.goto(aiPath, { waitUntil: 'load' });

    // small sleep helper
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    // Test in-app search suggestions
    try {
      await page.waitForSelector('#siteSearch', { timeout: 2000 });
      await page.click('#siteSearch');
      await page.type('#siteSearch', 'pdf');
      await sleep(600);
      const suggestions = await page.$$eval('.search-suggestion-item', els => els.map(e => e.innerText.trim()));
      console.log('searchSuggestionsCount:', suggestions.length);
      console.log('searchSuggestionsSample:', suggestions.slice(0,5));
    } catch (err) {
      console.warn('Search suggestions test failed:', err.message);
    }

    // Test SEO generation in AI Generator
    try {
      await page.waitForSelector('#seoKeywords', { timeout: 2000 });
      await page.evaluate(() => { document.getElementById('seoKeywords').value = 'pdf ai,firstpage pdf'; });
      await page.$eval('#generateSeoBtn', btn => btn.click());
      // Wait for preview seo-section
      await page.waitForSelector('#documentPreview .seo-section', { timeout: 5000 }).catch(() => {});
      const hasSeo = (await page.$('#documentPreview .seo-section')) !== null;
      console.log('aiGeneratorSeoSectionPresent:', hasSeo);
    } catch (err) {
      console.warn('AI generator SEO test failed or timed out:', err.message);
    }

    // Website report flow
    const page2 = await browser.newPage();
    const wrPath = 'file://' + path.join(process.cwd(), 'website-report.html').replace(/\\/g, '/');
    console.log('Opening', wrPath);
    await page2.goto(wrPath, { waitUntil: 'load' });

    try {
      await page2.waitForSelector('#websiteUrl', { timeout: 3000 });
      await page2.type('#websiteUrl', 'https://example.com');
      await page2.type('#reportAuthor', 'Automated Tester');
      // submit the form via DOM to ensure JS handler runs
      await page2.$eval('#websiteForm', form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

      // Wait for the loading and preview to appear
      await page2.waitForSelector('#reportPreview', { timeout: 20000 });
      // Wait up to 8s for SEO content to be injected into reportPreview
      let hasSeoText = false;
      try {
        await page2.waitForFunction(() => {
          const el = document.getElementById('reportPreview');
          return el && el.innerText && (el.innerText.includes('SEO Suggestions') || el.innerText.includes('Recommended keywords'));
        }, { timeout: 8000 });
        hasSeoText = true;
      } catch (err) {
        // fallback: read currently available text
        const reportText = await page2.$eval('#reportPreview', el => el.innerText || '');
        hasSeoText = reportText.includes('SEO Suggestions') || reportText.includes('Recommended keywords');
      }
      console.log('websiteReportHasSeo:', hasSeoText);
    } catch (err) {
      console.warn('Website report test failed or timed out:', err.message);
    }

    await browser.close();
    console.log('UI tests completed');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error during tests:', err);
    await browser.close();
    process.exit(1);
  }
})();
