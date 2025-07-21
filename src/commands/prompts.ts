import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { checkEasyAIExists } from '../utils/helpers';

interface Prompt {
  name: string;
  description: string;
  category: string;
  content: string;
  model?: string;
}

interface PromptsOptions {
  create?: boolean;
  edit?: string;
  delete?: string;
  list?: boolean;
  category?: string;
  search?: string;
}

export async function managePrompts(options: PromptsOptions): Promise<void> {
  const projectDir = process.cwd();
  
  if (!await checkEasyAIExists(projectDir)) {
    throw new Error('EasyAI not initialized. Run "easyai init" first.');
  }

  if (options.create) {
    await createPrompt(projectDir);
  } else if (options.edit) {
    await editPrompt(projectDir, options.edit);
  } else if (options.delete) {
    await deletePrompt(projectDir, options.delete);
  } else if (options.list || !Object.keys(options).length) {
    await listPrompts(projectDir, options);
  } else {
    console.log(chalk.yellow('Please specify an action: --list, --create, --edit <name>, or --delete <name>'));
  }
}

async function listPrompts(projectDir: string, options: PromptsOptions): Promise<void> {
  const promptsDir = path.join(projectDir, 'easyai', 'prompts');
  
  console.log(chalk.blue('📝 Available Prompts'));
  console.log('═'.repeat(80));

  const prompts = await loadAllPrompts(promptsDir);
  
  if (prompts.length === 0) {
    console.log(chalk.yellow('\n📋 No prompts found. Create one with --create'));
    return;
  }

  // Apply filters
  let filteredPrompts = prompts;
  
  if (options.category) {
    filteredPrompts = prompts.filter(p => p.category.toLowerCase() === options.category!.toLowerCase());
  }
  
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    filteredPrompts = prompts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.content.toLowerCase().includes(searchTerm)
    );
  }

  // Group by category
  const groupedPrompts = filteredPrompts.reduce((groups, prompt) => {
    if (!groups[prompt.category]) groups[prompt.category] = [];
    groups[prompt.category].push(prompt);
    return groups;
  }, {} as Record<string, Prompt[]>);

  // Display prompts
  for (const [category, categoryPrompts] of Object.entries(groupedPrompts)) {
    console.log(`\n${chalk.cyan.bold(category)} (${categoryPrompts.length} prompts)`);
    console.log('─'.repeat(60));

    categoryPrompts.forEach(prompt => {
      console.log(`\n  ${chalk.green.bold(prompt.name)}`);
      console.log(`  ${chalk.gray(prompt.description)}`);
      
      // Show content preview (first 100 characters)
      const preview = prompt.content.replace(/\n/g, ' ').substring(0, 100);
      console.log(`  ${chalk.dim(preview)}${prompt.content.length > 100 ? '...' : ''}`);
      
      if (prompt.model) {
        console.log(`  ${chalk.yellow(`Default model: ${prompt.model}`)}`);
      }
    });
  }

  console.log(`\n${chalk.gray(`Total: ${filteredPrompts.length} prompts`)}`);
}

async function createPrompt(projectDir: string): Promise<void> {
  console.log(chalk.blue('✨ Create New Prompt'));
  console.log('─'.repeat(30));

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const prompt: Partial<Prompt> = {};

    // Get prompt details interactively
    prompt.name = await askQuestion(rl, 'Prompt name: ');
    if (!prompt.name) {
      throw new Error('Prompt name is required');
    }

    prompt.description = await askQuestion(rl, 'Description: ');
    if (!prompt.description) {
      throw new Error('Description is required');
    }

    // Show available categories
    const promptsDir = path.join(projectDir, 'easyai', 'prompts');
    const existingCategories = await getExistingCategories(promptsDir);
    if (existingCategories.length > 0) {
      console.log(chalk.gray(`Existing categories: ${existingCategories.join(', ')}`));
    }

    prompt.category = await askQuestion(rl, 'Category (or new): ');
    if (!prompt.category) {
      prompt.category = 'custom';
    }

    prompt.model = await askQuestion(rl, 'Default model (optional): ');

    console.log(chalk.yellow('\n📝 Enter prompt content (press Ctrl+D when finished):'));
    prompt.content = await readMultilineInput(rl);

    if (!prompt.content?.trim()) {
      throw new Error('Prompt content is required');
    }

    // Save the prompt
    await savePrompt(projectDir, prompt as Prompt);
    
    console.log(chalk.green(`\n✅ Prompt "${prompt.name}" created successfully!`));
    console.log(chalk.gray(`   Category: ${prompt.category}`));
    console.log(chalk.gray(`   Location: easyai/prompts/${prompt.category}/${prompt.name}.md`));

  } finally {
    rl.close();
  }
}

