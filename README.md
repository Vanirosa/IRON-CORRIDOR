# 铁线防区 · v0.12

单关卡、单条路线的现代军事塔防初稿。打开 [index.html](index.html) 即可离线试玩，推荐桌面 Chrome 或 Edge。小屏可以横向滑动战场。项目目录中的 HTML、样式和 `js` 文件需放在一起。

## 试玩

- 先在 H12 放链式机炮并升至 II 级，在 H11 部署帕拉丁火炮，然后点「开始第 1 波」。
- 在战场右侧的军械库选装备，小屏的军械库位于战场下方，再点击任意未占用的内部非道路格。一次选择只部署一座炮塔。点击禁建格或军费不足时会取消放置，并在点击位置附近显示短暂提示。点击已有炮塔会结束放置并更新左侧阵位详情，页面保持在当前滚动位置，可以查看覆盖范围和五级外观、升级或拆除。拆除返还总投入的 65%（向下取整）。图鉴显示炮塔各级的基础数值，左侧详情显示当前数值，两处都列出对应护甲的伤害倍率。
- 地面敌军从左侧进入，空中敌军沿同一条航线通过。第 3 波的阿帕奇分两批出现。第 5 波出现需要雷达揭露的无人机，第 6 波重装车队分批推进，第 7 波的 A-10C 分两批越线。开启每波前可以查看敌军型号与数量。
- 击毁敌军获得军费，每完成一波获得补给。漏防会扣除基地完整度。第 10 波的常规部队离场后，M1-X 堡垒指挥坦克单独登场。第 1–10 波在逐波成长之外增加 20% 耐久。第 11 波起改用 30% 耐久加成，速度增加 6%。击毁奖励与波后补给分别按 v0.7 的实际结算额再减少 20% 和 40%。第二阶段保留原有的额外 10% 收入折扣。v0.9 在 v0.8 的整数击毁奖励上增加 5%，再四舍五入到整数军费。HT-15 与 HT-X 的基础移动速度均比 v0.7 低 30%。
- 第 11 波开放反坦克导弹塔、铁拒马和反坦克地雷。导弹塔有 112 距离的近距死区，部署时用内圈标出。导弹对常规重甲效率较高，对轻中甲和超重甲的效果较弱，适合搭配溅射火力和地雷。铁拒马和地雷只能部署在内侧道路格，每格一件。铁拒马售价 110 CR，初始耐久 100。每减速一辆地面单位，每秒磨损 18 点耐久。耐久归零后摧毁。战场和工事详情都会显示剩余耐久。地雷耗费 380 CR，布设后短暂待命，由坦克类重甲触发，爆炸后消耗。
- 第 15 波首次遭遇 HT-15 裂阵双联重坦，并追加两辆错峰进场的 M1-X。第 16 波引入 HT-10 隼牙双联坦克，基础耐久 820，基础速度 42。第 20 波 HT-X 镇岳双联要塞随混编部队登场，基础耐久 6,600。三款双联坦克与 M1-X 统一使用超重甲倍率。M1-X 的基础耐久按换甲后的承伤重新折算为 850，兼顾第 10 波的防守强度。
- 每波可用一次「炮火支援」。先点按钮，再点战场，1.25 秒后对落点周围地面单位造成溅射。右键可以取消瞄准。
- 「下波预警」显示批次、出场顺序、实际耐久和敌军机制。「波后战报」列出突破位置、引爆地雷数、被摧毁的拒马和火力贡献。
- 战役结算页可开启无尽模式，带着现有炮塔、军费和基地完整度，从第 21 波继续。敌军耐久逐波增加，编队和出场间隔由波次决定，每五波安排一场首领战。
- 数字键 1–9 选装备，空格开战或暂停。在战场内右键或按 Esc 可以取消待放置装备和当前选中的炮塔。地图获得焦点后可用方向键按格移动，回车选择或部署。
- 点击顶部「测试模式」，选择第 1–20 波进行单波演练，军费无限，敌军血量可设为 0.25–10 倍。点击战场的「重试本波」或结算页的重试按钮，会恢复开波前的炮塔、工事和基地完整度，保留当前血量倍率。更换波次会重置布阵。在同一波演练中调整倍率时，现有敌人按原生命比例换算。

