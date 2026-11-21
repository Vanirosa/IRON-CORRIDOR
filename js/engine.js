/* 不依赖浏览器的战斗规则。地图与装备数值由 data.js 提供。 */
(() => {
  const data = globalThis.IronData;
  const { towers, towerModel, enemies, waves, endless, works, support, economy, stageOne, stageTwo, upgrade, map, test } = data;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const { columns, rows, cellSize, waypoints } = map;
  const roadIndices = new Set();
  for (const [index,[col,row]] of waypoints.entries()) {
    roadIndices.add(row * columns + col);
    if (!index) continue;
    const [fromCol,fromRow] = waypoints[index-1];
    const dc = col - fromCol, dr = row - fromRow;
    if ((dc !== 0) === (dr !== 0)) throw Error('道路拐点必须由相邻方向的直线连接。');
    for (let i = 1; i < Math.abs(dc || dr); i++) {
      roadIndices.add((fromRow + Math.sign(dr) * i) * columns + fromCol + Math.sign(dc) * i);
    }
  }

  const buildCells = [];
  const cells = Array.from({ length: columns * rows }, (_,index) => {
    const col = index % columns, row = Math.floor(index / columns);
    const cell = {
      col, row, x: (col + .5) * cellSize, y: (row + .5) * cellSize,
      code: String.fromCharCode(65 + row) + String(col + 1).padStart(2,'0'),
      road: roadIndices.has(index), edge: col === 0 || col === columns - 1 || row === 0 || row === rows - 1,
      padIndex: null
    };
    if (!cell.edge && !cell.road) {
      cell.padIndex = buildCells.length;
      buildCells.push(cell);
    }
    return cell;
  });

  function cellAt(col, row) {
    if (!Number.isInteger(col) || !Number.isInteger(row) || col < 0 || col >= columns || row < 0 || row >= rows) return null;
    return cells[row * columns + col];
  }

  const entrance = cellAt(...waypoints[0]), exit = cellAt(...waypoints.at(-1));
  const points = waypoints.map(([col,row]) => {
    const {x,y} = cellAt(col,row);
    return {x,y};
  });
  points[0].x = -cellSize * .65;
  points.at(-1).x = map.width + cellSize * .65;

  // 道路 SVG 和寻路都取自这组直线及二次曲线。
  const segments = [], commands = [`M ${points[0].x} ${points[0].y}`];
  let pathLength = 0, previous = points[0];
  function sample(next) {
    const {x,y} = previous, dx = next.x - x, dy = next.y - y;
    const length = Math.hypot(dx,dy);
    if (!length) return;
    segments.push({ x, y, dx, dy, start: pathLength, length, angle: Math.atan2(dy,dx) });
    pathLength += length;
    previous = next;
  }
  function straight(point) {
    commands.push(`L ${point.x} ${point.y}`);
    sample(point);
  }
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i-1], b = points[i], c = points[i+1];
    const radius = Math.min(map.cornerRadius,distance(a,b)/2,distance(b,c)/2);
    const from = { x: b.x - Math.sign(b.x-a.x)*radius, y: b.y - Math.sign(b.y-a.y)*radius };
    const to = { x: b.x + Math.sign(c.x-b.x)*radius, y: b.y + Math.sign(c.y-b.y)*radius };
    straight(from);
    commands.push(`Q ${b.x} ${b.y} ${to.x} ${to.y}`);
    const samples = 24;
    for (let j = 1; j <= samples; j++) {
      const t = j / samples, u = 1 - t;
      sample({
        x: u*u*from.x + 2*u*t*b.x + t*t*to.x,
        y: u*u*from.y + 2*u*t*b.y + t*t*to.y
      });
    }
  }
  straight(points.at(-1));
  const roadD = commands.join(' ');

  const tankArmor = new Set(['heavy','siege']);
  const roadProgress = new Map();
  for (const cell of cells) {
    if (!cell.road) continue;
    let nearest = Infinity, progress = 0;
    for (const s of segments) {
      const t = Math.max(0,Math.min(1,((cell.x-s.x)*s.dx + (cell.y-s.y)*s.dy)/(s.length*s.length)));
      const gap = Math.hypot(cell.x-s.x-t*s.dx,cell.y-s.y-t*s.dy);
      if (gap < nearest) { nearest = gap; progress = s.start + t*s.length; }
    }
    roadProgress.set(cell.code,progress);
  }

  const validHealth = value => Number.isFinite(value) && value >= test.minHealth && value <= test.maxHealth;

  function pointAt(progress) {
    const position = Math.max(0, Math.min(progress, pathLength));
    const segment = segments.find(item => position < item.start + item.length) ?? segments.at(-1);
    const fraction = (position - segment.start) / segment.length;
    return { x: segment.x + segment.dx * fraction, y: segment.y + segment.dy * fraction, angle: segment.angle };
  }

  function waveSchedule(wave) {
    const schedule = [];
    let time = .55;
    for (const [pattern, count, interval, gap = 0] of wave.groups) {
      time += gap;
      const types = Array.isArray(pattern) ? pattern : [pattern];
      for (let i = 0; i < count; i++) {
        schedule.push({ type: types[i % types.length], time });
        time += interval;
      }
    }
    return schedule;
  }

  function waveBossCount(wave, schedule) {
    if (!wave.boss) return 0;
    return wave.mixedBoss ? schedule.filter(({type}) => type === wave.boss).length : 1;
  }

  function endlessWave(number) {
    const rank = number - waves.length;
    const {name,types} = endless.patterns[(rank-1) % endless.patterns.length];
    let seed = Math.imul(number,0x9e3779b9) >>> 0;
    const groups = [];
    const groupCount = Math.min(8,5 + Math.floor((rank-1)/4));
    for (let i = 0; i < groupCount; i++) {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      const type = types[i % types.length];
      const heavy = enemies[type].armor === 'heavy' || enemies[type].armor === 'jet';
      const count = (heavy ? 5 : 7) + ((seed >>> 12) % 4) + Math.min(16,Math.floor(rank*.55));
      const interval = Math.max(.29,(heavy ? .84 : .61) - Math.min(.4,rank*.022));
      groups.push([type,count,interval,.32 + ((seed >>> 20) % 4)*.13]);
    }
    const boss = rank % endless.bossEvery === 0 ? 'dreadnought' : null;
    return {
      name: boss ? name + ' · 首领' : name,
      brief: boss ? `增援全部结束后，${enemies[boss].name}将进入战场。` : '敌军耐久随波次增加。根据预警中的地空构成布置火力。',
      bonus: 145 + Math.min(360,rank*11), groups, boss,
      healthScale: 1 + rank*endless.healthGrowth
    };
  }

  const newTelemetry = () => ({
    seconds: 0, spawned: 0, killCredits: 0, waveCredits: 0, refunds: 0, mineDamage: 0, supportDamage: 0,
    killedLife: 0, escapedLife: 0, enemies: new Map(), towers: new Map(), waves: []
  });
  const average = (total,count) => count ? total/count : null;

  class Battle {
    constructor({ testMode = false, healthMultiplier = 1, testWave = 1 } = {}) {
      this.pads = buildCells.map(cell => ({ ...cell, tower: null }));
      this.deployed = new Set();
      this.radars = new Set();
      this.works = new Map();
      this.supportReady = false;
      this.strike = null;
      this.waveReport = null;
      this.lastReport = null;
      this.testMode = testMode;
      this.testWave = testMode ? (Number.isInteger(testWave) && testWave >= 1 && testWave <= waves.length ? testWave : 1) : null;
      this.testCheckpoint = null;
      this.healthMultiplier = testMode && validHealth(healthMultiplier) ? healthMultiplier : 1;
      this.credits = data.start.credits;
      this.integrity = data.start.integrity;
      this.phase = 'ready';
      this.paused = false;
      this.wave = this.testWave === null ? 0 : this.testWave - 1;
      this.endless = false;
      this.currentWave = null;
      this.bossArrival = null;
      this.bossUnits = [];
      this.bossCount = 0;
      this.elapsed = 0;
      this.clock = 0;
      this.units = [];
      this.projectiles = [];
      this.effects = [];
      this.events = [];
      this.schedule = [];
      this.spawned = 0;
      this.kills = 0;
      this.escaped = 0;
      this.damageDone = 0;
      this.telemetry = newTelemetry();
      this.nextTowerId = 1;
      this.nextId = 1;
    }

    emit(type, details = {}) {
      this.events.push({ type, ...details });
    }

    effect(type, details) {
      if (this.effects.length < 220) this.effects.push({ type, age: 0, ...details });
    }

    canAfford(price) { return this.testMode || this.credits >= price; }

    applyCredits(amount) {
      if (!this.testMode) this.credits += amount;
    }

    combatIncome(amount,kind = 'kill') {
      const previous = Math.round(amount * (this.wave >= stageTwo.start ? stageTwo.income : 1));
      const payout = Math.round(previous * economy[kind]);
      return kind === 'kill' ? Math.round(payout * economy.killBoost) : payout;
    }

    get towerValue() {
      let value = 0;
      for (const pad of this.deployed) value += pad.tower.invested;
      return value;
    }

    trackTower(pad) {
      const {id,type,level,invested} = pad.tower;
      const record = this.telemetry.towers.get(id) ?? { id, type, cell: pad.code, damage: 0, kills: 0 };
      this.telemetry.towers.set(id,{ ...record, level, invested, deployed: true });
    }

    trackEnemyExit(unit,killed) {
      const time = this.telemetry.seconds-unit.bornAt;
      const stats = this.telemetry.enemies.get(unit.type) ?? { type: unit.type, killed: 0, escaped: 0, lifetimeSeconds: 0 };
      stats[killed ? 'killed' : 'escaped']++;
      stats.lifetimeSeconds += time;
      this.telemetry.enemies.set(unit.type,stats);
      this.telemetry[killed ? 'killedLife' : 'escapedLife'] += time;
    }

    waveStats(outcome) {
      const start = this.waveReport.baseline, t = this.telemetry;
      const resolved = this.kills + this.escaped - start.resolved;
      return {
        wave: this.wave, outcome, combatSeconds: t.seconds-start.seconds, spawned: t.spawned-start.spawned,
        damage: this.damageDone-start.damage, kills: this.waveReport.kills, escaped: this.waveReport.leaks.length,
        averageEnemySeconds: average(t.killedLife+t.escapedLife-start.life,resolved),
        earnedCredits: t.killCredits+t.waveCredits-start.earned, startTowerValue: start.towerValue,
        towerValue: this.towerValue, integrity: this.integrity
      };
    }

    battleStats() {
      const t = this.telemetry;
      return {
        mode: this.testMode ? 'test' : this.endless ? 'endless' : 'campaign', wave: this.wave, phase: this.phase,
        healthMultiplier: this.healthMultiplier, combatSeconds: t.seconds, damage: this.damageDone,
        supportDamage: t.supportDamage, mineDamage: t.mineDamage, spawned: t.spawned, kills: this.kills,
        escaped: this.escaped, unresolvedEnemies: t.spawned-this.kills-this.escaped,
        averageEnemySeconds: average(t.killedLife+t.escapedLife,this.kills+this.escaped),
        averageKilledSeconds: average(t.killedLife,this.kills), averageEscapedSeconds: average(t.escapedLife,this.escaped),
        earnedCredits: t.killCredits+t.waveCredits, killCredits: t.killCredits, waveCredits: t.waveCredits,
        refunds: t.refunds, credits: this.testMode ? null : this.credits, towerValue: this.towerValue,
        integrity: this.integrity, towers: [...t.towers.values()].map(item=>({...item})),
        enemyTypes: [...t.enemies.values()].map(item=>({ ...item, averageSeconds: average(item.lifetimeSeconds,item.killed+item.escaped) })),
        waves: this.phase === 'active' ? [...t.waves,this.waveStats('inProgress')] : [...t.waves]
      };
    }

    setHealthMultiplier(value) {
      if (!this.testMode || !validHealth(value)) return false;
      this.healthMultiplier = value;
      for (const unit of this.units) {
        const healthRatio = unit.hp / unit.maxHp;
        unit.maxHp = this.enemyHealth(unit.type);
        unit.hp = healthRatio ? Math.max(1,Math.round(unit.maxHp * healthRatio)) : 0;
      }
      return true;
    }

    available(spec) {
      return !spec.unlockWave || this.testMode || this.wave + Number(this.phase === 'ready') >= spec.unlockWave;
    }

    buildWork(cell,type) {
      const spec = works[type], road = cellAt(cell?.col,cell?.row);
      if (!Object.hasOwn(works,type) || !this.canEdit || !this.available(spec) || !road?.road || road.edge || this.works.has(road.code) || !this.canAfford(spec.cost)) return false;
      this.applyCredits(-spec.cost);
      const progress = roadProgress.get(road.code);
      this.works.set(road.code,{ ...road, ...pointAt(progress), progress, type, hp: spec.durability, readyAt: this.clock + (spec.armTime ?? 0) });
      this.emit('workBuilt',{ cell: road.code, unit: type });
      return true;
    }

    sellWork(code) {
      const work = this.works.get(code);
      if (!this.canEdit || !work) return false;
      const value = Math.floor(works[work.type].cost*.65);
      this.works.delete(code);
      this.applyCredits(value);
      if (!this.testMode) this.telemetry.refunds += value;
      this.emit('sold',{ cell: code, value });
      return true;
    }

    requestSupport(x,y) {
      if (this.phase !== 'active' || !this.supportReady || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > map.width || y < 0 || y > map.height) return false;
      this.supportReady = false;
      this.strike = { x,y, landAt: this.clock + support.delay };
      this.emit('supportCalled');
      return true;
    }

    build(index, type) {
      const pad = this.pads[index], spec = towers[type];
      if (!this.canEdit || !pad || pad.tower || !Object.hasOwn(towers, type) || !this.available(spec) || !this.canAfford(spec.cost)) return false;
      this.applyCredits(-spec.cost);
      pad.tower = { id: this.nextTowerId++, type, level: 1, invested: spec.cost, aim: -Math.PI / 2, cooldown: 0 };
      this.deployed.add(pad);
      this.trackTower(pad);
      if (type === 'sentinel') this.radars.add(pad);
      this.effect('build', { x: pad.x, y: pad.y, color: spec.color, ttl: .55 });
      this.emit('built', { index, unit: type });
      return true;
    }

    get canEdit() { return this.phase === 'ready' || this.phase === 'active'; }

    upgradePrice(index) {
      const tower = this.pads[index]?.tower;
      if (!tower || tower.level === upgrade.length) return null;
      return Math.round(towers[tower.type].cost * upgrade[tower.level].price);
    }

    improve(index) {
      const price = this.upgradePrice(index);
      if (!this.canEdit || price === null || !this.canAfford(price)) return false;
      const pad = this.pads[index];
      this.applyCredits(-price);
      pad.tower.level++;
      pad.tower.invested += price;
      this.trackTower(pad);
      this.effect('build', { x: pad.x, y: pad.y, color: towers[pad.tower.type].color, ttl: .65 });
      this.emit('upgraded', { index, level: pad.tower.level });
      return true;
    }

    sellValue(index) {
      const tower = this.pads[index]?.tower;
      return tower ? Math.floor(tower.invested * .65) : 0;
    }

    sell(index) {
      const value = this.sellValue(index);
      if (!this.canEdit || !value) return false;
      const pad = this.pads[index];
      this.telemetry.towers.get(pad.tower.id).deployed = false;
      pad.tower = null;
      this.deployed.delete(pad);
      this.radars.delete(pad);
      this.applyCredits(value);
      if (!this.testMode) this.telemetry.refunds += value;
      this.emit('sold', { index, value });
      return true;
    }

    stats(type, level = 1, control) {
      const spec = towers[type], rank = upgrade[level - 1];
      return {
        range: (spec.range + rank.range) * (1 + (control?.rangeBoost ?? 0)),
        minRange: spec.minRange ?? 0,
        damage: Math.round(spec.damage * rank.power),
        rounds: towerModel(type,level).barrels?.length ?? 1,
        interval: spec.interval / rank.speed,
        rangeBoost: spec.target === 'support' ? spec.boost + rank.boost : 0,
        damageBoost: spec.target === 'support' ? spec.damageBoostPerLevel * level : control?.damageBoost ?? 0
      };
    }

    fireControl(pad) {
      let strongest;
      for (const radar of this.radars) {
        const stats = this.stats(radar.tower.type, radar.tower.level);
        if (stats.rangeBoost > (strongest?.rangeBoost ?? 0) && distance(radar, pad) <= stats.range) {
          strongest = stats;
        }
      }
      return strongest;
    }

    padStats(pad) {
      const { type, level } = pad.tower;
      return this.stats(type, level, type === 'sentinel' ? undefined : this.fireControl(pad));
    }

    waveInfo(number) {
      return waves[number-1] ?? (this.endless && number > waves.length ? endlessWave(number) : null);
    }

    enterEndless() {
      if (this.testMode || this.phase !== 'won' || this.endless || this.wave !== waves.length) return false;
      this.endless = true;
      this.phase = 'ready';
      return true;
    }

    retryTest() {
      const save = this.testCheckpoint;
      if (!this.testMode || !save) return false;
      for (const pad of this.deployed) pad.tower = null;
      this.deployed.clear();
      this.radars.clear();
      this.telemetry = newTelemetry();
      for (const [index,tower] of save.towers) {
        const pad = this.pads[index];
        pad.tower = { ...tower };
        this.deployed.add(pad);
        this.trackTower(pad);
        if (tower.type === 'sentinel') this.radars.add(pad);
      }
      this.works = new Map(save.works.map(work=>[work.code,{ ...work }]));
      this.integrity = save.integrity;
      this.nextTowerId = save.nextTowerId;
      this.clock = save.clock;
      this.units = [];
      this.projectiles = [];
      this.effects = [];
      this.events = [];
      this.kills = this.escaped = this.damageDone = 0;
      this.nextId = 1;
      this.phase = 'ready';
      return this.startWave();
    }

    startWave() {
      if (this.phase !== 'ready') return false;
      const number = this.testWave ?? this.wave+1;
      const info = this.waveInfo(number);
      if (!info) return false;
      if (this.testMode) this.testCheckpoint = {
        towers: [...this.deployed].map(pad=>[pad.padIndex,{ ...pad.tower }]),
        works: [...this.works.values()].map(work=>({ ...work })),
        integrity: this.integrity,
        nextTowerId: this.nextTowerId,
        clock: this.clock
      };
      this.currentWave = info;
      this.schedule = waveSchedule(info);
      this.bossArrival = null;
      this.bossUnits = [];
      this.bossCount = waveBossCount(info,this.schedule);
      this.wave = number;
      this.spawned = 0;
      this.elapsed = 0;
      this.paused = false;
      this.supportReady = true;
      this.strike = null;
      this.waveReport = { wave: this.wave, startIntegrity: this.integrity, damage: {}, leaks: [], kills: 0, minesUsed: 0, barricadesLost: 0 };
      const t = this.telemetry;
      this.waveReport.baseline = { seconds: t.seconds, spawned: t.spawned, resolved: this.kills+this.escaped, life: t.killedLife+t.escapedLife,
        damage: this.damageDone, earned: t.killCredits+t.waveCredits, towerValue: this.towerValue };
      for (const pad of this.deployed) pad.tower.cooldown = 0;
      this.phase = 'active';
      this.emit('wave', { wave: this.wave, brief: info.brief });
      return true;
    }

    togglePause() {
      if (this.phase !== 'active') return false;
      this.paused = !this.paused;
      return true;
    }

    enemyHealth(type,number = this.wave,info = this.currentWave) {
      return Math.max(1,Math.round(enemies[type].hp * (1 + Math.max(0,number - 1) * .072) * (info?.healthScale ?? 1) * (number >= stageTwo.start ? stageTwo.health : stageOne.health) * this.healthMultiplier));
    }

    spawn(type) {
      const spec = enemies[type];
      const hp = this.enemyHealth(type);
      const unit = {
        id: this.nextId++, type, hp, maxHp: hp, bornAt: this.telemetry.seconds, speed: spec.speed * Math.min(1.48,1 + Math.max(0,this.wave - 1) * .012) * (this.wave >= stageTwo.start ? stageTwo.speed : 1),
        progress: 0, revealed: !spec.hidden, flash: 0, ...pointAt(0)
      };
      this.units.push(unit);
      this.telemetry.spawned++;
      if (this.currentWave?.boss === type) {
        this.bossUnits.push(unit);
        this.emit('boss',{ unit: type });
      }
      return unit;
    }

    chooseTarget(pad, range, category, minRange = 0) {
      let target = null, best = -1;
      for (const unit of this.units) {
        const spec = enemies[unit.type];
        if (unit.hp <= 0 || !unit.revealed || spec.category !== category) continue;
        const gap = distance(pad,unit);
        if (gap < minRange || gap > range) continue;
        const priority = Number(pad.tower?.type === 'atgm' && tankArmor.has(spec.armor));
        if (priority > best || priority === best && unit.progress > target.progress) {
          target = unit;
          best = priority;
        }
      }
      return target;
    }

    hurt(unit, amount, kind, source, towerId, damageBoost = 0) {
      if (unit.hp <= 0) return;
      const dealt = Math.max(1, Math.round(amount * data.damage[kind][enemies[unit.type].armor] * (1 + damageBoost)));
      const applied = Math.min(dealt,unit.hp);
      this.damageDone += applied;
      const gun = this.telemetry.towers.get(towerId);
      if (gun) gun.damage += applied;
      if (kind === 'mine') this.telemetry.mineDamage += applied;
      if (source === support.name) this.telemetry.supportDamage += applied;
      if (this.waveReport) {
        if (source) this.waveReport.damage[source] = (this.waveReport.damage[source] ?? 0) + applied;
        unit.lastHitCell = cellAt(Math.floor(unit.x/cellSize),Math.floor(unit.y/cellSize))?.code;
      }
      unit.hp = Math.max(0, unit.hp - dealt);
      unit.flash = .11;
      if (unit.hp) return;
      const reward = this.combatIncome(enemies[unit.type].reward);
      this.kills++;
      this.trackEnemyExit(unit,true);
      if (gun) gun.kills++;
      if (!this.testMode) this.telemetry.killCredits += reward;
      if (this.waveReport) this.waveReport.kills++;
      this.applyCredits(reward);
      if (enemies[unit.type].boss) {
        this.effect('impact', { x: unit.x, y: unit.y, radius: 54, color: '#ffc27f', ttl: .7 });
      }
      this.effect('wreck', { x: unit.x, y: unit.y, color: '#ffb587', ttl: .65 });
      if (!this.testMode) this.effect('reward', { x: unit.x, y: unit.y, value: reward, color: '#9de5bb', ttl: .84 });
    }

    fire(pad, target, stats) {
      const tower = pad.tower, spec = towers[tower.type];
      const model = towerModel(tower.type,tower.level);
      const muzzle = (model.muzzle ?? 16) * map.towerScale / .94;
      const bullet = spec.delivery === 'bullet';
      const direct = bullet || spec.delivery === 'missile';
      const targetSpeed = target.moveSpeed ?? target.speed;
      let intercept = target;
      if (direct) for (let i = 0; i < 3; i++) {
        const flight = Math.max(0,distance(pad,intercept)-muzzle) / spec.velocity;
        intercept = pointAt(target.progress + targetSpeed * flight);
      }
      const aim = Math.atan2(intercept.y-pad.y,intercept.x-pad.x);
      const dx = Math.cos(aim), dy = Math.sin(aim);
      tower.aim = aim;
      tower.cooldown = stats.interval;
      const barrels = model.barrels ?? [0];
      for (const [index,offset] of barrels.entries()) {
        const spread = offset * map.towerScale;
        const x = pad.x + dx*muzzle - dy*spread, y = pad.y + dy*muzzle + dx*spread;
        const damage = Math.floor(stats.damage / barrels.length) + Number(index < stats.damage % barrels.length);
        this.effect('muzzle', { x, y, angle: aim, color: bullet ? '#e5b67e' : spec.color, ttl: bullet ? .08 : .12 });
        const shot = { x, y, age: 0, kind: spec.kind, category: spec.target, damage, damageBoost: stats.damageBoost, color: spec.color, delivery: spec.delivery, towerId: tower.id, source: pad.code + ' ' + model.name };
        if (direct) {
          const angle = Math.atan2(intercept.y-y,intercept.x-x);
          const travel = distance({ x,y },intercept) + 22;
          this.projectiles.push({ ...shot, dx: Math.cos(angle), dy: Math.sin(angle), travel, velocity: spec.velocity, angle, level: tower.level });
          continue;
        }
        const flight = spec.delivery === 'shell' ? .36 : .57;
        const spacing = spec.delivery === 'rocket' ? 30 : 19;
        const end = pointAt(target.progress + targetSpeed * flight + (index - (barrels.length-1)/2) * spacing);
        this.projectiles.push({ ...shot, fromX: x, fromY: y, endX: end.x, endY: end.y, flight,
          blast: spec.blast, angle: Math.atan2(end.y-y,end.x-x) });
      }
    }

    advanceDirect(shot, dt) {
      const travel = Math.min(shot.travel, shot.velocity * dt);
      let first = null, entry = Infinity;
      for (const unit of this.units) {
        const spec = enemies[unit.type];
        if (!unit.hp || spec.category !== shot.category) continue;
        const x = unit.x - shot.x, y = unit.y - shot.y;
        const across = Math.abs(x * shot.dy - y * shot.dx);
        const radius = spec.size * .61;
        if (across > radius) continue;
        const along = x * shot.dx + y * shot.dy;
        const half = Math.sqrt(radius * radius - across * across);
        const hit = Math.max(0, along - half);
        if (along + half >= 0 && hit <= travel && hit < entry) {
          first = unit;
          entry = hit;
        }
      }
      const stride = first ? entry : travel;
      shot.x += shot.dx * stride;
      shot.y += shot.dy * stride;
      shot.travel -= stride;
      if (!first) return shot.travel > 0;
      if (shot.delivery === 'missile') this.effect('impact', { x: shot.x, y: shot.y, radius: 19, color: shot.color, ttl: .28 });
      else this.effect('spark', { x: shot.x, y: shot.y, angle: shot.angle, color: '#f2bf8e', ttl: .16 });
      this.hurt(first,shot.damage,shot.kind,shot.source,shot.towerId,shot.damageBoost);
      return false;
    }

    advanceProjectile(shot, dt) {
      shot.age += dt;
      if (shot.delivery === 'bullet' || shot.delivery === 'missile') return this.advanceDirect(shot,dt);
      const fraction = Math.min(1, shot.age / shot.flight);
      shot.x = shot.fromX + (shot.endX - shot.fromX) * fraction;
      shot.y = shot.fromY + (shot.endY - shot.fromY) * fraction;
      if (fraction < 1) return true;
      this.blastAt({ x: shot.endX, y: shot.endY },shot.blast,shot.damage,shot.kind,shot.color,shot.source,.66,shot.towerId,shot.damageBoost);
      return false;
    }

    blastAt(point,radius,damage,kind,color,source,falloff,towerId,damageBoost) {
      this.effect('impact',{ x: point.x,y: point.y,radius,color,ttl: .48 });
      for (const unit of this.units) {
        if (!unit.hp || enemies[unit.type].category !== 'ground') continue;
        const gap = distance(point,unit);
        if (gap < radius) this.hurt(unit,damage * (1 - falloff*gap/radius),kind,source,towerId,damageBoost);
      }
    }

    advanceGround(unit,dt) {
      const cell = cellAt(Math.floor(unit.x/cellSize),Math.floor(unit.y/cellSize));
      const obstacle = this.works.get(cell?.code);
      if (obstacle?.type !== 'barricade') {
        unit.progress += unit.speed*dt;
        return;
      }
      const spec = works.barricade;
      const slowedTime = Math.min(dt,obstacle.hp/spec.wearPerSecond);
      unit.progress += unit.speed*(dt - slowedTime*(1-spec.slow));
      obstacle.hp = Math.max(0,obstacle.hp - dt*spec.wearPerSecond);
      if (obstacle.hp === 0) {
        this.works.delete(obstacle.code);
        if (this.waveReport) this.waveReport.barricadesLost++;
        this.effect('wreck',{ x: obstacle.x,y: obstacle.y,color: spec.color,ttl: .5 });
        this.emit('barricadeBroken',{ cell: obstacle.code });
      }
    }

    resolveWorks() {
      const mine = works.mine;
      for (const work of this.works.values()) {
        if (work.type !== 'mine' || this.clock < work.readyAt) continue;
        const trigger = this.units.some(unit => unit.hp > 0 && tankArmor.has(enemies[unit.type].armor) && Math.abs(unit.progress-work.progress) <= mine.triggerRadius);
        if (!trigger) continue;
        this.works.delete(work.code);
        this.blastAt(work,mine.blast,mine.damage,'mine',mine.color,work.code+' 反坦克地雷',.30);
        if (this.waveReport) this.waveReport.minesUsed++;
        this.emit('mineFired',{ cell: work.code });
      }
      if (this.strike && this.clock >= this.strike.landAt) {
        this.blastAt(this.strike,support.blast,support.damage,'shell',support.color,support.name,.52);
        this.strike = null;
      }
    }

    resolveWave() {
      if (this.phase !== 'active') return;
      this.projectiles = [];
      this.strike = null;
      this.supportReady = false;
      this.lastReport = { ...this.waveReport, integrity: this.integrity };
      if (this.integrity === 0) {
        this.telemetry.waves.push(this.waveStats('lost'));
        this.phase = 'lost';
        this.emit('finished', { won: false });
        return;
      }
      if (this.testMode) {
        this.telemetry.waves.push(this.waveStats('cleared'));
        this.phase = 'won';
        this.emit('finished',{ won: true });
        return;
      }
      const bonus = this.combatIncome(this.currentWave.bonus,'wave');
      this.applyCredits(bonus);
      this.telemetry.waveCredits += bonus;
      this.telemetry.waves.push(this.waveStats('cleared'));
      if (!this.endless && this.wave === waves.length) {
        this.phase = 'won';
        this.emit('finished', { won: true, bonus });
      } else {
        this.phase = 'ready';
        this.emit('cleared', { wave: this.wave, bonus });
      }
    }

    finishSpawnSequence() {
      const type = this.currentWave.boss;
      if (!type || this.bossUnits.length || this.currentWave.mixedBoss) {
        this.resolveWave();
      } else if (this.bossArrival === null) {
        this.bossArrival = this.elapsed + 2.4;
        this.emit('bossWarning', { unit: type });
      } else if (this.elapsed >= this.bossArrival) {
        this.spawn(type);
      }
    }

    step(dt) {
      if (this.paused || this.phase === 'won' || this.phase === 'lost') return;
      this.clock += dt;
      this.effects = this.effects.filter(fx => (fx.age += dt) < fx.ttl);
      if (this.phase !== 'active') return;
      this.elapsed += dt;
      this.telemetry.seconds += dt;
      while (this.schedule[this.spawned]?.time <= this.elapsed) this.spawn(this.schedule[this.spawned++].type);

      const scanners = [...this.radars].map(pad => ({ pad, radius: this.padStats(pad).range }));
      this.units = this.units.filter(unit => {
        const before = unit.progress;
        if (enemies[unit.type].category === 'ground') this.advanceGround(unit,dt);
        else unit.progress += unit.speed * dt;
        if (dt > 0) unit.moveSpeed = (unit.progress-before)/dt;
        Object.assign(unit, pointAt(unit.progress));
        unit.flash = Math.max(0, unit.flash - dt);
        if (unit.progress >= pathLength) {
          this.escaped++;
          this.trackEnemyExit(unit,false);
          this.waveReport?.leaks.push({ type: unit.type, lastHit: unit.lastHitCell });
          this.integrity = Math.max(0, this.integrity - enemies[unit.type].leak);
          this.emit('leak', { unit: unit.type, loss: enemies[unit.type].leak });
          this.effect('impact', { x: exit.x, y: exit.y, radius: 35, color: '#fb8f79', ttl: .45 });
          return false;
        }
        unit.revealed = !enemies[unit.type].hidden || scanners.some(({ pad, radius }) => distance(pad, unit) <= radius);
        return true;
      });
      if (!this.integrity) {
        this.resolveWave();
        return;
      }
      this.resolveWorks();
      this.projectiles = this.projectiles.filter(shot => this.advanceProjectile(shot, dt));
      for (const pad of this.deployed) {
        const tower = pad.tower;
        const spec = towers[tower.type];
        if (spec.target === 'support') continue;
        tower.cooldown = Math.max(0, tower.cooldown - dt);
        if (tower.cooldown > 0) continue;
        const stats = this.padStats(pad);
        const target = this.chooseTarget(pad,stats.range,spec.target,stats.minRange);
        if (target) this.fire(pad, target, stats);
      }
      this.units = this.units.filter(unit => unit.hp > 0);
      if (this.spawned === this.schedule.length && this.units.length === 0) this.finishSpawnSequence();
    }
  }

  globalThis.IronEngine = { Battle, cells, cellAt, entrance, exit, roadD, pointAt, pathLength, waveSchedule, waveBossCount, stepSeconds: 1 / 60 };
})();
