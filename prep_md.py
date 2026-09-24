import re
import base64

with open('docs/documentation.md', 'r', encoding='utf-8') as f:
    content = f.read()

def repl(match):
    code = match.group(1).strip()
    # encode base64
    b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    url = f"https://mermaid.ink/img/{b64}"
    return f"![Mermaid Diagram]({url})"

# Regex to match mermaid blocks
pattern = re.compile(r'`mermaid\n(.*?)\n`', re.DOTALL)
new_content = pattern.sub(repl, content)

with open('docs/documentation_images.md', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Created documentation_images.md")
