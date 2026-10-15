#!/usr/bin/env python3
"""Atualização aditiva CONCEPT V5, executada localmente em clones GitHub.
Não envia código ao GitHub e não elimina módulos originais.
Uso: python instalar_v5_em_clones.py /caminho/para/pasta-que-contem-os-11-repositorios
"""
from pathlib import Path
import sys,shutil,re,datetime
SOURCE=Path(__file__).resolve().parent
REPOS=['E-3904-05-Concept', 'E-3906-concept', 'E-3907-concept', 'E-3908-concept', 'E-3909-concept', 'E-3910-concept', 'E-3911-concept', 'E-3912-concept', 'E-3913-concept', 'E-3914-Concept', 'Merox-Gasolina']
if len(sys.argv)!=2:
  print('Uso: python instalar_v5_em_clones.py /caminho/pasta-com-repositorios')
  sys.exit(2)
base=Path(sys.argv[1]).resolve()
log=[]
for repo in REPOS:
  root=base/repo
  if not root.is_dir() or not (root/'index.html').exists():
    log.append(f'{repo}: PULADO — clone ou index.html não encontrado')
    continue
  source=SOURCE/repo/'conteudo-integral.js'
  if not source.exists():
    log.append(f'{repo}: PULADO — arquivo V5 ausente');continue
  idx=root/'index.html';txt=idx.read_text(encoding='utf-8')
  original=txt
  # Escolha explícita para evitar alterações silenciosas em páginas incompatíveis.
  tags=re.findall(r'<script\b[^>]*\bsrc\s*=\s*["\']\./conteudo-integral\.js[^"\']*["\'][^>]*>\s*</script>',txt,flags=re.I)
  if len(tags)>1:
    log.append(f'{repo}: REVISAR — várias referências a conteudo-integral.js');continue
  if len(tags)==1:
    txt=txt.replace(tags[0],'<script defer src="./conteudo-integral.js?v=5"></script>')
  else:
    if '</body>' not in txt.lower():
      log.append(f'{repo}: REVISAR — sem fechamento </body>');continue
    txt=re.sub(r'</body>',r'<script defer src="./conteudo-integral.js?v=5"></script>\n</body>',txt,count=1,flags=re.I)
  filename=root/'conteudo-integral.js'
  if txt!=original:
    bak=idx.with_name('index.html.BACKUP-antes-v5')
    if not bak.exists():shutil.copy2(idx,bak)
    idx.write_text(txt,encoding='utf-8')
  if filename.exists() and filename.read_bytes()!=source.read_bytes():
    bak=filename.with_name('conteudo-integral.js.BACKUP-antes-v5')
    if not bak.exists():shutil.copy2(filename,bak)
  shutil.copy2(source,filename)
  log.append(f'{repo}: PRONTO — conteúdo V4 preservado, laboratório V5 instalado, backup local criado quando necessário')
print('\n'.join(log))
