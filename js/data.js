/* 游戏配置。尺寸为地图坐标，时间为模拟秒。 */
(() => {
  const towers = {
    bushmaster: {
      code: 'M242', name: '链式机炮', role: '对地 · 速射', color: '#85dfba', cost: 105, range: 153,
      damage: 17, interval: .37, kind: 'kinetic', target: 'ground', delivery: 'bullet', velocity: 640, muzzle: 27,
      desc: '持续输出，擅长清理快速轻甲。对重甲伤害下降。',
      reference: 'M242 Bushmaster 25 mm 机炮 · 取自 M2A3 Bradley 的炮塔构型',
      source: 'https://asc.army.mil/docs/pubs/alt/2004/6_NovDec/web_edition/04_Live_Fire_Demonstration_Event.cfm'
    },
    paladin: {
      code: 'M109A7', name: '帕拉丁火炮', role: '对地 · 破甲', color: '#f3be77', cost: 160, range: 202,
      damage: 90, interval: 1.56, kind: 'shell', target: 'ground', delivery: 'shell', blast: 43,
      desc: '优先处理重装甲，炮弹落点可伤及邻近地面单位。',
      reference: 'M109A7 Paladin 155 mm 自行榴弹炮',
      source: 'https://www.army.mil/article/273189/position_areas_for_artillery_paa_analysis_in_severely_restricted_terrain'
    },
    phalanx: {
      code: 'LPWS', name: '密集阵防空炮', role: '对空 · 速射', color: '#7ad6e8', cost: 125, range: 148,
      damage: 18, interval: .23, kind: 'flak', target: 'air', delivery: 'bullet', velocity: 780, muzzle: 23,
      desc: '短距离高射速，擅长拦截无人机和低速直升机。',
      reference: 'Land-Based Phalanx Weapon System · C-RAM 拦截炮',
      source: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/FB12BA8E-A70A-4C54-88F5-88AC7277BBB1-1659012885821/fm3_01x44.pdf'
    },
    avenger: {
      code: 'AN/TWQ-1', name: '复仇者导弹', role: '对空 · 重击', color: '#a2c3ff', cost: 175, range: 219,
      damage: 105, interval: 1.24, kind: 'missile', target: 'air', delivery: 'missile', velocity: 620,
      desc: '远距离锁定空中重型目标，导弹预判航线后直飞拦截。',
      reference: 'AN/TWQ-1 Avenger · 双发射舱配 FIM-92 Stinger',
      source: 'https://www.army.mil/article/209435/letterkenny_army_depot_completes_72nd_avenger_in_support_of_deterrence_mission_in_europe'
    },
    himars: {
      code: 'M142', name: '海马斯火箭炮', role: '对地 · 溅射', color: '#ff9f83', cost: 230, range: 235,
      damage: 112, interval: 2.45, kind: 'rocket', target: 'ground', delivery: 'rocket', blast: 69,
      desc: '覆盖远处密集车队，越靠近爆心，溅射伤害越高。',
      reference: 'M142 HIMARS · 单个六管发射舱与六轮卡车底盘',
      source: 'https://odin.t2com.army.mil/WEG/Asset/M142_'
    },
    sentinel: {
      code: 'AN/MPQ-64', name: '哨兵雷达', role: '支援 · 增程增伤', color: '#d0b3ff', cost: 110, range: 175,
      damage: 0, interval: 0, target: 'support', boost: .18, damageBoostPerLevel: .05,
      desc: '揭露扫描区内的低可探测单位，提高友军炮塔的射程与最终伤害。多部雷达取最强增益。',
      reference: 'AN/MPQ-64 Sentinel · 拖车式相控阵空情雷达',
      source: 'https://rdl.train.army.mil/catalog-ws/view/100.ATSC/FB12BA8E-A70A-4C54-88F5-88AC7277BBB1-1659012885821/fm3_01x44.pdf'
    },
    atgm: {
      code: 'M41 ITAS', name: '反坦克导弹塔', role: '对地 · 远距破甲', color: '#f0d58c', cost: 220, unlockWave: 11,
      range: 252, minRange: 112, damage: 155, interval: 2.05, kind: 'atgm', target: 'ground', delivery: 'missile', velocity: 690,
      desc: '优先瞄准重甲，对轻中甲和超重甲效率较低。112 距离以内是火力死区，适合在纵深阵位架设。',
      reference: 'M41 ITAS · TOW 导弹发射架与独立热成像瞄具',
      source: 'https://www.army.mil/article/269217/army_announces_contract_award_for_tow_weapon_system'
    }
  };

  // II、III、IV 级的现实原型。规则倍率与外形分开调整。
  const variants = {
    atgm: [
      { code: 'M1134', name: '斯特赖克反坦克车', reference: 'M1134 Stryker ATGM，八轮底盘配升降双发射管。', source: 'https://odin.t2com.army.mil/WEG/Asset/M1134_%28Stryker%29_American_8x8_Armored_Anti-Tank_Guided_Missile_Vehicle' },
      { code: 'Kornet-EM', name: '短号反坦克车', reference: 'Kornet-EM 车载构型，左右各有独立发射架。', source: 'https://rostec.ru/media/news/kornet-em-groza-ne-tolko-dlya-tankov/' },
      { code: 'Spike NLOS', name: '长钉远程反坦克车', reference: 'Spike NLOS 车载构型，成组矩形筒与重型轮式底盘。', source: 'https://www.lockheedmartin.com/en-us/products/Spike-NLOS.html' }
    ],
    bushmaster: [
      { code: 'Mk44', name: 'Mk44 链式机炮', reference: 'Bushmaster II 30 mm 链炮，方形供弹箱与较粗炮身', muzzle: 31, source: 'https://www.northropgrumman.com/-/media/wp-content/uploads/Mk44-30mm-Bushmaster-Chain-Gun.pdf' },
      { code: 'CV9035', name: 'CV9035 机炮塔', reference: '35 mm Bushmaster III，楔形炮塔与车长瞄具', muzzle: 35, source: 'https://www.baesystems.com/en-us/article/bae-systems-rolls-out-world-leading-combat-vehicle-to-the-slovak-armed-forces' },
      { code: 'CV9040', name: 'CV9040 重机炮', reference: '瑞典 Strf 9040 的 40 mm 博福斯机炮与非对称炮塔', muzzle: 39, source: 'https://www.forsvarsmakten.se/globalassets/02-om-forsvarsmakten/myndighetsinformation/dokument/reglementen/sakr-fo-strf2.pdf' }
    ],
    paladin: [
      { code: 'AS90', name: 'AS90 自行火炮', reference: '英军 155 mm 自行火炮，宽大的箱形炮塔和短炮管', source: 'https://www.army.mod.uk/learn-and-explore/equipment/artillery-and-air-defence/as90/' },
      { code: 'K9', name: 'K9 雷霆火炮', reference: 'K9 Thunder 155 mm 自行火炮，斜面炮塔和长炮管', source: 'https://www.hanwha.com/newsroom/news/press-releases/hanwha-aerospace-secures-follow-on-k9-howitzer-contract-with-finland.do' },
      { code: 'PzH 2000', name: 'PzH 2000 自行火炮', reference: '德国 155 mm 自行火炮，宽体炮塔、长管和大型制退器', source: 'https://www.bundeswehr.de/de/ausruestung-technik-bundeswehr/landsysteme-bundeswehr/panzerhaubitze-2000' }
    ],
    phalanx: [
      { code: 'Gepard', name: '猎豹防空炮', reference: 'Gepard 自行防空炮，双侧 35 mm 机炮和后部搜索雷达', muzzle: 32, source: 'https://www.bundeswehr.de/de/meldungen/flugabwehrkanonenpanzer-gepard-5400072' },
      { code: 'Skyranger 30', name: '天空游骑兵防空炮', reference: 'Skyranger 30 低矮炮塔，中央机炮和分布式传感器', muzzle: 33, source: 'https://www.rheinmetall.com/en/products/air-defence-systems/mobile-air-defence-skyranger' },
      { code: 'Skynex Mk3', name: 'Skynex 转膛防空炮', reference: 'Skynex 系统的 35 mm Revolver Gun Mk3，炮座与火控传感器', muzzle: 37, source: 'https://www.rheinmetall.com/Rheinmetall%20Group/brochure-download/Air-Defence/B200e0424-Oerlikon-Skynex-air-defence-system.pdf' }
    ],
    avenger: [
      { code: 'SGT STOUT', name: '斯托特防空车', reference: 'M-SHORAD，八轮斯特赖克底盘与非对称防空炮塔', source: 'https://api.army.mil/e2/c/downloads/2024/07/19/ab2038a9/u-s-army-portfolio-2024.pdf' },
      { code: 'NASAMS', name: 'NASAMS 防空导弹', reference: 'NASAMS 六联多用途发射器，双排矩形发射筒', source: 'https://www.kongsberg.com/globalassets/kongsberg-defence--aerospace/1.-what-we-do/1.3-defence--security/intergrated-air-and-missile-defence/mml_2022.pdf' },
      { code: 'IRIS-T SLM', name: 'IRIS-T SLM 防空导弹', reference: '车载垂直发射架，俯视以竖直发射筒端盖和支撑脚识别', source: 'https://new.diehl.com/defence/de/produkte/bodengebundene-luftverteidigung/iris-t-slm2' }
    ],
    himars: [
      { code: 'M270A1', name: 'M270A1 火箭炮', reference: 'M270A1 MLRS，履带底盘与两组装填舱', source: 'https://asc.army.mil/docs/wsh2/2020-2021-wsh.pdf' },
      { code: 'K239', name: 'K239 天舞火箭炮', reference: 'Chunmoo 多管火箭炮，八轮卡车与双发射舱', source: 'https://m.hanwhaaerospace.com/eng/media/newsroom/view.do?seq=636' },
      { code: 'PHL-03', name: 'PHL-03 火箭炮', reference: 'PHL-03（AR2）300 mm 火箭炮，八轮底盘与外露圆管束', source: 'https://odin.t2com.army.mil/WEG/Asset/aad9442fd3d1b8b4b8fb0cbadb5f84f5' }
    ],
    sentinel: [
      { code: 'Giraffe AMB', name: '长颈鹿 AMB 雷达', reference: '萨博长颈鹿 AMB，箱式工作舱与高桅杆天线', source: 'https://www.saab.com/markets/singapore/surface_radars/giraffe-amb' },
      { code: 'AN/TPS-80', name: 'G/ATOR 雷达', reference: '美国海军陆战队 G/ATOR，多用途平面阵列与支撑桁架', source: 'https://www.pae.marines.mil/organization/pm-exr/' },
      { code: 'LTAMDS', name: 'LTAMDS 雷达', reference: 'Raytheon LTAMDS，一面主阵列配两面副阵列', source: 'https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/ltamds' }
    ]
  };

  const ultimate = {
    atgm: { code: 'LRA-2', name: '穿云双联反坦克塔', reference: '近未来双联反坦克发射架，双路火控和装甲防护舱。', muzzle: 18, barrels: [-8,8], fictional: true },
    bushmaster: { code: 'VX-45', name: '螳镰双联链炮', reference: '双联 40 mm 链炮，错开的供弹箱让两根炮管能并列架设。', muzzle: 40, barrels: [-7,7], fictional: true },
    paladin: { code: 'H-155T', name: '断层双联火炮', reference: '双联 155 mm 履带炮座，各炮管采用独立后坐机构。两发炮弹分别压制目标前后。', muzzle: 43, barrels: [-8,8], fictional: true },
    phalanx: { code: 'A-35T', name: '雨幕三联防空炮', reference: '中央与两侧各一门 35 mm 速射炮，顶部整合独立光电瞄具。', muzzle: 39, barrels: [-11,0,11], fictional: true },
    avenger: { code: 'VLS-12', name: '天穹垂发导弹', reference: '三列共十二个独立垂发单元，作战时从两侧并发拦截弹。', muzzle: 8, barrels: [-9,9], fictional: true },
    himars: { code: 'MRL-18', name: '雷簇三舱火箭炮', reference: '重型八轮底盘搭载三组独立发射舱，齐射覆盖道路上的三个相邻落点。', muzzle: 13, barrels: [-12,0,12], fictional: true },
    sentinel: { code: 'R-360', name: '三棱镜阵列雷达', reference: '三面固定有源阵列分担全向扫描，重叠空域由火控系统统一分配。', fictional: true }
  };

  function towerModel(type, level = 1) {
    if (level === 1) return towers[type];
    return variants[type][level - 2] ?? ultimate[type];
  }

  const enemies = {
    scout: { code: 'LAV-25', name: '突击侦察车', category: 'ground', armor: 'light', hp: 125, speed: 131, reward: 19, leak: 2, size: 19, desc: '高速八轮先遣单位。道路铁拒马可以延长拦截窗口。' },
    titan: { code: 'HT-15', name: '裂阵双联重坦', category: 'ground', armor: 'siege', hp: 1470, speed: 28.7, reward: 90, leak: 6, size: 27, heavy: true, desc: '虚构双炮管重坦。正面抗炮击，底部对反坦克地雷特别脆弱。' },
    twin: { code: 'HT-10', name: '隼牙双联坦克', category: 'ground', armor: 'siege', hp: 820, speed: 42, reward: 50, leak: 4, size: 24, desc: '近未来虚构双管坦克。比 M1A2 厚重，仍比 HT-15 灵活。超重甲能削弱常规火力，可用反坦克地雷重创。' },
    dreadnought: { code: 'HT-X', name: '镇岳双联要塞', category: 'ground', armor: 'siege', hp: 6600, speed: 26.6, reward: 360, leak: 20, size: 33, heavy: true, boss: true, desc: '虚构大型重装首领，双联主炮与附加裙甲。与隼牙和空袭编队同步推进。' },
    m113: { code: 'M113', name: '履带输送车', category: 'ground', armor: 'light', hp: 72, speed: 79, reward: 10, leak: 1, size: 17, desc: '轻甲先遣。' },
    stryker: { code: 'Stryker', name: '斯特赖克装甲车', category: 'ground', armor: 'light', hp: 106, speed: 110, reward: 14, leak: 1, size: 19, desc: '八轮车，地面速度最快。' },
    bradley: { code: 'M2A3', name: '布雷德利步战车', category: 'ground', armor: 'medium', hp: 192, speed: 74, reward: 18, leak: 2, size: 20, desc: '中型装甲，机炮效率有所下降。' },
    abrams: { code: 'M1A2', name: '艾布拉姆斯坦克', category: 'ground', armor: 'heavy', hp: 395, speed: 59, reward: 32, leak: 3, size: 23, desc: '重甲缓慢推进，优先用火炮。', source: 'https://www.dvidshub.net/image/3055954/m1a2-abrams-main-battle-tank' },
    m1boss: { code: 'M1-X', name: '堡垒指挥坦克', category: 'ground', armor: 'siege', hp: 850, speed: 46, reward: 210, leak: 20, size: 30, boss: true, desc: '虚构首领。超重甲可大幅削弱炮击，突破时会摧毁基地。' },
    apache: { code: 'AH-64E', name: '阿帕奇直升机', category: 'air', armor: 'rotary', hp: 178, speed: 91, reward: 20, leak: 2, size: 22, desc: '双翼下挂载的旋翼目标。' },
    reaper: { code: 'MQ-9', name: '死神无人机', category: 'air', armor: 'drone', hp: 125, speed: 116, reward: 22, leak: 2, size: 22, hidden: true, desc: '关卡特性：低可探测。进入雷达扫描区后可被锁定。' },
    thunderbolt: { code: 'A-10C', name: '雷电 II 攻击机', category: 'air', armor: 'jet', hp: 300, speed: 145, reward: 34, leak: 3, size: 25, desc: '高速高耐久，适合用防空导弹拦截。' }
  };

  const armorNames = { light: '轻甲', medium: '中甲', heavy: '重甲', siege: '超重甲', rotary: '旋翼', drone: '低可探测', jet: '高速固定翼' };
  const damage = {
    kinetic: { light: 1.24, medium: .82, heavy: .34, siege: .04 },
    shell: { light: .58, medium: 1.10, heavy: 1.32, siege: .135 },
    rocket: { light: 1.12, medium: 1, heavy: .85, siege: .11 },
    atgm: { light: .40, medium: .74, heavy: 1.52, siege: .28 },
    mine: { light: .90, medium: 1, heavy: 1.12, siege: 1.36 },
    flak: { rotary: 1.08, drone: 1.25, jet: .68 },
    missile: { rotary: 1, drone: .84, jet: 1.24 }
  };

  const works = {
    barricade: { code: 'CZ-90', name: '铁拒马', role: '道路工事 · 减速', cost: 110, unlockWave: 11, color: '#b9ced0', slow: .53, durability: 100, wearPerSecond: 18,
      desc: '安装在道路上。减速地面单位时持续磨损，耐久归零后摧毁。空军正常通过。' },
    mine: { code: 'AT-M', name: '反坦克地雷', role: '道路工事 · 一次性', cost: 380, unlockWave: 11, color: '#ffd28d', armTime: 1.15, triggerRadius: 9, blast: 55, damage: 4650,
      desc: '布设后短暂待命，只由坦克类重甲触发。爆炸重创周围地面敌军，对超重甲尤其有效。' }
  };
  const support = { name: '炮火支援', color: '#ffb78e', delay: 1.25, blast: 58, damage: 430 };
  const economy = { kill: .80, wave: .60, killBoost: 1.05 };
  const stageOne = { health: 1.20 };
  const stageTwo = { start: 11, health: 1.30, speed: 1.06, income: .90 };

  // 每组为 [单位类型, 数量, 出场间隔, 与上一组的额外间隔]。
  const waves = [
    { name: '先遣试探', brief: '轻型履带车首先进入防区。机炮适合守住西侧弯道。', bonus: 65, groups: [['m113', 7, 1.12], ['stryker', 3, 1.18, 1.4]] },
    { name: '轮式冲锋', brief: '斯特赖克速度更快。用射程覆盖多个弯道。', bonus: 72, groups: [['stryker', 8, .75], ['m113', 6, .82, 1.2]] },
    { name: '低空来袭', brief: '阿帕奇首次进入航线，分两批来袭。开波前在航线旁部署防空。', bonus: 78, groups: [['m113', 6, .7], ['apache', 4, 1.48, .75], ['stryker', 4, .66, .85], ['apache', 2, 1.55, .9]] },
    { name: '装甲纵队', brief: '布雷德利伴随艾布拉姆斯推进。重甲会削弱机炮。', bonus: 85, groups: [['bradley', 7, .9], ['abrams', 3, 1.9, .7], ['bradley', 5, .8, .9]] },
    { name: '静默侦察', brief: 'MQ-9 需要雷达揭露。让雷达扫描区和对空火力交叠。', bonus: 90, groups: [['apache', 4, .9], ['reaper', 8, .85, .8], ['stryker', 8, .6, .3]] },
    { name: '道路压制', brief: '混编车队分批推进，注意用火炮拦截重甲。下一波将迎来高速攻击机。', bonus: 100, groups: [['m113', 12, .36], ['bradley', 9, .47], ['abrams', 4, 1.06, .75], ['stryker', 10, .42]] },
    { name: '雷电掠袭', brief: 'A-10C 分两批高速越线。防空导弹拦截固定翼，雷达协助发现中间批次的无人机。', bonus: 105, groups: [['thunderbolt', 5, 1.2], ['reaper', 9, .62, .75], ['thunderbolt', 4, .94, .55]] },
    { name: '钢铁洪峰', brief: '坦克集群和直升机先后出现。准备地空两类火力。', bonus: 110, groups: [['abrams', 10, .76], ['apache', 12, .48, .35], ['bradley', 12, .4, .65], ['abrams', 6, .58]] },
    { name: '交叉穿越', brief: '高速目标会追上先行车队。利用弯道覆盖不同方向的地空目标。', bonus: 115, groups: [['abrams', 7, .75], ['stryker', 15, .29], ['thunderbolt', 9, .54, .3], ['reaper', 10, .47]] },
    { name: '堡垒突围', brief: '拦截五批地空增援。常规部队结束后，堡垒指挥坦克会单独进入防区。', bonus: 260, groups: [['bradley', 11, .40], ['abrams', 10, .65, .4], ['apache', 8, .48, .35], ['reaper', 8, .45], ['thunderbolt', 9, .57, .35]], boss: 'm1boss' },
    { name: '突破第二防线', brief: '敌军耐久和速度全面提升。侦察车打头，铁拒马能为纵深火力争取时间。', bonus: 180, groups: [['scout', 11, .56], ['bradley', 11, .52, .6], ['abrams', 6, .87], ['apache', 7, .60]] },
    { name: '高速穿插', brief: '侦察车跟在布雷德利之后，注意从地面纵队上方穿过的固定翼。', bonus: 195, groups: [[['bradley','scout','scout'], 21, .46], ['reaper', 9, .48, .55], ['thunderbolt', 9, .68], ['abrams', 7, .76]] },
    { name: '装甲重拳', brief: 'M1A2 密集推进。把反坦克导弹塔架在离道路两到三格的纵深位置。', bonus: 210, groups: [['abrams', 11, .65], [['bradley','scout','abrams'], 18, .56, .5], ['apache', 10, .53], ['reaper', 9, .49]] },
    { name: '战壕前哨', brief: '重坦和两类飞机接续进场。留出能布雷的道路格，并确保末段有防空。', bonus: 450, groups: [[['abrams','bradley','scout'], 21, .54], [['thunderbolt','reaper','apache'], 23, .49], ['abrams', 9, .66, .5]] },
    { name: '双堡压境', brief: `${enemies.titan.name}率先登场，随后两辆 M1-X 堡垒指挥坦克接续压阵。预先规划雷区和纵深火力。`, bonus: 420,
      groups: [['bradley', 10, .44], ['titan', 3, 2.6, .9], ['apache', 11, .49], ['titan', 1, 1.0, .75], ['m1boss', 2, 5.2, 4.8]],
      boss: 'm1boss', mixedBoss: true },
    { name: '双管先遣', brief: `${enemies.twin.name}首次混入车队。它比 M1A2 慢，但常规火力更难击穿其装甲。`, bonus: 250, groups: [[['abrams','twin','bradley','abrams','bradley'], 15, .56], ['apache', 9, .50], ['scout', 10, .40], ['titan', 2, 1.6]] },
    { name: '火线护航', brief: '两组装甲编队接续推进。用机炮清理轻甲，让反坦克火力集中对付队伍里的重装单位。', bonus: 270, groups: [[['bradley','abrams','twin','titan','abrams'], 15, .62], [['reaper','thunderbolt','apache'], 21, .48], [['abrams','twin','bradley','abrams'], 12, .54, .5]] },
    { name: '破口扩大', brief: '双联坦克前后都有护卫。前半程用火箭拆队，后半程让地雷拦住重坦。', bonus: 380, groups: [[['abrams','bradley','twin','titan','abrams','bradley','abrams','bradley','abrams'], 18, .53], [['apache','reaper','thunderbolt'], 24, .49], [['scout','abrams','twin','titan'], 8, .60]] },
    { name: '重装协同', brief: '混编队列交替进入。留意快速轻甲从重装车队之间穿插。', bonus: 530, groups: [[['scout','abrams','twin','titan','bradley','scout','abrams','bradley','abrams'], 18, .51], [['thunderbolt','reaper','apache'], 24, .45], [['abrams','twin','bradley','titan'], 8, .53, .35]] },
    { name: '要塞齐进', brief: `${enemies.dreadnought.name}随车队进场，双联重坦和空袭仍会继续。先用溅射拆护航，再让地雷与反坦克导弹集中打首领。`, bonus: 480,
      groups: [[['abrams','bradley','scout','twin','abrams'], 15, .52], [['abrams','titan','twin','titan','abrams','abrams'], 6, .60], ['dreadnought', 1, .85, .35], [['apache','twin','reaper','abrams','thunderbolt','titan'], 12, .51, .25], [['reaper','thunderbolt','apache'], 15, .48]],
      boss: 'dreadnought', mixedBoss: true }
  ];

  const endless = {
    bossEvery: 5,
    healthGrowth: .075,
    patterns: [
      { name: '钢铁增援', types: ['bradley','abrams','apache','twin','reaper','titan'] },
      { name: '低空饱和', types: ['apache','stryker','thunderbolt','reaper','abrams','thunderbolt'] },
      { name: '混成突破', types: ['scout','reaper','abrams','thunderbolt','twin','apache'] }
    ]
  };

  const cellSize = 40, columns = 27, rows = 14;
  const map = {
    width: cellSize * columns, height: cellSize * rows, cellSize, columns, rows,
    towerScale: .74, roadWidth: 36, cornerRadius: 12,
    waypoints: [[0,6],[4,6],[4,2],[8,2],[8,9],[13,9],[13,4],[17,4],[17,2],[22,2],[22,10],[26,10]]
  };

  const test = { minHealth: .25, maxHealth: 10 };

  globalThis.IronData = { towers, towerModel, enemies, armorNames, damage, waves, endless, works, support, economy, stageOne, stageTwo, map, test, start: { credits: 360, integrity: 20 }, upgrade: [
    { power: 1, speed: 1, range: 0, boost: 0 },
    { power: 1.52, speed: 1.12, range: 15, boost: .045, price: .68 },
    { power: 2.18, speed: 1.25, range: 29, boost: .09, price: 1.03 },
    { power: 2.94, speed: 1.39, range: 45, boost: .135, price: 1.47 },
    { power: 4.25, speed: 1.52, range: 65, boost: .19, price: 2.10 }
  ] };
})();
