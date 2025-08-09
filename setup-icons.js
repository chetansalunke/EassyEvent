const fs = require('fs');
const path = require('path');

// Icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const projectRoot = process.cwd();
const androidResPath = path.join(
  projectRoot,
  'android',
  'app',
  'src',
  'main',
  'res',
);
const logoPath = path.join(projectRoot, 'assets', 'logo.png');

console.log('Setting up launcher icons...');
console.log('Logo path:', logoPath);
console.log('Android res path:', androidResPath);

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('Logo file not found at:', logoPath);
  process.exit(1);
}

// For now, we'll copy the original logo to all mipmap folders
// In a production app, you should use proper image resizing tools
Object.keys(iconSizes).forEach(density => {
  const mipmapPath = path.join(androidResPath, density);

  // Create directory if it doesn't exist
  if (!fs.existsSync(mipmapPath)) {
    fs.mkdirSync(mipmapPath, { recursive: true });
  }

  // Copy logo as ic_launcher.png
  const iconPath = path.join(mipmapPath, 'ic_launcher.png');
  const roundIconPath = path.join(mipmapPath, 'ic_launcher_round.png');

  try {
    fs.copyFileSync(logoPath, iconPath);
    fs.copyFileSync(logoPath, roundIconPath);
    console.log(`✓ Created icons for ${density}`);
  } catch (error) {
    console.error(`✗ Failed to create icons for ${density}:`, error.message);
  }
});

// Also copy logo to drawable folder for adaptive icon foreground
const drawablePath = path.join(androidResPath, 'drawable');
if (!fs.existsSync(drawablePath)) {
  fs.mkdirSync(drawablePath, { recursive: true });
}

const drawableLogoPath = path.join(drawablePath, 'logo.png');
try {
  fs.copyFileSync(logoPath, drawableLogoPath);
  console.log('✓ Created logo in drawable folder');
} catch (error) {
  console.error('✗ Failed to create logo in drawable folder:', error.message);
}

console.log('✓ Launcher icons setup complete!');
console.log(
  '\nNote: For production apps, consider using properly sized icons for each density.',
);
console.log(
  "You can use tools like Android Studio's Image Asset Studio or online icon generators.",
);
