from PIL import Image

img = Image.open('assets/favicon_raw.jpg').convert('RGBA')
width, height = img.size

# Tight crop around zk letters
left = int(width * 0.23)
top = int(height * 0.41)
right = int(width * 0.77)
bottom = int(height * 0.59)

cropped = img.crop((left, top, right, bottom))

# Expand zk letters to fill maximum area of 512x512 icon (500x500)
square = Image.new('RGBA', (512, 512), (5, 7, 10, 255))
cropped = cropped.resize((490, int(490 * cropped.height / cropped.width)), Image.Resampling.LANCZOS)

paste_x = (512 - cropped.width) // 2
paste_y = (512 - cropped.height) // 2
square.paste(cropped, (paste_x, paste_y))

square.save('assets/favicon.png', 'PNG')
square.save('favicon.ico')
print('Large zk favicon created successfully!')
