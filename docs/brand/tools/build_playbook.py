# -*- coding: utf-8 -*-
"""Builds dist/playbook.html from tools/template.html + the brand markdown files.

Usage:  python tools/build_playbook.py [BASE]
BASE = folder holding 00-espinha.md and the deliverables (default: parent of tools/).
Requires: pip install markdown
"""
import re, os, sys, html
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(HERE)
OUT = os.path.join(BASE, 'dist', 'playbook.html')
GH = 'https://github.com/andrlut/perceva/blob/main/docs/brand/'

EXT = ['tables', 'fenced_code', 'sane_lists', 'attr_list', 'md_in_html']


def md(text):
    return markdown.markdown(text, extensions=EXT, output_format='html5')


def wrap_tables(h):
    return h.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')


def shift_headings(h, by=2):
    for lvl in range(6, 0, -1):
        new = min(6, lvl + by)
        h = re.sub(r'<h%d(\s[^>]*)?>' % lvl, lambda m: '<h%d%s>' % (new, m.group(1) or ''), h)
        h = h.replace('</h%d>' % lvl, '</h%d>' % new)
    return h


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


# ---------------- spine ----------------
spine_md = read(os.path.join(BASE, '00-espinha.md'))
parts = re.split(r'^## (\d+)\. (.+)$', spine_md, flags=re.M)
sections = []
for i in range(1, len(parts), 3):
    num, title, body = parts[i], parts[i + 1].strip(), parts[i + 2]
    body = re.split(r'\n---\s*\n\s*\*Fontes:', body)[0]
    sections.append((int(num), title, body))

HOUSE = '''
<div class="house">
  <div class="roof">"Ele mostra quem os seus hábitos estão treinando você a ser."</div>
  <div class="cols">
    <div class="col"><div class="eyebrow">Prática</div><h4>A sensação mente; o registro, não.</h4><ul><li>Calendário com frentes Rotina / Humor / Cofre e filtro por dias</li><li>Humor em um toque + Padrões em 90 dias ("junto não é causa")</li></ul><p class="ex">"Você acha que vai à academia três vezes por semana. Conta."</p></div>
    <div class="col"><div class="eyebrow">Autoconhecimento</div><h4>Teste sério que vira prática.</h4><ul><li>/perfil: Big Five, Valores de Schwartz, Apego ECR-R, Forças</li><li>Espelho: contorno de como você se vê sobre o hexágono do que pratica; Norte</li></ul><p class="ex">"Sabe teste de personalidade? O meu faz o sério — e o resultado não para na tela."</p></div>
    <div class="col"><div class="eyebrow">Aprendizado</div><h4>Cinco minutos que rendem — e você vai lembrar.</h4><ul><li>Recanto: 1–5 ideias por assunto, fonte clicável, card que vira</li><li>Explorar acaba em cinco; mergulho em áudio em parte do catálogo</li></ul><p class="ex">"O feed acaba. De propósito."</p></div>
  </div>
  <div class="base">
    <div><b>Cofre</b>Você define a recompensa e o preço. Se for um deslize: "há quantos dias".</div>
    <div><b>Conector</b>Conecte ao seu assistente de IA (hoje, Claude). Ele lê dados reais em vez de adivinhar.</div>
    <div><b>Gentileza por arquitetura</b>Pular também é decidir. Nada zera. A Dedicação só sobe.</div>
  </div>
</div>
'''

out_sections = []
for num, title, body in sections:
    inner = wrap_tables(md(body))
    extra_open, extra_close = '', ''
    if num == 6:
        inner = HOUSE + inner
    if num == 11:
        extra_open, extra_close = '<div class="callout decide">', '</div>'
    wide = ' wide' if num in (2, 4, 6, 7, 8, 9) else ''
    out_sections.append(
        '<section class="chapter" id="c%d">\n<h2><span class="num">%02d</span>%s</h2>\n%s<div class="prose%s">%s</div>%s\n</section>'
        % (num, num, html.escape(title), extra_open, wide, inner, extra_close))
SPINE_HTML = '\n'.join(out_sections)

