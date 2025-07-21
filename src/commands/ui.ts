import chalk from 'chalk';
import { exec } from 'child_process';
import { checkEasyAIExists } from '../utils/helpers';
import { startServer } from '../server';

async function killPortProcess(port: number): Promise<void> {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -ti:${port}`;
    }

    exec(command, (error, stdout) => {
      if (error || !stdout.trim()) {
        // No process found on port, continue
        resolve();
        return;
      }

      const processIds = stdout.trim().split('\n').filter(Boolean);
      
      if (processIds.length === 0) {
        resolve();
        return;
      }

      // Kill processes
      let killCommand: string;
      if (platform === 'win32') {
        killCommand = `taskkill /PID ${processIds[0].split(/\s+/).pop()} /F`;
      } else {
        killCommand = `kill -9 ${processIds.join(' ')}`;
      }

      console.log(chalk.yellow(`🔄 Port ${port} in use, cleaning up...`));
      
      exec(killCommand, (killError) => {
        if (killError) {
          console.log(chalk.red(`⚠️  Could not clean port ${port}: ${killError.message}`));
        } else {
          console.log(chalk.green(`✅ Port ${port} cleaned successfully`));
        }
        resolve();
      });
    });
  });
}

export async function startUI(port: number = 7542): Promise<void> {
  const projectDir = process.cwd();

  console.log(chalk.green('🎯 Starting EasyAI Dashboard...'));
  
  // Kill any existing process on the port
  await killPortProcess(port);
  
  console.log(chalk.blue(`📱 Opening: http://localhost:${port}`));
  console.log(chalk.gray('Press Ctrl+C to stop'));

  // Set port in environment
  process.env.EASYAI_PORT = port.toString();

  // Start the TypeScript server
  await startServer();

  // Wait a moment for server to start, then open browser
  setTimeout(() => {
    openBrowser(`http://localhost:${port}`);
  }, 2000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down EasyAI Dashboard...'));
    console.log(chalk.green('✅ Dashboard stopped'));
    process.exit(0);
  });

  return new Promise(() => {
    // Keep the process running
  });
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "" "${url}"`;
      break;
    default: // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  exec(command, (error) => {
    if (error) {
      console.log(chalk.yellow(`⚠️  Could not open browser automatically. Please visit: ${url}`));
    } else {
      console.log(chalk.green('🌐 Browser opened automatically'));
    }
  });
}