const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the build directory
const buildDir = path.join(__dirname, 'build');

// Clean previous build
if (fs.existsSync(buildDir)) {
  console.log('Cleaning previous build...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
      }
    });
  });
}

// Main build function
async function buildForProduction() {
  try {
    console.log('🚀 Starting production build process...');
    
    // Build the app with optimizations
    console.log('📦 Building optimized bundle...');
    await runCommand('npm', ['run', 'build:optimized']);
    
    // Install sharp if not already installed
    try {
      console.log('🔍 Checking for sharp dependency...');
      require('sharp');
    } catch (err) {
      console.log('🔧 Installing sharp for image optimization...');
      await runCommand('npm', ['install', '--save-dev', 'sharp', '--legacy-peer-deps']);
    }
    
    // Optimize images
    console.log('🖼️ Optimizing images...');
    await runCommand('node', ['optimize-images.js']);
    
    // Create additional caching files and manifests
    console.log('📝 Generating caching manifests...');
    
    // Create a hash manifest for cache busting
    const buildFiles = getAllFilesInDirectory(buildDir);
    const manifest = {};
    
    buildFiles.forEach(file => {
      const relativePath = path.relative(buildDir, file);
      const stats = fs.statSync(file);
      const hash = stats.mtimeMs.toString(16);
      manifest[relativePath] = hash;
    });
    
    fs.writeFileSync(
      path.join(buildDir, 'asset-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('✅ Production build completed successfully!');
    console.log('➡️ The optimized build is available in the "build" directory.');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Helper function to get all files in a directory recursively
function getAllFilesInDirectory(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recurse into subdirectory
      results = results.concat(getAllFilesInDirectory(filePath));
    } else {
      results.push(filePath);
    }
  });
  
  return results;
}

// Run the build
buildForProduction(); 