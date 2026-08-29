from PIL import Image

img = Image.open('assets/favicon_raw.jpg').convert('RGBA')
width, height = img.size

# Simple crop focusing on the center zk text
left = int(width * 0.15)
top = int(height * 0.35)
right = int(width * 0.85)
bottom = int(height * 0.65)

cropped = img.crop((left, top, right, bottom))

# Center on 512x512 canvas
square = Image.new('RGBA', (512, 512), (5, 7, 10, 255))
cropped.thumbnail((440, 440), Image.Resampling.LANCZOS)
paste_x = (512 - cropped.width) // 2
paste_y = (512 - cropped.height) // 2
square.paste(cropped, (paste_x, paste_y))

square.save('assets/favicon.png', 'PNG')
square.save('favicon.ico')
print('Favicon created successfully!')
