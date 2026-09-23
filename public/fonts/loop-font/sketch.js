// LOOP FONT — WEB VERSION / screenshot defaults / fixed layout width
// LOOP FONT — ONLINE VERSION (reduced UI)
// Simplified public playground with text editor, layout controls,
// core form settings, inner line settings and outer weight mix.
// Site version: the controls live in index.html and the layout scales to the viewport.

let ui = {};
let glyphs = {};
let alternates = {};
let ligatures = {};
let features = {
  ss: "default",
  randomAlt: false,
  ligatures: true,
};
let currentParams = {
  loops: 0.33,
  radius: 1.90,
  mutation: 0.46,
  mutationSeed: 560,
  weight: 20,
  weightScaleA: 1.00,
  weightScaleB: 0.85,
  weightPattern: "fixed",
  weightSequenceText: "1.00, 0.85, 0.72, 0.90",
  weightOffset: 0,
  weightResetPerWord: false,
  innerScaleA: 1.00,
  innerScaleB: 0.28,
  innerPattern: "fixed",
  innerSequenceText: "1.00, 0.75, 0.45, 0.28",
  sequenceOffset: 0,
  sequenceDirection: "forward",
  randomDirectionPerWord: false,
  resetPatternPerWord: false,
  tight: -0.85,
};

// --------------------------------------------------------
// HTML controls (index.html)
// --------------------------------------------------------
function initHtmlUi() {
  ui.textArea = bindText("textArea");
  ui.alignSelect = bindText("alignSelect");
  ui.textSize = bindRange("textSize");
  ui.leading = bindRange("leading");

  ui.loops = bindRange("loops");
  ui.curve = bindRange("curve");
  ui.radius = bindRange("radius");
  ui.weight = bindRange("weight");
  ui.spacing = bindRange("spacing");
  ui.mutation = bindRange("mutation");
  ui.mutationSeed = bindRange("mutationSeed");

  ui.innerScaleA = bindRange("innerScaleA");
  ui.innerScaleB = bindRange("innerScaleB");
  ui.innerPattern = bindText("innerPattern");

  ui.weightScaleA = bindRange("weightScaleA");
  ui.weightScaleB = bindRange("weightScaleB");
  ui.weightPattern = bindText("weightPattern");
  ui.weightSequenceInput = bindText("weightSequenceInput");
  ui.weightOffset = bindRange("weightOffset");

  ui.fillMode = bindCheckbox("fillMode");

  document.getElementById("textArea").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const lines = (ui.textArea.value() || "").replace(/\r/g, "").split("\n");
    if (lines.length >= 25) e.preventDefault();
  });

  // draw() reads every control, so any edit only needs a redraw.
  const controls = document.getElementById("controls");
  controls.addEventListener("input", () => redraw());
  controls.addEventListener("change", () => redraw());

  const exportBtn = document.getElementById("exportSvgBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportSvg);
  }
}

function bindRange(id) {
  const el = document.getElementById(id);
  return { value: () => Number(el.value) };
}

function bindText(id) {
  const el = document.getElementById(id);
  return { value: () => el.value || "" };
}

function bindCheckbox(id) {
  const el = document.getElementById(id);
  return { checked: () => el.checked };
}

// --------------------------------------------------------
// Setup & Resize
// --------------------------------------------------------
function setup() {
  const sketchHost = document.getElementById("sketch-holder");

  const w = sketchHost.offsetWidth || window.innerWidth;
  const h = sketchHost.offsetHeight || window.innerHeight;

  const canvas = createCanvas(w, h);
  canvas.parent(sketchHost);
  pixelDensity(window.devicePixelRatio || 1);

  initGlyphs();
  initAlternatesAndLigatures();
  initHtmlUi();

  noLoop();
  redraw();
}

function windowResized() {
  const sketchHost = document.getElementById("sketch-holder");
  resizeCanvas(sketchHost.offsetWidth, sketchHost.offsetHeight);
  redraw();
}

// --------------------------------------------------------
// Layout
// --------------------------------------------------------
// The type is set in the editor's fixed units (180 px glyphs) and scaled to
// the viewport, so spacing, leading and weight keep their tuned proportions.
// Text Size (%) scales that fitted size.
const LAYOUT_SIZE = 180;

function getLayout() {
  let s = ((height * 0.14) / LAYOUT_SIZE) * (ui.textSize.value() / 100);
  let boxX = (width * 0.04) / s;
  return {
    scale: s,
    baseSize: LAYOUT_SIZE,
    boxX,
    boxW: width / s - boxX * 2,
    topY: LAYOUT_SIZE * 1.4,
    leading: ui.leading.value(),
    alignMode: ui.alignSelect.value(),
  };
}

// --------------------------------------------------------
// Draw
// --------------------------------------------------------
function draw() {
  background(255);

  currentParams = computeEffectiveParams();

  let layout = getLayout();
  let baseSize = layout.baseSize;
  let boxX = layout.boxX;
  let boxW = layout.boxW;
  let topY = layout.topY;
  let leading = layout.leading;
  let alignMode = layout.alignMode;

  push();
  scale(layout.scale);

  let lines = getEditorLines();
  let glyphOrdinal = 0;
  let patternOrdinal = 0;
  let weightOrdinal = 0;
  let wordOrdinal = 0;
  let inWord = false;
  let resetPatternPerWord = currentParams.resetPatternPerWord;
  let weightResetPerWord = currentParams.weightResetPerWord;

  for (let li = 0; li < lines.length; li++) {
    let txtLine = lines[li];

    let baselineY = topY + li * leading;
    let lineW = measureLineWidth(txtLine);
    let x = getAlignedStartX(lineW, boxX, boxW, alignMode);

    let i = 0;
    while (i < txtLine.length) {
      let info = getGlyphInfo(txtLine, i);
      if (info.type === "space") {
        x += info.advance;
        if (inWord) wordOrdinal++;
        inWord = false;
        if (resetPatternPerWord) patternOrdinal = 0;
        if (weightResetPerWord) weightOrdinal = 0;
      } else {
        let dir = getDirectionForWord(wordOrdinal);
        drawGlyph(info.strokes, x, baselineY - baseSize, baseSize, patternOrdinal, dir, weightOrdinal);
        x += info.advance;
        glyphOrdinal++;
        patternOrdinal++;
        weightOrdinal++;
        inWord = true;
      }
      i += info.consumed;
    }

    if (inWord) wordOrdinal++;
    inWord = false;
    if (resetPatternPerWord) patternOrdinal = 0;
    if (weightResetPerWord) weightOrdinal = 0;
  }
  pop();
}

// --------------------------------------------------------
// Editor helpers
// --------------------------------------------------------
function getEditorLines() {
  let raw = ui.textArea.value() || "";
  raw = raw.replace(/\r/g, "");
  let lines = raw.split("\n");
  return lines.slice(0, 25);
}

function measureLineWidth(txtLine) {
  let w = 0;
  let i = 0;
  while (i < txtLine.length) {
    let info = getGlyphInfo(txtLine, i);
    w += info.advance;
    i += info.consumed;
  }
  return w;
}

function getAlignedStartX(lineWidth, boxX, boxW, alignMode) {
  if (alignMode === "center") return boxX + (boxW - lineWidth) * 0.5;
  if (alignMode === "right") return boxX + (boxW - lineWidth);
  return boxX;
}

