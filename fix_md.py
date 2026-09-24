with open('docs/documentation_local_images.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken replacement
content = content.replace('!\\[Diagram\\]', '![Diagram]')

# Fix any remaining double backticks around images
import re
content = re.sub(r'`!\[Diagram\]\((.*?)\)`', r'![Diagram](\1)', content)

with open('docs/documentation_local_images.md', 'w', encoding='utf-8') as f:
    f.write(content)
