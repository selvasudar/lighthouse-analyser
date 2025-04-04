import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto'; // Added missing import

export default async function handler(req, res) {
  try {
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    
    // Create directory if it doesn't exist
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Check if directory exists before reading it
    const directoryExists = await fs.stat(resultsDir).catch(() => false);
    
    let files = [];
    if (directoryExists) {
      files = await fs.readdir(resultsDir);
    }

    if (req.method === 'DELETE') {
      const { sitemapUrl, timestamp } = req.query;
      const sitemapHash = crypto.createHash('md5').update(sitemapUrl).digest('hex');
      const filePath = path.join(resultsDir, `${sitemapHash}-${timestamp}.json`);
      await fs.unlink(filePath);
      return res.status(200).json({ message: 'Result deleted successfully' });
    }

    if (req.query.timestamp && req.query.sitemapUrl) {
      const sitemapHash = crypto.createHash('md5').update(req.query.sitemapUrl).digest('hex');
      const filePath = path.join(resultsDir, `${sitemapHash}-${req.query.timestamp}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return res.status(200).json(JSON.parse(data));
    }

    const results = await Promise.all(files.map(async file => {
      const data = await fs.readFile(path.join(resultsDir, file), 'utf8');
      const parsed = JSON.parse(data);
      return {
        sitemapUrl: parsed[0]?.sitemapUrl || 'Unknown',
        timestamp: file.replace('.json', '').split('-').slice(1).join('-') // Extract timestamp from filename
      };
    }));

    const sitemapUrls = [...new Set(results.map(r => r.sitemapUrl))];
    const timestamps = [...new Set(results.map(r => r.timestamp))];

    res.status(200).json({ sitemapUrls, timestamps });
  } catch (error) {
    console.error('Error handling results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}