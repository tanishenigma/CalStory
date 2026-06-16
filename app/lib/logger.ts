import fs from 'fs/promises';
import path from 'path';

export async function logApiRequest(endpoint: string, params: any, responseStatus: number) {
  try {
    const logFilePath = path.join(process.cwd(), 'api.log');
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ENDPOINT: ${endpoint} | PARAMS: ${JSON.stringify(params)} | STATUS: ${responseStatus}\n`;
    
    await fs.appendFile(logFilePath, logEntry, 'utf8');
  } catch (error) {
    console.error('Failed to write to api.log:', error);
  }
}