async function editPrompt(projectDir: string, promptName: string): Promise<void> {
  const promptPath = await findPromptFile(projectDir, promptName);
  
  if (!promptPath) {
    throw new Error(`Prompt "${promptName}" not found`);
  }

  console.log(chalk.blue(`✏️  Edit Prompt: ${promptName}`));
  console.log('─'.repeat(50));

  const currentPrompt = await loadPromptFromFile(promptPath);
  console.log(`Current content:\n${chalk.gray(currentPrompt.content)}\n`);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const updates: Partial<Prompt> = {};

    // Ask what to update
    console.log('What would you like to update? (leave empty to keep current value)');
    
    const newDescription = await askQuestion(rl, `Description [${currentPrompt.description}]: `);
    if (newDescription.trim()) {
      updates.description = newDescription;
    }

    const newCategory = await askQuestion(rl, `Category [${currentPrompt.category}]: `);
    if (newCategory.trim()) {
      updates.category = newCategory;
    }

    const newModel = await askQuestion(rl, `Default model [${currentPrompt.model || 'none'}]: `);
    if (newModel.trim()) {
      updates.model = newModel;
    }

    const updateContent = await askQuestion(rl, 'Update content? (y/N): ');
    if (updateContent.toLowerCase() === 'y' || updateContent.toLowerCase() === 'yes') {
      console.log(chalk.yellow('📝 Enter new content (press Ctrl+D when finished):'));
      updates.content = await readMultilineInput(rl);
    }

    // Apply updates
    const updatedPrompt = { ...currentPrompt, ...updates };

    // If category changed, we need to move the file
    if (updates.category && updates.category !== currentPrompt.category) {
      // Delete old file
      await fs.remove(promptPath);
      // Save to new location
      await savePrompt(projectDir, updatedPrompt);
      console.log(chalk.green(`✅ Prompt moved to category "${updates.category}"`));
    } else {
      // Update in place
      await fs.writeFile(promptPath, formatPromptContent(updatedPrompt));
      console.log(chalk.green(`✅ Prompt "${promptName}" updated successfully!`));
    }

  } finally {
    rl.close();
  }
}

async function deletePrompt(projectDir: string, promptName: string): Promise<void> {
  const promptPath = await findPromptFile(projectDir, promptName);
  
  if (!promptPath) {
    throw new Error(`Prompt "${promptName}" not found`);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const confirm = await askQuestion(rl, chalk.yellow(`Are you sure you want to delete "${promptName}"? (y/N): `));
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      await fs.remove(promptPath);
      console.log(chalk.green(`✅ Prompt "${promptName}" deleted successfully!`));
    } else {
      console.log(chalk.gray('Operation cancelled'));
    }

  } finally {
    rl.close();
  }
}

// Helper functions
async function loadAllPrompts(promptsDir: string): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  
  if (!await fs.pathExists(promptsDir)) {
    return prompts;
  }

  const categories = await fs.readdir(promptsDir);
  
  for (const category of categories) {
    const categoryPath = path.join(promptsDir, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      const files = await fs.readdir(categoryPath);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(categoryPath, file);
          try {
            const prompt = await loadPromptFromFile(filePath);
            prompt.category = category;
            prompt.name = path.basename(file, '.md');
            prompts.push(prompt);
          } catch (error) {
            // Skip invalid prompt files
            continue;
          }
        }
      }
    }
  }

  return prompts;
}

async function loadPromptFromFile(filePath: string): Promise<Prompt> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let description = '';
  let model = '';
  let actualContent = content;
  
  // Parse frontmatter if exists
  if (content.startsWith('# ')) {
    const titleLine = lines.find(line => line.startsWith('# '));
    if (titleLine) {
      description = titleLine.substring(2).trim();
    }
    
    // Look for model specification
    const modelLine = lines.find(line => line.toLowerCase().includes('model:') || line.toLowerCase().includes('default model:'));
    if (modelLine) {
      const match = modelLine.match(/model:\s*(.+)/i);
      if (match) {
        model = match[1].trim();
      }
    }
  }

  return {
    name: '',
    description: description || 'No description',
    category: '',
    content: actualContent,
    model: model || undefined
  };
}

async function savePrompt(projectDir: string, prompt: Prompt): Promise<void> {
  const categoryDir = path.join(projectDir, 'easyai', 'prompts', prompt.category);
  await fs.ensureDir(categoryDir);
  
  const filePath = path.join(categoryDir, `${prompt.name}.md`);
  const content = formatPromptContent(prompt);
  
  await fs.writeFile(filePath, content);
}

function formatPromptContent(prompt: Prompt): string {
  let content = `# ${prompt.description}\n\n`;
  
  if (prompt.model) {
    content += `Default model: ${prompt.model}\n\n`;
  }
  
  content += prompt.content;
  
  return content;
}

async function findPromptFile(projectDir: string, promptName: string): Promise<string | null> {
  const promptsDir = path.join(projectDir, 'easyai', 'prompts');
  
  if (!await fs.pathExists(promptsDir)) {
    return null;
  }

  const categories = await fs.readdir(promptsDir);
  
  for (const category of categories) {
    const categoryPath = path.join(promptsDir, category);
    const stat = await fs.stat(categoryPath);
    
    if (stat.isDirectory()) {
      const promptFile = path.join(categoryPath, `${promptName}.md`);
      if (await fs.pathExists(promptFile)) {
        return promptFile;
      }
    }
  }

  return null;
}

async function getExistingCategories(promptsDir: string): Promise<string[]> {
  if (!await fs.pathExists(promptsDir)) {
    return [];
  }

  const items = await fs.readdir(promptsDir);
  const categories = [];
  
  for (const item of items) {
    const itemPath = path.join(promptsDir, item);
    const stat = await fs.stat(itemPath);
    if (stat.isDirectory()) {
      categories.push(item);
    }
  }
  
  return categories;
}

function askQuestion(rl: any, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function readMultilineInput(rl: any): Promise<string> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    
    rl.on('line', (line: string) => {
      lines.push(line);
    });
    
    rl.on('close', () => {
      resolve(lines.join('\n'));
    });
  });
}