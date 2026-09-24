import re
import base64
import requests
import os

os.makedirs('docs/img', exist_ok=True)

with open('docs/documentation.md', 'r', encoding='utf-8') as f:
    content = f.read()

image_counter = 1

def repl(match):
    global image_counter
    code = match.group(1).strip()
    # encode base64
    b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    url = f"https://mermaid.ink/img/{b64}"
    
    img_path = f"docs/img/diagram_{image_counter}.png"
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        if response.status_code == 200:
            with open(img_path, 'wb') as img_f:
                img_f.write(response.content)
            print(f"Downloaded {img_path}")
        else:
            print(f"Failed to download diagram {image_counter}: HTTP {response.status_code}")
    except Exception as e:
        print(f"Error downloading diagram {image_counter}: {e}")

    res = f"![Diagram](img/diagram_{image_counter}.png)"
    image_counter += 1
    return res

# Regex to match mermaid blocks
pattern = re.compile(r'`mermaid\n(.*?)\n`', re.DOTALL)
new_content = pattern.sub(repl, content)

with open('docs/documentation_local_images.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Created documentation_local_images.md")
