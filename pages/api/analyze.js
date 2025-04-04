import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import lighthouse from 'lighthouse';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sitemapUrl } = req.body;
    const timestamp = new Date().toISOString();
    const sitemapHash = crypto.createHash('md5').update(sitemapUrl).digest('hex');
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    await fs.mkdir(resultsDir, { recursive: true });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sitemapResponse = await fetch(sitemapUrl);
    const sitemapText = await sitemapResponse.text();
    const urls = sitemapText.match(/<loc>(.*?)<\/loc>/g)?.map(match => match.replace(/<loc>|<\/loc>/g, '')) || [];

    const simplifiedResults = [];

    res.write(`data: ${JSON.stringify({ progress: 0, total: urls.length, message: 'Starting analysis...' })}\n\n`);

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    const port = new URL(browser.wsEndpoint()).port;
    const options = { logLevel: 'info', output: 'json', port };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const runnerResult = await lighthouse(url, options);
        const lhr = runnerResult.lhr;
        simplifiedResults.push({
          url,
          timestamp,
          sitemapUrl,
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

        const progress = ((i + 1) / urls.length) * 100;
        res.write(`data: ${JSON.stringify({ progress, total: urls.length, current: i + 1, message: `Analyzing ${url}` })}\n\n`);
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
        simplifiedResults.push({ url, timestamp, sitemapUrl, error: 'Analysis failed' });
        res.write(`data: ${JSON.stringify({ progress: ((i + 1) / urls.length) * 100, total: urls.length, current: i + 1, message: `Error analyzing ${url}` })}\n\n`);
      }
    }

    await browser.close();

    const filePath = path.join(resultsDir, `${sitemapHash}-${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(simplifiedResults));

    res.write(`data: ${JSON.stringify({ progress: 100, timestamp, sitemapUrl, message: 'Analysis completed' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Analysis error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Internal server error', message: 'Analysis failed. Please contact administrator.' })}\n\n`);
    res.end();
  }
}