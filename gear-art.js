'use strict';
(() => {
  const A = window.Art;
  const palettes = [
    { metal: '#b8c6c1', rim: '#785344', gem: '#f7b749' },
    { metal: '#fff9e9', rim: '#a77750', gem: '#91bd61' },
    { metal: '#8fc4d0', rim: '#f7b749', gem: '#76934b' },
    { metal: '#c2edf0', rim: '#659ca8', gem: '#bc83a0' }
  ];
  A.gearLook = p => {
    const weapon = Number((p.equipment?.weapon || 'warrior-0').split('-').pop()),
      armor = Number((p.equipment?.armor || 'armor-0').split('-').pop());
    return {
      weapon,
      armor,
      ...palettes[weapon],
      name: ['여행자', '단풍', '수호자', '수정 군주'][weapon],
      armorName: ['천 망토', '가죽 조끼와 머리띠', '수정 갑옷과 관'][armor]
    };
  };
  const poly = (c, points, fill, stroke = '#543929', width = 2) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  };
  const oval = (c, x, y, rx, ry, fill, stroke) => {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.stroke();
    }
  };
  const box = (c, x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  function weapon(c, p, g) {
    c.save();
    c.translate(13, -27);
    const tier = g.weapon,
      material = g.metal;
    if (p.job === 'archer') {
      c.strokeStyle = g.rim;
      c.lineWidth = 4 + tier;
      c.beginPath();
      c.arc(4, -8, 24 + tier * 2, -1.22, 1.22);
      c.stroke();
      c.strokeStyle = '#fff9e9';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(13, -33 - tier * 2);
      c.lineTo(p.attack > 0 ? -5 : 13, -8);
      c.lineTo(13, 17 + tier * 2);
      c.stroke();
      if (tier > 0) {
        poly(
          c,
          [
            [12, -34 - tier * 2],
            [20, -25],
            [12, -20],
            [5, -29]
          ],
          material
        );
        poly(
          c,
          [
            [12, 18 + tier * 2],
            [20, 8],
            [12, 3],
            [5, 12]
          ],
          material
        );
      }
      if (tier > 1) {
        oval(c, 29, -8, 5, 7, g.gem, g.rim);
        poly(
          c,
          [
            [26, -22],
            [38, -28],
            [32, -13]
          ],
          material
        );
      }
      box(c, -2, -9, 40, 2, g.rim);
      poly(
        c,
        [
          [36, -13],
          [45, -8],
          [36, -3]
        ],
        material
      );
    } else if (p.job === 'mage') {
      c.rotate(0.12);
      box(c, 6, -37 - tier * 3, 5, 58 + tier * 3, g.rim);
      if (tier < 2) oval(c, 8, -41 - tier * 3, 8 + tier * 3, 9 + tier * 3, g.gem, g.rim);
      else
        poly(
          c,
          [
            [8, -66 - tier * 2],
            [21, -48],
            [8, -31],
            [-5, -48]
          ],
          material,
          g.rim,
          3
        );
      oval(c, 7, -44 - tier * 3, 4 + tier, 6, g.gem);
      oval(c, 4, -48 - tier * 3, 2, 3, '#fff9e9');
      if (tier > 0) {
        poly(
          c,
          [
            [-4, -40],
            [-8, -55],
            [-2, -52],
            [1, -41],
            [15, -41],
            [20, -56],
            [25, -53],
            [20, -36]
          ],
          g.rim
        );
      }
      if (tier === 3) {
        oval(c, 8, -49, 18, 2, '#bc83a077');
        box(c, 0, -16, 18, 3, material);
      }
    } else {
      c.rotate(p.attack > 0 ? -1.05 : -0.23);
      const tip = -34 - tier * 7;
      poly(
        c,
        [
          [4, 2],
          [5, tip + 11],
          [10, tip],
          [16, tip + 11],
          [15, 2]
        ],
        material,
        g.rim
      );
      poly(
        c,
        [
          [10, tip],
          [11, 2],
          [7, 2]
        ],
        '#fff9e9',
        null
      );
      if (tier > 1) {
        poly(
          c,
          [
            [5, tip + 22],
            [-2, tip + 16],
            [4, tip + 6]
          ],
          material,
          g.rim
        );
        poly(
          c,
          [
            [15, tip + 22],
            [23, tip + 16],
            [16, tip + 6]
          ],
          material,
          g.rim
        );
      }
      box(c, -1, 0, 23, 4, g.rim);
      box(c, 7, 4, 6, 12, '#543929');
      oval(c, 10, 1, 3, 4, g.gem);
    }
    oval(c, 5, 7, 5, 5, '#ffd8ad', '#543929');
    c.restore();
  }
  A.player = (c, p, t) => {
    const g = A.gearLook(p),
      cape = p.job === 'archer' ? '#76934b' : p.job === 'mage' ? '#4779aa' : '#bd6137';
    c.save();
    c.translate(Math.round(p.x), Math.round(p.y));
    oval(c, 0, 0, 22, 4, '#352a2433');
    c.scale(p.dir || 1, 1);
    const step = p.grounded && Math.abs(p.vx) > 15 ? Math.sin(t * 15) * 4 : 0;
    c.translate(0, -Math.abs(step) * 0.3);
    poly(
      c,
      [
        [-11, -42],
        [-23, -20],
        [-28, -5],
        [-11, -9],
        [4, -19],
        [9, -39]
      ],
      cape
    );
    poly(
      c,
      [
        [-16, -34],
        [-23, -12],
        [-13, -17],
        [-7, -38]
      ],
      g.armor === 2 ? '#c2edf0' : '#f8d685',
      null
    );
    box(c, -11, -16, 9, 12 + step, '#543929');
    box(c, 3, -16, 9, 12 - step, '#543929');
    poly(
      c,
      [
        [-12, -7 + step],
        [-3, -7 + step],
        [0, 0],
        [-15, 0]
      ],
      g.armor === 2 ? '#659ca8' : '#785344'
    );
    poly(
      c,
      [
        [3, -7 - step],
        [12, -7 - step],
        [16, 0],
        [3, 0]
      ],
      g.armor === 2 ? '#659ca8' : '#785344'
    );
    poly(
      c,
      [
        [-13, -40],
        [11, -40],
        [15, -18],
        [8, -13],
        [-14, -17]
      ],
      g.armor === 0 ? '#fff9e9' : g.armor === 1 ? '#a77750' : '#8fc4d0'
    );
    if (g.armor === 1) {
      for (let y = -35; y < -18; y += 7) {
        box(c, -10, y, 21, 2, '#785344');
      }
      poly(
        c,
        [
          [-17, -39],
          [-7, -42],
          [-7, -31],
          [-20, -28]
        ],
        '#ca9968'
      );
    }
    if (g.armor === 2) {
      poly(
        c,
        [
          [-19, -42],
          [-9, -45],
          [-8, -30],
          [-24, -29]
        ],
        '#c2edf0'
      );
      poly(
        c,
        [
          [11, -43],
          [22, -37],
          [21, -27],
          [11, -30]
        ],
        '#c2edf0'
      );
      poly(
        c,
        [
          [-2, -34],
          [5, -38],
          [10, -30],
          [4, -23]
        ],
        '#bc83a0'
      );
    }
    box(c, -12, -20, 27, 4, '#543929');
    box(c, 0, -21, 5, 5, '#f7b749');
    oval(c, 0, -49, 18, 17, '#ffd8ad', '#543929');
    oval(c, 16, -45, 4, 5, '#ffd8ad', '#543929');
    poly(
      c,
      [
        [-18, -48],
        [-20, -60],
        [-13, -65],
        [-6, -63],
        [0, -69],
        [10, -64],
        [17, -58],
        [19, -51],
        [12, -55],
        [6, -50],
        [1, -55],
        [-7, -49],
        [-12, -55],
        [-14, -44]
      ],
      '#543929'
    );
    poly(
      c,
      [
        [-15, -59],
        [-6, -62],
        [3, -64],
        [10, -59],
        [0, -58],
        [-5, -54]
      ],
      '#a77750',
      null
    );
    box(c, 1, -49, 4, 7, '#543929');
    box(c, 11, -49, 3, 6, '#543929');
    box(c, 2, -49, 2, 2, '#fff9e9');
    box(c, 3, -39, 5, 2, '#bd6137');
    oval(c, -5, -42, 4, 2, '#e986a5');
    if (g.armor === 1) {
      poly(
        c,
        [
          [-18, -57],
          [17, -56],
          [17, -51],
          [-18, -52]
        ],
        '#ca9968'
      );
      box(c, -2, -57, 6, 6, '#f7b749');
    }
    if (g.armor === 2) {
      poly(
        c,
        [
          [-19, -55],
          [-23, -69],
          [-12, -61],
          [0, -73],
          [12, -61],
          [22, -69],
          [18, -55]
        ],
        '#c2edf0',
        '#659ca8'
      );
      poly(
        c,
        [
          [-4, -61],
          [0, -68],
          [5, -61],
          [0, -56]
        ],
        '#bc83a0'
      );
    }
    poly(
      c,
      [
        [-13, -37],
        [4, -34],
        [14, -38],
        [8, -30],
        [-7, -31]
      ],
      cape
    );
    oval(c, -14, -24, 5, 5, '#ffd8ad', '#543929');
    weapon(c, p, g);
    c.restore();
  };
  A.equipmentPreview = (canvas, p) => {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    oval(c, 80, 100, 70, 76, '#f1d39b55');
    c.save();
    c.translate(62, 174);
    c.scale(1.5, 1.5);
    A.player(c, { ...p, x: 0, y: 0, vx: 0, dir: 1, grounded: true, attack: 0, invuln: 0 }, 0);
    c.restore();
  };
})();
