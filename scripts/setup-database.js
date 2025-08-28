#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDatabase() {
  console.log('🔧 Database Setup Helper\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  console.log('Choose your database setup:');
  console.log('1. Supabase (recommended)');
  console.log('2. Local PostgreSQL');
  console.log('3. Other PostgreSQL provider');

  const choice = await question('\nEnter your choice (1-3): ');

  if (choice === '1') {
    // Supabase setup
    console.log('\n📋 Supabase Setup');
    console.log('Get these values from your Supabase dashboard > Settings > API\n');

    const supabaseUrl = await question('Supabase Project URL (e.g., https://your-project-id.supabase.co): ');
    const anonKey = await question('Supabase Anon Key: ');
    const serviceRoleKey = await question('Supabase Service Role Key: ');
    const dbPassword = await question('Database Password: ');

    // Generate the connection string
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectId) {
      console.error('❌ Invalid Supabase URL format');
      process.exit(1);
    }

    const databaseUrl = `postgresql://postgres:${dbPassword}@db.${projectId}.supabase.co:5432/postgres`;

    // Update or create .env content
    const newEnvContent = `# Database - Supabase Configuration
SUPABASE_URL="${supabaseUrl}"
SUPABASE_ANON_KEY="${anonKey}"
SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"
SUPABASE_DB_PASSWORD="${dbPassword}"
DATABASE_URL="${databaseUrl}"

# JWT Secret
JWT_SECRET="${generateJwtSecret()}"

# Server
PORT=3000
NODE_ENV=development

# AI Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"

# OAuth Configuration (optional)
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:3000/auth/slack/callback"

GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3000/auth/gmail/callback"

MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

MICROSOFT_CLIENT_ID_USER=""
MICROSOFT_CLIENT_SECRET_USER=""
`;

    fs.writeFileSync(envPath, newEnvContent);
    console.log('\n✅ Supabase configuration saved to .env file');
    console.log('📝 Next steps:');
    console.log('1. Run: npm run db:push');
    console.log('2. Run: npm run dev');

  } else if (choice === '2') {
    // Local PostgreSQL setup
    console.log('\n📋 Local PostgreSQL Setup\n');

    const host = await question('Database Host (default: localhost): ') || 'localhost';
    const port = await question('Database Port (default: 5432): ') || '5432';
    const username = await question('Database Username (default: postgres): ') || 'postgres';
    const password = await question('Database Password: ');
    const database = await question('Database Name (default: soboco_task): ') || 'soboco_task';

    const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;

    // Update or create .env content
    const newEnvContent = `# Database - Local PostgreSQL
DATABASE_URL="${databaseUrl}"

# JWT Secret
JWT_SECRET="${generateJwtSecret()}"

# Server
PORT=3000
NODE_ENV=development

# AI Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"

# OAuth Configuration (optional)
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:3000/auth/slack/callback"

GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3000/auth/gmail/callback"

MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

MICROSOFT_CLIENT_ID_USER=""
MICROSOFT_CLIENT_SECRET_USER=""
`;

    fs.writeFileSync(envPath, newEnvContent);
    console.log('\n✅ Local PostgreSQL configuration saved to .env file');
    console.log('📝 Next steps:');
    console.log('1. Create the database: createdb soboco_task');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run dev');

  } else if (choice === '3') {
    // Other PostgreSQL provider
    console.log('\n📋 Other PostgreSQL Provider Setup\n');

    const databaseUrl = await question('Full PostgreSQL Connection String: ');

    // Update or create .env content
    const newEnvContent = `# Database - Other PostgreSQL Provider
DATABASE_URL="${databaseUrl}"

# JWT Secret
JWT_SECRET="${generateJwtSecret()}"

# Server
PORT=3000
NODE_ENV=development

# AI Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"

# OAuth Configuration (optional)
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:3000/auth/slack/callback"

GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3000/auth/gmail/callback"

MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

MICROSOFT_CLIENT_ID_USER=""
MICROSOFT_CLIENT_SECRET_USER=""
`;

    fs.writeFileSync(envPath, newEnvContent);
    console.log('\n✅ Database configuration saved to .env file');
    console.log('📝 Next steps:');
    console.log('1. Run: npm run db:push');
    console.log('2. Run: npm run dev');

  } else {
    console.log('❌ Invalid choice');
    process.exit(1);
  }

  rl.close();
}

function generateJwtSecret() {
  return require('crypto').randomBytes(64).toString('hex');
}

setupDatabase().catch(console.error);
