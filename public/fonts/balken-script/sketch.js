// BALKLEN SCRIPT WEB COMPOSER MODE
// Optical Type Designer Mode + Glyph Spacing + Kerning Pairs + Multiline + Alignment + Auto Wrap

let input;
let sizeS, weightS, blockS, slantS, crypticS;
let capHeightS, capWidthS, trackingS, leadingS, xHeightS, ascenderS, descenderS, contrastS;
let blockCB, cutCB, capsCB;
let exportBtn;
let alignSel;

// Fixed web-version values for removed controls
const FIXED_TEXT_BOX_WIDTH = 560;
const FIXED_DEEP_DROPS = 60;
const FIXED_SEED = 1234;
const ARROWS_ON = false;
const SHOW_GRID = false;

// -----------------------------
// SPACING + KERNING
// Werte sind in Pixel / werden direkt addiert
// -----------------------------

const SPACING = {
  A:{left:-8, right:-10},
  B:{left:1, right:-12},
  C:{left:2, right:-10},
  V:{left:-8, right:-14},
  W:{left:0, right:8},
  T:{left:-8, right:-18},
  I:{left:-22, right:-22},
  L:{left:-6, right:-12},
  S:{left:-26, right:-12},
  Z:{left:-8, right:-14},

  i:{left:-24, right:30},
  c:{left:-25, right:0},
  d:{left:-24, right:4},
  k:{left:32, right:-12},
  l:{left:-16, right:-14},
  h:{left:-0, right:5},
  j:{left:-10, right:-12},
  i:{left:-40, right:-10},
  f:{left:-8, right:-10},
  u:{left:0, right:-24},
  t:{left:-8, right:-10},
  p:{left:-0, right:-20},
  s:{left:-20, right:-16},
  z:{left:-8, right:-12},
  r:{left:-0, right:-10},
  W:{left:-0, right:-6},

  ".":{left:-18, right:-18},
  ",":{left:-18, right:-18},
  ":":{left:-18, right:-18},
  ";":{left:-18, right:-18},
  "!":{left:-16, right:-16},
  "?":{left:-8, right:-8}
};

const KERNING = {
  "TA":-36,
  "IC":26,
  "TO":-26,
  "To":-30,
  "Te":-24,
  "Tr":-22,
  "Ts":-24,
  "Ty":-26,

  "AV":-34,
  "AW":-24,
  "AT":-28,
  "AY":-30,

  "VA":-34,
  "WA":-22,
  "LT":-24,
  "ST":-20,
  "SA":-14,
  "SZ":-16,

  "Sz":-12,
  "Pl":-12,
  "as":-18,
  "ea":-4,
  "Ts":-24,
  "Tz":-20,
  "rs":-10,
  "se":-10,
  "re":-10,
  "ip":24,
  "pt":-20,
  "rz":-10,
  "ri":-10,
  "le":10,
  "qr":10,
  "st":-8,
  "zt":-8,
  "hj":-24,
  "jk":20,
  "wt":-8,
  "ok":-25,
  "10":-24,
};

function setup() {
  const sketchHost = document.getElementById("sketch-holder");
  const canvas = createCanvas(1560, 1040);
  canvas.parent(sketchHost);
  pixelDensity(1);

  input = select("#textArea");

  sizeS = select("#size");
  weightS = select("#weight");
  blockS = select("#blockWidth");
  contrastS = select("#contrast");

  slantS = select("#slant");
  trackingS = select("#tracking");
  leadingS = select("#leading");
  crypticS = select("#cryptic");

  capHeightS = select("#capHeight");
  capWidthS = select("#capWidth");
  xHeightS = select("#xHeight");
  ascenderS = select("#ascender");
  descenderS = select("#descender");

  blockCB = select("#blockMode");
  cutCB = select("#brutalCut");
  capsCB = select("#monumentalCaps");

  alignSel = select("#alignSelect");

  exportBtn = select("#exportSvgBtn");
  exportBtn.mousePressed(exportSVG);
}

function draw() {
  background(255);

  push();
  translate(470, 185);

  if (SHOW_GRID) drawPosterGrid();

  drawParagraph(getWrappedLines(input.value()));
  pop();
}

// -----------------------------
// TEXT ENGINE + SPACING + POSTER COMPOSER
// -----------------------------

function drawText(txt) {
  // Draws one single line at the current origin.
  let fs = sizeS.value();
  let cryptic = crypticS.value() / 100;
  let tracking = trackingS.value();
  let x = 0;

  for (let i = 0; i < txt.length; i++) {
    let ch = txt[i];
    let next = txt[i + 1] || "";
    let isCap = isUpper(ch);

    x += getLeftBearing(ch);

    push();
    translate(x, 0);
    drawGlyph(ch, i);
    pop();

    x += fs * getAdvance(ch, cryptic, isCap);
    x += getRightBearing(ch);
    x += getKerning(ch, next);
    if (i < txt.length - 1) x += tracking;
  }
}

function drawParagraph(lines) {
  let fs = sizeS.value();
  let leading = fs * (leadingS.value() / 100);
  let boxW = FIXED_TEXT_BOX_WIDTH;
  let align = alignSel.value();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineW = measureTextWidth(line);

    let x = 0;
    if (align === "Center") x = boxW * 0.5 - lineW * 0.5;
    if (align === "Right") x = boxW - lineW;

    push();
    translate(x, i * leading);
    drawText(line);
    pop();
  }
}

function getTextLines(txt) {
  return txt.split(String.fromCharCode(13)).join("\n").split("\n").slice(0, 15);
}

