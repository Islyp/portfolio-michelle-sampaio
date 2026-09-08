# Portfólio — Michelle Sampaio Rocha

Site de portfólio de **Michelle Rocha Sampaio**, analista de marketing júnior.
HTML, CSS e JavaScript puros — **sem framework e sem nenhuma dependência de
runtime**. É só servir a pasta.

---

## Rodando localmente

Qualquer servidor estático serve. Por exemplo:

```bash
npx serve .
```

O arquivo `.claude/launch.json` já traz essa configuração pronta.

---

## Estrutura

```
index.html
assets/
  css/
    base.css        tokens, reset e componentes compartilhados
    hero.css        cabeçalho e hero
    about.css       "Sobre mim" e o painel de serviços
    case.css        case Elevamos e os números
    creatives.css   carrossel de peças
    videos.css      embeds do Instagram
    footer.css      contato e rodapé
  js/main.js        menu, carrossel, embeds, reveal
  img/
    criativos/      peças otimizadas (usadas no site)
    Criativo/       arquivos originais, em alta (fonte, não servidos)
    cases/          logo e artes do case
docs/
  responsive-check.html   renderiza o site em várias larguras lado a lado
  face-check.js           verifica se algum card do hero cobre o rosto
  ref-*.png               mockups de referência
```

---

## Decisões que valem conhecer antes de mexer

### Só dados reais

Os mockups de referência trazem métricas inventadas (+180% seguidores, 128K
alcance, 2.8M impressões, 320 leads). **Nada disso está no site.** Os números
vêm dos insights reais do Instagram da Elevamos (ago/2026): 15 mil
visualizações no mês, +51% vs. julho, 1.683 seguidores, 60 posts autorais,
17% de alcance em não seguidores.

Vale o mesmo para os contatos: o LinkedIn e o Instagram dos mockups não
existiam e ficaram de fora até chegarem os perfis reais.

### A zona de respeito do rosto no hero

Os cards flutuantes **não podem cobrir o rosto da Michelle em nenhuma
largura**. Isso não é ajuste de olho: as variáveis em `.hero__visual`
(`--face-right`, `--face-left`, `--face-floor`) reproduzem a geometria da
foto, e os cards se ancoram nelas.

A foto trava em 512px enquanto a coluna continua crescendo — por isso
posicionar em % da coluna descola do rosto em larguras intermediárias. A
folga é em **pixels**, não em porcentagem, senão encolhe junto com a foto.

Ao mexer no hero, rode `docs/face-check.js` varrendo as larguras.

### Carrossel por transform, não por scroll

O giro contínuo usa `transform: translate3d()`. Rolagem nativa é renderizada
em pixels inteiros: a 26px/s a posição mudaria de 1 em 1 pixel e pareceria
travada. Por isso o arraste, as setas e o teclado são implementados à mão.

O loop duplica os cards e volta ao início em silêncio ao completar a volta.
O deslocamento das setas é uma **distância relativa pendente**, nunca uma
posição absoluta — um alvo além da volta seria inalcançável e o carrossel
dispararia sem parar.

### Embeds do Instagram

Usam o `embed.js` oficial, carregado só quando a seção se aproxima da tela.
O iframe é cross-origin, então não dá para ler a altura do conteúdo; calcular
por fórmula erra o rodapé porque cabeçalho e barra de ações não escalam com a
largura. O script oficial recebe a altura exata por `postMessage`.

---

## Imagens

As peças em `assets/img/criativos/` são versões otimizadas (altura 820px,
JPEG mozjpeg q80) dos originais em `assets/img/Criativo/`. O conjunto saiu de
5.159 KB para 616 KB.

A otimização foi feita com `sharp` em script avulso, **fora do projeto**, para
o site continuar sem dependências.

---

## Publicando (Cloudflare Pages)

O repositório guarda mais coisa do que o site precisa servir: os originais em
alta de `assets/img/Criativo/` (5,4 MB) e os mockups de `docs/` (5,7 MB) são
fonte e referência, não conteúdo. Publicar a raiz colocaria no ar, entre
outras coisas, os mockups com as métricas fictícias.

Por isso o deploy monta uma pasta só com o que é servido:

- **Build command:**
  `mkdir -p dist && cp index.html dist/ && cp -r assets dist/ && rm -rf dist/assets/img/Criativo`
- **Build output directory:** `dist`

Sai de 18 MB para 8,3 MB — o vídeo institucional (5 MB) é o grosso disso.
Verificado: os arquivos referenciados pelo `index.html` estão todos
presentes no `dist`.

---

## Verificação

`docs/responsive-check.html` renderiza o site em 375, 768, 1024, 1280 e
1440px. Aceita `?w=375` para isolar uma largura.

Cinco breakpoints não bastam: a checagem do rosto varre de 320 a 1600px de 10
em 10, porque as falhas apareciam justamente nos vãos entre os pontos
testados.