// --------------------------------------------------------
// Glyph-Definitionen (0..1-Koordinaten)
// --------------------------------------------------------
function initGlyphs() {
  glyphs = {
    // --- Großbuchstaben A–Z ---
    A: [
      [
        [0.1, 1],
        [0.5, 0],
        [0.9, 1],
      ],
      [
        [0.25, 0.6],
        [0.75, 0.6],
      ],
    ],
    B: [
      [
        [0.1, 0],
        [0.1, 1],
      ],
      [
        [0.1, 0],
        [0.7, 0.2],
        [0.1, 0.5],
      ],
      [
        [0.1, 0.5],
        [0.8, 0.75],
        [0.1, 1],
      ],
    ],
    C: [
      [
        [0.8, 0.1],
        [0.5, 0],
        [0.2, 0.2],
        [0.1, 0.5],
        [0.2, 0.8],
        [0.5, 1],
        [0.8, 0.9],
      ],
    ],
    D: [
      [
        [0.1, 0],
        [0.1, 1],
      ],
      [
        [0.1, 0],
        [0.7, 0.2],
        [0.9, 0.5],
        [0.7, 0.8],
        [0.1, 1],
      ],
    ],
    E: [
      [
        [0.8, 0],
        [0.1, 0],
        [0.1, 1],
        [0.8, 1],
      ],
      [
        [0.1, 0.5],
        [0.65, 0.5],
      ],
    ],
    F: [
      [
        [0.1, 0],
        [0.1, 1],
      ],
      [
        [0.1, 0],
        [0.8, 0],
      ],
      [
        [0.1, 0.5],
        [0.65, 0.5],
      ],
    ],
    G: [
      [
        [0.8, 0.2],
        [0.6, 0],
        [0.3, 0.1],
        [0.1, 0.5],
        [0.3, 0.9],
        [0.6, 1],
        [0.85, 0.8],
        [0.85, 0.6],
        [0.55, 0.6],
      ],
    ],
    H: [
      [
        [0.1, 0],
        [0.1, 1],
      ],
      [
        [0.9, 0],
        [0.9, 1],
      ],
      [
        [0.1, 0.5],
        [0.9, 0.5],
      ],
    ],
    I: [
      [
        [0.2, 0],
        [0.8, 0],
      ],
      [
        [0.5, 0],
        [0.5, 1],
      ],
      [
        [0.2, 1],
        [0.8, 1],
      ],
    ],
    J: [
      [
        [0.8, 0],
        [0.8, 0.7],
        [0.7, 0.95],
        [0.5, 1],
        [0.3, 0.85],
      ],
    ],
    K: [
      [
        [0.1, 0],
        [0.1, 1],
      ],
      [
        [0.1, 0.5],
        [0.9, 0],
      ],
      [
        [0.1, 0.5],
        [0.9, 1],
      ],
    ],
    L: [
      [
        [0.1, 0],
        [0.1, 1],
        [0.85, 1],
      ],
    ],
    M: [
      [
        [0.1, 1],
        [0.1, 0],
        [0.5, 0.5],
        [0.9, 0],
        [0.9, 1],
      ],
    ],
    N: [
      [
        [0.1, 1],
        [0.1, 0],
        [0.9, 1],
        [0.9, 0],
      ],
    ],
    O: [
      [
        [0.5, 0],
        [0.85, 0.2],
        [0.9, 0.5],
        [0.85, 0.8],
        [0.5, 1],
        [0.15, 0.8],
        [0.1, 0.5],
        [0.15, 0.2],
        [0.5, 0],
      ],
    ],
    P: [
      [
        [0.1, 1],
        [0.1, 0],
      ],
      [
        [0.1, 0],
        [0.8, 0.2],
        [0.7, 0.5],
        [0.1, 0.55],
      ],
    ],
    Q: [
      [
        [0.5, 0],
        [0.85, 0.2],
        [0.9, 0.5],
        [0.85, 0.8],
        [0.5, 1],
        [0.15, 0.8],
        [0.1, 0.5],
        [0.15, 0.2],
        [0.5, 0],
      ],
      [
        [0.6, 0.7],
        [0.9, 1],
      ],
    ],
    R: [
      [
        [0.1, 1],
        [0.1, 0],
      ],
      [
        [0.1, 0],
        [0.7, 0.15],
        [0.7, 0.45],
        [0.1, 0.55],
      ],
      [
        [0.1, 0.55],
        [0.75, 1],
      ],
    ],
    S: [
      [
        [0.8, 0.1],
        [0.4, 0],
        [0.2, 0.25],
        [0.6, 0.45],
        [0.8, 0.65],
        [0.6, 0.9],
        [0.2, 1],
      ],
    ],
    T: [
      [
        [0.1, 0],
        [0.9, 0],
      ],
      [
        [0.5, 0],
        [0.5, 1],
      ],
    ],
    U: [
      [
        [0.1, 0],
        [0.1, 0.7],
        [0.3, 1],
        [0.7, 1],
        [0.9, 0.7],
        [0.9, 0],
      ],
    ],
    V: [
      [
        [0.1, 0],
        [0.5, 1],
        [0.9, 0],
      ],
    ],
    W: [
      [
        [0.1, 0],
        [0.3, 1],
        [0.5, 0.4],
        [0.7, 1],
        [0.9, 0],
      ],
    ],
    X: [
      [
        [0.1, 0],
        [0.9, 1],
      ],
      [
        [0.9, 0],
        [0.1, 1],
      ],
    ],
    Y: [
      [
        [0.1, 0],
        [0.5, 0.5],
        [0.9, 0],
      ],
      [
        [0.5, 0.5],
        [0.5, 1],
      ],
    ],
    Z: [
      [
        [0.1, 0],
        [0.9, 0],
        [0.1, 1],
        [0.9, 1],
      ],
    ],

    // Fallback
    "?": [
      [
        [0.2, 0.2],
        [0.5, 0],
        [0.8, 0.2],
        [0.7, 0.4],
        [0.5, 0.5],
        [0.5, 0.7],
      ],
      [
        [0.5, 0.9],
        [0.5, 1],
      ],
    ],
  };

  // --- Kleinbuchstaben a–z ---
  glyphs["a"] = [
  [
    [0.30, 0.42],
    [0.42, 0.31],
    [0.58, 0.28],
    [0.72, 0.34],
    [0.80, 0.47],
    [0.80, 0.66],
    [0.72, 0.80],
    [0.57, 0.89],
    [0.40, 0.90],
    [0.28, 0.82],
    [0.22, 0.68],
    [0.22, 0.52],
    [0.24, 0.43],
    [0.30, 0.42],
  ],
  [
    [0.82, 0.94],
    [0.82, 0.12],
  ],
];
  glyphs["b"] = [
    [
      [0.2, 0],
      [0.2, 1],
    ],
    [
      [0.2, 0.4],
      [0.6, 0.3],
      [0.8, 0.5],
      [0.6, 0.7],
      [0.2, 0.75],
    ],
  ];
  glyphs["c"] = [
    [
      [0.8, 0.45],
      [0.6, 0.3],
      [0.3, 0.35],
      [0.2, 0.6],
      [0.4, 0.85],
      [0.7, 0.9],
    ],
  ];
  glyphs["d"] = [
    [
      [0.8, 0],
      [0.8, 1],
    ],
    [
      [0.8, 0.4],
      [0.55, 0.3],
      [0.3, 0.4],
      [0.25, 0.65],
      [0.45, 0.9],
      [0.7, 0.8],
    ],
  ];
  glyphs["e"] = [
    [
      [0.3, 0.55],
      [0.8, 0.55],
    ],
    [
      [0.8, 0.45],
      [0.6, 0.3],
      [0.35, 0.35],
      [0.25, 0.55],
      [0.35, 0.8],
      [0.7, 0.85],
    ],
  ];
  glyphs["f"] = [
    [
      [0.55, 0],
      [0.45, 0.25],
      [0.45, 1],
    ],
    [
      [0.25, 0.3],
      [0.7, 0.3],
    ],
  ];
  glyphs["g"] = [
    [
      [0.7, 0.35],
      [0.5, 0.25],
      [0.3, 0.35],
      [0.25, 0.6],
      [0.45, 0.85],
      [0.7, 0.8],
    ],
    [
      [0.7, 0.8],
      [0.75, 1.1],
      [0.45, 1.15],
      [0.25, 1.0],
    ],
  ];
  glyphs["h"] = [
    [
      [0.2, 0],
      [0.2, 1],
    ],
    [
      [0.2, 0.5],
      [0.55, 0.35],
      [0.8, 0.45],
      [0.8, 1],
    ],
  ];
  glyphs["i"] = [
    [
      [0.5, 0.4],
      [0.5, 0.95],
    ],
    [
      [0.5, 0.15],
      [0.5, 0.2],
    ],
  ];
  glyphs["j"] = [
    [
      [0.6, 0.4],
      [0.6, 1.1],
      [0.4, 1.2],
      [0.25, 1.0],
    ],
    [
      [0.6, 0.15],
      [0.6, 0.2],
    ],
  ];
  glyphs["k"] = [
    [
      [0.2, 0],
      [0.2, 1],
    ],
    [
      [0.2, 0.6],
      [0.8, 0.3],
    ],
    [
      [0.2, 0.6],
      [0.8, 0.95],
    ],
  ];
  glyphs["l"] = [[[0.4, 0], [0.4, 1]]];
  glyphs["m"] = [
    [
      [0.15, 0.95],
      [0.15, 0.45],
      [0.35, 0.3],
      [0.5, 0.45],
      [0.5, 0.95],
    ],
    [
      [0.5, 0.95],
      [0.5, 0.45],
      [0.7, 0.3],
      [0.85, 0.45],
      [0.85, 0.95],
    ],
  ];
  glyphs["n"] = [
    [
      [0.2, 0.95],
      [0.2, 0.45],
      [0.45, 0.3],
      [0.7, 0.45],
      [0.7, 0.95],
    ],
  ];
  glyphs["o"] = [
    [
      [0.5, 0.3],
      [0.75, 0.4],
      [0.8, 0.6],
      [0.7, 0.85],
      [0.45, 0.9],
      [0.25, 0.75],
      [0.25, 0.5],
      [0.4, 0.35],
      [0.5, 0.3],
    ],
  ];
  glyphs["p"] = [
    [
      [0.2, 0.4],
      [0.2, 1.2],
    ],
    [
      [0.2, 0.4],
      [0.55, 0.3],
      [0.8, 0.5],
      [0.6, 0.7],
      [0.2, 0.75],
    ],
  ];
  glyphs["q"] = [
    [
      [0.75, 0.4],
      [0.75, 1.2],
    ],
    [
      [0.75, 0.4],
      [0.5, 0.3],
      [0.3, 0.4],
      [0.25, 0.65],
      [0.4, 0.85],
      [0.65, 0.8],
    ],
  ];
  glyphs["r"] = [
    [
      [0.25, 0.95],
      [0.25, 0.45],
    ],
    [
      [0.25, 0.5],
      [0.5, 0.35],
      [0.7, 0.45],
    ],
  ];
  glyphs["s"] = [
    [
      [0.75, 0.35],
      [0.5, 0.3],
      [0.3, 0.4],
      [0.55, 0.55],
      [0.75, 0.7],
      [0.55, 0.85],
      [0.3, 0.9],
    ],
  ];
  glyphs["t"] = [
    [
      [0.5, 0.1],
      [0.45, 0.4],
      [0.45, 0.95],
    ],
    [
      [0.25, 0.4],
      [0.7, 0.4],
    ],
  ];
  glyphs["u"] = [
    [
      [0.2, 0.45],
      [0.2, 0.8],
      [0.4, 0.95],
      [0.65, 0.9],
      [0.8, 0.7],
      [0.8, 0.45],
    ],
  ];
  glyphs["v"] = [
    [
      [0.2, 0.45],
      [0.5, 0.95],
      [0.8, 0.45],
    ],
  ];
  glyphs["w"] = [
    [
      [0.15, 0.45],
      [0.3, 0.95],
      [0.5, 0.55],
      [0.7, 0.95],
      [0.85, 0.45],
    ],
  ];
  glyphs["x"] = [
    [
      [0.25, 0.4],
      [0.8, 0.9],
    ],
    [
      [0.8, 0.4],
      [0.25, 0.9],
    ],
  ];
  glyphs["y"] = [
    [
      [0.2, 0.45],
      [0.5, 0.75],
      [0.8, 0.45],
    ],
    [
      [0.5, 0.75],
      [0.5, 1.2],
    ],
  ];
  glyphs["z"] = [
    [
      [0.25, 0.45],
      [0.8, 0.45],
      [0.25, 0.9],
      [0.8, 0.9],
    ],
  ];

  // --- Ziffern 0–9 ---
  glyphs["0"] = [
    [
      [0.5, 0],
      [0.8, 0.2],
      [0.9, 0.5],
      [0.8, 0.8],
      [0.5, 1],
      [0.2, 0.8],
      [0.1, 0.5],
      [0.2, 0.2],
      [0.5, 0],
    ],
  ];
  glyphs["1"] = [
    [
      [0.4, 0.15],
      [0.5, 0],
      [0.5, 1],
    ],
    [
      [0.3, 1],
      [0.7, 1],
    ],
  ];
  glyphs["2"] = [
    [
      [0.2, 0.2],
      [0.4, 0],
      [0.7, 0.1],
      [0.8, 0.3],
      [0.6, 0.55],
      [0.3, 0.8],
      [0.2, 1],
      [0.8, 1],
    ],
  ];
  glyphs["3"] = [
    [
      [0.25, 0.1],
      [0.55, 0],
      [0.8, 0.15],
      [0.6, 0.35],
      [0.75, 0.55],
      [0.6, 0.8],
      [0.35, 1],
      [0.2, 0.9],
    ],
  ];
  glyphs["4"] = [
    [
      [0.7, 0],
      [0.7, 1],
    ],
    [
      [0.15, 0.5],
      [0.85, 0.5],
    ],
    [
      [0.3, 0],
      [0.15, 0.5],
    ],
  ];
  glyphs["5"] = [
    [
      [0.8, 0.1],
      [0.4, 0],
      [0.25, 0.35],
      [0.7, 0.35],
      [0.85, 0.6],
      [0.6, 0.9],
      [0.25, 1],
    ],
  ];
  glyphs["6"] = [
    [
      [0.7, 0.1],
      [0.45, 0],
      [0.2, 0.35],
      [0.25, 0.8],
      [0.5, 1],
      [0.8, 0.85],
      [0.7, 0.6],
      [0.4, 0.55],
      [0.25, 0.7],
    ],
  ];
  glyphs["7"] = [[[0.2, 0.05], [0.85, 0.05], [0.4, 1]]];
  glyphs["8"] = [
    [
      [0.5, 0],
      [0.8, 0.2],
      [0.5, 0.4],
      [0.2, 0.2],
      [0.5, 0],
    ],
    [
      [0.5, 0.4],
      [0.85, 0.65],
      [0.5, 1],
      [0.15, 0.65],
      [0.5, 0.4],
    ],
  ];
  glyphs["9"] = [
    [
      [0.25, 0.9],
      [0.5, 1],
      [0.8, 0.7],
      [0.75, 0.3],
      [0.5, 0],
      [0.3, 0.2],
      [0.55, 0.4],
      [0.75, 0.35],
    ],
  ];

  // --- Satzzeichen ---
  glyphs["."] = [[[0.45, 0.9], [0.55, 1.0]]];
  glyphs[","] = [[[0.45, 0.9], [0.55, 1.05], [0.45, 1.15]]];
  glyphs[":"] = [
    [
      [0.5, 0.25],
      [0.5, 0.3],
    ],
    [
      [0.5, 0.8],
      [0.5, 0.85],
    ],
  ];
  glyphs[";"] = [
    [
      [0.5, 0.25],
      [0.5, 0.3],
    ],
    [
      [0.45, 0.8],
      [0.55, 0.95],
      [0.45, 1.05],
    ],
  ];
  glyphs["!"] = [
    [
      [0.5, 0.05],
      [0.5, 0.8],
    ],
    [
      [0.5, 0.9],
      [0.5, 0.95],
    ],
  ];
  glyphs["-"] = [[[0.2, 0.55], [0.8, 0.5]]];
  glyphs["+"] = [
    [
      [0.5, 0.3],
      [0.5, 0.8],
    ],
    [
      [0.25, 0.55],
      [0.75, 0.55],
    ],
  ];
  glyphs["="] = [
    [
      [0.22, 0.4],
      [0.78, 0.4],
    ],
    [
      [0.22, 0.68],
      [0.78, 0.68],
    ],
  ];
  glyphs["<"] = [
    [
      [0.75, 0.2],
      [0.3, 0.5],
      [0.75, 0.8],
    ],
  ];
  glyphs[">"] = [
    [
      [0.25, 0.2],
      [0.7, 0.5],
      [0.25, 0.8],
    ],
  ];
  glyphs["_"] = [[[0.15, 1.0], [0.85, 1.0]]];
  glyphs["°"] = [
    [
      [0.5, 0.08],
      [0.66, 0.14],
      [0.72, 0.28],
      [0.66, 0.42],
      [0.5, 0.48],
      [0.34, 0.42],
      [0.28, 0.28],
      [0.34, 0.14],
      [0.5, 0.08],
    ],
  ];
  glyphs["["] = [
    [
      [0.65, 0.02],
      [0.35, 0.02],
      [0.35, 1.0],
      [0.65, 1.0],
    ],
  ];
  glyphs["]"] = [
    [
      [0.35, 0.02],
      [0.65, 0.02],
      [0.65, 1.0],
      [0.35, 1.0],
    ],
  ];
  glyphs["{"] = [
    [
      [0.68, 0.02],
      [0.48, 0.08],
      [0.42, 0.28],
      [0.52, 0.46],
      [0.35, 0.54],
      [0.52, 0.62],
      [0.42, 0.82],
      [0.48, 0.98],
      [0.68, 1.0],
    ],
  ];
  glyphs["}"] = [
    [
      [0.32, 0.02],
      [0.52, 0.08],
      [0.58, 0.28],
      [0.48, 0.46],
      [0.65, 0.54],
      [0.48, 0.62],
      [0.58, 0.82],
      [0.52, 0.98],
      [0.32, 1.0],
    ],
  ];
  glyphs["|"] = [[[0.5, 0.0], [0.5, 1.0]]];
  glyphs["\\"] = [[[0.2, 0.0], [0.8, 1.0]]];
  glyphs["^"] = [
    [
      [0.2, 0.45],
      [0.5, 0.08],
      [0.8, 0.45],
    ],
  ];
  glyphs["±"] = [
    [
      [0.5, 0.18],
      [0.5, 0.68],
    ],
    [
      [0.25, 0.43],
      [0.75, 0.43],
    ],
    [
      [0.25, 0.84],
      [0.75, 0.84],
    ],
  ];
  glyphs["×"] = [
    [
      [0.22, 0.22],
      [0.78, 0.78],
    ],
    [
      [0.78, 0.22],
      [0.22, 0.78],
    ],
  ];
  glyphs["÷"] = [
    [
      [0.22, 0.52],
      [0.78, 0.52],
    ],
    [
      [0.5, 0.2],
      [0.5, 0.24],
    ],
    [
      [0.5, 0.8],
      [0.5, 0.84],
    ],
  ];
  glyphs["•"] = [
    [
      [0.5, 0.42],
      [0.56, 0.46],
      [0.58, 0.54],
      [0.5, 0.6],
      [0.42, 0.54],
      [0.44, 0.46],
      [0.5, 0.42],
    ],
  ];
  glyphs["…"] = [
    [
      [0.22, 0.92],
      [0.26, 0.96],
    ],
    [
      [0.48, 0.92],
      [0.52, 0.96],
    ],
    [
      [0.74, 0.92],
      [0.78, 0.96],
    ],
  ];
  glyphs["„"] = [
    [
      [0.34, 0.82],
      [0.38, 0.98],
      [0.32, 1.08],
    ],
    [
      [0.62, 0.82],
      [0.66, 0.98],
      [0.6, 1.08],
    ],
  ];
  glyphs["“"] = [
    [
      [0.38, 0.08],
      [0.34, 0.22],
    ],
    [
      [0.66, 0.08],
      [0.62, 0.22],
    ],
  ];
  glyphs["‚"] = [
    [
      [0.52, 0.82],
      [0.56, 0.98],
      [0.5, 1.08],
    ],
  ];
  glyphs["‘"] = [
    [
      [0.56, 0.08],
      [0.52, 0.22],
    ],
  ];
  glyphs["–"] = [[[0.22, 0.55], [0.78, 0.55]]];
  glyphs["—"] = [[[0.08, 0.55], [0.92, 0.55]]];
  glyphs["/"] = [[[0.2, 1.0], [0.8, 0.0]]];
  glyphs["("] = [
    [
      [0.7, 0.0],
      [0.4, 0.2],
      [0.3, 0.5],
      [0.4, 0.8],
      [0.7, 1.0],
    ],
  ];
  glyphs[")"] = [
    [
      [0.3, 0.0],
      [0.6, 0.2],
      [0.7, 0.5],
      [0.6, 0.8],
      [0.3, 1.0],
    ],
  ];
  glyphs['"'] = [
    [
      [0.35, 0.1],
      [0.35, 0.25],
    ],
    [
      [0.65, 0.1],
      [0.65, 0.25],
    ],
  ];
  glyphs["'"] = [[[0.5, 0.1], [0.55, 0.25]]];

  // --- Umlaute & ß ---
  glyphs["Ä"] = JSON.parse(JSON.stringify(glyphs["A"]));
  glyphs["Ä"].push([
    [0.3, -0.05],
    [0.3, 0.0],
  ]);
  glyphs["Ä"].push([
    [0.7, -0.05],
    [0.7, 0.0],
  ]);

  glyphs["Ö"] = JSON.parse(JSON.stringify(glyphs["O"]));
  glyphs["Ö"].push([
    [0.35, -0.05],
    [0.35, 0.0],
  ]);
  glyphs["Ö"].push([
    [0.65, -0.05],
    [0.65, 0.0],
  ]);

  glyphs["Ü"] = JSON.parse(JSON.stringify(glyphs["U"]));
  glyphs["Ü"].push([
    [0.35, -0.05],
    [0.35, 0.0],
  ]);
  glyphs["Ü"].push([
    [0.65, -0.05],
    [0.65, 0.0],
  ]);

  glyphs["ä"] = JSON.parse(JSON.stringify(glyphs["a"]));
  glyphs["ä"].push([
    [0.35, 0.15],
    [0.35, 0.2],
  ]);
  glyphs["ä"].push([
    [0.6, 0.15],
    [0.6, 0.2],
  ]);

  glyphs["ö"] = JSON.parse(JSON.stringify(glyphs["o"]));
  glyphs["ö"].push([
    [0.35, 0.15],
    [0.35, 0.2],
  ]);
  glyphs["ö"].push([
    [0.6, 0.15],
    [0.6, 0.2],
  ]);

  glyphs["ü"] = JSON.parse(JSON.stringify(glyphs["u"]));
  glyphs["ü"].push([
    [0.35, 0.15],
    [0.35, 0.2],
  ]);
  glyphs["ü"].push([
    [0.6, 0.15],
    [0.6, 0.2],
  ]);

  glyphs["ß"] = [
    [
      [0.2, 0.0],
      [0.35, 0.15],
      [0.35, 0.45],
    ],
    [
      [0.35, 0.15],
      [0.7, 0.1],
      [0.8, 0.3],
      [0.45, 0.4],
    ],
    [
      [0.45, 0.4],
      [0.75, 0.5],
      [0.8, 0.8],
      [0.5, 1.0],
      [0.3, 0.9],
    ],
  ];

  // ======================================================
  // EXTRA SYMBOLS: @€$%&§#*~=<>_°[]{}|\^±×÷•…„“‚‘–— + Pfeile
  // (simple, loop-friendly strokes — du kannst später noch "typografischer" feilen)
  // ======================================================

  // @ : Außenring + kleines "a" + Häkchen
  glyphs["@"] = [
    [
      [0.55, 0.08],
      [0.78, 0.15],
      [0.9, 0.38],
      [0.82, 0.72],
      [0.55, 0.9],
      [0.25, 0.82],
      [0.12, 0.5],
      [0.25, 0.18],
      [0.55, 0.08],
    ],
    [
      [0.38, 0.55],
      [0.52, 0.42],
      [0.68, 0.48],
      [0.68, 0.64],
      [0.55, 0.72],
      [0.4, 0.66],
      [0.38, 0.55],
    ],
    [
      [0.68, 0.48],
      [0.78, 0.38],
      [0.82, 0.5],
      [0.75, 0.62],
    ],
  ];

  // € : C-Form + 2 Querstriche
  glyphs["€"] = [
    [
      [0.82, 0.18],
      [0.55, 0.06],
      [0.28, 0.18],
      [0.18, 0.5],
      [0.28, 0.82],
      [0.55, 0.94],
      [0.82, 0.82],
    ],
    [
      [0.22, 0.42],
      [0.7, 0.42],
    ],
    [
      [0.22, 0.6],
      [0.7, 0.6],
    ],
  ];

  // $ : S + Vertikalstrich
  glyphs["$"] = [
    [
      [0.78, 0.18],
      [0.45, 0.06],
      [0.22, 0.2],
      [0.55, 0.46],
      [0.8, 0.7],
      [0.55, 0.94],
      [0.22, 0.82],
    ],
    [
      [0.5, 0.02],
      [0.5, 0.98],
    ],
  ];

  // % : 2 Kreise + Diagonal
  glyphs["%"] = [
    [
      [0.25, 0.25],
      [0.35, 0.15],
      [0.45, 0.25],
      [0.35, 0.35],
      [0.25, 0.25],
    ],
    [
      [0.55, 0.75],
      [0.65, 0.65],
      [0.75, 0.75],
      [0.65, 0.85],
      [0.55, 0.75],
    ],
    [
      [0.25, 0.85],
      [0.75, 0.15],
    ],
  ];

  // & : loopige Form (vereinfacht)
  glyphs["&"] = [
    [
      [0.7, 0.22],
      [0.55, 0.08],
      [0.35, 0.18],
      [0.45, 0.38],
      [0.7, 0.6],
      [0.55, 0.88],
      [0.28, 0.78],
      [0.28, 0.62],
      [0.52, 0.52],
      [0.8, 0.9],
    ],
  ];

  // § : Doppel-S (vereinfacht)
  glyphs["§"] = [
    [
      [0.75, 0.16],
      [0.45, 0.06],
      [0.28, 0.22],
      [0.55, 0.4],
      [0.72, 0.56],
      [0.55, 0.72],
      [0.28, 0.62],
    ],
    [
      [0.72, 0.44],
      [0.45, 0.34],
      [0.28, 0.5],
      [0.55, 0.68],
      [0.72, 0.84],
      [0.55, 0.96],
      [0.28, 0.86],
    ],
  ];

  // # : Gitter
  glyphs["#"] = [
    [
      [0.35, 0.1],
      [0.3, 0.9],
    ],
    [
      [0.65, 0.1],
      [0.6, 0.9],
    ],
    [
      [0.18, 0.38],
      [0.85, 0.32],
    ],
    [
      [0.15, 0.68],
      [0.82, 0.62],
    ],
  ];

  // * : Stern
  glyphs["*"] = [
    [
      [0.5, 0.15],
      [0.5, 0.85],
    ],
    [
      [0.22, 0.32],
      [0.78, 0.68],
    ],
    [
      [0.78, 0.32],
      [0.22, 0.68],
    ],
  ];

  // ~ : Welle
  glyphs["~"] = [
    [
      [0.15, 0.58],
      [0.32, 0.42],
      [0.48, 0.58],
      [0.65, 0.42],
      [0.85, 0.58],
    ],
  ];

  // ---------------------------
  // Pfeile (einheitlicher Style)
  // ---------------------------

  // ←
  glyphs["←"] = [
    [
      [0.85, 0.5],
      [0.2, 0.5],
    ],
    [
      [0.35, 0.35],
      [0.2, 0.5],
      [0.35, 0.65],
    ],
  ];

  // →
  glyphs["→"] = [
    [
      [0.15, 0.5],
      [0.8, 0.5],
    ],
    [
      [0.65, 0.35],
      [0.8, 0.5],
      [0.65, 0.65],
    ],
  ];

  // ↑
  glyphs["↑"] = [
    [
      [0.5, 0.85],
      [0.5, 0.2],
    ],
    [
      [0.35, 0.35],
      [0.5, 0.2],
      [0.65, 0.35],
    ],
  ];

  // ↓
  glyphs["↓"] = [
    [
      [0.5, 0.15],
      [0.5, 0.8],
    ],
    [
      [0.35, 0.65],
      [0.5, 0.8],
      [0.65, 0.65],
    ],
  ];

  // ↔
  glyphs["↔"] = [
    [
      [0.2, 0.5],
      [0.8, 0.5],
    ],
    [
      [0.35, 0.35],
      [0.2, 0.5],
      [0.35, 0.65],
    ],
    [
      [0.65, 0.35],
      [0.8, 0.5],
      [0.65, 0.65],
    ],
  ];

  // ↕
  glyphs["↕"] = [
    [
      [0.5, 0.2],
      [0.5, 0.8],
    ],
    [
      [0.35, 0.35],
      [0.5, 0.2],
      [0.65, 0.35],
    ],
    [
      [0.35, 0.65],
      [0.5, 0.8],
      [0.65, 0.65],
    ],
  ];

  // ↗ (NE)
  glyphs["↗"] = [
    [
      [0.25, 0.75],
      [0.75, 0.25],
    ],
    [
      [0.62, 0.25],
      [0.75, 0.25],
      [0.75, 0.38],
    ],
  ];

  // ↖ (NW)
  glyphs["↖"] = [
    [
      [0.75, 0.75],
      [0.25, 0.25],
    ],
    [
      [0.38, 0.25],
      [0.25, 0.25],
      [0.25, 0.38],
    ],
  ];

  // ↘ (SE)
  glyphs["↘"] = [
    [
      [0.25, 0.25],
      [0.75, 0.75],
    ],
    [
      [0.62, 0.75],
      [0.75, 0.75],
      [0.75, 0.62],
    ],
  ];

  // ↙ (SW)
  glyphs["↙"] = [
    [
      [0.75, 0.25],
      [0.25, 0.75],
    ],
    [
      [0.38, 0.75],
      [0.25, 0.75],
      [0.25, 0.62],
    ],
  ];

  // ↰ (up then left)
  glyphs["↰"] = [
    [
      [0.65, 0.8],
      [0.65, 0.25],
      [0.25, 0.25],
    ],
    [
      [0.38, 0.12],
      [0.25, 0.25],
      [0.38, 0.38],
    ],
  ];

  // ↱ (up then right)
  glyphs["↱"] = [
    [
      [0.35, 0.8],
      [0.35, 0.25],
      [0.75, 0.25],
    ],
    [
      [0.62, 0.12],
      [0.75, 0.25],
      [0.62, 0.38],
    ],
  ];

  // ↩ (return / hook left) — vereinfacht als "rechts->links mit Haken"
  glyphs["↩"] = [
    [
      [0.8, 0.35],
      [0.35, 0.35],
      [0.35, 0.75],
      [0.2, 0.75],
    ],
    [
      [0.35, 0.6],
      [0.2, 0.75],
      [0.35, 0.9],
    ],
  ];
}