function getWrappedLines(rawText) {
  let srcLines = getTextLines(rawText);
  let wrapped = [];
  let maxW = FIXED_TEXT_BOX_WIDTH;

  for (let i = 0; i < srcLines.length; i++) {
    let line = srcLines[i];

    if (line.trim() === "") {
      wrapped.push("");
      continue;
    }

    let words = line.split(/\s+/);
    let current = "";

    for (let j = 0; j < words.length; j++) {
      let word = words[j];
      let test = current === "" ? word : current + " " + word;

      if (measureTextWidth(test) <= maxW || current === "") {
        current = test;
      } else {
        wrapped.push(current);
        current = word;
      }
    }

    if (current !== "") wrapped.push(current);
  }

  return wrapped.slice(0, 15);
}

function measureTextWidth(txt) {
  let fs = sizeS.value();
  let cryptic = crypticS.value() / 100;
  let tracking = trackingS.value();
  let x = 0;

  for (let i = 0; i < txt.length; i++) {
    let ch = txt[i];
    let next = txt[i + 1] || "";
    let isCap = isUpper(ch);

    x += getLeftBearing(ch);
    x += fs * getAdvance(ch, cryptic, isCap);
    x += getRightBearing(ch);
    x += getKerning(ch, next);
    if (i < txt.length - 1) x += tracking;
  }

  return x;
}

function getLeftBearing(ch) {
  return SPACING[ch]?.left || 0;
}

function getRightBearing(ch) {
  return SPACING[ch]?.right || 0;
}

function getKerning(a, b) {
  if (!a || !b) return 0;
  return KERNING[a + b] || 0;
}

function drawGlyph(ch, index) {
  let fs = sizeS.value();
  let weight = weightS.value();
  let blockW = blockS.value();
  let slant = slantS.value() / 100;
  let cryptic = crypticS.value() / 100;
  let drops = FIXED_DEEP_DROPS / 100;
  let seed = FIXED_SEED;
  let arrows = ARROWS_ON;
  let cut = cutCB.checked();
  let blockMode = blockCB.checked();
  let monumentalCaps = capsCB.checked();

  let u = fs / 7;

  randomSeed(seed + index * 999 + ch.charCodeAt(0));

  let alt = floor(random(0, 4));
  let deep = random() < drops * 0.55;
  let chaos = cryptic * 0.28;

  let segs = getGlyph(ch, alt, cryptic, deep);

  let isCap = isUpper(ch);
  let capScaleX = isCap && monumentalCaps ? capWidthS.value() / 100 : 1;
  let capScaleY = isCap && monumentalCaps ? capHeightS.value() / 100 : 1;

  push();
  scale(capScaleX, capScaleY);

  for (let seg of segs) {
    let type = seg[3] || "main";

    let a = opticalPoint(seg[0], u, slant, chaos, ch);
    let b = opticalPoint(seg[1], u, slant, chaos, ch);

    if (cut) {
      let cp = cutLinePoints(a, b, weight);
      a = cp.a;
      b = cp.b;
    }

    let localW = opticalWidth(blockW, weight, type, blockMode);

    if (blockMode) drawBlockSegment(a, b, localW);
    else drawStrokeSegment(a, b, localW);

    if (arrows && seg[2]) {
      if (blockMode) drawBlockArrow(a, b, localW);
      else drawArrow(a, b, localW);
    }
  }

  if (cryptic > 0.48 && ch !== " ") {
    drawCrypticMarks(u, weight, blockW, cryptic, blockMode);
  }

  pop();
}

// -----------------------------
// OPTICAL TRANSFORM
// -----------------------------

function opticalPoint(p, u, slant, chaos, ch) {
  let x = p[0] * u;
  let y = p[1] * u;

  let lower = ch.toLowerCase();
  let isCap = isUpper(ch);

  if (!isCap) {
    if (isXHeightZone(p[1])) y *= xHeightS.value() / 100;
    if (isAscenderGlyph(lower) && p[1] < -2.1) y *= ascenderS.value() / 100;
    if (isDescenderGlyph(lower) && p[1] > 2.1) y *= descenderS.value() / 100;
  }

  x += y * slant;

  x += random(-chaos, chaos) * u;
  y += random(-chaos, chaos) * u;

  return createVector(x, y);
}

function isXHeightZone(y) {
  return y >= -2.2 && y <= 2.2;
}

function isAscenderGlyph(ch) {
  return "bdfhklti".includes(ch);
}

function isDescenderGlyph(ch) {
  return "gjpqyß".includes(ch);
}

function opticalWidth(blockW, weight, type, blockMode) {
  let contrast = contrastS.value() / 200;
  let base = blockMode ? blockW : weight;

  if (type === "thin") return base * map(contrast, 0, 1, 1, 0.10);
  if (type === "hair") return base * map(contrast, 0, 1, 0.8, 0.025);
  if (type === "heavy") return base * map(contrast, 0, 1, 1, 2.25);

  return base;
}

function isUpper(ch) {
  return ch !== ch.toLowerCase() && ch.toLowerCase() !== ch.toUpperCase();
}

// -----------------------------
// DRAWING HELPERS
// -----------------------------

function cutLinePoints(a, b, weight) {
  let v = p5.Vector.sub(b, a);
  let len = v.mag();
  if (len < 2) return { a, b };

  v.normalize();

  return {
    a: p5.Vector.add(a, p5.Vector.mult(v, weight * 0.65)),
    b: p5.Vector.sub(b, p5.Vector.mult(v, weight * 0.38))
  };
}

function drawStrokeSegment(a, b, w) {
  stroke(0);
  strokeWeight(w);
  strokeCap(PROJECT);
  strokeJoin(MITER);
  noFill();
  line(a.x, a.y, b.x, b.y);
}

function drawBlockSegment(a, b, w) {
  let v = p5.Vector.sub(b, a);
  let len = v.mag();
  if (len < 1) return;

  v.normalize();
  let n = createVector(-v.y, v.x);
  let hw = w / 2;

  let p1 = p5.Vector.add(a, p5.Vector.mult(n, hw));
  let p2 = p5.Vector.add(b, p5.Vector.mult(n, hw));
  let p3 = p5.Vector.sub(b, p5.Vector.mult(n, hw));
  let p4 = p5.Vector.sub(a, p5.Vector.mult(n, hw));

  noStroke();
  fill(0);
  beginShape();
  vertex(p1.x, p1.y);
  vertex(p2.x, p2.y);
  vertex(p3.x, p3.y);
  vertex(p4.x, p4.y);
  endShape(CLOSE);
}

