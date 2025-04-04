import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sitemapUrl } = req.body;
    const timestamp = new Date().toISOString();
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    await fs.mkdir(resultsDir, { recursive: true });

    // Fetch sitemap
    const sitemapResponse = await fetch(sitemapUrl);
    const sitemapText = await sitemapResponse.text();
    
    // Extract URLs from sitemap XML
    const urls = sitemapText.match(/<loc>(.*?)<\/loc>/g)
      ?.map(match => match.replace(/<loc>|<\/loc>/g, '')) || [];

    const simplifiedResults = [];

    // Launch Puppeteer (Headless Chrome)
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    const page = await browser.newPage();
    const port = new URL(browser.wsEndpoint()).port;
    const options = { logLevel: 'info', output: 'json', port };

    // Analyze each URL with Lighthouse
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const runnerResult = await lighthouse(url, options);
        const lhr = runnerResult.lhr;
        simplifiedResults.push({
          url,
          timestamp,
          performance: lhr.categories.performance.score * 100,
          accessibility: lhr.categories.accessibility.score * 100,
          bestPractices: lhr.categories['best-practices'].score * 100,
          seo: lhr.categories.seo.score * 100,
          metrics: {
            fcp: lhr.audits['first-contentful-paint'].displayValue,
            lcp: lhr.audits['largest-contentful-paint'].displayValue,
            tbt: lhr.audits['total-blocking-time'].displayValue,
            cls: lhr.audits['cumulative-layout-shift'].displayValue,
            speedIndex: lhr.audits['speed-index'].displayValue
          }
        });
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
        simplifiedResults.push({
          url,
          timestamp,
          error: 'Analysis failed'
        });
      }
    }

    await browser.close();

    // Save to file
    const filePath = path.join(resultsDir, `${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(simplifiedResults));

    res.status(200).json({ timestamp });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}