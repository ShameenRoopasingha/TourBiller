import base64
import requests
import re
import os
from io import BytesIO
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from htmldocx import HtmlToDocx
import markdown

md_file = 'docs/documentation.md'
docx_file = 'docs/VIGIL_Documentation.docx'

with open(md_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

# Create a new document
doc = Document()
html_parser = HtmlToDocx()

# Split the markdown by mermaid blocks
# The pattern finds `mermaid ... `
pattern = r'(`mermaid\n.*?\n`)'
parts = re.split(pattern, md_content, flags=re.DOTALL)

for part in parts:
    if part.startswith('`mermaid'):
        # It's a mermaid block
        code = part.replace('`mermaid', '').replace('`', '').strip()
        # Encode to base64
        # mermaid.ink expects base64 without padding usually, or standard base64 URL safe
        b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')
        url = f'https://mermaid.ink/img/{b64}'
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                image_stream = BytesIO(response.content)
                doc.add_picture(image_stream, width=Inches(6.0))
            else:
                doc.add_paragraph("[Diagram could not be rendered]")
                doc.add_paragraph(code)
        except Exception as e:
            doc.add_paragraph("[Error rendering diagram]")
            doc.add_paragraph(code)
    else:
        # It's regular markdown. Convert to HTML and add to doc
        if part.strip():
            html = markdown.markdown(part, extensions=['tables'])
            html_parser.add_html_to_document(html, doc)

doc.save(docx_file)
print("Created " + docx_file)
