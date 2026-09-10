(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const palettes = [
    ['#bd6137', '#df8b42', '#f1b75b', '#f8d685'],
    ['#76934b', '#91bd61', '#bad0ac', '#f8d685']
  ];
  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }
  function poly(c, p, color) {
    c.fillStyle = color;
    c.beginPath();
    p.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v)));
    c.closePath();
    c.fill();
  }
  function rand(n) {
    return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1) + 1;
  }
  function tree(c, x, y, s, seed, back = false) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    poly(
      c,
      [
        [-28, 0],
        [-19, -94],
        [-23, -174],
        [-44, -218],
        [-23, -210],
        [-8, -177],
        [2, -256],
        [13, -249],
        [13, -174],
        [38, -211],
        [50, -215],
        [20, -157],
        [26, -63],
        [41, 0]
      ],
      back ? '#90b7a1' : '#785344'
    );
    if (!back) {
      poly(
        c,
        [
          [-13, 0],
          [-9, -120],
          [-15, -182],
          [-4, -164],
          [3, -237],
          [8, -232],
          [5, -145],
          [15, -58],
          [22, 0]
        ],
        '#a77750'
      );
      c.strokeStyle = '#543929';
      c.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(-10 + i * 4, -20 - i * 22);
        c.lineTo(-6 + i * 3, -42 - i * 22);
        c.stroke();
      }
    }
    const colors = back
      ? ['#90b7a1', '#bad0ac', '#c2dfd9', '#bad0ac']
      : palettes[seed % 5 === 0 ? 1 : 0];
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 7; i++) {
        const a = i * 0.94 + seed,
          xx = Math.cos(a) * (72 - j * 19),
          yy = -215 + Math.sin(a) * 34 - j * 18;
        ellipse(c, xx, yy, 43 - j * 3, 34 - j * 2, colors[j]);
        if (!back) {
          poly(
            c,
            [
              [xx - 22, yy - 12],
              [xx - 15, yy - 21],
              [xx - 3, yy - 24],
              [xx + 8, yy - 20],
              [xx - 2, yy - 16],
              [xx - 7, yy - 8]
            ],
            colors[Math.min(j + 1, 3)]
          );
        }
      }
    if (!back)
      for (let i = 0; i < 22; i++) {
        const xx = (rand(seed + i) - 1.5) * 148,
          yy = -195 - (rand(i + seed * 3) - 1) * 79;
        c.fillStyle = i % 2 ? '#f8d685' : '#bd6137';
        c.fillRect(xx, yy, 4, 3);
      }
    c.restore();
  }
  function house(c, x, y) {
    c.save();
    c.translate(x, y);
    ellipse(c, 0, -2, 87, 10, '#78534433');
    poly(
      c,
      [
        [-57, -5],
        [-54, -99],
        [50, -99],
        [58, -5]
      ],
      '#ffd8ad'
    );
    poly(
      c,
      [
        [31, -98],
        [50, -98],
        [58, -5],
        [31, -5]
      ],
      '#ca9968'
    );
    c.strokeStyle = '#a77750';
    c.lineWidth = 3;
    for (let i = -39; i < 49; i += 19) {
      c.beginPath();
      c.moveTo(i, -86);
      c.lineTo(i, -5);
      c.stroke();
    }
    poly(
      c,
      [
        [-85, -92],
        [-75, -116],
        [-44, -142],
        [-9, -157],
        [25, -150],
        [59, -132],
        [85, -105],
        [86, -90],
        [65, -80],
        [-64, -80]
      ],
      '#785344'
    );
    poly(
      c,
      [
        [-81, -97],
        [-72, -116],
        [-42, -140],
        [-9, -152],
        [25, -145],
        [58, -128],
        [81, -102],
        [80, -94],
        [60, -87],
        [-62, -87]
      ],
      '#bd6137'
    );
    poly(
      c,
      [
        [-69, -115],
        [-40, -139],
        [-9, -150],
        [25, -143],
        [50, -131],
        [15, -137],
        [-14, -140],
        [-40, -130]
      ],
      '#df8b42'
    );
    ellipse(c, -42, -119, 16, 10, '#fff9e9');
    ellipse(c, 16, -139, 13, 8, '#fff9e9');
    ellipse(c, 54, -108, 14, 9, '#fff9e9');
    ellipse(c, -3, -97, 11, 6, '#f8d685');
    c.fillStyle = '#785344';
    c.beginPath();
    c.roundRect(-18, -56, 37, 56, [18, 18, 0, 0]);
    c.fill();
    c.fillStyle = '#a77750';
    c.beginPath();
    c.roundRect(-13, -51, 27, 50, [14, 14, 0, 0]);
    c.fill();
    c.fillStyle = '#f7b749';
    c.fillRect(7, -25, 4, 4);
    ellipse(c, -38, -56, 12, 14, '#785344');
    ellipse(c, -38, -56, 9, 11, '#8fc4d0');
    c.fillStyle = '#fff9e9';
    c.fillRect(-39, -66, 2, 20);
    c.fillRect(-46, -57, 16, 2);
    c.fillStyle = '#785344';
    c.fillRect(-28, -4, 56, 5);
    c.fillStyle = '#ca9968';
    c.fillRect(-32, 1, 64, 5);
    c.restore();
  }
  function flower(c, x, y, seed) {
    c.fillStyle = '#76934b';
    c.fillRect(x, y - 13, 2, 13);
    poly(
      c,
      [
        [x, y - 4],
        [x - 6, y - 9],
        [x - 7, y - 5]
      ],
      '#91bd61'
    );
    const color = seed % 3 === 0 ? '#e986a5' : '#fff9e9';
    ellipse(c, x - 3, y - 14, 3, 3, color);
    ellipse(c, x + 3, y - 14, 3, 3, color);
    ellipse(c, x, y - 18, 3, 3, color);
    ellipse(c, x, y - 11, 3, 3, color);
    ellipse(c, x, y - 14, 2, 2, '#f7b749');
  }
  const trees = [];
  for (let i = 0; i < 20; i++)
    trees.push({ x: i * 249 + 60, y: 609, s: 0.85 + rand(i) * 0.25, seed: i });
  let farLayer = null,
    midLayer = null;
  function layers() {
    if (farLayer) return;
    farLayer = document.createElement('canvas');
    farLayer.width = 2200;
    farLayer.height = 720;
    const f = farLayer.getContext('2d');
    poly(
      f,
      [
        [0, 445],
        [0, 365],
        [160, 286],
        [260, 336],
        [421, 249],
        [605, 330],
        [747, 293],
        [952, 382],
        [1180, 263],
        [1330, 337],
        [1538, 254],
        [1777, 369],
        [1948, 285],
        [2200, 371],
        [2200, 610],
        [0, 610]
      ],
      '#bad0ac'
    );
    poly(
      f,
      [
        [0, 480],
        [0, 414],
        [197, 346],
        [365, 411],
        [521, 351],
        [675, 450],
        [889, 345],
        [1100, 423],
        [1255, 353],
        [1459, 448],
        [1620, 362],
        [1777, 450],
        [1940, 367],
        [2200, 430],
        [2200, 610],
        [0, 610]
      ],
      '#90b7a1'
    );
    for (let i = 0; i < 22; i++) tree(f, i * 107, 570, 0.5 + (i % 3) * 0.09, i, true);
    midLayer = document.createElement('canvas');
    midLayer.width = 5200;
    midLayer.height = 720;
    const m = midLayer.getContext('2d');
    trees.forEach(v => tree(m, v.x, v.y, v.s, v.seed));
    house(m, 165, 610);
    house(m, 336, 610);
    for (let i = 0; i < 90; i++) {
      const x = i * 61;
      ellipse(m, x, 600, 35, 15, i % 3 ? '#91bd61' : '#76934b');
      ellipse(m, x - 9, 590, 19, 13, '#bad0ac');
    }
  }
  Art.background = (c, camera, t, w, h) => {
    layers();
    const cam = typeof camera === 'number' ? camera : camera.x || 0;
    const sky = c.createLinearGradient(0, 0, 0, 610);
    sky.addColorStop(0, '#c2dfd9');
    sky.addColorStop(0.67, '#f8e9b7');
    sky.addColorStop(1, '#f8d685');
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    const sun = c.createRadialGradient(900 - cam * 0.1, 151, 10, 900 - cam * 0.1, 151, 200);
    sun.addColorStop(0, '#fff9e9bb');
    sun.addColorStop(1, '#fff9e900');
    c.fillStyle = sun;
    c.fillRect(0, 0, w, 420);
    ellipse(c, 900 - cam * 0.1, 151, 39, 39, '#fff9e9');
    for (let i = 0; i < 7; i++) {
      const x = i * 319 - cam * 0.08;
      ellipse(c, x, 139 + (i % 3) * 45, 85, 16, '#fff9e977');
      ellipse(c, x + 18, 126 + (i % 3) * 45, 38, 22, '#fff9e977');
    }
    c.drawImage(farLayer, -cam * 0.22, 0);
    c.globalAlpha = 0.84;
    c.drawImage(midLayer, -cam * 0.72, 0);
    c.globalAlpha = 1;
    const haze = c.createLinearGradient(0, 420, 0, 610);
    haze.addColorStop(0, '#f8e9b700');
    haze.addColorStop(1, '#f8e9b755');
    c.fillStyle = haze;
    c.fillRect(0, 420, w, 190);
    c.fillStyle = '#a77750';
    c.fillRect(0, 610, w, h - 610);
    c.fillStyle = '#ca9968';
    c.fillRect(0, 625, w, 14);
    for (let i = Math.floor(cam / 31); i < (cam + w) / 31; i++) {
      c.fillStyle = i % 2 ? '#785344' : '#ca9968';
      c.fillRect(i * 31 - cam, 651 + (i % 4) * 16, 12, 4);
    }
    c.fillStyle = '#76934b';
    c.fillRect(0, 606, w, 13);
    c.fillStyle = '#bad0ac';
    c.fillRect(0, 605, w, 4);
    for (let i = Math.floor(cam / 17); i < (cam + w) / 17; i++) {
      c.fillStyle = '#76934b';
      c.fillRect(i * 17 - cam, 615, 8, 5 + (i % 4));
    }
  };
  Art.foreground = (c, camera, t, w) => {
    const cam = typeof camera === 'number' ? camera : camera.x || 0;
    for (let i = Math.max(0, Math.floor(cam / 71)); i < (cam + w) / 71 + 1; i++) {
      let x = i * 71 + 13;
      flower(c, x, 606, i);
      if (i % 3 === 0) {
        c.fillStyle = '#ffd8ad';
        c.fillRect(x + 17, 598, 4, 8);
        ellipse(c, x + 19, 597, 8, 4, '#bd6137');
        ellipse(c, x + 17, 596, 2, 1, '#fff9e9');
      }
    }
    if (!reduce.matches)
      for (let i = 0; i < 16; i++) {
        const x = cam + ((i * 191 + t * (9 + (i % 3))) % (w + 100)) - 50,
          y = (i * 83 + t * (12 + (i % 5))) % 610;
        c.save();
        c.translate(x, y);
        c.rotate(Math.sin(t + i) * 0.8);
        poly(
          c,
          [
            [0, -5],
            [5, -2],
            [3, 3],
            [0, 5],
            [-4, 1],
            [-3, -3]
          ],
          i % 2 ? '#df8b42' : '#f8d685'
        );
        c.restore();
      }
  };
})();
