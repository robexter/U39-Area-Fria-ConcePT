# Auditoria das one pages — U39 Area Fria Concept v12

Foram checadas as 11 páginas atualmente carregadas pelo portal central.

## Padrões encontrados

| One page | Padrão encontrado |
|---|---|
| E-3904/05 | `#body / #title / #subtitle` |
| E-3906 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3907 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3908 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3909 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3910 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3911 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3912 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3913 | `#panelBody / #panelTitle / #panelSubtitle` |
| E-3914 | `#drawerBody / #drawerTitle / #drawerSub` |
| Merox Gasolina | `#panelBody / #panelTitle / #panelSubtitle` |

## Conclusão

Havia três famílias de estrutura. A E-3914 não era a única página fora do
padrão majoritário: a E-3904/05 também usa uma estrutura diferente.

Na v12, o portal NÃO depende mais do nome original desses elementos. Ao abrir
qualquer módulo, ele converte a página carregada para um contrato interno único:

- `data-u39-role="text-body"`
- `data-u39-role="text-title"`
- `data-u39-role="text-subtitle"`
- `data-u39-role="save-text"`
- `data-u39-role="reset-text"`
- `data-u39-role="edit-mode"`
- `data-u39-item-id="..."`

Assim, salvar rascunho, publicar texto oficial, editar e restaurar passam a
usar sempre o mesmo padrão dentro do portal central.

As páginas individuais no GitHub continuam intactas; a padronização é feita
automaticamente quando elas são carregadas no U39 Area Fria Concept.