function drawBlockArrow(a, b, w) {
  let v = p5.Vector.sub(b, a);
  if (v.mag() < 2) return;

  v.normalize();
  let n = createVector(-v.y, v.x);

  let len = w * 1.25;
  let wide = w * 1.05;
  let back = p5.Vector.sub(b, p5.Vector.mult(v, len));

  let p1 = b.copy();
  let p2 = p5.Vector.add(back, p5.Vector.mult(n, wide));
  let p3 = p5.Vector.add(back, p5.Vector.mult(n, w * 0.28));
  let p4 = p5.Vector.sub(back, p5.Vector.mult(n, w * 0.28));
  let p5v = p5.Vector.sub(back, p5.Vector.mult(n, wide));

  noStroke();
  fill(0);
  beginShape();
  vertex(p1.x, p1.y);
  vertex(p2.x, p2.y);
  vertex(p3.x, p3.y);
  vertex(p4.x, p4.y);
  vertex(p5v.x, p5v.y);
  endShape(CLOSE);
}

function drawArrow(a, b, w) {
  let v = p5.Vector.sub(b, a);
  if (v.mag() < 2) return;

  v.normalize();
  let n = createVector(-v.y, v.x);

  let len = w * 1.55;
  let back = p5.Vector.sub(b, p5.Vector.mult(v, len));

  let p1 = p5.Vector.add(back, p5.Vector.mult(n, len * 0.72));
  let p2 = p5.Vector.sub(back, p5.Vector.mult(n, len * 0.72));

  line(b.x, b.y, p1.x, p1.y);
  line(b.x, b.y, p2.x, p2.y);
}

function drawCrypticMarks(u, weight, blockW, cryptic, blockMode) {
  let n = floor(map(cryptic, 0.48, 1, 1, 4));

  for (let i = 0; i < n; i++) {
    let x = random(0.4, 4.8) * u;
    let y = random(-3.4, 4.2) * u;
    let l = random(0.45, 1.15) * u;

    let a = createVector(x, y);
    let b = random() < 0.5 ? createVector(x + l, y + l) : createVector(x + l, y - l);

    if (blockMode) drawBlockSegment(a, b, blockW * 0.42);
    else drawStrokeSegment(a, b, weight * 0.65);
  }
}

// -----------------------------
// GLYPHS
// Segment: [[x1,y1],[x2,y2], arrowEnd, type]
// type: "main", "heavy", "thin", "hair"
// -----------------------------

function getGlyph(ch, alt, cryptic, deep) {
  let raw = ch;
  let lower = ch.toLowerCase();

  if (lower === "ä") return addDots(getGlyph("a", alt, cryptic, deep));
  if (lower === "ö") return addDots(getGlyph("o", alt, cryptic, deep));
  if (lower === "ü") return addDots(getGlyph("u", alt, cryptic, deep));
  if (lower === "ß") return glyphSharpS(cryptic, deep);

  if (isUpper(raw)) return glyphCaps(lower, alt, cryptic, deep);
  if ("0123456789".includes(raw)) return glyphNumber(raw, cryptic, deep);
  if (PUNCT[raw]) return JSON.parse(JSON.stringify(PUNCT[raw]));

  // Unbekannte / fehlende Zeichen werden als klassisches quadratisches TOFU dargestellt.
  let segs = BASE[lower]
    ? JSON.parse(JSON.stringify(BASE[lower]))
    : glyphTofu();

  if (alt === 1) segs.push([[1,2],[3,4],true,"thin"]);
  if (alt === 2) segs.push([[4,-2],[5,-3],false,"hair"]);
  if (alt === 3) segs.push([[0,0],[2,3],true,"thin"]);

  if (cryptic > 0.25) {
    if ("aeorsxz".includes(lower)) segs.push([[3,0],[5,2],true,"thin"]);
    if ("bdhkl".includes(lower)) segs.push([[0,-5],[1,-4],false,"hair"]);
  }

  if (cryptic > 0.55) {
    if ("mnuvw".includes(lower)) segs.push([[2,0],[4,3],true,"thin"]);
    if ("gqpyjx".includes(lower)) segs.push([[2,3],[0,5],true,"hair"]);
  }

  return segs;
}

