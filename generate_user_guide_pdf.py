from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.units import mm

input_md = 'CRObras_User_Guide.md'
output_pdf = 'CRObras_User_Guide.pdf'

with open(input_md, 'r', encoding='utf-8') as f:
    lines = [line.rstrip('\n') for line in f]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='GuideHeading1', parent=styles['Heading1'], fontSize=18, leading=22, spaceAfter=12))
styles.add(ParagraphStyle(name='GuideHeading2', parent=styles['Heading2'], fontSize=14, leading=18, spaceAfter=10))
styles.add(ParagraphStyle(name='GuideBullet', parent=styles['Normal'], leftIndent=12, bulletIndent=0, spaceAfter=4))
styles.add(ParagraphStyle(name='GuideBody', parent=styles['Normal'], fontSize=11, leading=15, spaceAfter=8))

story = []
list_items = []
inside_list = False

for line in lines:
    if not line.strip():
        if inside_list:
            story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))
            list_items = []
            inside_list = False
        story.append(Spacer(1, 6))
        continue
    if line.startswith('# '):
        if inside_list:
            story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))
            list_items = []
            inside_list = False
        story.append(Paragraph(line[2:].strip(), styles['GuideHeading1']))
    elif line.startswith('## '):
        if inside_list:
            story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))
            list_items = []
            inside_list = False
        story.append(Paragraph(line[3:].strip(), styles['GuideHeading2']))
    elif line.startswith('- '):
        inside_list = True
        list_items.append(ListItem(Paragraph(line[2:].strip(), styles['GuideBullet']), leftIndent=12, bulletFontSize=10))
    elif line[0:3].isdigit() and line[1:3] == '. ':
        if inside_list:
            story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))
            list_items = []
            inside_list = False
        story.append(Paragraph(line, styles['GuideBody']))
    else:
        if inside_list:
            story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))
            list_items = []
            inside_list = False
        story.append(Paragraph(line, styles['GuideBody']))

if inside_list:
    story.append(ListFlowable(list_items, bulletType='bullet', start='bullet', leftIndent=12, bulletFontSize=10))

pdf = SimpleDocTemplate(output_pdf, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
pdf.build(story)
print('Created', output_pdf)
