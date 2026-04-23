#!/usr/bin/env python3
"""
SnackMaster QR Code Generator
Generates QR codes for all configured vending machines.

Install dependencies:
    pip install qrcode[pil] pillow

Usage:
    python generate_qrs.py
    python generate_qrs.py --base-url https://snackmaster.io
    python generate_qrs.py --output-dir /path/to/output
"""

import argparse
import os
import sys

try:
    import qrcode
    from qrcode.image.styledpil import StyledPilImage
    from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Required packages not installed.")
    print("Run: pip install qrcode[pil] pillow")
    sys.exit(1)

# ─── Machine data ────────────────────────────────────────────────────
MACHINES = [
    {"code": "2143", "location": "WIPRO GOPANPALLY - GROUND FLOOR"},
    {"code": "2144", "location": "WIPRO MANIKONDA 5 - GROUND FLOOR"},
    {"code": "2145", "location": "WIPRO MANIKONDA 4 - GROUND FLOOR"},
    {"code": "2632", "location": "WIPRO GOPANPALLY 1 - GROUND FLOOR"},
    {"code": "2633", "location": "WIPRO GOPANPALLY 2 - GROUND FLOOR"},
    {"code": "2634", "location": "WIPRO GOPANPALLY 3 - GROUND FLOOR"},
    {"code": "2642", "location": "WIPRO MANIKONDA 1 - 9TH FLOOR"},
    {"code": "2643", "location": "WIPRO MANIKONDA 2 - 3RD FLOOR"},
    {"code": "2644", "location": "WIPRO MANIKONDA 3 - GROUND FLOOR"},
    {"code": "2645", "location": "WIPRO MANIKONDA 6 - GROUND FLOOR"},
    {"code": "4772", "location": "DRAPER STARTUP HOUSE - GACHIBOWLI"},
    {"code": "VV00006", "location": "HOTEL SAYINN - GROUND FLOOR"},
    {"code": "vv00001", "location": "BOB - BANK OF BARODA GACHIBOWLI"},
    {"code": "vv00002", "location": "IIRM - IIRM FINANCIAL DIST"},
    {"code": "vv00003", "location": "UOH - UNIVERSITY OF HYDERABAD GACHIBOWLI"},
]

BRAND_ORANGE = "#FF6B00"
BRAND_DARK   = "#1A0A00"
BRAND_LIGHT  = "#FFF8F0"


def generate_qr(machine_code: str, url: str, output_path: str) -> None:
    """Generate a styled QR code PNG for a single machine."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Build QR image
    qr_img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        color_mask=None,
    ).convert("RGB")

    # Canvas
    canvas_w, canvas_h = 600, 750
    canvas = Image.new("RGB", (canvas_w, canvas_h), BRAND_LIGHT)
    draw = ImageDraw.Draw(canvas)

    # Header banner
    draw.rectangle([0, 0, canvas_w, 130], fill=BRAND_ORANGE)

    # Title text (use default font since custom fonts may not be available)
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 36)
        sub_font   = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 18)
        code_font  = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 28)
        loc_font   = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 16)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font   = title_font
        code_font  = title_font
        loc_font   = title_font

    draw.text((canvas_w // 2, 45), "🍿 SnackMaster", font=title_font, fill="white", anchor="mm")
    draw.text((canvas_w // 2, 90), "Scan to give feedback", font=sub_font, fill="white", anchor="mm")

    # QR code centered
    qr_size = 380
    qr_resized = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    qr_x = (canvas_w - qr_size) // 2
    qr_y = 150
    canvas.paste(qr_resized, (qr_x, qr_y))

    # Machine info box
    box_y = qr_y + qr_size + 20
    draw.rectangle([30, box_y, canvas_w - 30, box_y + 80], fill=BRAND_DARK, outline=BRAND_ORANGE, width=2)

    draw.text(
        (canvas_w // 2, box_y + 22),
        machine_code,
        font=code_font,
        fill=BRAND_ORANGE,
        anchor="mm",
    )

    # Truncate location if too long
    location = MACHINES[[m["code"] for m in MACHINES].index(machine_code)]["location"]
    if len(location) > 48:
        location = location[:45] + "..."

    draw.text(
        (canvas_w // 2, box_y + 56),
        location,
        font=loc_font,
        fill="white",
        anchor="mm",
    )

    # Footer
    draw.text(
        (canvas_w // 2, canvas_h - 20),
        "snackmaster.io",
        font=loc_font,
        fill="#888888",
        anchor="mm",
    )

    canvas.save(output_path, "PNG", optimize=True)
    print(f"  ✅  {machine_code} → {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate SnackMaster QR codes")
    parser.add_argument(
        "--base-url",
        default="https://snackmaster.io",
        help="Base URL (default: https://snackmaster.io)",
    )
    parser.add_argument(
        "--output-dir",
        default="qr-codes",
        help="Output directory (default: ./qr-codes)",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    out_dir  = args.output_dir

    os.makedirs(out_dir, exist_ok=True)
    print(f"\n🍿 SnackMaster QR Code Generator")
    print(f"   Base URL : {base_url}")
    print(f"   Output   : {out_dir}/\n")

    for machine in MACHINES:
        code = machine["code"]
        url  = f"{base_url}/machine/{code}"
        path = os.path.join(out_dir, f"{code}.png")
        generate_qr(code, url, path)

    print(f"\n🎉 Done! {len(MACHINES)} QR codes saved to '{out_dir}/'")
    print("   Print these and attach them to the corresponding machines.\n")


if __name__ == "__main__":
    main()