const BASE = {
  a:[
    [[0,0],[2,-2],false,"heavy"], [[2,-2],[4,0],false,"main"],
    [[4,0],[3,2],false,"thin"], [[3,2],[1,2],false,"main"],
    [[1,2],[0,0],true,"heavy"], [[1.1,0],[3.2,0],false,"hair"],
    [[4,0],[4,2.6],true,"thin"]
  ],
  b:[
    [[0,-5],[0,2],true,"heavy"], [[0,-1],[2,-2],false,"thin"],
    [[2,-2],[4,0],false,"main"], [[4,0],[2,2],false,"thin"],
    [[2,2],[0,1],false,"main"]
  ],
  c:[
    [[4,-2],[1,-2],false,"main"], [[1,-2],[0,0],false,"thin"],
    [[0,0],[1,2],true,"heavy"], [[1,2],[4,2],false,"main"]
  ],
  d:[
    [[4,-5],[4,2],true,"heavy"], [[4,-1],[2,-2],false,"thin"],
    [[2,-2],[0,0],false,"main"], [[0,0],[2,2],false,"thin"],
    [[2,2],[4,1],false,"main"]
  ],
  e:[
    [[4,-2],[1,-2],false,"main"], [[1,-2],[0,0],false,"thin"],
    [[0,0],[4,0],false,"hair"], [[0,0],[1,2],true,"heavy"],
    [[1,2],[4,2],false,"main"]
  ],
  f:[
    [[4,-5],[2,-5],false,"thin"], [[2,-5],[1,-3],false,"main"],
    [[1,-3],[1,2],true,"heavy"], [[0,-1],[3.6,-1],false,"hair"]
  ],
  g:[
    [[4,-2],[1,-2],false,"main"], [[1,-2],[0,0],false,"thin"],
    [[0,0],[2,2],false,"main"], [[2,2],[4,0],false,"thin"],
    [[4,0],[3,5.8],false,"heavy"], [[3,5.8],[1,5.8],true,"main"]
  ],
  h:[
    [[0,-5],[0,2],true,"heavy"], [[0,0],[2,-2],false,"thin"],
    [[2,-2],[4,0],false,"main"], [[4,0],[4,2],true,"heavy"]
  ],
  i:[
    [[2,-2],[2,2],true,"heavy"], [[1.4,-4],[2.6,-5],false,"hair"]
  ],
  j:[
    [[3,-2],[3,5.8],false,"heavy"], [[3,5.8],[1,5.8],true,"main"],
    [[2.4,-4],[3.6,-5],false,"hair"]
  ],
  k:[
    [[0,-5],[0,2],true,"heavy"], [[0,0],[3,-2],false,"thin"],
    [[1,0],[4,2],true,"heavy"], [[2,-1],[4,-3],false,"hair"]
  ],
  l:[
    [[1,-5],[1,2],true,"heavy"], [[1,2],[4,2],false,"main"]
  ],
  m:[
    [[0,2],[0,-2],false,"heavy"], [[0,-2],[1.6,0],false,"thin"],
    [[1.6,0],[3.2,-2],false,"main"], [[3.2,-2],[5,0],false,"thin"],
    [[5,0],[5,2],true,"heavy"]
  ],
  n:[
    [[0,2],[0,-2],false,"heavy"], [[0,-2],[4,2],true,"main"],
    [[4,2],[4,-2],false,"thin"]
  ],
  o:[
    [[2,-2],[4,0],false,"main"], [[4,0],[2,2],false,"thin"],
    [[2,2],[0,0],false,"main"], [[0,0],[2,-2],false,"thin"]
  ],
  p:[
    [[0,5.8],[0,-2],true,"heavy"], [[0,-2],[3,-2],false,"main"],
    [[3,-2],[4,0],false,"thin"], [[4,0],[1,1],false,"main"]
  ],
  q:[
    [[4,5.8],[4,-2],true,"heavy"], [[4,-2],[1,-2],false,"main"],
    [[1,-2],[0,0],false,"thin"], [[0,0],[3,1],false,"main"]
  ],
  r:[
    [[0,2],[0,-2],false,"heavy"], [[0,-2],[3,-2],false,"main"],
    [[3,-2],[4,-1],true,"thin"]
  ],
  s:[
    [[4,-2],[0.8,-2],false,"hair"],
    [[0.8,-2],[5.3,0],false,"heavy"],
    [[4.8,0],[3.5,2],false,"thin"],
    [[0.8,2],[3.8,2],true,"main"]
  ],
  t:[
    [[2,-5],[2,2],true,"heavy"], [[0,-2],[4,-2],false,"hair"],
    [[2,2],[4,2],false,"main"]
  ],
  u:[
    [[0,-2],[0,1],false,"heavy"], [[0,1],[2,2],false,"thin"],
    [[2,2],[4,1],false,"main"], [[4,1],[4,-2],true,"heavy"]
  ],
  v:[
    [[0,-2],[2,2],false,"thin"], [[2,2],[4,-2],true,"heavy"]
  ],
  w:[
    [[0,-2],[1,2],false,"thin"], [[1,2],[2,0],false,"main"],
    [[2,0],[3,2],false,"thin"], [[3,2],[5,-2],true,"heavy"]
  ],
  x:[
    [[0,-2],[4,2],true,"heavy"], [[4,-2],[0,2],true,"thin"],
    [[1,2],[2,5.8],false,"hair"], [[2,5.8],[3,4.8],true,"thin"]
  ],
  y:[
    [[0,-2],[2,0],false,"thin"], [[4,-2],[2,0],false,"main"],
    [[2,0],[2,5.8],true,"heavy"]
  ],
  z:[
    [[0,-2],[4,-2],false,"hair"],
    [[4,-2],[0,2],false,"heavy"],
    [[0,2],[4,2],true,"main"]
  ],
  " ":[]
};

