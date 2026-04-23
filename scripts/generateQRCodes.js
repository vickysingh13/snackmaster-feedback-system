const fs = require('fs');
const path = require('path');

const dotenv = require('../backend/node_modules/dotenv');
const QRCode = require('../backend/node_modules/qrcode');
const prisma = require('../backend/db/prisma');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'qr-codes');
const BASE_URL = 'https://snackmaster.io/machine';

function removeOldNumericQRCodes() {
  if (!fs.existsSync(OUTPUT_DIR)) return;

  const files = fs.readdirSync(OUTPUT_DIR);
  for (const file of files) {
    if (!/^\d+\.png$/i.test(file)) continue;
    fs.unlinkSync(path.join(OUTPUT_DIR, file));
  }
}

async function generateQRCodes() {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    removeOldNumericQRCodes();

    const machines = await prisma.machine.findMany({
      select: { machineCode: true },
      orderBy: { id: 'asc' },
    });

    if (machines.length === 0) {
      console.log('No machines found. Nothing to generate.');
      return;
    }

    for (const machine of machines) {
      const machineCode = String(machine.machineCode || '').trim();
      if (!machineCode) continue;

      const url = `${BASE_URL}/${encodeURIComponent(machineCode)}`;
      const outputPath = path.join(OUTPUT_DIR, `${machineCode}.png`);

      await QRCode.toFile(outputPath, url, {
        width: 512,
        margin: 2,
      });

      console.log(`Generated QR for machineCode: ${machineCode}`);
    }

    if (machines.length !== 15) {
      console.warn(`Warning: expected 15 machines, found ${machines.length}.`);
    }

    console.log(`Done. Generated ${machines.length} QR code(s).`);
  } catch (error) {
    console.error('Failed to generate QR codes:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

generateQRCodes();
