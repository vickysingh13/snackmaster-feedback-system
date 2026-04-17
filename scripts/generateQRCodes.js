const fs = require('fs');
const path = require('path');

const dotenv = require('../backend/node_modules/dotenv');
const QRCode = require('../backend/node_modules/qrcode');
const prisma = require('../backend/db/prisma');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'qr-codes');
const BASE_URL = 'https://snackmaster.io/machine';

async function generateQRCodes() {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const machines = await prisma.machine.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (machines.length === 0) {
      console.log('No machines found. Nothing to generate.');
      return;
    }

    for (const machine of machines) {
      const machineId = machine.id;
      const url = `${BASE_URL}/${machineId}`;
      const outputPath = path.join(OUTPUT_DIR, `${machineId}.png`);

      await QRCode.toFile(outputPath, url, {
        width: 512,
        margin: 2,
      });

      console.log(`Generated: qr-codes/${machineId}.png`);
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