function glyphCaps(ch, alt, cryptic, deep) {
  let d = deep ? 6.2 : 4.2;

  const C = {
    a:[[[0,2],[2,-5],false,"heavy"],[[2,-5],[5,2],true,"main"],[[1,0],[4,0],false,"hair"],[[0,2],[1,1],true,"thin"]],
    b:[[[0,-5],[0,2],true,"heavy"],[[0,-5],[4,-3],false,"main"],[[4,-3],[1,-1],false,"thin"],[[1,-1],[5,1],false,"main"],[[5,1],[0,2],false,"thin"]],
    c:[[[5,-4],[1,-4],false,"main"],[[1,-4],[0,-1],false,"thin"],[[0,-1],[1,2],true,"heavy"],[[1,2],[5,2],false,"main"]],
    d:[[[0,-5],[0,2],true,"heavy"],[[0,-5],[4,-3],false,"main"],[[4,-3],[5,0],false,"thin"],[[5,0],[0,2],false,"main"]],
    e:[[[5,-5],[0,-5],false,"main"],[[0,-5],[0,2],true,"heavy"],[[0,-1],[4,-1],false,"hair"],[[0,2],[5,2],false,"main"]],
    f:[[[5,-5],[0,-5],false,"main"],[[0,-5],[0,2],true,"heavy"],[[0,-1],[4,-1],false,"hair"]],
    g:[[[5,-4],[1,-4],false,"main"],[[1,-4],[0,-1],false,"thin"],[[0,-1],[1,2],false,"heavy"],[[1,2],[5,2],true,"main"],[[5,2],[5,0],false,"thin"],[[5,0],[3,0],false,"hair"]],
    h:[[[0,-5],[0,2],true,"heavy"],[[5,-5],[5,2],true,"heavy"],[[0,-1],[5,-1],false,"hair"]],
    i:[[[1,-5],[4,-5],false,"hair"],[[2.5,-5],[2.5,2],true,"heavy"],[[1,2],[4,2],false,"main"]],
    j:[[[1,-5],[5,-5],false,"main"],[[4,-5],[4,d],false,"heavy"],[[4,d],[1,d],true,"main"]],
    k:[[[0,-5],[0,2],true,"heavy"],[[0,-1],[5,-5],false,"thin"],[[1,-1],[5,2],true,"heavy"]],
    l:[[[0,-5],[0,2],true,"heavy"],[[0,2],[5,2],false,"main"]],
    m:[[[0,2],[0,-5],true,"heavy"],[[0,-5],[2.5,-1],false,"thin"],[[2.5,-1],[5,-5],false,"main"],[[5,-5],[5,2],true,"heavy"]],
    n:[[[0,2],[0,-5],true,"heavy"],[[0,-5],[5,2],true,"main"],[[5,2],[5,-5],false,"thin"]],
    o:[[[2.5,-5],[5,-1.5],false,"main"],[[5,-1.5],[3,2],false,"thin"],[[3,2],[0,0],false,"main"],[[0,0],[2.5,-5],false,"thin"]],
    p:[[[0,2],[0,-5],true,"heavy"],[[0,-5],[4,-4],false,"main"],[[4,-4],[5,-1],false,"thin"],[[5,-1],[0,0],false,"main"]],
    q:[[[2.5,-5],[5,-1.5],false,"main"],[[5,-1.5],[3,2],false,"thin"],[[3,2],[0,0],false,"main"],[[0,0],[2.5,-5],false,"thin"],[[3,2],[5,4],true,"heavy"]],
    r:[[[0,2],[0,-5],true,"heavy"],[[0,-5],[4,-4],false,"main"],[[4,-4],[5,-1],false,"thin"],[[5,-1],[0,0],false,"main"],[[1,0],[5,2],true,"heavy"]],
    s:[
      [[5,-5],[1,-5],false,"hair"],
      [[1,-5],[6,-1],false,"heavy"],
      [[5.6,-1],[4.6,2],false,"thin"],
      [[1.2,2],[3.8,2],true,"main"]
    ],
    t:[[[0,-5],[5,-5],false,"hair"],[[2.5,-5],[2.5,2],true,"heavy"]],
    u:[[[0,-5],[0,1],false,"heavy"],[[0,1],[2.5,2],false,"thin"],[[2.5,2],[5,1],false,"main"],[[5,1],[5,-5],true,"heavy"]],
    v:[[[0,-5],[2.5,2],false,"thin"],[[2.5,2],[5,-5],true,"heavy"]],
    w:[[[0,-5],[1.3,2],false,"thin"],[[1.3,2],[2.5,-1],false,"main"],[[2.5,-1],[3.8,2],false,"thin"],[[3.8,2],[5,-5],true,"heavy"]],
    x:[[[0,-5],[5,2],true,"heavy"],[[5,-5],[0,2],true,"thin"]],
    y:[[[0,-5],[2.5,-1],false,"thin"],[[5,-5],[2.5,-1],false,"main"],[[2.5,-1],[2.5,d],true,"heavy"]],
    z:[[[0,-5],[5,-5],false,"hair"],[[5,-5],[0,2],false,"heavy"],[[0,2],[5,2],true,"main"]]
  };

  let segs = C[ch] ? JSON.parse(JSON.stringify(C[ch])) : JSON.parse(JSON.stringify(C["x"]));

  if (alt === 1) segs.push([[5,-5],[6,-3],true,"thin"]);
  if (cryptic > 0.45) segs.push([[1,2],[3,d],true,"hair"]);

  return segs;
}

function glyphNumber(n, cryptic, deep) {
  let d = deep ? 5.5 : 3.8;

  const N = {
    "0":[[[2,-4],[5,-1],false,"main"],[[5,-1],[3,2],false,"thin"],[[3,2],[0,0],false,"main"],[[0,0],[2,-4],false,"thin"],[[1,1],[4,-3],true,"hair"]],
    "1":[[[2,-4],[2,2],true,"heavy"],[[1,-3],[2,-4],false,"thin"],[[1,2],[4,2],false,"main"]],
    "2":[[[0,-3],[3,-4],false,"thin"],[[3,-4],[5,-2],false,"main"],[[5,-2],[0,2],false,"heavy"],[[0,2],[5,2],true,"main"]],
    "3":[[[0,-4],[5,-4],false,"main"],[[5,-4],[3,-1],false,"thin"],[[3,-1],[5,2],false,"main"],[[5,2],[0,2],true,"heavy"]],
    "4":[[[4,-4],[4,2],true,"heavy"],[[0,-1],[5,-1],false,"hair"],[[0,-1],[4,-4],false,"main"]],
    "5":[[[5,-4],[0,-4],false,"main"],[[0,-4],[0,-1],false,"heavy"],[[0,-1],[4,-1],false,"hair"],[[4,-1],[5,2],false,"thin"],[[5,2],[0,2],true,"main"]],
    "6":[[[5,-4],[1,-2],false,"thin"],[[1,-2],[0,1],false,"heavy"],[[0,1],[3,2],false,"main"],[[3,2],[5,0],true,"thin"],[[5,0],[2,-1],false,"hair"]],
    "7":[[[0,-4],[5,-4],false,"main"],[[5,-4],[1,2],true,"heavy"]],
    "8":[[[2,-4],[5,-2],false,"main"],[[5,-2],[2,0],false,"thin"],[[2,0],[5,2],false,"main"],[[5,2],[0,2],true,"heavy"],[[0,2],[2,0],false,"thin"],[[2,0],[0,-2],false,"main"],[[0,-2],[2,-4],false,"thin"]],
    "9":[[[5,-1],[3,-4],false,"main"],[[3,-4],[0,-2],false,"thin"],[[0,-2],[3,0],false,"main"],[[3,0],[5,-1],false,"thin"],[[5,-1],[2,d],true,"heavy"]]
  };

  let segs = JSON.parse(JSON.stringify(N[n]));

  if (cryptic > 0.55) segs.push([[1,2],[3,d],true,"hair"]);

  return segs;
}

