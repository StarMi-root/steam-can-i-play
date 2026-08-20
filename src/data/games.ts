/**
 * 内置 Steam 游戏库（含 AppID，可直达商店页）。
 * min* 字段为官方公布的最低配置，折算为与本工具一致的性能指数。
 */

export interface Game {
  id: number;
  name: string;
  zh: string;
  year: number;
  genres: string[];
  minCpu: number;
  minGpu: number;
  minRam: number;
  platforms: { win: boolean; mac: boolean; linux: boolean };
  vr?: boolean;
  free?: boolean;
  custom?: boolean;
}

export const ALL_GENRES = [
  "射击", "竞技", "动作", "冒险", "ARPG", "开放世界", "魂系", "策略", "模拟",
  "竞速", "体育", "生存", "恐怖", "合作", "休闲", "平台", "独立", "沙盒", "其他",
];

export const GAMES: Game[] = [
  /* —— 免费游戏 —— */
  { id: 730, name: "Counter-Strike 2", zh: "反恐精英2", year: 2023, genres: ["射击", "竞技"], minCpu: 34, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 240, name: "Counter-Strike: Source", zh: "反恐精英：起源", year: 2004, genres: ["射击", "竞技"], minCpu: 12, minGpu: 4, minRam: 1, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 570, name: "Dota 2", zh: "刀塔2", year: 2013, genres: ["竞技", "策略"], minCpu: 30, minGpu: 18, minRam: 4, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 440, name: "Team Fortress 2", zh: "军团要塞2", year: 2007, genres: ["射击", "休闲"], minCpu: 16, minGpu: 6, minRam: 2, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 1172470, name: "Apex Legends", zh: "Apex 英雄", year: 2020, genres: ["射击", "竞技"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 578080, name: "PUBG: BATTLEGROUNDS", zh: "绝地求生", year: 2017, genres: ["射击", "竞技"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 2767030, name: "Marvel Rivals", zh: "漫威争锋", year: 2024, genres: ["射击", "竞技"], minCpu: 58, minGpu: 46, minRam: 12, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 2080790, name: "Delta Force", zh: "三角洲行动", year: 2024, genres: ["射击"], minCpu: 60, minGpu: 54, minRam: 16, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 236390, name: "War Thunder", zh: "战争雷霆", year: 2013, genres: ["射击", "模拟"], minCpu: 30, minGpu: 22, minRam: 6, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 2073850, name: "THE FINALS", zh: "决赛", year: 2023, genres: ["射击", "竞技"], minCpu: 52, minGpu: 36, minRam: 12, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 1240440, name: "Halo Infinite", zh: "光环：无限", year: 2021, genres: ["射击"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 1085660, name: "Destiny 2", zh: "命运2", year: 2019, genres: ["射击", "ARPG"], minCpu: 44, minGpu: 34, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 230410, name: "Warframe", zh: "星际战甲", year: 2013, genres: ["射击", "ARPG"], minCpu: 36, minGpu: 24, minRam: 4, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 238960, name: "Path of Exile", zh: "流放之路", year: 2013, genres: ["ARPG"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: true, linux: false }, free: true },
  { id: 1599340, name: "Lost Ark", zh: "命运方舟", year: 2022, genres: ["ARPG"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 2139460, name: "Once Human", zh: "曾经的光", year: 2024, genres: ["生存", "射击"], minCpu: 54, minGpu: 42, minRam: 16, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 1097150, name: "Fall Guys", zh: "糖豆人", year: 2020, genres: ["休闲", "竞技"], minCpu: 40, minGpu: 22, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 291550, name: "Brawlhalla", zh: "大乱斗", year: 2017, genres: ["休闲", "竞技"], minCpu: 20, minGpu: 8, minRam: 2, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 386180, name: "Crossout", zh: "创世战车", year: 2017, genres: ["射击", "模拟"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 304930, name: "Unturned", zh: "未转变者", year: 2017, genres: ["生存", "休闲"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 1665460, name: "eFootball", zh: "实况足球", year: 2021, genres: ["体育", "竞技"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 438100, name: "VRChat", zh: "VR聊天室", year: 2017, genres: ["休闲", "沙盒"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, vr: true, free: true },
  { id: 761890, name: "Albion Online", zh: "阿尔比恩", year: 2017, genres: ["ARPG", "沙盒"], minCpu: 36, minGpu: 20, minRam: 4, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 1343400, name: "Old School RuneScape", zh: "老派江湖", year: 2020, genres: ["ARPG", "休闲"], minCpu: 10, minGpu: 4, minRam: 1, platforms: { win: true, mac: true, linux: false }, free: true },

  /* —— 热门 3A / 动作 —— */
  { id: 1245620, name: "ELDEN RING", zh: "艾尔登法环", year: 2022, genres: ["ARPG", "魂系", "开放世界"], minCpu: 50, minGpu: 46, minRam: 12, platforms: { win: true, mac: false, linux: false } },
  { id: 1086940, name: "Baldur's Gate 3", zh: "博德之门3", year: 2023, genres: ["ARPG", "策略"], minCpu: 58, minGpu: 42, minRam: 8, platforms: { win: true, mac: true, linux: false } },
  { id: 2358720, name: "Black Myth: Wukong", zh: "黑神话：悟空", year: 2024, genres: ["动作", "ARPG"], minCpu: 60, minGpu: 48, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1091500, name: "Cyberpunk 2077", zh: "赛博朋克2077", year: 2020, genres: ["ARPG", "开放世界", "射击"], minCpu: 58, minGpu: 42, minRam: 12, platforms: { win: true, mac: false, linux: false } },
  { id: 271590, name: "Grand Theft Auto V", zh: "侠盗猎车手5", year: 2015, genres: ["动作", "开放世界"], minCpu: 40, minGpu: 16, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 1174180, name: "Red Dead Redemption 2", zh: "荒野大镖客：救赎2", year: 2019, genres: ["动作", "开放世界"], minCpu: 50, minGpu: 40, minRam: 12, platforms: { win: true, mac: false, linux: false } },
  { id: 582010, name: "Monster Hunter: World", zh: "怪物猎人：世界", year: 2018, genres: ["动作", "合作"], minCpu: 44, minGpu: 32, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 814380, name: "Sekiro: Shadows Die Twice", zh: "只狼：影逝二度", year: 2019, genres: ["动作", "魂系"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 374320, name: "DARK SOULS III", zh: "黑暗之魂3", year: 2016, genres: ["动作", "魂系"], minCpu: 38, minGpu: 28, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1627720, name: "Lies of P", zh: "匹诺曹的谎言", year: 2023, genres: ["动作", "魂系"], minCpu: 52, minGpu: 40, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1325200, name: "Wo Long: Fallen Dynasty", zh: "卧龙：苍天陨落", year: 2023, genres: ["动作", "魂系"], minCpu: 54, minGpu: 42, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 2050650, name: "Resident Evil 4", zh: "生化危机4 重制版", year: 2023, genres: ["动作", "恐怖"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1196590, name: "Resident Evil Village", zh: "生化危机8：村庄", year: 2021, genres: ["动作", "恐怖"], minCpu: 50, minGpu: 42, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 2256430, name: "Alan Wake 2", zh: "心灵杀手2", year: 2023, genres: ["动作", "恐怖"], minCpu: 62, minGpu: 56, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 870780, name: "Control", zh: "控制", year: 2019, genres: ["动作", "冒险"], minCpu: 50, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 782330, name: "DOOM Eternal", zh: "毁灭战士：永恒", year: 2020, genres: ["射击", "动作"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1593500, name: "God of War", zh: "战神", year: 2022, genres: ["动作", "冒险"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1888930, name: "The Last of Us Part I", zh: "最后生还者 第一部", year: 2023, genres: ["动作", "冒险"], minCpu: 60, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 2215430, name: "Ghost of Tsushima", zh: "对马岛之魂", year: 2024, genres: ["动作", "开放世界"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1850570, name: "Death Stranding", zh: "死亡搁浅", year: 2020, genres: ["动作", "开放世界"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1243830, name: "Hogwarts Legacy", zh: "霍格沃茨之遗", year: 2023, genres: ["ARPG", "开放世界"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1716740, name: "Starfield", zh: "星空", year: 2023, genres: ["ARPG", "开放世界"], minCpu: 60, minGpu: 48, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 534380, name: "Dying Light 2", zh: "消逝的光芒2", year: 2022, genres: ["动作", "开放世界"], minCpu: 50, minGpu: 40, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 489830, name: "The Elder Scrolls V: Skyrim SE", zh: "上古卷轴5：天际", year: 2016, genres: ["ARPG", "开放世界"], minCpu: 38, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 292030, name: "The Witcher 3: Wild Hunt", zh: "巫师3：狂猎", year: 2015, genres: ["ARPG", "开放世界"], minCpu: 44, minGpu: 30, minRam: 6, platforms: { win: true, mac: false, linux: false } },
  { id: 524220, name: "NieR: Automata", zh: "尼尔：机械纪元", year: 2017, genres: ["动作", "ARPG"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1235140, name: "Yakuza: Like a Dragon", zh: "如龙7", year: 2020, genres: ["动作", "ARPG"], minCpu: 50, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1687950, name: "Persona 5 Royal", zh: "女神异闻录5 皇家版", year: 2022, genres: ["ARPG", "策略"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1446780, name: "Monster Hunter Rise", zh: "怪物猎人：崛起", year: 2022, genres: ["动作", "合作"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },

  /* —— 合作 / 派对 / 独立 —— */
  { id: 1426210, name: "It Takes Two", zh: "双人成行", year: 2021, genres: ["合作", "冒险", "平台"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 448510, name: "Overcooked! 2", zh: "胡闹厨房2", year: 2018, genres: ["休闲", "合作"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 550, name: "Left 4 Dead 2", zh: "求生之路2", year: 2009, genres: ["射击", "合作"], minCpu: 20, minGpu: 10, minRam: 2, platforms: { win: true, mac: true, linux: true }, free: true },
  { id: 945360, name: "Among Us", zh: "在我们之中", year: 2018, genres: ["休闲", "合作"], minCpu: 20, minGpu: 6, minRam: 2, platforms: { win: true, mac: true, linux: false } },
  { id: 837470, name: "Untitled Goose Game", zh: "捣蛋鹅", year: 2019, genres: ["休闲", "独立"], minCpu: 28, minGpu: 12, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 4000, name: "Garry's Mod", zh: "盖瑞模组", year: 2006, genres: ["沙盒", "休闲"], minCpu: 26, minGpu: 10, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 413150, name: "Stardew Valley", zh: "星露谷物语", year: 2016, genres: ["模拟", "独立", "休闲"], minCpu: 20, minGpu: 8, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 105600, name: "Terraria", zh: "泰拉瑞亚", year: 2011, genres: ["沙盒", "独立", "生存"], minCpu: 16, minGpu: 6, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 620, name: "Portal 2", zh: "传送门2", year: 2011, genres: ["平台", "休闲"], minCpu: 22, minGpu: 8, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 220, name: "Half-Life 2", zh: "半条命2", year: 2004, genres: ["射击", "动作"], minCpu: 14, minGpu: 5, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 1145360, name: "Hades", zh: "黑帝斯", year: 2020, genres: ["动作", "独立"], minCpu: 34, minGpu: 24, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 367520, name: "Hollow Knight", zh: "空洞骑士", year: 2017, genres: ["平台", "独立"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 646570, name: "Slay the Spire", zh: "杀戮尖塔", year: 2019, genres: ["策略", "独立"], minCpu: 30, minGpu: 12, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 1794680, name: "Vampire Survivors", zh: "吸血鬼幸存者", year: 2022, genres: ["休闲", "独立"], minCpu: 24, minGpu: 10, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 387290, name: "Ori and the Blind Forest", zh: "精灵与森林", year: 2015, genres: ["平台", "独立"], minCpu: 30, minGpu: 16, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 504230, name: "Celeste", zh: "蔚蓝", year: 2018, genres: ["平台", "独立"], minCpu: 26, minGpu: 10, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 268910, name: "Cuphead", zh: "茶杯头", year: 2017, genres: ["平台", "独立"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 460950, name: "Katana ZERO", zh: "武士零", year: 2019, genres: ["动作", "独立"], minCpu: 28, minGpu: 12, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 632470, name: "Disco Elysium", zh: "极乐迪斯科", year: 2019, genres: ["ARPG", "独立"], minCpu: 34, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 753640, name: "Outer Wilds", zh: "星际拓荒", year: 2019, genres: ["冒险", "独立"], minCpu: 40, minGpu: 30, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 435150, name: "Divinity: Original Sin 2", zh: "神界：原罪2", year: 2017, genres: ["ARPG", "策略"], minCpu: 48, minGpu: 34, minRam: 8, platforms: { win: true, mac: true, linux: false } },

  /* —— 生存 / 沙盒 / 恐怖 —— */
  { id: 1623730, name: "Palworld", zh: "幻兽帕鲁", year: 2024, genres: ["生存", "沙盒", "合作"], minCpu: 56, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 252490, name: "Rust", zh: "腐蚀", year: 2018, genres: ["生存", "竞技"], minCpu: 44, minGpu: 36, minRam: 10, platforms: { win: true, mac: false, linux: false } },
  { id: 221100, name: "DayZ", zh: "僵尸末日", year: 2018, genres: ["生存", "射击"], minCpu: 40, minGpu: 28, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 892970, name: "Valheim", zh: "英灵神殿", year: 2021, genres: ["生存", "合作"], minCpu: 44, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: true } },
  { id: 242760, name: "The Forest", zh: "森林", year: 2018, genres: ["生存", "恐怖"], minCpu: 40, minGpu: 30, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 1326470, name: "Sons Of The Forest", zh: "森林之子", year: 2023, genres: ["生存", "恐怖"], minCpu: 52, minGpu: 42, minRam: 12, platforms: { win: true, mac: false, linux: false } },
  { id: 2399830, name: "ARK: Survival Ascended", zh: "方舟：生存飞升", year: 2023, genres: ["生存", "沙盒"], minCpu: 62, minGpu: 58, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 264710, name: "Subnautica", zh: "深海迷航", year: 2018, genres: ["生存", "独立"], minCpu: 36, minGpu: 24, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 648800, name: "Raft", zh: "木筏求生", year: 2022, genres: ["生存", "合作"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 275850, name: "No Man's Sky", zh: "无人深空", year: 2016, genres: ["模拟", "开放世界", "生存"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: true, linux: false } },
  { id: 381210, name: "Dead by Daylight", zh: "黎明杀机", year: 2016, genres: ["恐怖", "竞技"], minCpu: 40, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 739630, name: "Phasmophobia", zh: "恐鬼症", year: 2020, genres: ["恐怖", "合作"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1966720, name: "Lethal Company", zh: "致命公司", year: 2023, genres: ["恐怖", "合作"], minCpu: 36, minGpu: 24, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1361210, name: "Content Warning", zh: "内容警告", year: 2024, genres: ["恐怖", "合作"], minCpu: 36, minGpu: 24, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 427520, name: "Factorio", zh: "异星工厂", year: 2020, genres: ["模拟", "策略"], minCpu: 36, minGpu: 16, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 526870, name: "Satisfactory", zh: "幸福工厂", year: 2024, genres: ["模拟", "沙盒"], minCpu: 50, minGpu: 40, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1366540, name: "Dyson Sphere Program", zh: "戴森球计划", year: 2021, genres: ["模拟", "策略"], minCpu: 44, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },

  /* —— 竞技 / 射击 / 格斗 —— */
  { id: 976730, name: "Halo: The Master Chief Collection", zh: "光环：士官长合集", year: 2019, genres: ["射击"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1172620, name: "Sea of Thieves", zh: "盗贼之海", year: 2020, genres: ["冒险", "合作"], minCpu: 44, minGpu: 36, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 548430, name: "Deep Rock Galactic", zh: "深岩银河", year: 2020, genres: ["射击", "合作"], minCpu: 44, minGpu: 34, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 553850, name: "HELLDIVERS 2", zh: "绝地潜兵2", year: 2024, genres: ["射击", "合作"], minCpu: 52, minGpu: 42, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 359550, name: "Rainbow Six Siege", zh: "彩虹六号：围攻", year: 2015, genres: ["射击", "竞技"], minCpu: 40, minGpu: 30, minRam: 6, platforms: { win: true, mac: false, linux: false } },
  { id: 1364780, name: "Street Fighter 6", zh: "街霸6", year: 2023, genres: ["竞技", "动作"], minCpu: 52, minGpu: 40, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1778820, name: "TEKKEN 8", zh: "铁拳8", year: 2024, genres: ["竞技", "动作"], minCpu: 56, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 2878800, name: "NBA 2K25", zh: "NBA 2K25", year: 2024, genres: ["体育", "竞技"], minCpu: 54, minGpu: 46, minRam: 8, platforms: { win: true, mac: false, linux: false } },

  /* —— 模拟 / 竞速 / 策略 —— */
  { id: 1551360, name: "Forza Horizon 5", zh: "极限竞速：地平线5", year: 2021, genres: ["竞速", "开放世界"], minCpu: 56, minGpu: 44, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 244210, name: "Assetto Corsa", zh: "神力科莎", year: 2014, genres: ["竞速", "模拟"], minCpu: 34, minGpu: 22, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 284160, name: "BeamNG.drive", zh: "光束骑士", year: 2015, genres: ["竞速", "模拟"], minCpu: 40, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 227300, name: "Euro Truck Simulator 2", zh: "欧洲卡车模拟2", year: 2012, genres: ["模拟", "休闲"], minCpu: 26, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 257910, name: "Cities: Skylines", zh: "城市：天际线", year: 2015, genres: ["模拟", "策略"], minCpu: 36, minGpu: 22, minRam: 6, platforms: { win: true, mac: true, linux: true } },
  { id: 703080, name: "Planet Zoo", zh: "动物园之星", year: 2019, genres: ["模拟"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1222670, name: "The Sims 4", zh: "模拟人生4", year: 2020, genres: ["模拟", "休闲"], minCpu: 34, minGpu: 20, minRam: 4, platforms: { win: true, mac: true, linux: false }, free: true },
  { id: 289070, name: "Sid Meier's Civilization VI", zh: "文明6", year: 2016, genres: ["策略"], minCpu: 40, minGpu: 30, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 779340, name: "Total War: THREE KINGDOMS", zh: "全面战争：三国", year: 2019, genres: ["策略"], minCpu: 50, minGpu: 36, minRam: 6, platforms: { win: true, mac: true, linux: true } },
  { id: 1466860, name: "Age of Empires IV", zh: "帝国时代4", year: 2021, genres: ["策略"], minCpu: 48, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 2252570, name: "Football Manager 2024", zh: "足球经理2024", year: 2023, genres: ["策略", "体育"], minCpu: 40, minGpu: 18, minRam: 4, platforms: { win: true, mac: true, linux: false } },

  /* —— VR —— */
  { id: 546560, name: "Half-Life: Alyx", zh: "半条命：爱莉克斯", year: 2020, genres: ["射击", "动作"], minCpu: 52, minGpu: 42, minRam: 12, platforms: { win: true, mac: false, linux: true }, vr: true },
  { id: 620980, name: "Beat Saber", zh: "节奏光剑", year: 2019, genres: ["休闲", "竞技"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false }, vr: true },
  { id: 555160, name: "Pavlov VR", zh: "帕夫洛夫", year: 2017, genres: ["射击", "竞技"], minCpu: 50, minGpu: 40, minRam: 8, platforms: { win: true, mac: false, linux: true }, vr: true },
  { id: 629730, name: "Blade and Sorcery", zh: "刀锋与魔法", year: 2018, genres: ["动作", "沙盒"], minCpu: 44, minGpu: 36, minRam: 8, platforms: { win: true, mac: false, linux: false }, vr: true },
];
