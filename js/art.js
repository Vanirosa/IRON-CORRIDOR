/* 原创俯视矢量绘制。装备的 +X 方向为车头或炮口。 */
(() => {
  const { map, towers, enemies, works, support } = IronData;
  const TAU = Math.PI * 2;
  const rect = (c, x, y, w, h, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, h); };
  function box(c, x, y, w, h, r, fill, stroke) {
    c.beginPath(); c.roundRect(x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }
  function poly(c, points, fill, stroke) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
  }
  function ring(c, x, y, r, stroke, width = 1, fill) {
    c.beginPath(); c.arc(x, y, r, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(c, points, stroke, width = 1) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = stroke; c.lineWidth = width; c.stroke();
  }
  function label(c, value, x, y, color, size = 11, align = 'left') {
    c.fillStyle = color; c.textAlign = align;
    c.font = '600 ' + size + 'px Consolas, "Microsoft YaHei", monospace';
    c.fillText(value, x, y);
  }
  function shade(c, x, y, w, h, light, dark) {
    const gradient = c.createLinearGradient(x, y, x + w * .24, y + h);
    gradient.addColorStop(0, light); gradient.addColorStop(1, dark);
    return gradient;
  }

  function panel(c,x,y,w,h,fill,edge,frame) {
    box(c,x,y,w,h,.9,fill,frame);
    line(c,[[x+.8,y+h-.8],[x+.8,y+.7],[x+w-.8,y+.7]],edge,.7);
    for (const dx of [1.6,w-1.6]) for (const dy of [1.6,h-1.6]) {
      ring(c,x+dx,y+dy,.43,null,1,edge);
    }
  }

  function grille(c,x,y,w,h,edge,slots = 5) {
    box(c,x,y,w,h,.8,'#293333','#303f40');
    for (let i=1;i<=slots;i++) {
      const slot = x + i*w/(slots+1);
      line(c,[[slot,y+.9],[slot,y+h-.8]],edge,.65);
    }
  }

  function hatch(c,x,y,r,fill,edge,frame) {
    ring(c,x,y,r,frame,.85,fill);
    c.beginPath(); c.arc(x,y,r-.8,Math.PI,Math.PI*1.63);
    c.strokeStyle=edge; c.lineWidth=.74; c.stroke();
    line(c,[[x-r*.44,y+.4],[x+r*.47,y+.4]],frame,1);
    rect(c,x-r*.76,y+r*.33,r*.35,r*.40,edge);
  }

  function optic(c,x,y,w,h,frame,glint = '#a2c3bc') {
    box(c,x,y,w,h,.7,frame,'#293638');
    rect(c,x+.7,y+.65,w-1.4,h-1.3,'#314c54');
    line(c,[[x+1.1,y+1],[x+w-1.2,y+1]],glint,.65);
  }

  function chassis(c, shape, colors) {
    const { body, edge, dark } = colors;
    if (shape === 'truck' || shape === 'truck8' || shape === 'stryk') {
      const wheels = shape === 'stryk' || shape === 'truck8' ? [-17, -7, 5, 15] : [-17, -8, 14];
      for (const x of wheels) for (const y of [-13, 8]) {
        box(c, x - 3, y, 7, 5, 1.5, '#10171b', '#222e32');
        rect(c,x-1.9,y+.7,1.2,3.7,'#4e5958');
        rect(c,x+1.8,y+.7,.65,3.7,'#384343');
        ring(c,x+.25,y+2.5,.92,'#18262a',.55,'#65706b');
      }
      poly(c, [[-20,-9],[13,-10],[21,-6],[21,6],[13,10],[-20,9]], body, dark);
      panel(c,8,-7,9.8,14,edge,'#b1bbb0',dark);
      optic(c,13.4,-5.9,3.7,5.6,'#71888b');
      optic(c,13.4,.35,3.7,5.6,'#71888b');
      panel(c,-17,-7,15,14,dark,'#7d8e83','#31433f');
      rect(c,18.2,-5,.8,10,'#5e716a');
      rect(c, 19, -6, 1.5, 3, '#e5d99e'); rect(c, 19, 3, 1.5, 3, '#e5d99e');
    } else if (shape === 'track') {
      for (const y of [-13, 8]) {
        box(c, -19, y, 37, 5, 1, '#14191c', '#30383a');
        line(c,[[-17,y+.7],[17,y+.7]],'#58615b',.7);
        for (let x=-16;x<18;x+=3.4) {
          rect(c,x,y+1.15,.84,2.9,'#53605a');
          rect(c,x+.9,y+2.9,1.2,.55,'#292f30');
        }
      }
      poly(c, [[-18,-9],[14,-9],[20,-6],[20,6],[14,9],[-18,9]], body, dark);
      grille(c,-15,-6.8,9,13.6,edge,4);
      line(c,[[-18,-8.1],[14,-8.1],[19,-5]],edge,.82);
      for (const y of [-9,7.3]) for (const x of [-13,-5,3,11]) {
        line(c,[[x,y],[x+.65,y+1.5]],dark,.75);
      }
      rect(c,17.3,-4.7,1.6,1.1,'#e2d2ac');
      rect(c,17.3,3.6,1.6,1.1,'#e2d2ac');
    }
  }

  function barrel(c, from, to, y, width, fill, edge) {
    box(c,from,y-width/2,to-from,width,.8,fill,'#283941');
    line(c,[[from+.9,y-width*.29],[to-2,y-width*.29]],edge,.72);
    box(c,from+1,y-width*.68,Math.min(5,(to-from)*.28),width*1.36,.55,'#7d8c86','#394e50');
    box(c,to-3.8,y-width*.64,3.8,width*1.28,.55,'#526a72','#31454d');
    line(c,[[to-1.1,y-width*.37],[to-1.1,y+width*.37]],'#243135',.8);
  }

  function pod(c, x, y, length, width, fill, channels, edge) {
    box(c,x,y,length,width,1.5,fill,'#344649');
    for (let i = 1; i < channels; i++) {
      const v = y + width * i / channels;
      line(c,[[x+2,v],[x+length-2,v]],'#40555d',.8);
    }
    line(c,[[x+1.2,y+1],[x+length-1.4,y+1]],edge,.7);
    line(c,[[x+4,y+1.6],[x+4,y+width-1.2]],'#516464',.9);
    for (let i=0;i<channels;i++) {
      const v=y+width*(i+.5)/channels;
      ring(c,x+length-2.2,v,Math.min(1.23,width/channels*.28),edge,.6,'#29383a');
    }
    rect(c,x+1.6,y+width*.44,1.7,width*.13,edge);
  }

  function antenna(c, x, y, width, height, accent) {
    box(c,x,y,width,height,1.5,'#7c859e','#3a435b');
    for (let i=2;i<width-1;i+=3) line(c,[[x+i,y+2],[x+i,y+height-2]],'#484e68',.8);
    for (let i=3;i<height-1;i+=4) line(c,[[x+1,y+i],[x+width-1,y+i]],'#b6bbcd88',.7);
    rect(c,x+width-2,y+1,1,height-2,accent);
    line(c,[[x+.9,y+1],[x+.9,y+height-1]],'#c1c2d1',.75);
    for (const dy of [2.1,height-2.1]) ring(c,x+width*.47,y+dy,.85,'#49465e',.55,'#ddd2ed');
  }

  function gunVariant(c, level, colors, accent) {
    const {body,edge,dark} = colors;
    if (level === 2) {
      box(c,-15,-11,25,22,2,body,dark);
      box(c,-13,4,14,10,1,'#718578',dark);
      for (const x of [-11,-7,-3]) rect(c,x,6,1,5,'#394e47');
      panel(c,-3,-6,14,11,'#a7b6a3',edge,dark);
      grille(c,-12,5.2,9,6.3,'#91aa96',3);
      optic(c,-6,-8.2,5.7,3.6,'#667e70');
      barrel(c,8,33,-1,3.3,edge,accent);
    } else if (level === 3) {
      poly(c,[[-17,-11],[-4,-14],[9,-11],[15,-3],[11,8],[1,13],[-15,9]],body,dark);
      poly(c,[[-13,-9],[0,-10],[10,-6],[6,2],[-10,4]],'#9eb19c',dark);
      hatch(c,-8,5,4.5,'#b7c6ae',edge,dark);
      optic(c,3,4,7,4,'#567776');
      panel(c,-12,-8.2,7,4.8,'#849887',edge,dark);
      barrel(c,9,37,0,4.3,edge,accent);
    } else {
      poly(c,[[-20,-9],[-12,-13],[9,-12],[16,-6],[14,8],[4,14],[-18,10]],body,dark);
      box(c,-17,-10,15,10,1.5,'#a1b3a2',dark);
      box(c,-15,2,16,9,1,'#526961',dark);
      box(c,-1,-6,17,9,2,'#a8baa9',dark);
      line(c,[[-17,-9],[-3,-9],[-3,-3]],accent,1.2);
      optic(c,5,5,6,4,'#668079');
      hatch(c,-11,-4.7,3.45,'#aab9a8',edge,dark);
      grille(c,-13,3.7,10,5.7,'#8a9e8f',4);
      barrel(c,12,41,-2,5.3,edge,accent);
      box(c,25,-5.4,5,6.8,1,'#647d75',dark);
    }
  }

  function artilleryVariant(c, level, colors, accent) {
    const {body,edge,dark} = colors;
    chassis(c,'track',colors);
    if (level === 2) {
      box(c,-17,-11,26,22,3,body,dark);
      panel(c,-14,-9,19,17,'#8a9481',edge,dark);
      grille(c,-12.7,-6.7,6.5,12.6,'#aab19b',3);
      hatch(c,1,-4,3,'#a8b39e',edge,dark);
      optic(c,2.3,3,4.5,3.7,'#6a7d72');
      barrel(c,6,32,0,4.8,edge,accent);
    } else if (level === 3) {
      poly(c,[[-18,-9],[-12,-12],[4,-11],[12,-6],[12,6],[5,11],[-15,10]],body,dark);
      poly(c,[[-16,-7],[-10,-9],[4,-8],[7,-5],[3,3],[-13,5]],'#a2aa94',dark);
      panel(c,-16,4,8,5,'#526860',edge,dark);
      for (const y of [-6.4,-1.4]) panel(c,-13.8,y,7.7,4.4,'#899d89',edge,dark);
      hatch(c,2,5,3.5,'#aeb9a8',edge,dark);
      optic(c,5,-7,4.6,3.4,'#768f80');
      barrel(c,8,37,0,5,edge,accent);
      box(c,16,-4,7,8,1,'#728b7e',dark);
    } else {
      poly(c,[[-20,-11],[-14,-15],[7,-13],[15,-7],[15,8],[9,13],[-18,12]],body,dark);
      grille(c,-16,-10,18,8,'#94a797',6);
      panel(c,-15,1,24,9,'#aeb5a0',edge,dark);
      line(c,[[-10,2],[-10,9]],dark,.85);
      hatch(c,-2,5,3,'#8c9c88',edge,dark);
      optic(c,5,-8,5.8,3.5,'#617a6d');
      barrel(c,11,42,0,5.5,edge,accent);
      box(c,37,-4.7,6,9.4,1,'#64766e',dark);
      line(c,[[-17,10],[-10,10]],accent,1.2);
    }
  }

  function airGunVariant(c, level, colors, accent) {
    const {body,edge,dark} = colors;
    if (level === 2) {
      chassis(c,'track',colors);
      ring(c,-2,0,12,dark,1,body);
      for (const y of [-11,11]) {
        panel(c,-6,y-3.5,15,7,body,edge,dark);
        grille(c,-5.1,y-2.25,5.2,4.5,'#91abb0',3);
        barrel(c,7,34,y,3.2,edge,accent);
      }
      antenna(c,-16,-8,5,16,accent);
      hatch(c,-5,0,3.4,'#97b1b8',edge,dark);
      optic(c,4.1,-3.5,5.8,7,'#7894a1');
    } else if (level === 3) {
      poly(c,[[-18,-8],[-9,-14],[4,-12],[14,-7],[16,1],[10,10],[-10,13],[-17,9]],body,dark);
      poly(c,[[-12,-6],[-4,-9],[9,-6],[11,2],[2,5],[-13,5]],'#92b0b9',dark);
      for (const [x,y] of [[-13,-7],[-14,5],[5,-7],[6,6]]) optic(c,x,y,6,4,'#527987',accent);
      grille(c,-10.7,-2.4,8.5,5.4,'#95acb6',4);
      panel(c,1.2,-2.8,10.7,5.6,'#a2b9bd',edge,dark);
      barrel(c,10,35,0,4.2,edge,accent);
    } else {
      for (const y of [-13,7]) box(c,-16,y,26,6,1,'#5b7781',dark);
      ring(c,-4,0,13,dark,1,body);
      panel(c,-14,-6,19,12,'#9cb6bd',edge,dark);
      grille(c,-12,-3.8,8.7,7.6,'#7897a2',5);
      panel(c,1,-5,15,10,body,edge,dark);
      optic(c,0,-12,9,6,'#4d6d7d',accent);
      panel(c,0,7,9,6,'#5f7e8b',edge,dark);
      barrel(c,11,39,0,4.8,edge,accent);
    }
  }

  function missileVariant(c, level, colors, accent) {
    const {body,edge,dark} = colors;
    if (level === 2) {
      chassis(c,'stryk',colors);
      poly(c,[[-10,-6],[3,-7],[10,-3],[7,6],[-9,7]],body,dark);
      pod(c,-13,-11,18,6,body,2,accent);
      optic(c,-8,7,11,5,'#45667a',accent);
      hatch(c,-4,-1.8,2.9,'#9fb4bb',edge,dark);
      optic(c,3.1,3.2,5.4,4.8,'#638591');
      barrel(c,5,23,0,2.1,edge,'#c4d7e1');
    } else if (level === 3) {
      box(c,-21,-11,37,22,2,'#4d6372',dark);
      line(c,[[-20,-10],[-20,10],[16,10]],'#a5bbc6',1.2);
      for (const y of [-12,1]) pod(c,-16,y,29,11,body,3,accent);
      line(c,[[-16,0],[13,0]],'#a5c0c5',1.05);
      for (const x of [-19,17]) for (const y of [-14,10]) {
        panel(c,x-2,y,4,4,'#829ca7',edge,dark);
        ring(c,x,y+2,.8,dark,.7,'#9bb4b8');
      }
    } else {
      chassis(c,'truck8',colors);
      for (const x of [-17,3]) for (const y of [-15,9]) box(c,x-3,y,6,6,1,edge,dark);
      box(c,-17,-10,21,20,2,'#5e7888',dark);
      for (const x of [-14,-5]) for (const y of [-8,-4,0,4]) {
        box(c,x,y,7,4,.7,'#a8bccb',dark);
        line(c,[[x+.65,y+.6],[x+5.8,y+.6]],edge,.65);
        ring(c,x+3.5,y+2,1.05,dark,.65,'#637e8d');
        rect(c,x+5.45,y+1.3,.8,1.3,accent);
      }
    }
  }

  function rocketVariant(c, level, colors, accent) {
    const {body,edge,dark} = colors;
    if (level === 2) {
      chassis(c,'track',colors);
      for (const y of [-11,1]) pod(c,-20,y,24,10,body,3,accent);
      rect(c,-20,-1,24,2,'#354646');
      panel(c,8,-7,9,14,'#9ea791',edge,dark);
      for (const y of [-5.6,.3]) optic(c,13,y,3.1,5.2,'#6b8477');
      hatch(c,9.5,-3,1.6,'#778b7d',edge,dark);
    } else if (level === 3) {
      chassis(c,'truck8',colors);
      for (const y of [-12,1]) {
        poly(c,[[-20,y+3],[-17,y],[3,y],[7,y+4],[6,y+10],[-20,y+10]],body,dark);
        for (const dy of [3,6,9]) line(c,[[-16,y+dy],[4,y+dy]],'#4a5d52',.9);
        line(c,[[-16,y+1.8],[2.2,y+1.8],[4.9,y+4.1]],edge,.74);
        rect(c,-18,y+2,2,7,accent);
        for (const d of [3.1,7.2]) ring(c,4.6,y+d,.92,edge,.65,'#394944');
      }
      panel(c,12,-6,7,12,'#698784',edge,dark);
      optic(c,16.4,-4.6,2.4,9.2,'#77938a');
    } else {
      chassis(c,'truck8',colors);
      for (const y of [-10,-4,2,8]) {
        box(c,-21,y,30,4.7,2,'#748577',dark);
        rect(c,-18,y+.7,23,1.1,edge);
        ring(c,-20,y+2.3,2,dark,.7,'#34403e');
      }
      for (const x of [-14,1]) {
        box(c,x,-12,4,26,1,body,dark);
        line(c,[[x+1,-11],[x+1,13]],edge,.65);
      }
      rect(c,2,-10,1,22,accent);
      panel(c,11,-7,9,14,'#748785',edge,dark);
      for (const y of [-5.6,.3]) optic(c,16.2,y,3.3,5.2,'#81968e');
    }
  }

  function radarVariant(c, level, colors, accent, time) {
    const {body,edge,dark} = colors;
    if (level === 2) {
      chassis(c,'truck',colors);
      panel(c,-19,-9,25,18,body,edge,dark);
      grille(c,-17,-7,10,13.5,'#97a9b1',4);
      panel(c,-4.8,-6.2,8.9,12.4,'#6f8191',edge,dark);
      hatch(c,-4,0,4.8,'#a5a8bf',edge,dark);
      c.rotate(time*.85);
      antenna(c,-8,-17,7,34,accent);
      line(c,[[-1,-10],[8,0],[-1,10]],'#a5aabc',1.8);
    } else if (level === 3) {
      panel(c,-19,-11,30,22,body,edge,dark);
      grille(c,-17.1,-8.8,8.5,17.5,'#93aab7',4);
      for (const x of [-16,9]) for (const y of [-15,11]) {
        panel(c,x-2,y,5,4,'#829aa9',edge,dark);
        line(c,[[x+.1,y+1],[x+.1,y+3]],dark,.85);
      }
      c.rotate(time*.58);
      antenna(c,-5,-19,9,38,accent);
      line(c,[[4,-16],[14,-5],[14,5],[4,16],[4,-16],[14,5],[14,-5],[4,16]],'#a6afc4',1.4);
    } else {
      panel(c,-23,-12,44,24,body,edge,dark);
      grille(c,-21,-8,6,16,'#9babbb',3);
      for (const x of [-17,-9,11]) for (const y of [-14,10]) panel(c,x,y,6,4,'#465366',edge,dark);
      poly(c,[[-16,-9],[5,-11],[13,0],[5,11],[-16,9]],'#67748d',dark);
      line(c,[[-15,-8],[4,-9],[12,0]],edge,.8);
      antenna(c,5,-18,9,36,accent);
      for (const [y,angle] of [[-10,-.57],[10,.57]]) {
        c.save(); c.translate(-10,y); c.rotate(angle);
        antenna(c,-4,-8,6,16,accent); c.restore();
      }
      line(c,[[-20,0],[4,0]],'#bac0cf',1.5);
    }
  }

  const variantArt = { bushmaster: gunVariant, paladin: artilleryVariant, phalanx: airGunVariant, avenger: missileVariant, himars: rocketVariant, sentinel: radarVariant };

  function ultimateTower(c,key,accent) {
    const body = shade(c,-25,-16,49,32,'#a7b4b1','#3d5058');
    const edge = '#bac9c3', dark = '#263a42';
    const colors = { body, edge, dark };
    if (key === 'bushmaster') {
      poly(c,[[-22,-10],[-11,-16],[10,-13],[18,-6],[18,6],[10,13],[-11,16],[-22,10]],body,dark);
      for (const y of [-7,7]) {
        panel(c,-18,y-5,20,10,'#697f75',edge,dark);
        grille(c,-16.7,y-3.4,9.6,6.8,'#a2b6a7',4);
        panel(c,1,y-4.6,14,9.2,body,edge,dark);
        rect(c,6,y-3.2,3.2,1,accent);
        barrel(c,12,43,y,4.2,edge,accent);
      }
      panel(c,-9,-3,18,6,'#294a4b',accent,dark);
      optic(c,3.3,-2,5,4,'#638f86',accent);
    } else if (key === 'paladin') {
      chassis(c,'track',colors);
      poly(c,[[-24,-12],[-18,-17],[7,-15],[15,-10],[15,10],[7,15],[-18,17],[-24,12]],body,dark);
      for (const y of [-8,8]) {
        panel(c,-19,y-5.8,29,11.6,body,edge,dark);
        panel(c,-5,y-4.5,16,9,'#718982',edge,dark);
        hatch(c,-13,y,3.05,'#87998e',edge,dark);
        line(c,[[0,y-3.5],[8,y-3.5]],accent,.8);
        barrel(c,8,46,y,5.8,edge,accent);
        box(c,40,y-4.4,6,8.8,.9,'#687e7b',dark);
      }
      grille(c,-20,-2.6,16,5.2,'#91a99e',6);
      optic(c,-3.5,-2.1,6.2,4.2,'#6f8a83',accent);
    } else if (key === 'phalanx') {
      poly(c,[[-20,-16],[6,-16],[16,-8],[16,8],[6,16],[-20,16],[-25,0]],body,dark);
      for (const y of [-11,0,11]) {
        panel(c,-9,y-4.6,20,9.2,'#86a1aa',edge,dark);
        grille(c,-8.1,y-2.8,7.7,5.5,'#8da9b3',3);
        barrel(c,7,y === 0 ? 43 : 40,y,3.7,edge,accent);
      }
      antenna(c,-19,-9,7,18,accent);
      optic(c,-5,-2.5,7,5,'#355e71',accent);
      line(c,[[-19,-12],[-12,-12],[-10,-8]],'#adc2c7',.88);
    } else if (key === 'avenger') {
      chassis(c,'truck8',colors);
      for (const y of [-15,9]) {
        box(c,-20,y,6,6,1,edge,dark);
        box(c,5,y,6,6,1,edge,dark);
      }
      poly(c,[[-24,-11],[-17,-16],[6,-16],[12,-11],[12,11],[6,16],[-17,16],[-24,11]],'#526877',dark);
      for (const x of [-18,-8,2]) for (const y of [-11,-5.5,0,5.5]) {
        box(c,x,y,8,5,.8,'#a3bdca',dark);
        ring(c,x+3.3,y+2.5,1.45,edge,.7,'#567482');
        line(c,[[x+1,y+.65],[x+7,y+.65]],edge,.65);
        rect(c,x+6.2,y+1.65,.9,1.5,accent);
      }
      panel(c,13,-5,6,10,'#466776',edge,dark);
      for (const y of [-3.9,.35]) optic(c,15,y,3.4,3.55,'#708f9e',accent);
    } else if (key === 'himars') {
      chassis(c,'truck8',colors);
      poly(c,[[-25,-16],[5,-17],[15,-10],[15,10],[5,17],[-25,16]],'#516762',dark);
      for (const y of [-12,0,12]) {
        pod(c,-24,y-4.8,37,9.6,body,3,accent);
        grille(c,-21,y-3.1,6,6.2,'#8da497',3);
        line(c,[[.6,y-3.8],[.6,y+3.8]],'#9eb0a6',1);
        for (const dy of [-2.7,0,2.7]) ring(c,10,y+dy,1.02,edge,.6,'#242f30');
      }
      panel(c,14,-5,6,10,'#657a77',edge,dark);
      for (const y of [-4.1,.5]) optic(c,16.25,y,3.15,3.7,'#728e84',accent);
    } else {
      poly(c,[[-22,-13],[0,-19],[22,-13],[23,12],[0,19],[-23,12]],body,dark);
      ring(c,0,0,7,dark,1,'#636e85');
      for (const angle of [0,TAU/3,2*TAU/3]) {
        c.save(); c.rotate(angle);
        poly(c,[[1,-6],[14,-12],[14,12],[1,6]],'#596477',dark);
        line(c,[[2,-4.1],[10,-8.5],[10,8.5],[2,4.1]],'#a6afc1',1);
        grille(c,6.4,-3.2,4.7,6.4,'#9caac3',2);
        antenna(c,12,-12,6,24,accent);
        rect(c,3,-.7,5.3,1.4,accent);
        c.restore();
      }
      ring(c,0,0,3.2,dark,1,'#e5c8ff');
    }
  }

  function atgmTower(c,level,accent) {
    const body = shade(c,-22,-13,44,26,'#b6b79e','#657765');
    const dark = '#344847', edge = '#c5cbbb';
    if (level > 1) chassis(c,level === 3 ? 'truck' : 'truck8',{ body,edge,dark });
    if (level === 1) {
      for (const [x,y] of [[-13,-11],[-13,11],[10,0]]) {
        line(c,[[0,0],[x,y]],'#718781',2.8);
        ring(c,x,y,2.4,dark,.8,edge);
      }
      panel(c,-10,-7,12,14,body,edge,dark);
      barrel(c,-10,22,0,5.8,edge,accent);
      optic(c,-4,4,9,5,'#86998a');
    } else {
      const heavy = level >= 4;
      panel(c,-17,-12,25,24,body,edge,dark);
      for (const y of [heavy ? -12 : -9,heavy ? 3 : 2]) {
        const width = heavy ? 9 : 6.8;
        pod(c,-13,y,level === 5 ? 32 : 26,width,body,level === 2 ? 1 : level === 3 ? 2 : 3,accent);
        if (heavy) grille(c,-12,y+1.3,6,width-2.4,edge,3);
      }
      optic(c,-2,-2.9,7,5.5,'#81968d',accent);
      hatch(c,13,4.3,2.7,body,edge,dark);
    }
  }

  function tower(c, key, x, y, angle, size = 1, time = 0, level = 1) {
    const accent = towers[key].color;
    c.save(); c.translate(x, y); c.scale(size, size);
    ring(c, 1.8, 3, 22, null, 1, '#09151bbb');
    ring(c, 0, 0, 21, '#384d57', 1, '#1b2c32');
    ring(c,0,0,17.5,'#4a6269',.7,'#283c43');
    ring(c,0,0,19.2,'#58717865',.65);
    for (let i=0;i<8;i++) {
      const a=i*TAU/8+.38, r=i%2 ? 17.8 : 19.2;
      ring(c,Math.cos(a)*r,Math.sin(a)*r,i%2 ? .72 : 1.06,'#182a32',.52,'#8ba19b');
    }
    c.rotate(angle);
    const metal = shade(c, -20, -13, 40, 26, '#a6b2a4', '#536a62');
    const steel = shade(c, -20, -13, 40, 26, '#a9bdc4', '#4b6774');
    if (key === 'atgm') {
      atgmTower(c,level,accent);
    } else if (level === 5) {
      ultimateTower(c,key,accent);
    } else if (level > 1) {
      const cool = ['phalanx','avenger','sentinel'].includes(key);
      variantArt[key](c,level,cool
        ? { body: steel, edge: '#b0c4ce', dark: '#354b58' }
        : { body: metal, edge: '#aebcaa', dark: '#3a504c' },accent,time);
    } else if (key === 'paladin') {
      chassis(c, 'track', { body: metal, dark: '#354b46', edge: '#a4af9b' });
      panel(c,-10,-8.5,22,17,metal,'#b3c1ab','#3b534d');
      panel(c,5,-4.3,8,8.6,'#b8bead','#d0d4c1','#455851');
      barrel(c,10,33,0,4.1,'#aab9ae',accent);
      hatch(c,-3.8,2.9,3.05,'#9bac98','#c3ceba','#50625a');
      grille(c,-8.3,-6.8,6.9,5.4,'#8d9f91',3);
      optic(c,2.1,-7.7,4.9,3.35,'#738d80');
      rect(c,-9,5.4,2.3,1.3,accent);
    } else if (key === 'bushmaster') {
      box(c, -13, -12, 23, 24, 3, metal, '#456256');
      poly(c, [[-9,-9],[7,-8],[14,-4],[14,4],[7,8],[-9,9]], metal, '#3a564b');
      hatch(c,-3,0,3.6,'#a7b3a2','#c4d3bd','#3c544d');
      optic(c,4.5,-6.4,5.8,3.2,'#789183');
      grille(c,-10.7,4.3,6.8,5.2,'#91ab98',3);
      panel(c,7.3,-2.9,5.7,5.8,'#8da192','#bfd0bc','#37524b');
      barrel(c,9,29,0,2.75,'#b5c6b6',accent);
      rect(c,-10,-7,3.3,1.25,accent);
    } else if (key === 'himars') {
      chassis(c, 'truck', { body: metal, dark: '#384b44', edge: '#a3ae97' });
      pod(c,-21,-8.2,25,16.4,metal,3,'#a6b9a5');
      line(c,[[-17.2,-7],[-17.2,7]],'#667c6d',1.3);
      for (const y of [-6.2,4.1]) panel(c,-14.3,y,10.6,2.8,'#778c7d','#9bac96','#405752');
      for (const y of [-5.4,0,5.4]) ring(c,.6,y,1.42,accent,.6,'#273637');
      rect(c,-19,-6,1.8,2.1,accent);
    } else if (key === 'phalanx') {
      ring(c, -4, 0, 13, '#334852', 1, steel);
      box(c,-12.5,-7.7,15.5,15.4,5.6,shade(c,-12,-7,16,15,'#e1e8e5','#899ea7'),'#51656e');
      line(c,[[-11.4,-3.5],[-9.3,-6.1],[-2.6,-6.3]],'#f0f4ef',.9);
      line(c,[[-4.2,-7],[-4.2,7]],'#839ba3',.72);
      panel(c,.3,-6,9.5,12,steel,'#b5cbd0','#475f69');
      for (const y of [-2.5,0,2.5]) line(c,[[7.4,y],[25,y]],'#b7c9ce',1.35);
      box(c,16.8,-4.05,4.4,8.1,1,'#657e88','#3e5360');
      optic(c,1.7,2.5,5.7,3.65,'#7b9aa6',accent);
    } else if (key === 'avenger') {
      chassis(c, 'truck', { body: steel, dark: '#384e5d', edge: '#94aeb8' });
      ring(c,-4,0,6.6,'#526772',1,'#a0b4b9');
      hatch(c,-4,0,3.2,'#a2b7bd','#d1ded9','#516d78');
      for (const y of [-10,4]) {
        pod(c,-12,y,20,6,steel,2,'#b2c7cb');
        rect(c,-10.2,y+1.1,2.7,3.8,accent);
      }
      optic(c,.9,-2.1,4.7,4.2,'#708c9b',accent);
    } else if (key === 'sentinel') {
      panel(c,-14,-11,25,22,steel,'#b6c7d0','#344a58');
      for (const y of [-14,10]) {
        box(c,-11,y,11,4,1,'#20282e');
        for (const x of [-9.5,-6.9,-4.2]) rect(c,x,y+.65,.74,2.7,'#586771');
      }
      grille(c,-12.4,-7.2,6.7,14.4,'#9bb0c1',3);
      line(c,[[9.9,-4],[19.3,0],[9.9,4]],'#9bb0b5',1.7);
      ring(c,19.3,0,1.35,'#3e525b',.75,'#a0b3b9');
      c.rotate(time*.62);
      hatch(c,0,0,6,'#96a0ae','#c2c7d9','#4e4c68');
      antenna(c,-3.7,-15,7.4,30,accent);
    }
    c.restore();
  }

  function abrams(c, flash, boss) {
    const seam = '#493b34', shadow = '#172021';
    const sand = flash ? '#ffe4d3' : boss ? '#b57a61' : '#d5b58d';
    const side = flash ? '#f5cbb4' : boss ? '#734a40' : '#9a7b63';
    const top = shade(c,-22,-14,45,30,sand,side);
    const light = flash ? '#fff2e4' : boss ? '#f8bc81' : '#e1c59d';
    box(c,-24,-12,51,30,4,'#11191b9b');
    for (const y of [-14,8.2]) {
      box(c,-24,y,47,5.8,1.6,shadow,'#3c3630');
      for (let x = -21; x < 22; x += 3.25) rect(c,x,y+.5,1.05,4.6,'#5e5146');
    }
    poly(c,[[-23,-11],[17,-11],[24,-8],[25,0],[24,8],[17,11],[-23,11]],top,seam);
    for (const y of [-12.4,8.6]) {
      for (const [x,w] of [[-20,8],[-11,7],[-3,7],[5,7],[13,7]]) box(c,x,y,w,3.5,.5,side,seam);
      line(c,[[-19,y+.6],[19,y+.6]],light,.65);
    }
    poly(c,[[12,-8.6],[19,-8.8],[24,-6],[24,6],[19,8.8],[12,8.6]],sand,seam);
    poly(c,[[17,-5],[23,-4],[24,0],[23,4],[17,5]],top,null);
    box(c,17.7,-2.9,4,5.8,1.4,side,seam);
    for (const y of [-7,6]) rect(c,23,y,1.4,1.2,boss ? '#ff9c79' : '#fff1c7');

    // 后甲板散热格栅与横向排气口。
    for (const y of [-8.2,.8]) {
      box(c,-22,y,10,7.4,.7,'#544a40',seam);
      for (let x = -21; x < -13; x += 1.7) rect(c,x,y+.6,.6,6,side);
    }
    rect(c,-23,-5.6,1.8,11.2,'#302d29');
    line(c,[[-21,-8],[-21,8]],light,.7);

    // 炮塔前部两块楔形装甲包围炮盾，后部保留弹药尾舱和挂架。
    poly(c,[[-18,-8],[-14,-11],[-2,-12],[4,-11],[13,-4.3],[14,-2],[14,2],[13,4.3],[4,11],[-2,12],[-14,11],[-18,8]],top,seam);
    poly(c,[[3,-10.2],[12,-4],[13,-2],[3,-3.2],[-1,-8.8]],light,seam);
    poly(c,[[3,10.3],[12,4],[13,2],[3,3.2],[-1,8.8]],side,seam);
    box(c,-17,-8.6,9.2,17.2,1.1,side,seam);
    for (const y of [-7.5,-2.5,2.5]) box(c,-16.3,y,6.8,4.6,.5,top,seam);
    line(c,[[-12,-9],[-19,-9],[-19,9],[-12,9]],light,.85);
    for (const y of [-5,0,5]) line(c,[[-19,y],[-17,y]],light,.72);
    ring(c,-3.6,4.8,3.5,seam,1,side);
    ring(c,-3.6,4.8,2.15,'#57473c',.55,top);
    ring(c,-4.8,-4.3,2.65,seam,.9,top);
    box(c,1.5,-6.4,5,4.3,1,side,seam);
    box(c,3.5,-5.9,2.1,1.8,.3,'#34484a');
    ring(c,2.5,5.4,2.25,seam,1,'#6e7971');
    rect(c,3.1,4.65,1.55,1.5,'#b0c4a8');
    line(c,[[-5,4],[-1,4],[1.8,3.4]],'#383833',1);
    box(c,10,-3.8,5.3,7.6,.9,side,seam);
    box(c,14,-1.45,22.8,2.9,.65,light,seam);
    box(c,18,-1.9,8.2,3.8,.55,top,seam);
    rect(c,35.6,-1.35,1.2,2.7,shadow);

    if (boss) {
      for (const y of [-14.2,10.2]) for (let x = -18; x < 18; x += 7.1) box(c,x,y,6.4,4,1,'#975748',seam);
      for (const y of [-10.2,7.2]) {
        box(c,-11,y,13,3,1,'#9c5d4d',seam);
        rect(c,-9.5,y+.8,4,1.3,'#ffd090');
      }
      box(c,-15,-3,7.6,6,1.4,'#3d4542',light);
      line(c,[[-13,-1.8],[-9.5,1.8]],'#ffd394',1);
      line(c,[[-9.5,-1.8],[-13,1.8]],'#ffd394',1);
      line(c,[[-17,-7],[-23,-12]],light,.85);
      line(c,[[-17,7],[-23,12]],light,.85);
    } else {
      rect(c,-15,-7.5,2.7,1.5,'#e3876b');
    }
  }

  const enemyPaint = {
    m113: ['#ccb38c','#886c56'],
    bradley: ['#d9b392','#8f6559'],
    stryker: ['#bec0a0','#6f735c'],
    apache: ['#c1ab8c','#735d4e'],
    reaper: ['#d5c9b8','#817c77'],
    thunderbolt: ['#c6bbb0','#827573']
  };

  function groundEnemy(c,type,colors) {
    const {body,edge,dark} = colors;
    const wheeled = type === 'stryker';
    box(c,-21,-9,43,23,3,'#111a1d8f');
    chassis(c,wheeled ? 'stryk' : 'track',colors);
    if (type === 'm113') {
      // 直壁货舱、宽大的后舱盖和车首右侧发动机格栅。
      poly(c,[[-19,-9],[13,-9],[19,-6],[19,6],[13,9],[-19,9]],body,dark);
      panel(c,-16,-7.6,16,15.2,'#b19572',edge,dark);
      line(c,[[-16,-5.5],[-16,5.5]],'#564b40',1.15);
      for (const y of [-5.3,4.1]) rect(c,-18,y,2.8,1.3,'#ddc09a');
      grille(c,7,1.8,8.2,5.4,'#9e927a',4);
      hatch(c,8,-4.7,2.6,'#a38c70',edge,dark);
      hatch(c,-.1,-2.3,3.55,'#9f8869',edge,dark);
      barrel(c,1.6,10.3,-2.3,1.25,'#62574c',edge);
      rect(c,-16,5.3,3.4,1.15,'#e99276');
    } else if (type === 'bradley') {
      poly(c,[[-18,-9],[13,-9],[20,-5.7],[20,5.7],[13,9],[-18,9]],body,dark);
      panel(c,-17,-6.9,13,13.8,'#a9846e',edge,dark);
      line(c,[[-15,0],[-5,0]],dark,.9);
      grille(c,11,1.6,5.8,5.2,'#ad8976',3);
      optic(c,10,-6.8,5.5,3.5,'#9a7664');
      poly(c,[[-8,-6.7],[3,-7.5],[10,-3.5],[10,3.5],[4,7],[-7,6.5]],body,dark);
      line(c,[[-6,-5.5],[3,-6.1],[8,-2.7]],edge,.8);
      hatch(c,-3,-2.8,2.7,'#b6957b',edge,dark);
      hatch(c,-2.5,2.7,2.3,'#96786a',edge,dark);
      pod(c,-7.5,6,13,4.8,'#b28d76',2,'#d6b29b');
      optic(c,3.2,-6.2,4.3,2.5,'#8d7164');
      barrel(c,7.2,25.5,-.8,2.25,edge,'#e1bba1');
      rect(c,-14,-5.4,3.4,1.15,'#ee9379');
    } else {
      // 八轮底盘、收尖的车首与低矮遥控武器站。
      poly(c,[[-20,-8.4],[10,-9.5],[19,-5.5],[21,-2.6],[21,2.6],[19,5.5],[10,9.5],[-20,8.4]],body,dark);
      for (const y of [-6.9,.5]) panel(c,-17,y,12.8,6.4,'#9e9e82',edge,dark);
      line(c,[[9,-8],[18,-4.7],[20,-2.1]],edge,.85);
      optic(c,11,-6,4.9,3,'#7b806d');
      grille(c,11,1.4,5.6,4.6,'#a7ab8d',3);
      hatch(c,4,-3.6,2.6,'#899079',edge,dark);
      box(c,-2,-.8,10,5.2,1.1,'#7d836f',dark);
      optic(c,4,2.5,3.9,2.6,'#818771');
      barrel(c,5,15.5,1.2,1.3,'#a8a58b',edge);
      rect(c,-17,4.2,3.7,1.2,'#e79278');
    }
  }

  function apache(c,body,edge,dark,time) {
    poly(c,[[-24,-1.25],[-12,-2.2],[-6,-4.4],[6,-5.2],[14,-3.6],[21,-1.9],[22,0],[21,2],[14,3.6],[6,5.2],[-6,4.4],[-12,2.2],[-24,1.25]],body,dark);
    poly(c,[[-3,-13],[3,-14],[6,-6],[6,6],[3,14],[-3,13],[-1,5],[-1,-5]],body,dark);
    for (const y of [-12.5,-8.8,6,9.7]) {
      box(c,-5,y,11,2.8,1,'#9b7c67',dark);
      rect(c,3.8,y+.6,1.6,1.5,'#d5ab8a');
    }
    for (const y of [-7,2.8]) {
      box(c,-11,y,11.4,4.2,1.1,body,dark);
      grille(c,-10.4,y+.8,4,2.7,'#aa977e',3);
      rect(c,-.9,y+.6,1.15,2.8,'#e2bf9e');
    }
    poly(c,[[3,-2.7],[9,-3],[13,-2.5],[18,-1.6],[19,0],[18,1.6],[13,2.5],[9,3],[3,2.7]],'#3d5259',dark);
    line(c,[[4,-2],[9,-2.1],[16,-1.2]],'#c1c8ba',.85);
    line(c,[[11,-2.5],[11,2.4]],'#aaa591',.8);
    optic(c,18,-1.8,4.3,3.6,'#a99075');
    poly(c,[[-20,-6],[-16,-6],[-15,-1],[-15,1],[-16,6],[-20,6],[-18,0]],body,dark);
    line(c,[[-24,-3],[-22.5,3]],edge,.8);
    c.rotate(time*17);
    ring(c,0,0,21.5,'#d6c3a330',.75);
    for (let i=0;i<4;i++) {
      c.rotate(Math.PI/2);
      poly(c,[[2,-.6],[20,-1.25],[22.7,-.9],[21,.5],[2,.6]],'#e2c7a9b7',null);
    }
    ring(c,0,0,2.45,dark,.8,edge);
  }

  function reaper(c,body,edge,dark,time) {
    poly(c,[[-4,-22.6],[-.4,-24],[3,-22.2],[4.4,-4],[4.4,4],[3,22.2],[-.4,24],[-4,22.6],[-3.6,4],[-3.6,-4]],body,dark);
    line(c,[[2.1,-21.5],[2.7,-5]],edge,.8);
    line(c,[[2.7,5],[2.1,21.5]],edge,.8);
    for (const y of [-16,-10,8,14]) box(c,-5.1,y,8.4,1.9,.65,'#a89f91',dark);
    poly(c,[[-19,-1.7],[-17,-8.8],[-13,-8],[-10,-2],[-4,-2.45],[8,-2.7],[14,-3.2],[19,-2.7],[22,0],[19,2.7],[14,3.2],[8,2.7],[-4,2.45],[-10,2],[-13,8],[-17,8.8],[-19,1.7]],body,dark);
    line(c,[[-15,-.9],[-4,-1],[15,-1.25]],edge,.7);
    ring(c,14.8,0,1.8,dark,.75,'#686864');
    rect(c,17.2,-.6,2,1.2,'#e69a7f');
    const span=4.7*Math.abs(Math.cos(time*29));
    line(c,[[-20.3,-span],[-20.3,span]],'#efe4d4ad',1.1);
    ring(c,-19.3,0,.95,null,1,'#534d4a');
    rect(c,-.6,-23.5,2,1,'#e79379');
    rect(c,-.6,22.5,2,1,'#e79379');
  }

  function thunderbolt(c,body,edge,dark) {
    // 平直大翼、后置双发和双垂尾是 A-10 的主要俯视特征。
    poly(c,[[-8,-19.5],[-6,-22.3],[.2,-22.3],[4.6,-7],[7,-3.5],[7,3.5],[4.6,7],[.2,22.3],[-6,22.3],[-8,19.5],[-4.7,5],[-4.7,-5]],body,dark);
    for (const y of [-17,-11,9,15]) {
      box(c,-7.2,y,12,2.1,.65,'#9d8e87',dark);
      rect(c,2.4,y+.5,2,1.05,'#ddac93');
    }
    poly(c,[[-19,-12],[-15,-11.6],[-12.2,-3],[-11.7,3],[-15,11.6],[-19,12],[-17,3],[-17,-3]],body,dark);
    for (const y of [-11.8,8.6]) poly(c,[[-20,y],[-15.8,y-.3],[-12.8,y+2.7],[-19.7,y+3]],'#a99d93',dark);
    poly(c,[[-19,-2.1],[-11,-3.4],[8,-3.8],[16,-3],[21,-1.6],[23,0],[21,1.6],[16,3],[8,3.8],[-11,3.4],[-19,2.1]],body,dark);
    for (const y of [-7.9,3.4]) {
      box(c,-14.7,y,12,4.5,1.8,'#9a8e86',dark);
      line(c,[[-13,y+.85],[-4.6,y+.85]],edge,.82);
      box(c,-5.1,y+.4,2.25,3.7,.65,'#515553',dark);
      rect(c,-14.6,y+.9,1.4,2.6,'#494846');
    }
    poly(c,[[8,-2.4],[13,-2.5],[16,-1.4],[17,0],[16,1.4],[13,2.5],[8,2.4]],'#40535a',dark);
    line(c,[[9,-1.7],[13,-1.7],[16,-.9]],'#aabfc0',.85);
    rect(c,20.4,.35,2.6,.95,'#55514e');
    rect(c,-4.5,-20.8,3.5,1.3,'#e59a83');
    rect(c,-4.5,19.5,3.5,1.3,'#e59a83');
  }

  function assaultVehicle(c,type,flash) {
    const edge = flash ? '#ffe6d1' : '#d6b08c', dark = '#463a34';
    const body = shade(c,-25,-16,50,32,edge,'#7f5b49');
    if (type === 'scout') {
      chassis(c,'stryk',{ body,edge,dark });
      panel(c,-15,-6.8,13,13.6,body,edge,dark);
      poly(c,[[-7,-6],[5,-7],[11,-3],[11,4],[1,7],[-7,5]],body,dark);
      hatch(c,-3,-1,3,body,edge,dark);
      optic(c,4,-6,4,3.2,'#9b8069');
      barrel(c,7,26,0,2.6,edge,'#e69876');
      return;
    }
    if (type === 'twin') {
      const trim = flash ? '#fff0dc' : '#b6b19a';
      const hull = shade(c,-22,-13,46,26,trim,'#5b645b');
      box(c,-21,-11,46,26,3,'#141c1dc2');
      for (const y of [-13,8]) {
        box(c,-22,y,43,5,1.4,'#252524',dark);
        for (let x=-20;x<20;x+=3.4) rect(c,x,y+.7,1,3.6,'#716a5d');
      }
      poly(c,[[-21,-9],[-16,-12],[13,-11],[23,-6],[24,6],[13,11],[-16,12],[-21,9]],hull,dark);
      for (const y of [-10.6,7.5]) {
        for (const x of [-12,-5,2,9]) panel(c,x,y,6.3,3.1,'#858578',trim,dark);
      }
      grille(c,-19,-6,7,12,'#aaa28e',4);
      poly(c,[[-12,-6],[-5,-9],[8,-8],[15,-5],[15,5],[8,8],[-5,9],[-12,6]],hull,dark);
      line(c,[[-9,-5],[-6,-7],[7,-6]],trim,1);
      hatch(c,-6,1,3.2,'#898b7b',trim,dark);
      optic(c,0,-3.5,4.8,4.7,'#6c8279');
      for (const y of [-4.3,4.3]) {
        panel(c,7,y-2.5,8,5,'#777e72',trim,dark);
        barrel(c,13,33,y,3.1,trim,'#e6a486');
        rect(c,19,y-1.5,3,3,'#ab6252');
      }
      for (const y of [-7,6]) rect(c,20,y,1.6,1.2,'#ffc49b');
      return;
    }
    const boss = type === 'dreadnought', width = boss ? 16 : 14.4;
    box(c,-24,-width+2,52,width*2,4,'#172021af');
    for (const y of [-width,width-6]) {
      box(c,-24,y,46,6,1.3,'#272322',dark);
      for (let x=-21;x<21;x+=3.8) rect(c,x,y+1,1.1,4,'#755d4d');
    }
    poly(c,[[-24,-width+3],[12,-width+2],[23,-9],[25,0],[23,9],[12,width-2],[-24,width-3]],body,dark);
    for (const y of [-width+2,width-6]) {
      for (const x of [-22,-14,-6,2,10]) panel(c,x,y,7.2,4,boss ? '#985542' : '#9a7660',edge,dark);
    }
    grille(c,-22,-8,9,16,'#be9779',4);
    poly(c,[[-15,-10],[-7,-12],[9,-11],[16,-5],[16,5],[9,11],[-7,12],[-15,10]],body,dark);
    panel(c,-12,-7,12,14,boss ? '#a26853' : '#ad8b70',edge,dark);
    hatch(c,-6,0,3.8,body,edge,dark);
    optic(c,4,-2.8,6.1,5.6,'#887965','#e2ad85');
    for (const y of [-5.5,5.5]) {
      panel(c,9,y-3.1,8.1,6.2,body,edge,dark);
      barrel(c,13,boss ? 42 : 37,y,boss ? 4.7 : 3.8,edge,'#ffb983');
    }
    if (boss) {
      for (const y of [-8,7]) rect(c,-13,y,8,1.3,'#ffd48e');
      rect(c,-2,-9,2.2,18,'#623d35');
    }
  }

  function enemy(c, type, x, y, angle, size, time, flash = false) {
    c.save(); c.translate(x,y); c.scale(size,size); c.rotate(angle);
    if (type === 'abrams' || type === 'm1boss') {
      abrams(c,flash,type === 'm1boss');
    } else if (type === 'scout' || type === 'twin' || type === 'titan' || type === 'dreadnought') {
      assaultVehicle(c,type,flash);
    } else {
      const [light,shadeColor] = enemyPaint[type];
      const body = flash ? '#ffe5d8' : shade(c,-19,-16,38,32,light,shadeColor);
      const edge = flash ? '#fff3e8' : light;
      const dark = '#4b403c';
      if (type === 'apache') apache(c,body,edge,dark,time);
      else if (type === 'reaper') reaper(c,body,edge,dark,time);
      else if (type === 'thunderbolt') thunderbolt(c,body,edge,dark);
      else groundEnemy(c,type,{ body,edge,dark });
    }
    c.restore();
  }

  function terrain(sheet) {
    sheet.width = map.width;
    sheet.height = map.height;
    const c = sheet.getContext('2d');
    let seed = 847259;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    rect(c, 0, 0, map.width, map.height, '#293936');
    const patches = [[96,106,174,121,'#615643'],[419,210,212,154,'#655f4b'],[818,75,199,139,'#5c6048'],[189,477,266,153,'#555640'],[568,484,218,128,'#4d5848'],[985,363,151,146,'#556151']];
    for (const [x,y,rx,ry,color] of patches) {
      c.save(); c.translate(x,y); c.scale(rx,ry);
      const glow = c.createRadialGradient(0,0,.02,0,0,1);
      glow.addColorStop(0,color); glow.addColorStop(1,color + '00');
      rect(c,-1,-1,2,2,glow); c.restore();
    }

    // 等高线和散落纹理只作底图，不参与道路或建造判定。
    for (const [x,y,rx,ry,rotation] of [[364,72,166,105,.41],[176,354,154,83,-.54],[526,513,191,82,-.26],[771,241,85,134,.42],[968,120,112,72,.13],[1018,504,120,83,-.34]]) {
      c.save(); c.translate(x,y); c.rotate(rotation);
      for (let n = 12; n >= 1; n--) {
        const fraction = .24 + .082 * n;
        const points = [];
        for (let i = 0; i < 80; i++) {
          const a = i / 80 * TAU, wobble = 1 + Math.sin(a * 3 + .4 + n * .08) * .14 + Math.cos(a * 7 + n * .09) * .065;
          points.push([Math.cos(a) * rx * fraction * wobble, Math.sin(a) * ry * fraction * wobble]);
        }
        poly(c, points, n % 2 ? '#142b2922' : '#7d70531a', n % 3 ? '#b4b39223' : '#c4bb9335');
      }
      c.restore();
    }

    for (let i = 0; i < 10300; i++) {
      const x = random() * map.width, y = random() * map.height, s = 1 + random() * 4;
      rect(c,x,y,s,.7 + random() * 2, i % 2 ? '#e6d2a30b' : '#10282527');
    }
    for (let i = 0; i < 430; i++) {
      const x = random() * map.width, y = random() * map.height, s = 1 + random() * 4;
      if (Math.sin(x * .026) + Math.cos(y * .034) < -.3) continue;
      poly(c,[[x-s,y],[x,y-s],[x+s*1.3,y-1],[x+s,y+s*.6],[x-s*.6,y+s*.7]],i % 3 ? '#16292278' : '#847a576e');
      rect(c,x-1,y-1,s,.8,'#b0a07845');
    }

    const vignette = c.createRadialGradient(540,280,220,540,280,680);
    vignette.addColorStop(0,'#0a161000'); vignette.addColorStop(1,'#071516ad');
    rect(c,0,0,map.width,map.height,vignette);
  }

  function drawMap(ground,svg) {
    terrain(ground);
    const { cells, entrance, exit, roadD, pointAt, pathLength } = IronEngine;
    const { width,height,cellSize:s,roadWidth:w } = map;
    const cellRect = ({x,y},className) => `<rect x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" class="${className}"/>`;
    const marked = cells.filter(cell => cell.edge || cell.road).map(cell => cellRect(cell,cell.road ? 'road-cell' : 'edge-cell')).join('');
    const axes = cells.filter(cell => (cell.row === 0 || cell.col === 0 && cell.row > 0 && !cell.road))
      .map(cell => `<text x="${cell.x}" y="${cell.y+3}">${cell.row === 0 ? cell.code.slice(1) : cell.code[0]}</text>`).join('');
    const arrows = [];
    for (let d = 126; d < pathLength - 80; d += 151) {
      if (Math.abs(pointAt(d-11).angle - pointAt(d+11).angle) > .04) continue;
      const {x,y,angle} = pointAt(d);
      arrows.push(`<path d="M-8 -5 L-2 0 -8 5 M0 -5 L6 0 0 5" transform="translate(${x} ${y}) rotate(${angle*180/Math.PI})"/>`);
    }
    const gate = (cell,style,name,align) => `<g class="map-gate ${style}">
      <path d="M${cell.x} ${cell.y-17} v34" stroke-dasharray="3 3"/>
      <rect x="${cell.x-9}" y="${cell.y-22}" width="18" height="5" rx="1"/>
      <rect x="${cell.x-9}" y="${cell.y+17}" width="18" height="5" rx="1"/>
      <text x="${cell.x+(align==='end'?10:-10)}" y="${cell.y-27}" text-anchor="${align}">${name}</text></g>`;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    svg.innerHTML = `<defs>
      <pattern id="combat-grid" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="M0 ${s}V0H${s}" class="grid-line"/><circle cx="0" cy="0" r="1.2" class="grid-dot"/></pattern>
      <path id="route-centerline" d="${roadD}"/>
      </defs>
      ${marked}<rect width="${width}" height="${height}" fill="url(#combat-grid)"/>
      <g class="road-bands">
        <use href="#route-centerline" class="road-base" stroke-width="${w}"/>
        <use href="#route-centerline" class="road-rim" stroke-width="${w-3}"/>
        <use href="#route-centerline" class="road-asphalt" stroke-width="${w-7}"/>
        <use href="#route-centerline" class="road-inner" stroke-width="${w-11}"/>
        <use href="#route-centerline" class="road-paint" stroke-width="1.2"/>
      </g>
      <g class="road-arrows">${arrows.join('')}</g><g class="map-axis">${axes}</g>
      ${gate(entrance,'entry','01 / ENTRY','start')}${gate(exit,'exit','02 / HQ','end')}`;
  }

  function highlightCell(c, cell, ink, blocked = false, placing = false) {
    const {x,y} = cell, half = map.cellSize/2 - 1;
    box(c,x-half,y-half,2*half,2*half,3,ink + '24',ink + 'c8');
    if (blocked) {
      line(c,[[x-5,y-5],[x+5,y+5]],ink,1.7);
      line(c,[[x+5,y-5],[x-5,y+5]],ink,1.7);
    } else if (!cell.tower && placing) {
      line(c,[[x-6,y],[x+6,y]],ink,1.4);
      line(c,[[x,y-6],[x,y+6]],ink,1.4);
    }
    label(c,cell.code,x,y+15,ink,8,'center');
  }

  function drawEffect(c, fx) {
    const a = fx.age / fx.ttl, {x,y} = fx;
    c.save(); c.globalAlpha = 1 - a;
    if (fx.type === 'spark') {
      for (const offset of [-.85,0,.85]) {
        const angle = fx.angle + offset;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        line(c,[[x+dx*a*7,y+dy*a*7],[x+dx*(4+a*9),y+dy*(4+a*9)]],fx.color,1.25);
      }
    } else if (fx.type === 'muzzle') {
      c.translate(x,y); c.rotate(fx.angle);
      poly(c,[[-3,-3],[11,0],[-3,3],[0,0]],'#fff5be');
    } else if (fx.type === 'reward') {
      label(c,'+' + fx.value,x,y-19-a*24,fx.color,13,'center');
    } else {
      const radius = fx.radius ?? (fx.type === 'build' ? 36 : 24);
      ring(c,x,y,4 + a * radius,fx.color,2,fx.color + '2d');
      if (fx.type !== 'build') for (let i = 0; i < 8; i++) {
        const angle = i * TAU / 8 + x;
        const spread = radius * (.15 + a * .85);
        ring(c,x+Math.cos(angle)*spread,y+Math.sin(angle)*spread,1.3 + 1.2 * (1-a),null,1,fx.color);
      }
    }
    c.restore();
  }

  function roadWork(c,type,x,y,angle,ready = true) {
    c.save(); c.translate(x,y); c.rotate(angle);
    if (type === 'barricade') {
      for (const side of [-8,8]) {
        box(c,-8,side-6,16,12,2,'#23303290');
        line(c,[[-7,side-5],[7,side+5]],'#a9babb',3);
        line(c,[[-7,side+5],[7,side-5]],'#879c9e',3);
        ring(c,0,side,1.6,'#28393b',.7,'#e1e6da');
      }
    } else {
      ring(c,0,0,8.6,'#332a27',1.1,'#8a7250');
      ring(c,0,0,5.4,'#c6a871',1,'#504537');
      for (const [dx,dy] of [[-5,0],[5,0],[0,-5],[0,5]]) ring(c,dx,dy,.9,null,1,'#d7b981');
      ring(c,0,0,2,null,1,ready ? '#ffcd75' : '#d27465');
    }
    c.restore();
  }

  function workPortrait(element,type) {
    const c=element.getContext('2d'), h=element.height;
    c.clearRect(0,0,element.width,h);
    c.save(); c.translate(element.width/2,h/2); c.scale(h/40,h/40);
    ring(c,0,0,17,works[type].color+'75',.8,'#23383a');
    roadWork(c,type,0,0,-.55);
    c.restore();
  }

  function createRenderer(canvasElement) {
    const c = canvasElement.getContext('2d');
    c.setTransform(canvasElement.width/map.width,0,0,canvasElement.height/map.height,0,0);
    return (game, selection, hover, selectedType, workSelection) => {
      c.clearRect(0,0,map.width,map.height);
      const towerType = towers[selectedType] ? selectedType : null;
      const roadType = works[selectedType] ? selectedType : null;
      const hoveredPad = game.pads[hover?.padIndex];
      const focus = game.pads[selection] ?? (towerType || (!selectedType && hoveredPad?.tower) ? hoveredPad : null);
      if (focus && (focus.tower || towerType)) {
        const spec = towers[focus.tower?.type ?? towerType];
        const stats = focus.tower ? game.padStats(focus) : game.stats(towerType,1,spec.target === 'support' ? undefined : game.fireControl(focus));
        c.setLineDash([5,5]);
        ring(c,focus.x,focus.y,stats.range,spec.color + '93',1.2,spec.color + '16');
        if (stats.minRange) ring(c,focus.x,focus.y,stats.minRange,'#ed9b82d4',1.5,'#d0715733');
        c.setLineDash([]);
      }
      if (focus) highlightCell(c,focus,towers[focus.tower?.type ?? selectedType]?.color ?? '#a7e5c3',false,Boolean(selectedType));
      if (towerType && hover?.padIndex === null) highlightCell(c,hover,'#f6a48e',true);
      const selectedWork = game.works.get(workSelection);
      if (selectedWork) highlightCell(c,selectedWork,works[selectedWork.type].color);
      if (roadType && hover) {
        const valid = hover.road && !hover.edge && !game.works.has(hover.code);
        highlightCell(c,hover,valid ? works[roadType].color : '#f6a48e',!valid,true);
        if (valid && roadType === 'mine') ring(c,hover.x,hover.y,works.mine.blast,'#ffd28d99',1,'#ffd28d12');
      }
      for (const work of game.works.values()) {
        roadWork(c,work.type,work.x,work.y,work.angle,game.clock >= work.readyAt);
        if (work.type === 'barricade') {
          const fraction = work.hp / works.barricade.durability;
          box(c,work.x-10,work.y-17,20,3,1,'#172428');
          rect(c,work.x-10,work.y-16.7,20*fraction,2.4,fraction > .35 ? '#b4d4c9' : '#f4a183');
        }
      }
      const mark = game.strike ?? (selectedType === 'strike' ? hover : null);
      if (mark) {
        c.setLineDash([5,4]);
        ring(c,mark.x,mark.y,support.blast,'#ffb78ecc',1.4,'#ff987524');
        c.setLineDash([]);
        line(c,[[mark.x-7,mark.y],[mark.x+7,mark.y]],'#ffc7a3',1.3);
        line(c,[[mark.x,mark.y-7],[mark.x,mark.y+7]],'#ffc7a3',1.3);
        if (game.strike) label(c,Math.max(0,mark.landAt-game.clock).toFixed(1)+'s',mark.x,mark.y-12,'#ffcfaf',12,'center');
      }
      for (const p of game.deployed) {
        const {type,aim,level} = p.tower;
        if (type === 'sentinel') {
          const range = game.padStats(p).range;
          const sectors = level === 5 ? [0,TAU/3,2*TAU/3] : [0];
          for (const offset of sectors) {
            const phase = game.clock * 1.28 + offset;
            c.beginPath(); c.moveTo(p.x,p.y); c.arc(p.x,p.y,range,phase-.20,phase); c.closePath();
            c.fillStyle = '#d2b7fc17'; c.fill();
          }
        }
        tower(c,type,p.x,p.y,aim,map.towerScale,game.clock,level);
        for (let i = 0; i < level; i++) rect(c,p.x - (level*4-1)/2 + i*4,p.y-18,3,2,towers[type].color);
      }
      for (const unit of game.units) {
        const spec = enemies[unit.type], isAir = spec.category === 'air';
        const {x,y} = unit, r = spec.size;
        if (isAir) {
          c.save(); c.globalAlpha = .23;
          enemy(c,unit.type,x+8,y+9,unit.angle,r/24,game.clock); c.restore();
        }
        if (spec.boss) ring(c,x,y,r+.8,'#ffc18295',1.3,'#3d232743');
        c.save(); c.globalAlpha = unit.revealed ? 1 : .42;
        enemy(c,unit.type,x,y,unit.angle,r/24,game.clock,unit.flash > 0);
        box(c,x-r*.74,y-r-4,r*1.48,3.4,1,'#10191c');
        rect(c,x-r*.74,y-r-3.7,r*1.48*unit.hp/unit.maxHp,2.6,spec.boss ? '#ffc182' : isAir ? '#f7b19d' : '#f89476');
        if (spec.boss) label(c,spec.code,x,y+r+11,'#ffce97',10,'center');
        if (spec.hidden) ring(c,x,y,r+3,unit.revealed ? '#d3b4f9b3' : '#b5c0c4a1',.9);
        c.restore();
      }
      for (const shot of game.projectiles) {
        if (shot.delivery === 'bullet') {
          c.save(); c.translate(shot.x,shot.y); c.rotate(shot.angle);
          const length = 5 + shot.level * .65;
          box(c,-length,-1.4,length+1,2.8,1.2,'#c59c70','#473f37');
          rect(c,-length+1,-.9,length-2,.8,'#f3d4a2');
          c.restore();
        } else if (shot.delivery === 'shell') {
          c.save(); c.translate(shot.x,shot.y); c.rotate(shot.angle);
          box(c,-6,-1.6,8,3.2,1.2,'#dfb282','#5c483b');
          rect(c,-4.7,-.9,4.5,.8,'#ffe2af');
          c.restore();
        }
        else {
          line(c,[[shot.x-12*Math.cos(shot.angle),shot.y-12*Math.sin(shot.angle)],[shot.x,shot.y]],shot.color,2.6);
          ring(c,shot.x,shot.y,2.7,null,1,'#fff4cd');
        }
      }
      for (const fx of game.effects) drawEffect(c,fx);
    };
  }

  function portrait(element, key, isEnemy = false, level = 1) {
    const c = element.getContext('2d'), w = element.width, h = element.height;
    c.clearRect(0,0,w,h);
    c.save(); c.translate(w*.51,h*.52); c.scale(h/54,h/54);
    const tint = isEnemy ? '#f2a18b' : towers[key].color;
    ring(c,0,0,24,tint + '38');
    for (const x of [-26,26]) line(c,[[x,-5],[x,5]],tint + '6b');
    for (const y of [-23,23]) line(c,[[-5,y],[5,y]],tint + '6b');
    if (isEnemy) enemy(c,key,0,0,-.68,key === 'abrams' || key === 'm1boss' ? .82 : .96,0);
    else tower(c,key,-3,0,-.64,level === 5 ? .72 : level > 1 ? .76 : .88,0,level);
    c.restore();
  }

  globalThis.IronArt = { drawMap, createRenderer, portrait, workPortrait };
})();