## 战斗记录

战场按钮「战斗记录」可查看和导出最近 30 场的 JSON。开始、波次结算、重试、重开和退出页面时会保存快照。记录保存在当前浏览器，列表标注生成记录的游戏版本。测试模式每次重试单独计场，战役接续的无尽模式沿用同一场记录。

- 伤害以敌军实际损失的耐久计算。过量伤害不计入，炮塔拆除后仍保留它的伤害和击毁数。
- 平均存活时间从敌军出场算到击毁或突破，采用战斗计时。还在场的敌军单独列为未结算。
- 赚取军费仅合计击毁奖励与波后补给。初始军费和拆除退款另计。在场炮塔价值按建造及升级实际投入合计。

## 调整入口

| 文件 | 用途 |
|---|---|
| [js/data.js](js/data.js) | 炮塔与敌军参数、伤害倍率、战役及无尽波次配置、网格与路线拐点、初始经济、升级倍率和每级装备 |
| [js/engine.js](js/engine.js) | 独立战斗模拟。以固定步长推进出场、路程、侦测、索敌、弹道、命中、经济及胜负 |
| [js/art.js](js/art.js) | Canvas 背景纹理与战斗图层、SVG 网格与道路、图鉴缩略图 |
| [js/ui.js](js/ui.js) | 将操作交给战斗模拟，显示波次、军费、阵位状态和战报 |
| [js/records.js](js/records.js) | 本地战斗记录、历史查询和 JSON 导出 |
| [style.css](style.css) | 指挥终端界面与宽窄屏布局 |

波次由若干组组成。每组依次写单位键名或循环编队数组、数量、组内出场间隔和可选的组前额外等待时间。敌军按道路累计距离移动。炮塔在射程内优先攻击同类可见目标中最接近出口的一辆或一架。反坦克导弹塔优先选择射程内的重甲。所有弹药在地图平面上直线飞行。机炮弹丸、防空炮弹和防空导弹命中途中第一个符合地空类型的单位。榴弹与火箭直飞预判落点，在那里结算地面溅射。哨兵雷达每步重新判断覆盖，同一炮塔只获得覆盖它的最高级雷达加成。雷达保留射程加成，并且每级提供 5% 最终伤害加成，满级为 25%。炮塔在开火时获得加成，命中后按护甲和溅射距离结算。火炮对轻甲的伤害倍率为 0.58，链式机炮对轻甲为 1.24。

地图在 `data.js` 中定义行列、格宽和路线拐点。拐点使用零基列、行坐标，每段保持横向或纵向，起终点分别在左右边缘。引擎根据同一份路线生成禁建格、SVG 道路曲线与行进采样；底图纹理独立绘制。战斗规则可由 Node.js 独立运行。依次加载 `data.js`、`engine.js` 后，创建 `IronEngine.Battle`，通过 `build`、`buildWork`、`requestSupport`、`improve`、`sell`、`startWave`、`retryTest` 和 `enterEndless` 操作，使用 `step(IronEngine.stepSeconds)` 推进。

## 装备原型

画面采用原创简化俯视示意。关卡阵营、射程、伤害、耐久和 MQ-9 的低可探测特性均为游戏设定。升级路线按关卡角色编排。I–IV 级使用现实原型，V 级为原创近未来型号。每一级的外观和说明均可在「装备图鉴」中查看。炮塔细节按原型区分炮管、检修盖、发射筒、观瞄设备与雷达阵面。

| 路线 | I 初始 | II 一阶 | III 二阶 | IV 三阶 | V 终极（虚构） |
|---|---|---|---|---|---|
| 机炮 | M242 | Mk44 | CV9035 | CV9040 | VX-45 螳镰双联链炮 |
| 火炮 | M109A7 | AS90 | K9 | PzH 2000 | H-155T 断层双联火炮 |
| 防空炮 | LPWS | Gepard | Skyranger 30 | Skynex Mk3 | A-35T 雨幕三联防空炮 |
| 防空导弹 | AN/TWQ-1 | SGT STOUT | NASAMS | IRIS-T SLM | VLS-12 天穹垂发导弹 |
| 火箭炮 | M142 | M270A1 | K239 | PHL-03 | MRL-18 雷簇三舱火箭炮 |
| 雷达 | AN/MPQ-64 | Giraffe AMB | AN/TPS-80 | LTAMDS | R-360 三棱镜阵列雷达 |
| 反坦克导弹 | M41 ITAS | M1134 | Kornet-EM | Spike NLOS | LRA-2 穿云双联反坦克塔 |

