const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'teeszone-catalogue-images-2026';
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const COLORS = [
  { name: "White", hex: "#FFFFFF", slug: "white" },
  { name: "Black", hex: "#26282D", slug: "black" },
  { name: "Light Grey Melange", hex: "#CCCAC9", slug: "light-grey-melange" },
  { name: "Carbon Grey Melange", hex: "#767873", slug: "carbon-grey-melange" },
  { name: "Olive", hex: "#808000", slug: "olive" },
  { name: "Pine Green", hex: "#01796F", slug: "pine-green" },
  { name: "Arrow Red", hex: "#FF0000", slug: "arrow-red" },
  { name: "Imperial Blue", hex: "#002395", slug: "imperial-blue" },
  { name: "Rama Blue", hex: "#4290F6", slug: "rama-blue" },
  { name: "Black Melange", hex: "#1C1C1C", slug: "black-melange" },
  { name: "Berige", hex: "#C0362D", slug: "berige" },
  { name: "Aluminium", hex: "#848789", slug: "aluminium" },
  { name: "Mint", hex: "#3EB489", slug: "mint" },
  { name: "French Wine", hex: "#AC1E44", slug: "french-wine" },
  { name: "Emerald Green", hex: "#50C878", slug: "emerald-green" },
  { name: "Chrome Yellow", hex: "#FFA700", slug: "chrome-yellow" },
  { name: "Woody Orange", hex: "#B74D20", slug: "woody-orange" },
  { name: "Blue Melange", hex: "#3B5998", slug: "blue-melange" },
  { name: "Navy Melange", hex: "#28334A", slug: "navy-melange" },
];

function hexToRgb(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

async function tintImage(inputPath, hex) {
  const rgb = hexToRgb(hex);
  const factorR = rgb.r / 255;
  const factorG = rgb.g / 255;
  const factorB = rgb.b / 255;

  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
      out[i + 3] = 0;
      continue;
    }

    out[i] = Math.min(255, Math.round(r * factorR));
    out[i + 1] = Math.min(255, Math.round(g * factorG));
    out[i + 2] = Math.min(255, Math.round(b * factorB));
    out[i + 3] = a;
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toBuffer();
}

async function uploadToS3(buffer, s3Key) {
  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await s3.send(cmd);
}

async function run() {
  const baseWhiteFront = path.resolve(__dirname, '../../frontend/public/products/polo-white-front-3d.png');
  const baseWhiteBack = path.resolve(__dirname, '../../frontend/public/products/polo-white-back-3d.png');
  const baseBlackFront = path.resolve(__dirname, '../../frontend/public/products/polo-black-front-3d.png');
  const baseBlackBack = path.resolve(__dirname, '../../frontend/public/products/polo-black-back-3d.png');

  const localBaseDir = path.resolve(__dirname, '../../frontend/public/customization/tshirts');

  console.log(`Starting processing for ${COLORS.length} colors...`);

  const results = [];

  for (const color of COLORS) {
    console.log(`\nProcessing: ${color.name} (${color.hex}) - slug: ${color.slug}`);
    const colorDir = path.join(localBaseDir, color.slug);
    fs.mkdirSync(colorDir, { recursive: true });

    let frontBuf, backBuf;

    if (color.slug === 'white') {
      frontBuf = fs.readFileSync(baseWhiteFront);
      backBuf = fs.readFileSync(baseWhiteBack);
    } else if (color.slug === 'black') {
      frontBuf = fs.readFileSync(baseBlackFront);
      backBuf = fs.readFileSync(baseBlackBack);
    } else {
      frontBuf = await tintImage(baseWhiteFront, color.hex);
      backBuf = await tintImage(baseWhiteBack, color.hex);
    }

    const localFrontPath = path.join(colorDir, 'front.png');
    const localBackPath = path.join(colorDir, 'back.png');
    fs.writeFileSync(localFrontPath, frontBuf);
    fs.writeFileSync(localBackPath, backBuf);
    console.log(`Saved local: ${localFrontPath}`);

    const s3FrontKey = `teeszone/customization/tshirts/${color.slug}/front.png`;
    const s3BackKey = `teeszone/customization/tshirts/${color.slug}/back.png`;

    try {
      await uploadToS3(frontBuf, s3FrontKey);
      await uploadToS3(backBuf, s3BackKey);
      console.log(`Uploaded to S3: ${s3FrontKey} & ${s3BackKey}`);
    } catch (err) {
      console.error(`S3 upload warning for ${color.name}:`, err.message);
    }

    const s3FrontUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3FrontKey}`;
    const s3BackUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3BackKey}`;

    results.push({
      name: color.name,
      slug: color.slug,
      hex: color.hex,
      frontModelUrl: `/customization/tshirts/${color.slug}/front.png`,
      backModelUrl: `/customization/tshirts/${color.slug}/back.png`,
      s3FrontUrl,
      s3BackUrl,
      s3FrontKey,
      s3BackKey,
      isActive: true,
    });
  }

  const manifestPath = path.resolve(__dirname, '../../frontend/src/data/customizationColors.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote complete manifest to: ${manifestPath}`);
  console.log(`Successfully generated and uploaded all ${results.length} colors!`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