// --------------------------------------------------------
// Alternates & Ligatures
// --------------------------------------------------------
function initAlternatesAndLigatures() {
  alternates = {};
  ligatures = {};

  function cloneGlyph(strokes) {
    return strokes.map((st) => st.map((p) => [p[0], p[1]]));
  }
  function tweakGlyph(strokes, dx, dy) {
    let g = cloneGlyph(strokes);
    for (let s = 0; s < g.length; s++) {
      for (let i = 0; i < g[s].length; i++) {
        if (i % 2 === 1) {
          g[s][i][0] += dx;
          g[s][i][1] += dy;
        }
      }
    }
    return g;
  }
  function makeAlt(ch, dx, dy) {
    if (!glyphs[ch]) return;
    if (!alternates[ch]) alternates[ch] = [];
    alternates[ch].push(tweakGlyph(glyphs[ch], dx, dy));
  }

  // Alternates
  makeAlt("A", 0.06, -0.08);
  makeAlt("A", -0.04, 0.06);
  makeAlt("O", 0.08, 0.0);
  makeAlt("O", -0.06, 0.05);
  makeAlt("S", 0.05, -0.05);
  makeAlt("R", -0.04, 0.05);
  makeAlt("M", 0.03, -0.05);
  makeAlt("N", -0.03, 0.07);
  makeAlt("E", 0.02, -0.06);

  makeAlt("a", 0.04, -0.06);
  makeAlt("o", -0.04, 0.05);
  makeAlt("s", 0.05, -0.04);

  // Ligaturen (ff, fi, fl, tt, ss, st)
  ligatures["ff"] = [
    [
      [0.15, 0],
      [0.15, 1],
    ],
    [
      [0.45, 0],
      [0.45, 1],
    ],
    [
      [0.1, 0.32],
      [0.9, 0.3],
    ],
  ];
  ligatures["fi"] = [
    [
      [0.2, 0],
      [0.2, 1],
    ],
    [
      [0.1, 0.32],
      [0.8, 0.3],
    ],
    [
      [0.75, 0.4],
      [0.75, 1],
    ],
    [
      [0.75, 0.15],
      [0.75, 0.2],
    ],
  ];
  ligatures["fl"] = [
    [
      [0.2, 0],
      [0.2, 1],
    ],
    [
      [0.1, 0.32],
      [0.8, 0.3],
    ],
    [
      [0.75, 0],
      [0.75, 1],
    ],
  ];
  ligatures["tt"] = [
    [
      [0.25, 0.1],
      [0.25, 0.95],
    ],
    [
      [0.55, 0.1],
      [0.55, 0.95],
    ],
    [
      [0.05, 0.4],
      [0.9, 0.4],
    ],
  ];
  ligatures["ss"] = [
    [
      [0.15, 0.2],
      [0.45, 0.1],
      [0.3, 0.4],
      [0.5, 0.55],
      [0.25, 0.8],
      [0.1, 0.9],
    ],
    [
      [0.5, 0.2],
      [0.8, 0.1],
      [0.65, 0.4],
      [0.85, 0.55],
      [0.6, 0.8],
      [0.45, 0.9],
    ],
  ];
  ligatures["st"] = [
    [
      [0.15, 0.2],
      [0.45, 0.1],
      [0.3, 0.4],
      [0.55, 0.55],
      [0.3, 0.8],
      [0.15, 0.9],
    ],
    [
      [0.65, 0.1],
      [0.6, 0.4],
      [0.6, 0.95],
    ],
    [
      [0.45, 0.4],
      [0.9, 0.4],
    ],
  ];
}