const PUNCT = {
  ".":[[[2,2],[2.3,2.3],true,"heavy"]],
  ",":[[[2,2],[1,4],true,"heavy"]],
  ":":[[[2,-2],[2.3,-2.3],true,"heavy"],[[2,2],[2.3,2.3],true,"heavy"]],
  ";":[[[2,-2],[2.3,-2.3],true,"heavy"],[[2,2],[1,4],true,"heavy"]],
  "!":[[[2,-5],[2,0.5],true,"heavy"],[[2,2],[2.3,2.3],true,"heavy"]],
  "?":[[[0,-4],[3,-5],false,"thin"],[[3,-5],[5,-3],false,"main"],[[5,-3],[2,0],true,"heavy"],[[2,2],[2.3,2.3],true,"heavy"]],
  "-":[[[0,0],[4,0],false,"main"]],
  "–":[[[-0.4,0],[5.4,0],false,"main"]],
  "—":[[[-0.9,0],[6.4,0],false,"main"]],
  "_":[[[0,3],[5,3],false,"main"]],
  "/":[[[0,3],[5,-5],true,"heavy"]],
  "\\":[[[0,-5],[5,3],true,"heavy"]],
  "+":[[[0,0],[4,0],false,"main"],[[2,-2],[2,2],true,"heavy"]],
  "=":[[[0,-1],[4,-1],false,"main"],[[0,1],[4,1],false,"main"]],
  "*":[[[0,-2],[4,2],true,"heavy"],[[4,-2],[0,2],true,"thin"],[[2,-3],[2,3],false,"hair"]],
  "#":[[[1,-4],[1,3],false,"heavy"],[[4,-4],[4,3],false,"thin"],[[0,-1],[5,-1],false,"main"],[[0,1],[5,1],true,"main"]],
  "&":[
  [[4.8,-4],[2.1,-4],false,"main"],
  [[2.1,-4],[1.1,-2.7],false,"thin"],
  [[1.1,-2.7],[2.6,-1.2],false,"main"],
  [[2.6,-1.2],[1.0,0.9],false,"thin"],
  [[1.0,0.9],[2.0,2.0],false,"heavy"],
  [[2.0,2.0],[4.8,2.0],false,"main"],
  [[2.4,-0.3],[5.0,-3.0],true,"heavy"]
],
  "@":[
  [[3,-4],[5,-1],false,"main"],
  [[5,-1],[4.4,2],false,"thin"],
  [[4.4,2],[1.4,2],false,"main"],
  [[1.4,2],[0,-0.2],false,"thin"],
  [[0,-0.2],[1.7,-4],false,"main"],
  [[1.7,-4],[3,-4],false,"hair"],

  [[2.1,-1.1],[3.2,-0.1],false,"main"],
  [[3.2,-0.1],[2.9,1.0],false,"thin"],
  [[2.9,1.0],[1.8,1.0],false,"main"],
  [[1.8,1.0],[1.4,-0.1],false,"thin"],
  [[1.4,-0.1],[2.1,-1.1],false,"heavy"],
  [[3.2,-0.1],[4.1,0.7],true,"thin"]
],
  "(":[[[4,-5],[1,-2],false,"thin"],[[1,-2],[1,1],false,"heavy"],[[1,1],[4,4],true,"thin"]],
  ")":[[[1,-5],[4,-2],false,"thin"],[[4,-2],[4,1],false,"heavy"],[[4,1],[1,4],true,"thin"]],
  "[":[[[4,-5],[1,-5],false,"main"],[[1,-5],[1,3],true,"heavy"],[[1,3],[4,3],false,"main"]],
  "]":[[[1,-5],[4,-5],false,"main"],[[4,-5],[4,3],true,"heavy"],[[4,3],[1,3],false,"main"]],
  "'":[[[2,-5],[1.5,-3.5],true,"heavy"]],
    "„":[[[2,2],[1.4,3.8],true,"heavy"],[[3.4,2],[2.8,3.8],true,"heavy"]],
  "“":[[[1.4,-5],[2,-3.3],true,"heavy"],[[2.8,-5],[3.4,-3.3],true,"heavy"]],
  "”":[[[2,-5],[1.4,-3.3],true,"heavy"],[[3.4,-5],[2.8,-3.3],true,"heavy"]],

  "$":[
    [[2.5,-5.2],[2.5,2.6],false,"hair"],
    [[5,-4],[1,-4],false,"hair"],
    [[1,-4],[5,-1],false,"heavy"],
    [[5,-1],[1,2],false,"thin"],
    [[1,2],[5,2],true,"main"]
  ],

  "€":[
  [[5,-4],[2.1,-4],false,"main"],
  [[2.1,-4],[1.0,-3.1],false,"thin"],
  [[1.0,-3.1],[0.25,-1.25],false,"heavy"],
  [[0.25,-1.25],[0.25,0.95],false,"thin"],
  [[0.25,0.95],[1.1,2.0],false,"heavy"],
  [[1.1,2.0],[4.8,2.0],false,"main"],
  [[0.75,-0.28],[3.95,-0.28],false,"hair"],
  [[0.75,0.42],[3.75,0.42],false,"hair"]
],

  "¢":[
    [[2.5,-4.8],[2.5,3.4],false,"hair"],
    [[4.8,-2],[1.2,-2],false,"main"],
    [[1.2,-2],[0,0],false,"thin"],
    [[0,0],[1.2,2],true,"heavy"],
    [[1.2,2],[4.8,2],false,"main"]
  ],

  "<":[
    [[5,-4],[0,0],false,"thin"],
    [[0,0],[5,4],true,"heavy"]
  ],

  ">":[
    [[0,-4],[5,0],false,"thin"],
    [[5,0],[0,4],true,"heavy"]
  ],
  '"':[[[1.5,-5],[1.2,-3.5],true,"heavy"],[[3,-5],[2.7,-3.5],true,"heavy"]]
  
};

