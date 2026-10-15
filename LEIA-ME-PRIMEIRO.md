# Área Fria Concept V5 — Conteúdo Integral + Laboratório Concept

## Entrega
Esta atualização acrescenta aos 11 módulos da Área Fria quatro laboratórios de engenharia e diagnóstico CIC. **Não retira conteúdo nem resumos, lâmpadas ou funções anteriores**. A V4 original foi preservada integralmente em cada script combinado V5.

## Instalação manual em cada repositório GitHub
1. Entre na pasta correspondente ao repositório (ex.: `E-3907-concept`).
2. Envie o arquivo **`conteudo-integral.js`** V5 para a raiz do repositório. Se o V4 estiver presente, substitua apenas esse arquivo JS.
3. Em `index.html`, antes de `</body>`, assegure **uma única referência**:
   ```html
   <script defer src="./conteudo-integral.js?v=5"></script>
   ```
   Se existir `?v=4`, troque para `?v=5`. Não duplique a chamada.
4. Confirme commit e reabra a página; se o PWA estiver instalado, atualize/desinstale cache se necessário.
5. **Não publique os arquivos `PREVIEW-LABORATORIO.html`, nem o arquivo alternativo `laboratorio-concept.js` se já enviar a versão combinada.**

## Alternativa, caso queira manter o JS V4 intacto no repositório
Mantenha `conteudo-integral.js` V4 e envie `laboratorio-concept.js` V5; acrescente outra tag `<script defer src="./laboratorio-concept.js?v=5"></script>` além da V4. **Não utilize as duas opções simultaneamente.**

## Instalação em lote
Se possuir os 11 repositórios clonados como subpastas, execute:

```bash
python instalar_v5_em_clones.py /caminho/pasta-com-os-11-repositorios
```

O script cria cópias de segurança locais e não faz envio ao GitHub.

## O que testar depois da publicação
- Abrir Conteúdo Integral da V4 e depois o Laboratório V5
- Variar quatro controles e observar os índices
- Abrir gráfico no desktop/celular e verificar rolagem na faixa de processo
- Testar 3 anomalias e 4 decisões encadeadas
- Conferir que o botão original Modo edição, as lâmpadas e qualquer treinamento existente permanecem funcionando

## Limites
Os índices são didáticos, sem calibração. Não usar os dados como operação, previsão de qualidade, margem mecânica ou especificação de produto. Tags e detalhes precisam de reconciliação com documentação vigente.
