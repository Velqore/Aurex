#!/usr/bin/env node

/**
 * Automated Koyeb Deployment Script
 * This script automatically sets up environment variables and deploys to Koyeb
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Default environment variables for AUREX
const DEFAULT_ENV_VARS = {
  // Database URLs (you can update these with your actual values)
  REDIS_URL: "redis://default:AXHSAAIncDExYjdhZWQzN2U1OTI0NTI0YjlhYjU4YTNiMDQ3NTU1NXAxMA@reliable-bass-51310.upstash.io:6379",
  DATABASE_URL: "postgresql://postgres.fhwkqtxkkvjrjcrwwbjd:Aurex213454@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
  
 // Authentication
JWT_SECRET :"ACPAr/iMRwfpLa7udOURK5Rbj/eXtw19NNkj5MG4gQc=",
JWT_EXPIRES_IN :"7d",
BCRYPT_ROUNDS:"12",

//Email Configuration
SMTP_HOST:"smtp.gmail.com",
SMTP_PORT:"587",
SMTP_SECURE:false,
SMTP_USER:"aurex.app@gmail.com",
SMTP_PASS :"egwc xfuj uphv ascg ",

// # AWS S3 (for file storage)
// AWS_ACCESS_KEY_ID="your-aws-access-key"
// AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
// AWS_S3_BUCKET="cybersecchat-files"
// AWS_REGION="us-east-1",

// External APIs
VIRUSTOTAL_API_KEY:"f5269c826123f9d7120c7647a65a2fa4d5f137f1acf623c820accb10f4763c6c",
THREAT_INTEL_API_KEY :"f5269c826123f9d7120c7647a65a2fa4d5f137f1acf623c820accb10f4763c6c",

// Security
ENCRYPTION_KEY:"B7piXIp4Gh4Izz5viCVDhOVOl3trzbvV%",
FILE_ENCRYPTION_KEY:"a2wo1L2ggtAYCoqW06liQ2wVDJ4VA5lR% ",

// Application
NEXTAUTH_URL:"http://localhost:3001",
NEXTAUTH_SECRET:"GXcP0fIyTlqAm1cejfSDmEC5zQRkwAkrFLfRIWGMgMk=",
NODE_ENV:"development",

// Rate Limiting
RATE_LIMIT_WINDOW_MS:"900000",
RATE_LIMIT_MAX_REQUESTS:"100"

};

console.log('🚀 AUREX Koyeb Deployment Script');
console.log('================================');

function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`💻 Running: ${command}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} - Success`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(error.message);
    process.exit(1);
  }
}

function generateEnvFile() {
  console.log('\n📝 Generating .env file with default values...');
  
  const envContent = Object.entries(DEFAULT_ENV_VARS)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created successfully');
  
  // Also create .env.local for local development
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local file created successfully');
}

function checkKoyebCLI() {
  console.log('\n🔍 Checking Koyeb CLI installation...');
  
  try {
    execSync('koyeb --version', { stdio: 'pipe' });
    console.log('✅ Koyeb CLI is installed');
  } catch (error) {
    console.log('⚠️  Koyeb CLI not found. Installing...');
    
    // Install Koyeb CLI
    if (process.platform === 'linux') {
      runCommand('curl -fsSL https://cli.koyeb.com/install.sh | sh', 'Installing Koyeb CLI for Linux');
    } else if (process.platform === 'darwin') {
      runCommand('brew install koyeb/koyeb/koyeb-cli', 'Installing Koyeb CLI for macOS');
    } else {
      console.log('🔗 Please install Koyeb CLI manually from: https://www.koyeb.com/docs/cli/');
      console.log('💡 Or use the web interface at: https://app.koyeb.com/');
      process.exit(1);
    }
  }
}

function deployToKoyeb() {
  const appName = 'aurex-cyber-platform';
  
  console.log(`\n🚀 Deploying to Koyeb as: ${appName}`);
  
  // Build environment variables string for Koyeb CLI
  const envVarsString = Object.entries(DEFAULT_ENV_VARS)
    .map(([key, value]) => `--env ${key}="${value}"`)
    .join(' ');
  
  // Koyeb deployment command
  const deployCommand = `koyeb app deploy ${appName} \\
    --git github.com/Velqore/Aurex \\
    --git-branch main \\
    --git-build-command "npm install && npm run build" \\
    --git-run-command "npm start" \\
    --instance-type nano \\
    --regions fra \\
    --ports 3000:http \\
    --routes /:3000 \\
    ${envVarsString}`;
  
  console.log('\n📋 Deployment Command:');
  console.log(deployCommand);
  
  // Create a deployment file for manual use
  fs.writeFileSync('koyeb-deploy.sh', `#!/bin/bash\n${deployCommand}`);
  runCommand('chmod +x koyeb-deploy.sh', 'Making deployment script executable');
  
  console.log('\n🎯 Deployment options:');
  console.log('1. 📁 Manual: Run ./koyeb-deploy.sh');
  console.log('2. 🌐 Web UI: Use https://app.koyeb.com/');
  console.log('3. ⚡ Auto: Continue with automatic deployment');
  
  // Uncomment the next line if you want automatic deployment
  // runCommand(deployCommand, 'Deploying to Koyeb');
}

function createDeploymentConfig() {
  console.log('\n⚙️  Creating Koyeb deployment configuration...');
  
  const koyebConfig = {
    name: "aurex-cyber-platform",
    git: {
      repository: "github.com/Velqore/Aurex",
      branch: "main",
      build_command: "npm install && npm run build",
      run_command: "npm start"
    },
    instance_types: ["nano"],
    regions: ["fra"],
    ports: [
      {
        port: 3000,
        protocol: "http"
      }
    ],
    routes: [
      {
        path: "/",
        port: 3000
      }
    ],
    env: DEFAULT_ENV_VARS
  };
  
  fs.writeFileSync('koyeb.json', JSON.stringify(koyebConfig, null, 2));
  console.log('✅ koyeb.json configuration created');
}

function showDeploymentInstructions() {
  console.log('\n🎉 DEPLOYMENT READY!');
  console.log('==================');
  console.log('\n📋 Files created:');
  console.log('  ✅ .env - Environment variables');
  console.log('  ✅ .env.local - Local development');
  console.log('  ✅ koyeb.json - Deployment configuration');
  console.log('  ✅ koyeb-deploy.sh - Deployment script');
  
  console.log('\n🚀 Deployment Options:');
  console.log('\n1. 🌐 WEB UI (Recommended):');
  console.log('   • Go to: https://app.koyeb.com/');
  console.log('   • Connect your GitHub repository');
  console.log('   • Import environment variables from koyeb.json');
  console.log('   • Deploy with one click!');
  
  console.log('\n2. 💻 COMMAND LINE:');
  console.log('   • Login: koyeb auth login');
  console.log('   • Deploy: ./koyeb-deploy.sh');
  
  console.log('\n3. ⚡ QUICK DEPLOY:');
  console.log('   • Just push to GitHub main branch');
  console.log('   • Koyeb will auto-deploy if connected');
  
  console.log('\n🔑 Environment Variables:');
  Object.entries(DEFAULT_ENV_VARS).forEach(([key, value]) => {
    const maskedValue = key.includes('SECRET') || key.includes('PASS') || key.includes('KEY') 
      ? '***masked***' 
      : value;
    console.log(`   ${key}: ${maskedValue}`);
  });
  
  console.log('\n🎯 Your app will be available at:');
  console.log('   https://aurex-cyber-platform-{random-id}.koyeb.app');
}

// Main execution
async function main() {
  try {
    generateEnvFile();
    checkKoyebCLI();
    createDeploymentConfig();
    deployToKoyeb();
    showDeploymentInstructions();
    
    console.log('\n✨ Deployment setup complete!');
    console.log('🔗 Visit https://app.koyeb.com/ to complete deployment');
    
  } catch (error) {
    console.error('\n❌ Deployment setup failed:', error.message);
    process.exit(1);
  }
}

main();
