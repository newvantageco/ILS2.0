#!/usr/bin/env python3
"""
Create ILS-branded favicon PNG files
Simple script using PIL/Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    def create_ils_favicon(size, output_path):
        """Create an ILS-branded favicon"""
        # Create image with dark blue background
        img = Image.new('RGBA', (size, size), (15, 23, 42, 255))  # #0f172a
        draw = ImageDraw.Draw(img)

        # Draw lens circles at top
        center_x = size // 2
        center_y = int(size * 0.3)
        outer_radius = int(size * 0.12)
        inner_radius = int(size * 0.08)

        # Outer circle
        draw.ellipse(
            [(center_x - outer_radius, center_y - outer_radius),
             (center_x + outer_radius, center_y + outer_radius)],
            outline=(96, 165, 250, 255),  # #60a5fa
            width=int(size * 0.03)
        )

        # Inner circle
        draw.ellipse(
            [(center_x - inner_radius, center_y - inner_radius),
             (center_x + inner_radius, center_y + inner_radius)],
            outline=(96, 165, 250, 255),  # #60a5fa
            width=int(size * 0.02)
        )

        # Draw ILS text
        try:
            # Try to use a system font
            font_size = int(size * 0.4)
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()

        text = "ILS"
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Center the text
        text_x = (size - text_width) // 2
        text_y = int(size * 0.65) - text_height // 2

        draw.text(
            (text_x, text_y),
            text,
            fill=(59, 130, 246, 255),  # #3b82f6
            font=font
        )

        # Save
        img.save(output_path, 'PNG')
        print(f"✅ Created {output_path} ({size}x{size})")

    # Create all sizes
    print("Creating ILS-branded favicons...\n")
    create_ils_favicon(128, 'client/public/favicon.png')
    create_ils_favicon(192, 'client/public/icon-192.png')
    create_ils_favicon(512, 'client/public/icon-512.png')
    print("\n✅ All favicons created successfully!")

except ImportError:
    print("❌ Pillow (PIL) not installed")
    print("\nInstall with: pip install Pillow")
    print("Or: pip3 install Pillow")
    print("\nAlternatively, use an online favicon generator:")
    print("1. Go to https://favicon.io/favicon-generator/")
    print("2. Use these settings:")
    print("   - Text: ILS")
    print("   - Background: #0f172a (dark blue)")
    print("   - Font Color: #3b82f6 (blue)")
    print("   - Font: Inter or Arial Bold")
    print("   - Size: Round")
    print("3. Download and extract to client/public/")