// --------------------------------------------------------
// Schleifen hinzufügen
// --------------------------------------------------------
function mutationHash(seed, strokeIndex, segmentIndex, channel) {
  // Kleiner deterministischer Hash: gleiche Parameter = gleiche Form.
  let n =
    seed * 12.9898 +
    strokeIndex * 78.233 +
    segmentIndex * 37.719 +
    channel * 19.913;
  let x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

function addLoopsToStroke(
  pts,
  loopStrength,
  size,
  radiusFactor,
  strokeIndex = 0,
  mutation = 0,
  mutationSeed = 37
) {
  if (loopStrength <= 0.01 || pts.length < 2) return pts;

  let newPts = [];
  let maxAmp = loopStrength * size * 0.5 * radiusFactor;
  let m = constrain(mutation, 0, 2);

  for (let i = 0; i < pts.length - 1; i++) {
    let p0 = pts[i];
    let p1 = pts[i + 1];

    newPts.push(p0.copy());

    let seg = p5.Vector.sub(p1, p0);
    let len = seg.mag();
    if (len > 0.0001) {
      let normal = createVector(-seg.y, seg.x).normalize();

      // 1) Position der Schleife wandert aus der Segmentmitte.
      let hPos = mutationHash(mutationSeed, strokeIndex, i, 1);
      let t = 0.5 + (hPos * 2 - 1) * 0.28 * m;
      t = constrain(t, 0.08, 0.92);
      let base = p5.Vector.add(p0, p5.Vector.mult(seg, t));

      // 2) Jedes Segment erhält eine eigene Schleifenstärke.
      let hLoop = mutationHash(mutationSeed, strokeIndex, i, 2);
      let localLoop = 1 + (hLoop * 2 - 1) * 0.85 * m;
      localLoop = constrain(localLoop, 0.05, 2.8);

      // 3) Zusätzlich variiert der Radius unabhängig davon.
      let hRadius = mutationHash(mutationSeed, strokeIndex, i, 3);
      let localRadius = 1 + (hRadius * 2 - 1) * 1.05 * m;
      localRadius = constrain(localRadius, 0.05, 3.2);

      // 4) Grundsätzlich alternierende Richtung; bei starker Mutation
      //    können einzelne Segmente bewusst auf dieselbe Seite kippen.
      let sign = i % 2 === 0 ? 1 : -1;
      let hFlip = mutationHash(mutationSeed, strokeIndex, i, 4);
      if (m > 0.9 && hFlip < (m - 0.9) * 0.42) sign *= -1;

      // 5) Kleine tangentiale Verschiebung erzeugt asymmetrischere Knoten.
      let hTang = mutationHash(mutationSeed, strokeIndex, i, 5);
      let tangent = seg.copy().normalize();
      let tangentialShift = (hTang * 2 - 1) * size * 0.10 * m;

      let amp = maxAmp * 0.7 * localLoop * localRadius * sign;
      let loopPoint = p5.Vector.add(base, p5.Vector.mult(normal, amp));
      loopPoint.add(p5.Vector.mult(tangent, tangentialShift));
      newPts.push(loopPoint);
    }
  }
  newPts.push(pts[pts.length - 1].copy());
  return newPts;
}

// --------------------------------------------------------
// transformierte Strokes (inkl. Schleifen & Radius)
// --------------------------------------------------------
function getTransformedStrokes(strokes, x0, y0, size) {
  let loopStrength = currentParams.loops;
  let radiusFactor = currentParams.radius;
  let mutation = currentParams.mutation;
  let mutationSeed = currentParams.mutationSeed;
  let result = [];

  for (let s = 0; s < strokes.length; s++) {
    let basePts = strokes[s].map((p) =>
      createVector(x0 + p[0] * size, y0 + p[1] * size)
    );
    let pts = addLoopsToStroke(
      basePts,
      loopStrength,
      size,
      radiusFactor,
      s,
      mutation,
      mutationSeed
    );
    if (pts.length >= 2) result.push(pts);
  }
  return result;
}

// --------------------------------------------------------
// Stylistic-Set-Parameter berechnen
// --------------------------------------------------------
function computeEffectiveParams() {
  let loops = ui.loops.value();
  let radius = ui.radius.value();
  let mutation = ui.mutation.value();
  let mutationSeed = ui.mutationSeed.value();
  let weight = ui.weight.value();
  let weightScaleA = ui.weightScaleA.value();
  let weightScaleB = ui.weightScaleB.value();
  let weightPattern = ui.weightPattern.value();
  let weightSequenceText = ui.weightSequenceInput.value();
  let weightOffset = ui.weightOffset.value();
  let weightResetPerWord = false;
  let innerScaleA = ui.innerScaleA.value();
  let innerScaleB = ui.innerScaleB.value();
  let innerPattern = ui.innerPattern.value();
  let innerSequenceText = "1.00, 0.75, 0.45, 0.28";
  let sequenceOffset = 0;
  let sequenceDirection = "forward";
  let randomDirectionPerWord = false;
  let resetPatternPerWord = false;
  let tight = ui.curve.value();

  loops = constrain(loops, 0, 3.5);
  radius = constrain(radius, 0.05, 6.5);
  tight = constrain(tight, -1, 1);

  mutation = constrain(mutation, 0, 2);
  weightScaleA = constrain(weightScaleA, 0.20, 2.50);
  weightScaleB = constrain(weightScaleB, 0.20, 2.50);
  weightOffset = max(0, floor(weightOffset));
  let weightSequence = parseWeightSequence(weightSequenceText, weightScaleA, weightScaleB);
  innerScaleA = constrain(innerScaleA, 0, 1);
  innerScaleB = constrain(innerScaleB, 0, 1);
  let innerSequence = parseInnerSequence(innerSequenceText, innerScaleA, innerScaleB);

  return {
    loops,
    radius,
    mutation,
    mutationSeed,
    weight,
    weightScaleA,
    weightScaleB,
    weightPattern,
    weightSequenceText,
    weightSequence,
    weightOffset,
    weightResetPerWord,
    innerScaleA,
    innerScaleB,
    innerPattern,
    innerSequenceText,
    innerSequence,
    sequenceOffset,
    sequenceDirection,
    randomDirectionPerWord,
    resetPatternPerWord,
    tight,
  };
}

// --------------------------------------------------------
// Glyph-Auswahl inkl. Ligaturen & Alternates
// --------------------------------------------------------
function getGlyphInfo(txt, index) {
  let spacing = ui.spacing.value();
  let ch = txt[index];

  if (ch === " ") {
    return { type: "space", consumed: 1, advance: spacing * 0.6 };
  }

  // Ligaturen prüfen (3er, dann 2er)
  if (features.ligatures) {
    for (let len = 3; len >= 2; len--) {
      if (index + len <= txt.length) {
        let key = txt.substring(index, index + len);
        if (ligatures[key]) {
          return {
            type: "glyph",
            strokes: ligatures[key],
            consumed: len,
            advance: spacing * len * 0.95,
          };
        }
      }
    }
  }

  // normale Glyphe + Alternates
  let base = glyphs[ch] || glyphs["?"];
  let strokes = base;

  if (features.randomAlt && alternates[ch] && alternates[ch].length > 0) {
    let variants = alternates[ch];
    let seed = (index + ch.charCodeAt(0) * 31) >>> 0;
    let r = ((seed * 9301 + 49297) % 233280) / 233280.0;
    let choice = floor(r * (variants.length + 1));
    if (choice > 0) strokes = variants[choice - 1];
  }

  return { type: "glyph", strokes: strokes, consumed: 1, advance: spacing };
}

// --------------------------------------------------------
// Outer Weight Pattern
// --------------------------------------------------------
function parseWeightSequence(raw, fallbackA, fallbackB) {
  let txt = String(raw || "")
    .replace(/;/g, ",")
    .replace(/\//g, ",")
    .replace(/\|/g, ",")
    .replace(/\s+/g, ",");

  let parts = txt
    .split(",")
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .map((v) => constrain(v, 0.20, 2.50));

  if (parts.length === 0) return [fallbackA, fallbackB];
  return parts;
}

function getWeightPatternSequence() {
  let a = currentParams.weightScaleA;
  let b = currentParams.weightScaleB;
  let mid = (a + b) * 0.5;

  switch (currentParams.weightPattern) {
    case "alternate":
      return [a, b];
    case "cycle4":
      return [a, lerp(a, b, 0.33), lerp(a, b, 0.66), b];
    case "wave":
      return [a, mid, b, mid];
    case "extreme":
      return [a, lerp(a, b, 0.25), b, lerp(a, b, 0.75), a];
    case "custom":
      return currentParams.weightSequence && currentParams.weightSequence.length
        ? currentParams.weightSequence
        : [a, b];
    case "fixed":
    default:
      return [a];
  }
}

function getWeightScaleForGlyph(glyphOrdinal) {
  let a = currentParams.weightScaleA;
  let b = currentParams.weightScaleB;
  let idx = glyphOrdinal + currentParams.weightOffset;

  if (currentParams.weightPattern === "random") {
    // Deterministisch: Canvas und SVG bleiben identisch.
    let seed = ((idx + 11) * 1664525 + currentParams.mutationSeed * 1013904223) >>> 0;
    let r = (seed % 100000) / 99999;
    return lerp(a, b, r);
  }

  let seq = getWeightPatternSequence();
  return seq[idx % seq.length];
}

function getOuterWeightForGlyph(baseWeight, glyphOrdinal) {
  let scale = getWeightScaleForGlyph(glyphOrdinal);
  return constrain(baseWeight * scale, 1, 180);
}

// --------------------------------------------------------
// Inner-Line Pattern
// --------------------------------------------------------
function parseInnerSequence(raw, fallbackA, fallbackB) {
  let txt = String(raw || "")
    .replace(/;/g, ",")
    .replace(/\//g, ",")
    .replace(/\|/g, ",")
    .replace(/\s+/g, ",");

  let parts = txt
    .split(",")
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .map((v) => constrain(v, 0, 1));

  if (parts.length === 0) return [fallbackA, fallbackB];
  return parts;
}

function getPatternSequenceForMode() {
  let a = currentParams.innerScaleA;
  let b = currentParams.innerScaleB;
  let mode = currentParams.innerPattern;

  if (mode === "fixed") return [a];
  if (mode === "alternate") return [a, b];
  if (mode === "cycle4") return [a, lerp(a, b, 0.33), lerp(a, b, 0.66), b];
  if (mode === "wave") {
    let mid = lerp(a, b, 0.5);
    return [a, mid, b, mid];
  }
  if (mode === "extreme") {
    return [a, lerp(a, b, 0.2), lerp(a, b, 0.5), lerp(a, b, 0.8), b];
  }
  if (mode === "custom") return currentParams.innerSequence;
  return [a];
}

function applyDirectionToSequence(seq, direction) {
  let base = seq.slice();
  if (base.length === 0) return [1];

  if (direction === "reverse") {
    return base.reverse();
  }

  if (direction === "mirror") {
    if (base.length <= 2) return base;
    return base.concat(base.slice(1, -1).reverse());
  }

  return base;
}

function getDirectionForWord(wordOrdinal) {
  return currentParams.sequenceDirection || "forward";
}

function getInnerScaleForGlyph(glyphOrdinal, directionOverride = null) {
  let a = currentParams.innerScaleA;
  let b = currentParams.innerScaleB;
  let mode = currentParams.innerPattern;
  let idx = glyphOrdinal + currentParams.sequenceOffset;

  if (mode === "random") {
    // deterministisch: Canvas und SVG bleiben identisch
    let seed = ((idx + 1) * 1103515245 + currentParams.mutationSeed * 12345) >>> 0;
    let r = (seed % 100000) / 99999;
    return lerp(a, b, r);
  }

  let seq = getPatternSequenceForMode();
  let dir = directionOverride || currentParams.sequenceDirection;
  seq = applyDirectionToSequence(seq, dir);
  return seq[idx % seq.length];
}

function getInnerStrokeWidth(outerBaseWeight, glyphOrdinal, directionOverride = null) {
  let scale = getInnerScaleForGlyph(glyphOrdinal, directionOverride);
  let outerWidth = outerBaseWeight + 4;
  // Nie breiter als die schwarze Außenlinie. 0 = komplett schwarz.
  return constrain(outerBaseWeight * scale, 0, max(0, outerWidth - 0.5));
}

// --------------------------------------------------------
// Canvas-Rendering
// --------------------------------------------------------
function drawGlyph(
  strokes,
  x0,
  y0,
  size,
  glyphOrdinal = 0,
  directionOverride = null,
  weightOrdinal = glyphOrdinal
) {
  let tight = currentParams.tight;
  let w = getOuterWeightForGlyph(currentParams.weight, weightOrdinal);
  let innerW = getInnerStrokeWidth(w, glyphOrdinal, directionOverride);
  let fillMode = ui.fillMode.checked();

  curveTightness(tight);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  noFill();

  let transformed = getTransformedStrokes(strokes, x0, y0, size);

  for (let pts of transformed) {
    let first = pts[0];
    let last = pts[pts.length - 1];

    if (fillMode) {
      stroke(0);
      strokeWeight(w + 4);
      beginShape();
      curveVertex(first.x, first.y);
      for (let v of pts) curveVertex(v.x, v.y);
      curveVertex(last.x, last.y);
      endShape();
    } else {
      stroke(0);
      strokeWeight(w + 4);
      beginShape();
      curveVertex(first.x, first.y);
      for (let v of pts) curveVertex(v.x, v.y);
      curveVertex(last.x, last.y);
      endShape();

      stroke(255);
      strokeWeight(innerW);
      beginShape();
      curveVertex(first.x, first.y);
      for (let v of pts) curveVertex(v.x, v.y);
      curveVertex(last.x, last.y);
      endShape();
    }
  }
}

// --------------------------------------------------------
// Kurven-Sampling für SVG (approx. curveVertex)
// --------------------------------------------------------
function sampleCurvePoints(pts, detail) {
  let sampled = [];
  if (pts.length < 2) return pts.slice();

  let cp = [];
  cp.push(pts[0]);
  for (let p of pts) cp.push(p);
  cp.push(pts[pts.length - 1]);

  for (let i = 1; i < cp.length - 2; i++) {
    for (let t = 0; t <= 1.0001; t += 1 / detail) {
      let x = curvePoint(cp[i - 1].x, cp[i].x, cp[i + 1].x, cp[i + 2].x, t);
      let y = curvePoint(cp[i - 1].y, cp[i].y, cp[i + 1].y, cp[i + 2].y, t);
      sampled.push(createVector(x, y));
    }
  }
  return sampled;
}

// --------------------------------------------------------
// SVG-Export (mehrzeilig + Align)
// --------------------------------------------------------
function exportSvg() {
  let fillMode = ui.fillMode.checked();

  let layout = getLayout();
  let baseSize = layout.baseSize;
  let boxX = layout.boxX;
  let boxW = layout.boxW;
  let topY = layout.topY;
  let leading = layout.leading;
  let alignMode = layout.alignMode;

  currentParams = computeEffectiveParams();
  let wStroke = currentParams.weight;
  let tight = currentParams.tight;
  curveTightness(tight);

  // Paths stay in layout units; the viewBox scales them to the canvas size.
  let viewW = (width / layout.scale).toFixed(2);
  let viewH = (height / layout.scale).toFixed(2);

  let svg = [];
  svg.push('<?xml version="1.0" encoding="UTF-8"?>');
  svg.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewW} ${viewH}">`
  );

  let lines = getEditorLines();
  let glyphOrdinal = 0;
  let patternOrdinal = 0;
  let weightOrdinal = 0;
  let wordOrdinal = 0;
  let inWord = false;
  let resetPatternPerWord = currentParams.resetPatternPerWord;
  let weightResetPerWord = currentParams.weightResetPerWord;
  for (let li = 0; li < lines.length; li++) {
    let txtLine = lines[li];
    let baselineY = topY + li * leading;

    let lineW = measureLineWidth(txtLine);
    let x = getAlignedStartX(lineW, boxX, boxW, alignMode);

    let i = 0;
    while (i < txtLine.length) {
      let info = getGlyphInfo(txtLine, i);

      if (info.type === "space") {
        x += info.advance;
        i += info.consumed;
        if (inWord) wordOrdinal++;
        inWord = false;
        if (resetPatternPerWord) patternOrdinal = 0;
        if (weightResetPerWord) weightOrdinal = 0;
        continue;
      }

      let dir = getDirectionForWord(wordOrdinal);
      let glyphWeight = getOuterWeightForGlyph(wStroke, weightOrdinal);
      let innerW = getInnerStrokeWidth(glyphWeight, patternOrdinal, dir);

      let transformed = getTransformedStrokes(
        info.strokes,
        x,
        baselineY - baseSize,
        baseSize
      );

      for (let pts of transformed) {
        if (pts.length < 2) continue;

        let curvePts = sampleCurvePoints(pts, 16);

        let d = `M ${curvePts[0].x.toFixed(2)} ${curvePts[0].y.toFixed(2)}`;
        for (let j = 1; j < curvePts.length; j++) {
          d += ` L ${curvePts[j].x.toFixed(2)} ${curvePts[j].y.toFixed(2)}`;
        }

        if (fillMode) {
          svg.push(
            `<path d="${d}" fill="none" stroke="black" stroke-width="${(
              glyphWeight + 4
            ).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" />`
          );
        } else {
          svg.push(
            `<path d="${d}" fill="none" stroke="black" stroke-width="${(
              glyphWeight + 4
            ).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" />`
          );
          svg.push(
            `<path d="${d}" fill="none" stroke="white" stroke-width="${innerW.toFixed(
              2
            )}" stroke-linecap="round" stroke-linejoin="round" />`
          );
        }
      }

      x += info.advance;
      i += info.consumed;
      glyphOrdinal++;
      patternOrdinal++;
      weightOrdinal++;
      inWord = true;
    }
    if (inWord) wordOrdinal++;
    inWord = false;
    if (resetPatternPerWord) patternOrdinal = 0;
    if (weightResetPerWord) weightOrdinal = 0;
  }

  svg.push("</svg>");
  saveStrings(svg, "loop_text", "svg");
}
