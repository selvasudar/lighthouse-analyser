import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  try {
    const resultsDir = path.join(process.cwd(), 'data', 'results');
    const files = await fs.readdir(resultsDir);
    const timestamps = files.map(file => file.replace('.json', ''));
    
    if (req.query.timestamp) {
      const filePath = path.join(resultsDir, `${req.query.timestamp}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return res.status(200).json(JSON.parse(data));
    }
    
    res.status(200).json({ timestamps });
  } catch (error) {
    console.error('Error reading results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}