function glyphTofu() {
  // Klassisches Missing-Glyph-Zeichen: kompakter, nahezu quadratischer Rahmen
  // mit diagonalem Kreuz. Die Form bleibt auch bei stärkerem Chaos erkennbar.
  return [
    [[0.2,-5],[4.8,-5],false,"main"],
    [[4.8,-5],[4.8,2],false,"main"],
    [[4.8,2],[0.2,2],false,"main"],
    [[0.2,2],[0.2,-5],false,"main"],
    [[0.9,-4.2],[4.1,1.2],false,"hair"],
    [[4.1,-4.2],[0.9,1.2],false,"hair"]
  ];
}

function addDots(segs) {
  let out = JSON.parse(JSON.stringify(segs));
  out.push([[1.1,-4.2],[1.5,-4.6],true,"heavy"]);
  out.push([[3.1,-4.2],[3.5,-4.6],true,"heavy"]);
  return out;
}

function glyphSharpS(cryptic, deep) {
  let d = deep ? 5.6 : 3.8;

  let segs = [
    [[1,-5],[4,-4],false,"main"],
    [[4,-4],[2,-1],false,"thin"],
    [[2,-1],[5,1],false,"main"],
    [[5,1],[2,2],true,"heavy"],
    [[1,-5],[1,d],true,"heavy"]
  ];

  if (cryptic > 0.5) segs.push([[2,2],[4,d],true,"hair"]);

  return segs;
}

function getAdvance(ch, cryptic, isCap) {
  if (ch === " ") return 0.48;
  if (ch === "–") return 0.88;
  if (ch === "—") return 1.12;
  if ("mwMW".includes(ch)) return 0.95;
  if ("iljI.,:;'\"!".includes(ch)) return 0.48;
  if (ch === "S" || ch === "s") return 1.05 + cryptic * 0.05;
  if (isCap) return 0.82 + cryptic * 0.05;
  return 0.7 + cryptic * 0.05;
}

// -----------------------------
// GRID
// -----------------------------

function drawGrid(fs) {
  let u = fs / 7;

  stroke(225);
  strokeWeight(1);

  for (let x = -4; x < 14; x++) {
    line(x * u, -9 * u, x * u, 10 * u);
  }

  for (let y = -9; y < 11; y++) {
    line(-4 * u, y * u, 14 * u, y * u);
  }
}

function drawPosterGrid() {
  let fs = sizeS.value();
  let u = fs / 7;
  let boxW = FIXED_TEXT_BOX_WIDTH;
  let leading = fs * (leadingS.value() / 100);

  stroke(232);
  strokeWeight(1);

  for (let x = 0; x <= boxW; x += u) {
    line(x, -55, x, leading * 15 + 60);
  }

  for (let y = -55; y <= leading * 15 + 60; y += u) {
    line(0, y, boxW, y);
  }

  stroke(170);
  noFill();
  rect(0, -45, boxW, leading * 15 + 70);
}

// -----------------------------
// SVG EXPORT
// -----------------------------

function exportSVG() {
  let lines = getWrappedLines(input.value());
  let fs = sizeS.value();
  let leading = fs * (leadingS.value() / 100);
  let exportH = max(1040, 260 + lines.length * leading + fs * 2.5);
  let svg = buildParagraphSVG(lines, 1560, exportH, 470, 185);
  downloadSVG(svg, "balken-script.svg");
}

function buildTextSVG(txt, w, h, tx, ty) {
  let svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  svg.push(`<rect width="100%" height="100%" fill="white"/>`);
  svg.push(`<g fill="black" stroke="none">`);
  appendLineSVG(svg, txt, tx, ty, 0);
  svg.push(`</g>`);
  svg.push(`</svg>`);
  return svg;
}

function buildParagraphSVG(lines, w, h, tx, ty) {
  let svg = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
  svg.push(`<rect width="100%" height="100%" fill="white"/>`);
  svg.push(`<g fill="black" stroke="none">`);

  let fs = sizeS.value();
  let leading = fs * (leadingS.value() / 100);
  let boxW = FIXED_TEXT_BOX_WIDTH;
  let align = alignSel.value();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let lineW = measureTextWidth(line);

    let x = tx;
    if (align === "Center") x = tx + boxW * 0.5 - lineW * 0.5;
    if (align === "Right") x = tx + boxW - lineW;

    let y = ty + i * leading;
    appendLineSVG(svg, line, x, y, i * 1000);
  }

  svg.push(`</g>`);
  svg.push(`</svg>`);
  return svg;
}