终极火力的面板伤害为整轮齐射总量，按炮管分配到各发弹药。双联火炮与三舱火箭炮沿敌军路线分配落点。终极雷达仍负责侦测和增程。

- 反坦克导弹路线的四个现实型号参考陆军与厂商资料。[TOW 与 ITAS](https://www.army.mil/article/269217/army_announces_contract_award_for_tow_weapon_system) · [M1134](https://odin.t2com.army.mil/WEG/Asset/M1134_%28Stryker%29_American_8x8_Armored_Anti-Tank_Guided_Missile_Vehicle) · [Kornet-EM](https://rostec.ru/media/news/kornet-em-groza-ne-tolko-dlya-tankov/) · [Spike NLOS](https://www.lockheedmartin.com/en-us/products/Spike-NLOS.html)
- M242 链式机炮取自 M2A3 布雷德利构型。敌军 M1A2、M2A3 与斯特赖克参考陆军的实弹演示资料。[美国陆军装备演示](https://asc.army.mil/docs/pubs/alt/2004/6_NovDec/web_edition/04_Live_Fire_Demonstration_Event.cfm)
- M1A2 的俯视轮廓参考实车空拍，保留楔形炮塔、尾舱挂架、炮塔顶观瞄设备与后甲板格栅。[DVIDS 实车空拍](https://www.dvidshub.net/image/3055954/m1a2-abrams-main-battle-tank) · [美陆军坦克排手册](https://rdl.train.army.mil/catalog-ws/view/100.ATSC/2F4F8430-78F6-459A-A9A5-DFC8E73007E0-1356018579249/atp3_20x15.pdf)
- M109A7 帕拉丁与 M142 海马斯分别参考履带式榴弹炮及六轮单发射舱构型。[帕拉丁](https://www.army.mil/article/273189/position_areas_for_artillery_paa_analysis_in_severely_restricted_terrain) · [海马斯](https://odin.t2com.army.mil/WEG/Asset/M142_)
- 密集阵、哨兵、复仇者采用陆基密集阵、拖车雷达及双发射舱防空车构型。[陆军防空手册](https://rdl.train.army.mil/catalog-ws/view/100.ATSC/C01CC9C1-DA1C-4D5E-A6EB-5FCFAE218DCD-1398170439966/fm3_01.pdf) · [复仇者](https://www.army.mil/article/209435/letterkenny_army_depot_completes_72nd_avenger_in_support_of_deterrence_mission_in_europe)
- M113 的后舱和履带、Stryker 的八轮底盘和武器站、Bradley 的炮塔和侧置发射器均按实车资料绘制。[M113](https://innovation.army.mil/News/Article-View/Article/3572769/m113-series-fov-chock-it-up-to-being-ready/) · [Stryker](https://odin.t2com.army.mil/WEG/Asset/M1126_%28Stryker%29_American_Infantry_Carrier_Vehicle) · [Bradley](https://www.benning.army.mil/Infantry/DoctrineSupplement/ATP3-21.8/chapter_03/RoleoftheMech/Bradley/index.html)
- AH-64E、MQ-9、A-10C 的俯视细节分别突出短翼挂架和四叶主旋翼、细长机翼和尾部推进桨，以及后置双发动机和双垂尾。[M113](https://www.army.mil/article/3103/m113) · [AH-64E](https://www.army.mil/article/137579/) · [MQ-9](https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104470/mq9-reaper/mq-9-reaper/) · [A-10C](https://www.dm.af.mil/About-DM/Fact-Sheets/Article/2844049/a-10c-thunderbolt-ii/)