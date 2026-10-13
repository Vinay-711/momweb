const fs = require('fs');
const path = require('path');
const https = require('https');

const screensFile = '/Users/vinxy/.gemini/antigravity-ide/brain/c577b062-81e8-484c-8b32-5159ec296223/.system_generated/steps/267/output.txt';
const targetDir = '/Users/vinxy/MOMWEB/stitch-export';
const screensDir = path.join(targetDir, 'screens');

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Follow redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/padma's floral - /g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  const content = fs.readFileSync(screensFile, 'utf8');
  const data = JSON.parse(content);
  const screens = data.screens || [];

  console.log(`Found ${screens.length} screens to export...`);

  const manifest = [];

  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    const slug = slugify(s.title);
    const htmlFilename = `${String(i + 1).padStart(2, '0')}_${slug}.html`;
    const imgFilename = `${String(i + 1).padStart(2, '0')}_${slug}.png`;

    const htmlPath = path.join(screensDir, htmlFilename);
    const imgPath = path.join(screensDir, imgFilename);

    console.log(`[${i + 1}/${screens.length}] Downloading "${s.title}"...`);

    if (s.htmlCode && s.htmlCode.downloadUrl) {
      try {
        await downloadFile(s.htmlCode.downloadUrl, htmlPath);
      } catch (err) {
        console.error(`Failed to download HTML for ${s.title}:`, err.message);
      }
    }

    if (s.screenshot && s.screenshot.downloadUrl) {
      try {
        await downloadFile(s.screenshot.downloadUrl, imgPath);
      } catch (err) {
        console.error(`Failed to download image for ${s.title}:`, err.message);
      }
    }

    manifest.push({
      index: i + 1,
      title: s.title,
      slug,
      deviceType: s.deviceType,
      width: s.width,
      height: s.height,
      htmlFile: `screens/${htmlFilename}`,
      screenshotFile: `screens/${imgFilename}`
    });
  }

  // Write manifest.json
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Write README.md
  let readme = `# Padma's Floral - Stitch Project Export\n\n`;
  readme += `Exported from **Stitch Project \`2605852677261256314\` (Padma's Floral E-Commerce Platform)**.\n\n`;
  readme += `## Exported Screens (${manifest.length})\n\n`;
  readme += `| # | Screen Title | Device | HTML Prototype | Preview Image |\n`;
  readme += `|---|---|---|---|---|\n`;

  manifest.forEach((m) => {
    readme += `| ${m.index} | **${m.title}** | \`${m.deviceType}\` | [View HTML](./screens/${path.basename(m.htmlFile)}) | [View Image](./screens/${path.basename(m.screenshotFile)}) |\n`;
  });

  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);

  console.log('Export complete!');
}

run().catch(console.error);