function appendLineSVG(svg, line, baseX, baseY, seedOffset) {
  let fs = sizeS.value();
  let weight = weightS.value();
  let blockW = blockS.value();
  let slant = slantS.value() / 100;
  let cryptic = crypticS.value() / 100;
  let drops = FIXED_DEEP_DROPS / 100;
  let seed = FIXED_SEED;
  let arrows = ARROWS_ON;
  let cut = cutCB.checked();
  let blockMode = blockCB.checked();
  let monumentalCaps = capsCB.checked();
  let tracking = trackingS.value();
  let cursor = 0;

  for (let i = 0; i < line.length; i++) {
    let ch = line[i];
    let next = line[i + 1] || "";
    let isCap = isUpper(ch);

    cursor += getLeftBearing(ch);

    randomSeed(seed + (seedOffset + i) * 999 + ch.charCodeAt(0));

    let alt = floor(random(0, 4));
    let deep = random() < drops * 0.55;
    let chaos = cryptic * 0.28;
    let u = fs / 7;
    let segs = getGlyph(ch, alt, cryptic, deep);

    let scaleX = isCap && monumentalCaps ? capWidthS.value() / 100 : 1;
    let scaleY = isCap && monumentalCaps ? capHeightS.value() / 100 : 1;

    for (let seg of segs) {
      let type = seg[3] || "main";

      let a = opticalPoint(seg[0], u, slant, chaos, ch);
      let b = opticalPoint(seg[1], u, slant, chaos, ch);

      a.x *= scaleX; a.y *= scaleY;
      b.x *= scaleX; b.y *= scaleY;

      if (cut) {
        let cp = cutLinePoints(a, b, weight);
        a = cp.a;
        b = cp.b;
      }

      let localW = opticalWidth(blockW, weight, type, blockMode);

      let ax = baseX + cursor + a.x;
      let ay = baseY + a.y;
      let bx = baseX + cursor + b.x;
      let by = baseY + b.y;

      if (blockMode) {
        svg.push(svgBlockSegment(ax, ay, bx, by, localW));
      } else {
        svg.push(`<line x1="${svgNum(ax)}" y1="${svgNum(ay)}" x2="${svgNum(bx)}" y2="${svgNum(by)}" stroke="black" stroke-width="${svgNum(localW)}" stroke-linecap="projecting" stroke-linejoin="miter"/>`);
      }

      if (arrows && seg[2]) {
        if (blockMode) svg.push(svgBlockArrow(ax, ay, bx, by, localW));
        else svg.push(svgArrow(ax, ay, bx, by, localW));
      }
    }

    cursor += fs * getAdvance(ch, cryptic, isCap);
    cursor += getRightBearing(ch);
    cursor += getKerning(ch, next);
    if (i < line.length - 1) cursor += tracking;
  }
}

function downloadSVG(svgArray, filename) {
  let svgText = Array.isArray(svgArray) ? svgArray.join("\n") : svgArray;

  let blob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8"
  });

  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function svgBlockSegment(ax, ay, bx, by, w) {
  let vx = bx - ax;
  let vy = by - ay;
  let len = sqrt(vx * vx + vy * vy);
  if (len < 1) return "";

  vx /= len;
  vy /= len;

  let nx = -vy;
  let ny = vx;
  let hw = w / 2;

  return `<polygon points="${svgNum(ax + nx * hw)},${svgNum(ay + ny * hw)} ${svgNum(bx + nx * hw)},${svgNum(by + ny * hw)} ${svgNum(bx - nx * hw)},${svgNum(by - ny * hw)} ${svgNum(ax - nx * hw)},${svgNum(ay - ny * hw)}"/>`;
}

function svgBlockArrow(ax, ay, bx, by, w) {
  let vx = bx - ax;
  let vy = by - ay;
  let len0 = sqrt(vx * vx + vy * vy);
  if (len0 < 2) return "";

  vx /= len0;
  vy /= len0;

  let nx = -vy;
  let ny = vx;

  let len = w * 1.25;
  let wide = w * 1.05;

  let backX = bx - vx * len;
  let backY = by - vy * len;

  return `<polygon points="${svgNum(bx)},${svgNum(by)} ${svgNum(backX + nx * wide)},${svgNum(backY + ny * wide)} ${svgNum(backX + nx * w * 0.28)},${svgNum(backY + ny * w * 0.28)} ${svgNum(backX - nx * w * 0.28)},${svgNum(backY - ny * w * 0.28)} ${svgNum(backX - nx * wide)},${svgNum(backY - ny * wide)}"/>`;
}

function svgArrow(ax, ay, bx, by, w) {
  let vx = bx - ax;
  let vy = by - ay;
  let d = sqrt(vx * vx + vy * vy);
  if (d < 2) return "";

  vx /= d;
  vy /= d;

  let nx = -vy;
  let ny = vx;

  let len = w * 1.55;
  let backX = bx - vx * len;
  let backY = by - vy * len;

  return `
  <line x1="${svgNum(bx)}" y1="${svgNum(by)}" x2="${svgNum(backX + nx * len * 0.72)}" y2="${svgNum(backY + ny * len * 0.72)}" stroke="black" stroke-width="${svgNum(w)}" stroke-linecap="projecting"/>
  <line x1="${svgNum(bx)}" y1="${svgNum(by)}" x2="${svgNum(backX - nx * len * 0.72)}" y2="${svgNum(backY - ny * len * 0.72)}" stroke="black" stroke-width="${svgNum(w)}" stroke-linecap="projecting"/>
  `;
}

function safeName(ch) {
  const names = {
    "Ä":"A_umlaut","Ö":"O_umlaut","Ü":"U_umlaut",
    "ä":"a_umlaut","ö":"o_umlaut","ü":"u_umlaut",
    "ß":"eszett",".":"period",",":"comma",":":"colon",";":"semicolon",
    "!":"exclam","?":"question","-":"hyphen","–":"endash","—":"emdash","_":"underscore",
    "/":"slash","\\":"backslash","+":"plus","=":"equals",
    "*":"asterisk","#":"hash","&":"ampersand","@":"at",
    "(":"paren_left",")":"paren_right","[":"bracket_left","]":"bracket_right",
    "'":"quote_single",'"':"quote_double"
  };

  return names[ch] || ch;
}

function svgNum(v) {
  return nf(v, 0, 2);
}