# ---------------- deliverables ----------------
DOCS = [
    ('roteiros', 'Roteiros de vídeo — 10 em pt-BR, 4 em en-US', 'roteiros.md'),
    ('site', 'Site perceva.app v5 — especificação e copy final (pt + en)', 'site-v5.md'),
    ('loja', 'Loja — pacote de ASO reescrito (Google Play agora, App Store pronta)', 'aso-loja.md'),
    ('social', 'Sistema de conteúdo — Instagram, TikTok, Shorts', 'conteudo-social.md'),
    ('gtm', 'GTM — plano operacional de 90 dias', 'gtm-90-dias.md'),
    ('ciencia', 'Base científica da metodologia', 'base-cientifica.md'),
]
docs_html = []
present = 0
for key, title, fname in DOCS:
    p = os.path.join(BASE, fname)
    if os.path.exists(p):
        present += 1
        raw = read(p)
        body = shift_headings(wrap_tables(md(raw)))
        size = '%d mil caracteres' % round(len(raw) / 1000)
        inner = '<div class="body">%s</div>' % body
    else:
        size = 'pendente'
        inner = ('<div class="body"><p class="missing">Documento não produzido nesta rodada. '
                 'Gerar a partir da espinha e gravar em <code>docs/brand/%s</code>.</p></div>' % fname)
    docs_html.append(
        '<details class="doc" id="doc-%s"><summary><span class="ttl">%s</span>'
        '<span class="meta">%s · <a href="%s%s">%s</a></span><span class="open">abrir</span></summary>%s</details>'
        % (key, html.escape(title), size, GH, fname, fname, inner))
DOCS_HTML = '\n'.join(docs_html)

# ---------------- research ----------------
RESEARCH = [
    ('evid-dados.md', 'Evidência · Prática (medir)', 'Automonitoramento, "a sensação mente", formação de hábito, humor, limites de medir.'),
    ('evid-autoconhecimento.md', 'Evidência · Autoconhecimento', 'Fit pessoa-atividade, tailoring, Big Five e saúde, valores, forças, apego, Barnum e testes pop.'),
    ('evid-aprendizado.md', 'Evidência · Aprendizado', 'Lacuna intenção-ação, recuperação e espaçamento, telas e bem-estar (controvérsia), áudio, momento certo, fontes.'),
    ('evid-recompensas.md', 'Evidência · Recompensas', 'Incentivos, motivação intrínseca, gamificação, compromisso e aversão à perda, streaks, recaída.'),
    ('evid-mentoria.md', 'Evidência · Acompanhamento e IA', 'Suporte humano em intervenções digitais, coaching, accountability, chatbots, riscos e regulação.'),
    ('evid-social.md', 'Evidência · Social', 'Suporte social, contágio (e críticas), comparação, compromisso público, mecânicas de apps, LGPD, tamanho de círculo.'),
    ('mercado-posicionamento.md', 'Mercado · o rótulo "all-in-one self-care"', 'Taglines verificadas, o que a Play devolve, conotação de "autocuidado", literatura de posicionamento, o que mudou.'),
    ('publico-demanda.md', 'Público e demanda', 'Tamanho e perfil BR/EUA, testes de personalidade, terapia no Brasil, churn, uso de IA, três segmentos e o beachhead.'),
    ('gtm-benchmarks.md', 'GTM · como apps parecidos cresceram', 'Finch, Fabulous, Habitica, Cíngulo, Ofensiva, Rosebud, Stoic, Structured, Opal, Cal AI; canais, CPI/CAC, cenários, armadilhas.'),
    ('video-curto.md', 'Vídeo curto · ofício e banco de ganchos', 'Gancho, duração, cortes, legendas, rosto, plataformas, criadores brasileiros, UGC, regras das lojas, 40 ganchos.'),
    ('brandbook-padrao.md', 'Padrão · o que um playbook de marca contém', 'Nove blocos, exemplos públicos, brand book × playbook, fundador solo + IA, erros do setor, checklist de seções.'),
    ('fidelidade-produto.md', 'Repositório · discurso × produto real', 'Alegação por alegação: o que existe, o que está dormente, o que é módulo; o que o app faz e ninguém conta; screenshots a recapturar.'),
    ('vocabulario.md', 'Repositório · vocabulário canônico', 'Divergências app × site × loja × brief, cânone pt/en por conceito, termos proibidos, mudanças por superfície.'),
]
RESEARCH_HTML = '\n'.join(
    '<a href="%sresearch/%s"><b>%s</b>%s</a>' % (GH, f, html.escape(t), html.escape(d)) for f, t, d in RESEARCH)

tpl = read(os.path.join(HERE, 'template.html'))
out = tpl.replace('<!--@SPINE-->', SPINE_HTML).replace('<!--@DOCS-->', DOCS_HTML).replace('<!--@RESEARCH-->', RESEARCH_HTML)
# Bulletproof against any viewer/server that ignores the charset: everything after the
# main <style> block becomes ASCII with numeric entities (CSS stays raw so content:"..." works).
head, sep, rest = out.partition('</style>')
out = head + sep + rest.encode('ascii', 'xmlcharrefreplace').decode('ascii')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)
print('ok', OUT, len(out), 'bytes;', len(sections), 'spine sections;', present, '/', len(DOCS), 'docs')
