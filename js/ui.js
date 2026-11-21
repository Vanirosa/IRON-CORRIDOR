/* 事件输入、界面状态和固定步长时钟。 */
(() => {
  const { towers, towerModel, enemies, armorNames, damage, waves, works, support, stageOne, stageTwo, map, start, upgrade } = IronData;
  const { Battle, cellAt, waveSchedule, waveBossCount, stepSeconds } = IronEngine;
  const $ = id => document.getElementById(id);
  const board = $('battlefield');
  board.width = map.width * 1.5;
  board.height = map.height * 1.5;
  IronArt.drawMap($('ground'),$('roadmap'));
  const draw = IronArt.createRenderer(board);
  const shop = $('shop');
  const workShop = $('work-shop');
  const gear = { ...towers, ...works };
  const gearKeys = Object.keys(gear);
  const operations = $('operations');
  const records = $('records-dialog');
  const combatLog = new IronCombatLog(records);
  const inspect = $('inspect');
  const feedback = $('deploy-feedback');
  let feedbackAnimation;
  const intel = $('intel');
  const end = $('end');
  const confirm = $('confirm');
  const testing = $('testing'), testEnabled = $('test-enabled'), testHp = $('test-hp'), testWave = $('test-wave');
  for (const [index,info] of waves.entries()) testWave.add(new Option('第 ' + (index+1) + ' 波 · ' + info.name,String(index+1)));
  const towerKeys = Object.keys(towers);
  const rankMarks = ['I','II','III','IV','V'];
  const initialMessage = '建议在 H12 放链式机炮并升至 II 级，再在 H11 部署帕拉丁火炮。';

  let game = new Battle();
  let activeType = null;
  let selection = null, selectedWork = null, hover = null, keyboardCell = cellAt(3,5);
  let speed = 1;
  let previousFrame, accumulator = 0;
  let previousWave = '', previousInspection = '', previousBoss = '';

  for (const [index,type] of gearKeys.entries()) {
    const spec = gear[type];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.unit = type;
    card.style.setProperty('--tone', spec.color);
    card.setAttribute('aria-keyshortcuts', String(index + 1));
    card.title = spec.desc;
    card.innerHTML = `
      <canvas width="96" height="80" aria-hidden="true"></canvas>
      <span class="card-copy"><code>${spec.code}</code><strong class="card-name">${spec.name}</strong><span class="card-role">${spec.role}</span></span>
      <span class="price"><i aria-hidden="true">◈</i><span>${spec.cost}</span></span>`;
    if (works[type]) {
      workShop.append(card);
      IronArt.workPortrait(card.querySelector('canvas'),type);
    } else {
      shop.append(card);
      IronArt.portrait(card.querySelector('canvas'),type);
    }
  }

  function towerStatsMarkup(spec, stats) {
    const radar = spec.target === 'support';
    const bonus = stats.damageBoost ? `<span>${radar ? '友军' : '雷达'}最终伤害 <strong>+${Math.round(stats.damageBoost * 100)}%</strong></span>` : '';
    const values = radar
      ? `<span>扫描半径 <strong>${Math.round(stats.range)}</strong></span><span>友军射程 <strong>+${Math.round(stats.rangeBoost * 100)}%</strong></span>`
      : `<span>射程 <strong>${stats.minRange ? stats.minRange + '–' : ''}${Math.round(stats.range)}</strong></span>
        <span>${stats.rounds > 1 ? '齐射伤害' : '伤害'} <strong>${stats.damage}</strong>${stats.rounds > 1 ? ' · ' + stats.rounds + ' 发' : ''}</span>
        <span>间隔 <strong>${stats.interval.toFixed(2)}s</strong></span>`;
    const splash = spec.blast ? `<span>溅射半径 <strong>${spec.blast}</strong></span>` : '';
    return `<div class="tower-stats">${values}${splash}${bonus}</div>`;
  }

  function armorMatchups(kind) {
    const multipliers = damage[kind];
    if (!multipliers) return '';
    return `<div class="armor-matchups"><h4>护甲克制倍率</h4><dl>${Object.entries(armorNames).filter(([armor]) => Object.hasOwn(multipliers,armor)).map(([armor,name]) => {
      const multiplier = multipliers[armor];
      return `<div><dt>${name}</dt><dd class="${multiplier > 1 ? 'favored' : multiplier < 1 ? 'resisted' : ''}">×${multiplier}</dd></div>`;
    }).join('')}</dl></div>`;
  }

  for (const type of towerKeys) {
    const spec = towers[type];
    const family = document.createElement('article');
    family.className = 'intel-family';
    family.style.setProperty('--tone',spec.color);
    family.innerHTML = `<h4>${spec.name} <span>${spec.role} · 部署 ◈${spec.cost}</span></h4><div class="intel-ranks">${upgrade.map((_,index) => {
      const model = towerModel(type,index+1);

      const source = model.fictional ? '<span class="fictional">近未来虚构</span>'
        : `<a href="${model.source}" target="_blank" rel="noopener noreferrer">原型资料 ↗</a>`;
      return `<div class="intel-model${model.fictional ? ' ultimate' : ''}"><canvas width="104" height="64" aria-hidden="true"></canvas>
        <b>${rankMarks[index]} / ${model.code}</b>${towerStatsMarkup(spec,game.stats(type,index+1))}<p>${model.reference}</p>${source}</div>`;
    }).join('')}</div>${armorMatchups(spec.kind)}`;
    $('intel-towers').append(family);
    family.querySelectorAll('canvas').forEach((element,index) => IronArt.portrait(element,type,false,index+1));
  }

  for (const [type,spec] of Object.entries(enemies)) {
    const entry = document.createElement('article');
    entry.className = spec.boss ? 'intel-entry boss' : 'intel-entry';
    const summary = `${spec.category === 'air' ? '空中' : '地面'} · ${armorNames[spec.armor]} · 耐久 ${spec.hp} · 速度 ${spec.speed} · 漏防 -${spec.leak}`;
    const source = spec.source ? `<a href="${spec.source}" target="_blank" rel="noopener noreferrer">实车俯视照片 ↗</a>` : '';
    entry.innerHTML = `<canvas width="76" height="65" aria-hidden="true"></canvas><div><b>${spec.code}</b><strong>${spec.name}</strong><p>${summary}</p><p>${spec.desc}</p>${source}</div>`;
    $('intel-enemies').append(entry);
    IronArt.portrait(entry.querySelector('canvas'),type,true);
  }

  const digits = n => String(n).padStart(2,'0');
  const phaseText = { ready: '待部署', active: '敌袭进行中', paused: '战斗已暂停', won: '防守成功', lost: '防线失守' };

  function status(message, warning = false) {
    $('status').classList.toggle('warn',warning);
    $('status').querySelector('span').textContent = message;
  }

  function waveBrief() {
    const number = game.phase === 'ready' ? game.wave+1 : game.wave;
    const stamp = [game.phase,game.endless,game.testMode,number].join(':');
    if (stamp === previousWave) return;
    previousWave = stamp;
    const info = game.waveInfo(number);
    const totals = new Map();
    const units = waveSchedule(info);
    for (const {type} of units) if (type !== info.boss) totals.set(type,(totals.get(type) ?? 0) + 1);
    const tag = game.phase === 'ready' ? '预警' : game.phase === 'active' ? '战斗' : '战报';
    const boss = info.boss ? `<b class="boss">${enemies[info.boss].code} ×${waveBossCount(info,units)} · 首领</b>` : '';
    $('wave-brief').innerHTML = `<h3><span>${game.testMode ? '演练 ' : game.endless ? '无尽 ' : ''}${tag} ${digits(number)}</span>${info.name}</h3>
      <p>${info.brief}</p><div class="wave-mix">${[...totals].map(([type,count]) => `<b class="${enemies[type].category}">${enemies[type].code} ×${count}</b>`).join('')}${boss}</div>`;
  }

  const healthFormat = new Intl.NumberFormat('zh-CN');

  function showForecast() {
    const number = game.testWave ?? game.wave+1, info = game.waveInfo(number);
    if (!info || (!game.canEdit && !game.testMode)) return;
    const units = waveSchedule(info);
    const totals = new Map();
    for (const {type} of units) totals.set(type,(totals.get(type) ?? 0)+1);
    if (info.boss && !info.mixedBoss) totals.set(info.boss,waveBossCount(info,units));
    const air = units.filter(({type})=>enemies[type].category === 'air').length;
    const count = [...totals.values()].reduce((sum,n)=>sum+n,0);
    $('operations-title').textContent = '第 ' + number + ' 波 · ' + info.name;
    $('operations-body').innerHTML = `<p class="manual">${info.brief}</p>
      ${number >= stageTwo.start ? '<p class="ops-note">第二阶段 · 基础耐久 +' + Math.round((stageTwo.health-1)*100) + '% · 速度 +' + Math.round((stageTwo.speed-1)*100) + '% · 阶段额外收入 −' + Math.round((1-stageTwo.income)*100) + '%</p>' : '<p class="ops-note">第一阶段 · 基础耐久 +' + Math.round((stageOne.health-1)*100) + '%</p>'}
      <div class="ops-grid"><div class="ops-stat"><b>${count-air}</b>地面单位</div><div class="ops-stat"><b>${air}</b>空中单位</div><div class="ops-stat"><b>${info.groups.length}</b>出场批次</div></div>
      <h3>出场顺序</h3><div class="ops-list">${info.groups.map(([pattern,n,interval],i) => {
        const types = Array.isArray(pattern) ? pattern : [pattern];
        return `<div class="ops-row"><b>${digits(i+1)}</b>${types.map(type=>enemies[type].code).join(' → ')} · 共 ${n} 辆 / 架 · 间隔 ${interval.toFixed(2)} 秒</div>`;
      }).join('')}${info.boss && !info.mixedBoss ? '<div class="ops-row"><b>首领</b>常规部队离场后单独登场</div>' : ''}</div>
      <h3>单位情报</h3><div class="ops-list">${[...totals].map(([type,n]) => {
        const enemy = enemies[type];
        return `<div class="ops-row"><b>${enemy.name} ×${n}</b>每单位耐久 ${healthFormat.format(game.enemyHealth(type,number,info))} · ${enemy.desc}</div>`;
      }).join('')}</div>`;
    operations.showModal();
  }

  function showWaveReport() {
    const report = game.lastReport;
    if (!report) return;
    const leads = Object.entries(report.damage).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const leaks = new Map();
    for (const leak of report.leaks) {
      const key = enemies[leak.type].name + ' · ' + (leak.lastHit ? '最后交火 ' + leak.lastHit : '未受到火力拦截');
      leaks.set(key,(leaks.get(key) ?? 0)+1);
    }
    $('operations-title').textContent = '第 ' + report.wave + ' 波战报';
    $('operations-body').innerHTML = `<div class="ops-grid"><div class="ops-stat"><b>${report.kills}</b>击毁</div><div class="ops-stat"><b>${report.leaks.length}</b>突破</div><div class="ops-stat"><b>${report.startIntegrity} → ${report.integrity}</b>基地完整度</div><div class="ops-stat"><b>${report.minesUsed}</b>引爆地雷</div><div class="ops-stat"><b>${report.barricadesLost}</b>被摧毁的拒马</div></div>
      <h3>火力贡献</h3><div class="ops-list">${leads.map(([name,amount])=>`<div class="ops-row"><b>${name}</b>实际伤害 ${healthFormat.format(amount)}</div>`).join('') || '<p class="manual">本波没有记录到伤害。</p>'}</div>
      <h3>突破记录</h3><div class="ops-list">${[...leaks].map(([label,n])=>`<div class="ops-row"><b>×${n}</b>${label}</div>`).join('') || '<p class="manual">本波全数拦截。</p>'}</div>`;
    operations.showModal();
  }

  function updateBoss() {
    const meter = $('boss-meter');
    const type = game.phase === 'active' ? game.currentWave.boss : null;
    meter.hidden = !type;
    if (!type) {
      previousBoss = '';
      return;
    }
    const {bossUnits,bossCount,bossArrival,elapsed,currentWave} = game;
    const countdown = bossArrival === null ? null : Math.max(0,Math.ceil(bossArrival-elapsed));
    const stamp = [type,bossCount,countdown,...bossUnits.map(boss => boss.hp + '/' + boss.maxHp)].join(':');
    if (stamp === previousBoss) return;
    previousBoss = stamp;
    const waiting = countdown !== null ? countdown + ' 秒后进入战场'
      : currentWave.mixedBoss ? '随车队登场' : '常规部队结束后登场';
    meter.innerHTML = Array.from({length: bossCount},(_,index) => {
      const boss = bossUnits[index], rank = bossCount > 1 ? ' ' + (index+1) : '';
      const health = boss?.hp ? healthFormat.format(boss.hp) + ' / ' + healthFormat.format(boss.maxHp) : '已击毁';
      return `<div class="boss-row">
        <div class="boss-name"><b>首领${rank}</b><strong>${enemies[type].name}</strong></div>
        ${boss ? `<progress max="${boss.maxHp}" value="${boss.hp}" aria-label="首领${rank}生命值"></progress>` : ''}
        <span class="boss-status">${boss ? health : waiting}</span></div>`;
    }).join('');
  }

  const upgradeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 11 7-7 7 7M5 19l7-7 7 7"/></svg>';
  const dismantleIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7"/></svg>';
  const inspectPortrait = '<div class="inspect-portrait"><canvas width="432" height="256" aria-hidden="true"></canvas></div>';

  function dismantleButton(action, refund) {
    return `<button type="button" data-action="${action}" ${game.canEdit ? '' : 'disabled'}>
      ${dismantleIcon}<span>拆除${game.testMode ? '' : `<b>+${refund} CR</b>`}</span>
    </button>`;
  }

  function inspectPanel() {
    const road = game.works.get(selectedWork);
    const roadSpec = works[road?.type ?? activeType];
    if (roadSpec) {
      const stamp = [roadSpec.code,road?.code,game.canEdit,game.testMode].join(':');
      if (stamp === previousInspection) return;
      previousInspection = stamp;
      inspect.style.setProperty('--tone',roadSpec.color);
      inspect.innerHTML = `${inspectPortrait}<div class="inspect-head"><h3>${roadSpec.name}</h3><span class="flag">${road?.code ?? roadSpec.code}</span></div>
        <p>${roadSpec.desc}</p>${road?.type === 'barricade' ? '<div class="work-durability"><progress class="work-hp" aria-label="拒马耐久" max="' + roadSpec.durability + '" value="' + road.hp + '"></progress><b></b></div>' : ''}${road ? `<div class="inspect-actions">${dismantleButton('sell-work',Math.floor(roadSpec.cost*.65))}</div>` : '<small>选择未占用的道路格，外圈禁建。</small>'}`;
      IronArt.workPortrait(inspect.querySelector('.inspect-portrait canvas'),road?.type ?? activeType);
      return;
    }
    const pad = game.pads[selection];
    const tower = pad?.tower;
    const type = tower?.type ?? (towers[activeType] ? activeType : null);
    const price = tower ? game.upgradePrice(selection) : null;
    const affordable = price !== null && game.canAfford(price);
    const stats = tower ? game.padStats(pad) : type ? game.stats(type,1,pad && type !== 'sentinel' ? game.fireControl(pad) : undefined) : null;
    const stamp = [selection,type,activeType,tower?.level,affordable,stats?.range,stats?.damageBoost,game.canEdit,game.testMode].join(':');
    if (stamp === previousInspection) return;
    previousInspection = stamp;

    if (!type) {
      inspect.style.removeProperty('--tone');
      if (activeType === 'strike') {
        inspect.innerHTML = '<h3>炮火支援</h3><p>点击地图指定落点，1.25 秒后打击附近地面敌军。</p>';
        return;
      }
      inspect.innerHTML = `<div class="inspect-head"><h3>${pad ? '空置阵位' : '等待部署指令'}</h3><span class="flag">${pad?.code ?? 'DEPLOY'}</span></div>
        <p>先选择装备，再点击地图内侧空格。点击已部署的炮塔可以查看五级外观、升级或拆除。</p>
        <small>炮塔和雷达都可在战斗期间部署。</small>`;
      return;
    }
    const spec = towers[type];
    const level = tower?.level ?? 1;
    const model = towerModel(type,level);
    const next = price === null ? null : towerModel(type,level+1);

    const actions = tower ? `<div class="inspect-actions">
        <button type="button" data-action="upgrade" ${!game.canEdit || !affordable ? 'disabled' : ''}>
          ${upgradeIcon}<span>${next ? '升至 ' + rankMarks[level] : '已满级'}${next && !game.testMode ? `<b>◈ ${price}</b>` : ''}</span>
        </button>
        ${dismantleButton('sell',game.sellValue(selection))}
      </div>` : '<small>点击空置阵位部署 · 悬停预览覆盖范围</small>';
    const models = upgrade.map((_,index) => {
      const item = towerModel(type,index+1);
      return `<li class="tier-chip${item.fictional ? ' ultimate' : ''}" ${level === index+1 ? 'aria-current="step"' : ''} title="${item.reference}">
        <canvas width="76" height="58" aria-hidden="true"></canvas><b>${item.code}</b><span>LV.${rankMarks[index]}</span></li>`;
    }).join('');
    inspect.style.setProperty('--tone',spec.color);
    inspect.innerHTML = `${inspectPortrait}<div class="inspect-head"><h3>${model.name}</h3><span class="flag">${tower ? pad.code + ' / LV.' + level : model.code}</span></div>
      <p>${level === 1 ? spec.desc : model.reference}</p>${towerStatsMarkup(spec,stats)}${armorMatchups(spec.kind)}
      <h4 class="tier-title">升级路线</h4>
      <ol class="tier-tree" aria-label="五级升级路线">${models}</ol>
      ${next ? `<small class="next-rank">${next.fictional ? '终极升级' : '下一阶'} ${next.name}</small>` : ''}${actions}`;
    IronArt.portrait(inspect.querySelector('.inspect-portrait canvas'),type,false,level);
    inspect.querySelectorAll('.tier-chip canvas').forEach((element,index) => IronArt.portrait(element,type,false,index+1));
  }

  function updateWorkHealth() {
    const work = game.works.get(selectedWork);
    const progress = inspect.querySelector('.work-hp');
    if (work?.type !== 'barricade' || !progress) return;
    const hp = Math.ceil(work.hp), label = '耐久 ' + hp + ' / ' + works.barricade.durability;
    if (progress.value !== hp) progress.value = hp;
    if (progress.nextElementSibling.textContent !== label) progress.nextElementSibling.textContent = label;
  }

  const creditLabel = () => game.testMode ? '∞' : String(game.credits);

  function update() {
    $('credits').textContent = creditLabel();
    const testButton = $('test-open');
    testButton.setAttribute('aria-pressed',String(game.testMode));
    testButton.textContent = game.testMode ? '测试 #' + game.testWave : '测试模式';
    testButton.title = game.testMode ? '第 ' + game.testWave + ' 波 · 敌军血量 ×' + game.healthMultiplier : '选择波次、无限军费和血量倍率';
    $('integrity').textContent = game.integrity;
    $('health-fill').style.width = game.integrity / start.integrity * 100 + '%';
    $('wave').textContent = digits(game.testWave ?? game.wave);
    $('wave-total').textContent = '/ ' + (game.endless ? '∞' : digits(waves.length));
    $('wave-mode').hidden = !game.endless && !game.testMode;
    $('wave-mode').textContent = game.testMode ? '测试' : '无尽';
    const phase = game.paused ? 'paused' : game.phase;
    if ($('phase').dataset.phase !== phase) {
      $('phase').dataset.phase = phase;
      $('phase').innerHTML = '<i></i> ' + phaseText[phase];
    }
    const label = { ready: '开始第 ' + (game.wave + 1) + ' 波 <span>▶</span>', active: '暂停 <span>Ⅱ</span>', paused: '继续战斗 <span>▶</span>', won: '查看结算 <span>↗</span>', lost: '演习终止' }[phase];
    if ($('launch').innerHTML !== label) $('launch').innerHTML = label;
    $('launch').classList.toggle('running', phase === 'active');
    $('launch').disabled = game.phase === 'lost';
    for (const card of $('armory').querySelectorAll('[data-unit]')) {
      const type = card.dataset.unit, spec = gear[type], unlocked = game.available(spec);
      card.classList.toggle('poor',!game.canAfford(spec.cost));
      card.classList.toggle('locked',!unlocked);
      card.querySelector('.price span').textContent = unlocked ? (game.testMode ? '∞' : spec.cost) : '11 波解锁';
      card.setAttribute('aria-pressed',String(activeType === type));
      card.disabled = !game.canEdit || !unlocked;
    }
    $('forecast').disabled = !game.testMode && (!game.canEdit || !game.waveInfo(game.wave+1));
    $('forecast').textContent = game.testMode ? '本波情报' : '下波预警';
    $('test-retry').hidden = !game.testMode;
    $('test-retry').disabled = !game.testCheckpoint;
    $('wave-report').disabled = !game.lastReport;
    $('call-support').disabled = game.phase !== 'active' || !game.supportReady;
    $('call-support').setAttribute('aria-pressed',String(activeType === 'strike'));
    $('call-support').textContent = game.phase === 'active' && !game.supportReady ? '支援已用' : '炮火支援';
    waveBrief();
    inspectPanel();
    updateWorkHealth();
    updatePlacementCursor();
  }

  function showResult(won) {
    $('result-title').textContent = game.testMode ? '第 ' + game.testWave + ' 波演练' + (won ? '通过' : '失败') : won ? '战役通关' : game.endless ? '无尽防守结束' : '防线失守';
    $('result-desc').textContent = game.testMode ? '可恢复开波前的布防，再次演练本波。' : won ? `${enemies.dreadnought.name}与混编护卫已被消灭。` : '基地完整度归零，本次防守结束。';
    $('endless-start').hidden = $('endless-note').hidden = !won || game.testMode;
    $('test-change-wave').hidden = !game.testMode;
    $('replay').textContent = game.testMode ? '重试第 ' + game.testWave + ' 波 ↻' : '重新部署 ↻';
    $('result-stats').innerHTML = `<span><b>${game.testMode ? '第 ' + game.testWave + ' 波' : game.wave + ' / ' + (game.endless ? '∞' : waves.length)}</b>战斗波次</span>
      <span><b>${game.kills}</b>击毁单位</span><span><b>${game.escaped}</b>突破单位</span>`;
    end.showModal();
  }

  function consumeEvents() {
    const events = game.events.splice(0);
    if (!events.length) return false;
    for (const event of events) {
      if ((event.type === 'cleared' || event.type === 'finished') && activeType === 'strike') activeType = null;
      if (event.type === 'wave' || event.type === 'cleared' || event.type === 'finished') combatLog.save(game);
      if (event.type === 'wave') status('第 ' + event.wave + ' 波开始。' + event.brief);
      if (event.type === 'bossWarning') status('常规部队已离场。' + enemies[event.unit].name + '即将登场。',true);
      if (event.type === 'workBuilt') status(event.cell + ' 已布设' + works[event.unit].name + '。');
      if (event.type === 'mineFired') {
        if (selectedWork === event.cell) selectedWork = null;
        status(event.cell + ' 反坦克地雷已引爆。');
      }
      if (event.type === 'barricadeBroken') {
        if (selectedWork === event.cell) selectedWork = null;
        status(event.cell + ' 铁拒马耐久耗尽，已摧毁。',true);
      }
      if (event.type === 'supportCalled') status('炮火支援已确认，1.25 秒后打击。');
      if (event.type === 'boss') status(enemies[event.unit].name + '已进入战场。',true);
      if (event.type === 'built') status(game.pads[event.index].code + ' 已部署 ' + towers[event.unit].name + '。');
      if (event.type === 'upgraded') {
        const pad = game.pads[event.index];
        status(pad.code + ' 已升级为 ' + towerModel(pad.tower.type,event.level).name + '（LV.' + event.level + '）。');
      }
      if (event.type === 'sold') status((event.cell ?? game.pads[event.index].code) + (game.testMode ? ' 已拆除。' : ' 已拆除，回收 ' + event.value + ' CR。'));
      if (event.type === 'leak') status(enemies[event.unit].code + ' 突破防线，基地完整度 -' + event.loss + '。',true);
      if (event.type === 'cleared') status('第 ' + event.wave + ' 波结束。' + (game.testMode ? '' : '获得补给 ' + event.bonus + ' CR。') + '可布防后开启下一波。' + (event.wave === 10 ? '反坦克塔和道路工事已解锁。' : ''));
      if (event.type === 'finished') {
        status(game.testMode ? '本波演练结束。可以重试或选择波次。' : event.won ? '演习完成，防线仍在。' : '基地失守，点击右上方的 ↻ 可以重新部署。',!event.won);
        showResult(event.won);
      }
    }
    return true;
  }

  function reset(testMode = game.testMode, healthMultiplier = game.healthMultiplier, number = game.testWave ?? 1) {
    combatLog.save(game);
    combatLog.reset();
    game = new Battle({ testMode, healthMultiplier, testWave: number });
    activeType = null;
    selection = selectedWork = null;
    setHover(null);
    keyboardCell = cellAt(3,5);
    accumulator = 0;
    chooseSpeed(1);
    status(testMode ? '第 ' + game.testWave + ' 波演练待部署。' : initialMessage);
    update();
  }

  function chooseType(type) {
    if (!game.canEdit || !game.available(gear[type])) return;
    activeType = type;
    selection = selectedWork = null;
    status('已选择 ' + gear[type].name + (works[type] ? '。点击空道路格部署。' : '。点击空格部署一座。'));
    update();
  }

  function cellRestriction(cell) {
    if (cell.edge) return '边缘格';
    if (cell.road) return '道路格';
    return '';
  }

  function updatePlacementCursor() {
    board.dataset.placing = String(Boolean(activeType));
    if (hover && activeType === 'strike') board.style.cursor = 'crosshair';
    else if (game.pads[hover?.padIndex]?.tower || game.works.has(hover?.code)) board.style.cursor = 'pointer';
    else if (activeType && hover) {
      const legal = works[activeType] ? hover.road && !hover.edge : hover.padIndex !== null;
      board.style.cursor = legal ? 'crosshair' : 'not-allowed';
    }
    else board.style.cursor = '';
  }

  function setHover(cell) {
    hover = cell;
    const readout = $('cell-readout');
    readout.textContent = cell ? cell.code + ' · ' + (cellRestriction(cell) || '部署区') : map.columns + ' × ' + map.rows;
    readout.dataset.blocked = String(Boolean(cell?.edge || (cell?.road && !works[activeType] && activeType !== 'strike')));
    updatePlacementCursor();
  }

  function cancelSelection() {
    activeType = null;
    selection = selectedWork = null;
    setHover(null);
    feedbackAnimation?.cancel();
    feedback.hidden = true;
    status('已取消选择。');
    update();
  }

  function showDeployFeedback(message, cell, pointer) {
    feedbackAnimation?.cancel();
    feedback.textContent = message;
    feedback.hidden = false;
    const bounds = board.getBoundingClientRect();
    const x = pointer?.clientX ?? bounds.left + cell.x / map.width * bounds.width;
    const y = pointer?.clientY ?? bounds.top + cell.y / map.height * bounds.height;
    feedback.style.left = Math.max(8,Math.min(innerWidth-feedback.offsetWidth-8,x+13)) + 'px';
    feedback.style.top = Math.max(20,Math.min(innerHeight-feedback.offsetHeight-8,y-feedback.offsetHeight-12)) + 'px';
    const rise = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'translateY(-11px)';
    feedbackAnimation = feedback.animate([
      { opacity: 1 },
      { opacity: 1, offset: .55 },
      { opacity: 0, transform: rise }
    ],{ duration: 1120, easing: 'ease-out', fill: 'forwards' });
    feedbackAnimation.onfinish = () => { feedback.hidden = true; };
  }

  function clickCell(cell,pointer) {
    const type = activeType;
    activeType = null;
    if (type === 'strike') {
      if (cell) game.requestSupport(cell.x,cell.y);
      consumeEvents();
      update();
      return;
    }
    const pad = game.pads[cell?.padIndex], work = game.works.get(cell?.code);
    const existing = Boolean(pad?.tower || work);
    selection = pad?.padIndex ?? null;
    selectedWork = work?.code ?? null;
    let warning = '';
    if (existing) {
      if (type) warning = work ? '此格已有工事' : '此格已有炮塔';
      status(cell.code + ' · ' + (work ? works[work.type].name : towerModel(pad.tower.type,pad.tower.level).name) + '。');
    } else if (type) {
      const spec = gear[type], roadType = Boolean(works[type]);
      if (roadType && (!cell?.road || cell.edge)) warning = '工事只能部署在内侧道路格';
      else if (!roadType && !pad) warning = (cell ? cellRestriction(cell) + '，' : '') + '无法部署';
      else if (!game.canAfford(spec.cost)) warning = '军费不足 · 需要 ' + spec.cost + ' CR';
      else if (roadType) {
        if (game.buildWork(cell,type)) selectedWork = cell.code;
        else warning = '当前无法部署';
      } else if (!game.build(pad.padIndex,type)) warning = '当前无法部署';
      if (warning) selection = null;
    } else if (pad) {
      status(pad.code + ' 是空格。先从军械库选择装备。');
    }
    if (warning) {
      showDeployFeedback(warning,cell,pointer);
      status(warning + '。已取消部署。',true);
    }
    consumeEvents();
    update();
  }

  function cellFromPointer(event) {
    const bounds = board.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * map.width / bounds.width;
    const y = (event.clientY - bounds.top) * map.height / bounds.height;
    return cellAt(Math.floor(x/map.cellSize),Math.floor(y/map.cellSize));
  }

  function chooseSpeed(rate) {
    speed = rate;
    for (const button of document.querySelectorAll('[data-speed]')) button.setAttribute('aria-pressed',String(Number(button.dataset.speed) === speed));
  }

  function launch() {
    if (game.phase === 'won') {
      showResult(true);
      return;
    }
    if (game.phase === 'ready') game.startWave();
    else if (game.togglePause()) status(game.paused ? '战斗已暂停。' : '战斗继续。');
    accumulator = 0;
    consumeEvents();
    update();
  }

  $('armory').addEventListener('click',event => {
    const card = event.target.closest('[data-unit]');
    if (card) chooseType(card.dataset.unit);
  });
  board.addEventListener('pointermove',event => {
    const cell = cellFromPointer(event);
    if (hover !== cell) setHover(cell);
  });
  board.addEventListener('pointerleave',() => setHover(null));
  board.addEventListener('click',event => {
    const cell = cellFromPointer(event);
    if (cell) keyboardCell = cell;
    clickCell(cell,event);
  });
  board.addEventListener('contextmenu',event => {
    event.preventDefault();
    cancelSelection();
  });
  const keyboardOffsets = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
  board.addEventListener('keydown',event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      clickCell(keyboardCell);
      return;
    }
    const offset = keyboardOffsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = cellAt(keyboardCell.col+offset[0],keyboardCell.row+offset[1]);
    if (next) keyboardCell = next;
    setHover(keyboardCell);
    selection = selectedWork = null;
    const restriction = cellRestriction(keyboardCell);
    status('定位到 ' + keyboardCell.code + (restriction ? ' · ' + restriction + '。' : '，按回车选择。'));
    update();
  });
  board.addEventListener('blur',() => setHover(null));
  inspect.addEventListener('click',event => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (action === 'upgrade') game.improve(selection);
    if (action === 'sell' && game.sell(selection)) activeType = null;
    if (action === 'sell-work' && game.sellWork(selectedWork)) selectedWork = null;
    consumeEvents();
    update();
  });
  for (const button of document.querySelectorAll('[data-speed]')) button.addEventListener('click',() => chooseSpeed(Number(button.dataset.speed)));
  $('launch').addEventListener('click',launch);
  $('forecast').addEventListener('click',showForecast);
  $('wave-report').addEventListener('click',showWaveReport);
  $('records-open').addEventListener('click',()=>combatLog.open(game));
  window.addEventListener('pagehide',()=>combatLog.save(game));
  $('call-support').addEventListener('click',() => {
    if (activeType === 'strike') { cancelSelection(); return; }
    if (game.phase !== 'active' || !game.supportReady) return;
    activeType = 'strike';
    selection = selectedWork = null;
    status(support.name + '已待命。点击地图标记落点。');
    update();
  });
  $('intel-open').addEventListener('click',() => intel.showModal());
  function syncTestInputs() {
    testWave.disabled = testHp.disabled = !testEnabled.checked;
  }

  function openTestSettings() {
    if (end.open) end.close();
    testEnabled.checked = game.testMode;
    testWave.value = String(game.testWave ?? 1);
    testHp.value = game.healthMultiplier;
    syncTestInputs();
    testing.showModal();
  }

  function retryTest() {
    if (!game.testCheckpoint) return;
    combatLog.save(game);
    if (!game.retryTest()) return;
    combatLog.reset();
    if (end.open) end.close();
    activeType = null;
    selection = selectedWork = null;
    setHover(null);
    accumulator = 0;
    consumeEvents();
    status('第 ' + game.testWave + ' 波已重试。已恢复开波前的布防。');
    update();
  }

  $('test-open').addEventListener('click',openTestSettings);
  $('test-change-wave').addEventListener('click',openTestSettings);
  $('test-retry').addEventListener('click',retryTest);
  testEnabled.addEventListener('change',syncTestInputs);
  $('test-cancel').addEventListener('click',() => testing.close());
  $('test-form').addEventListener('submit',event => {
    event.preventDefault();
    const mode = testEnabled.checked, number = Number(testWave.value);
    const multiplier = mode ? testHp.valueAsNumber : 1;
    if (mode && !testHp.reportValidity()) return;
    testing.close();
    if (mode !== game.testMode || mode && number !== game.testWave) reset(mode,multiplier,number);
    else if (mode) game.setHealthMultiplier(multiplier);
    status(mode ? '第 ' + game.testWave + ' 波演练 · 无限军费 · 敌军血量 ×' + game.healthMultiplier : '普通模式 · ' + initialMessage);
    update();
  });
  $('restart').addEventListener('click',() => { confirm.returnValue = ''; confirm.showModal(); });
  confirm.addEventListener('close',() => { if (confirm.returnValue === 'restart') reset(); });
  $('replay').addEventListener('click',() => {
    if (game.testMode) retryTest();
    else { end.close(); reset(); }
  });
  $('endless-start').addEventListener('click',() => {
    if (!game.enterEndless()) return;
    combatLog.save(game);
    end.close();
    activeType = null;
    selection = selectedWork = null;
    status('无尽模式已开启。布防后可开始第 ' + (game.wave+1) + ' 波。');
    update();
  });
  document.addEventListener('keydown',event => {
    if (intel.open || end.open || confirm.open || testing.open || operations.open || records.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      cancelSelection();
    } else if (!event.repeat && /^[1-9]$/.test(event.key) && !['INPUT','TEXTAREA'].includes(event.target.tagName)) {
      chooseType(gearKeys[Number(event.key) - 1]);
    } else if (event.code === 'Space' && !event.repeat && !['BUTTON','INPUT','TEXTAREA'].includes(event.target.tagName)) {
      event.preventDefault();
      launch();
    }
  });

  function frame(now) {
    const elapsed = Math.min(.075, (now - (previousFrame ?? now)) / 1000);
    previousFrame = now;
    if (!intel.open && !end.open && !confirm.open && !testing.open && !operations.open && !records.open && !game.paused) {
      accumulator += elapsed * (game.phase === 'active' ? speed : 1);
      let count = 0;
      while (accumulator >= stepSeconds && count++ < 15) {
        game.step(stepSeconds);
        accumulator -= stepSeconds;
      }
    }
    const changed = consumeEvents();
    if (changed || $('credits').textContent !== creditLabel() || $('integrity').textContent !== String(game.integrity) || $('phase').dataset.phase !== (game.paused ? 'paused' : game.phase)) update();
    updateBoss();
    updateWorkHealth();
    draw(game,selection,hover,activeType,selectedWork);
    requestAnimationFrame(frame);
  }
  update();
  requestAnimationFrame(frame);
})();
