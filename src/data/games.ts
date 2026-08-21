/*
 * Copyright (C) 2026 王博
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
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
  /** 推荐配置（可选）：达到即判「完美运行」 */
  recCpu?: number;
  recGpu?: number;
  recRam?: number;
  minNote?: string;
  recNote?: string;
  /** 自定义封面图（本地上传的 base64 或外链） */
  image?: string;
  platforms: { win: boolean; mac: boolean; linux: boolean };
  vr?: boolean;
  free?: boolean;
  custom?: boolean;
  /** 由「一键更新游戏库」从 Steam 在线导入 */
  ext?: boolean;
}

/** 在线导入游戏库的本地持久化键 */
export const EXT_GAMES_KEY = "cip.extGames.v1";

/** 将 Steam 官方类型描述（中文或英文）映射为本工具的类型标签 */
export function mapSteamGenres(list: string[]): string[] {
  const s = list.join("|");
  const hit: string[] = [];
  const add = (g: string) => {
    if (!hit.includes(g) && ALL_GENRES.includes(g)) hit.push(g);
  };
  if (/射击|shooter/i.test(s)) add("射击");
  if (/角色扮演|rpg/i.test(s)) add("ARPG");
  if (/动作|action/i.test(s)) add("动作");
  if (/冒险|adventure/i.test(s)) add("冒险");
  if (/策略|strategy/i.test(s)) add("策略");
  if (/模拟|simulation/i.test(s)) add("模拟");
  if (/竞速|racing/i.test(s)) add("竞速");
  if (/体育|sports/i.test(s)) add("体育");
  if (/休闲|casual/i.test(s)) add("休闲");
  if (/独立|indie/i.test(s)) add("独立");
  if (/恐怖|horror/i.test(s)) add("恐怖");
  if (/生存|survival/i.test(s)) add("生存");
  if (/沙盒|sandbox/i.test(s)) add("沙盒");
  if (/平台|platformer/i.test(s)) add("平台");
  if (/合作|co-?op/i.test(s)) add("合作");
  if (/大型多人|mmo/i.test(s)) add("其他");
  return hit.slice(0, 3);
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
  { id: 255710, name: "Cities: Skylines", zh: "城市：天际线", year: 2015, genres: ["模拟", "策略"], minCpu: 36, minGpu: 22, minRam: 6, platforms: { win: true, mac: true, linux: true } },
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

  /* —— 经典老游戏 —— */
  { id: 10, name: "Counter-Strike 1.6", zh: "反恐精英1.6", year: 2000, genres: ["射击", "竞技"], minCpu: 8, minGpu: 4, minRam: 1, platforms: { win: true, mac: true, linux: true } },
  { id: 70, name: "Half-Life", zh: "半条命", year: 1998, genres: ["射击"], minCpu: 6, minGpu: 2, minRam: 1, platforms: { win: true, mac: true, linux: true } },
  { id: 400, name: "Portal", zh: "传送门", year: 2007, genres: ["平台", "休闲"], minCpu: 14, minGpu: 4, minRam: 1, platforms: { win: true, mac: true, linux: true } },
  { id: 500, name: "Left 4 Dead", zh: "求生之路", year: 2008, genres: ["射击", "合作"], minCpu: 16, minGpu: 6, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 3590, name: "Plants vs. Zombies: GOTY", zh: "植物大战僵尸", year: 2009, genres: ["休闲", "策略"], minCpu: 10, minGpu: 2, minRam: 1, platforms: { win: true, mac: true, linux: false } },
  { id: 22300, name: "Fallout 3", zh: "辐射3", year: 2008, genres: ["ARPG", "开放世界"], minCpu: 18, minGpu: 6, minRam: 2, platforms: { win: true, mac: false, linux: false } },
  { id: 22380, name: "Fallout: New Vegas", zh: "辐射：新维加斯", year: 2010, genres: ["ARPG", "开放世界"], minCpu: 20, minGpu: 8, minRam: 2, platforms: { win: true, mac: false, linux: false } },
  { id: 22330, name: "The Elder Scrolls IV: Oblivion", zh: "上古卷轴4：湮灭", year: 2006, genres: ["ARPG", "开放世界"], minCpu: 16, minGpu: 6, minRam: 1, platforms: { win: true, mac: false, linux: false } },
  { id: 377160, name: "Fallout 4", zh: "辐射4", year: 2015, genres: ["ARPG", "开放世界", "射击"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1151340, name: "Fallout 76", zh: "辐射76", year: 2020, genres: ["ARPG", "开放世界"], minCpu: 48, minGpu: 34, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 306130, name: "The Elder Scrolls Online", zh: "上古卷轴OL", year: 2014, genres: ["ARPG"], minCpu: 34, minGpu: 20, minRam: 4, platforms: { win: true, mac: true, linux: false } },

  /* —— 射击 / 战术 / 恐怖 —— */
  { id: 218620, name: "PAYDAY 2", zh: "收获日2", year: 2013, genres: ["射击", "合作"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: false, linux: true } },
  { id: 1938090, name: "Call of Duty: Warzone", zh: "使命召唤：战争地带", year: 2022, genres: ["射击", "竞技"], minCpu: 52, minGpu: 38, minRam: 12, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 1144200, name: "Ready or Not", zh: "严阵以待", year: 2021, genres: ["射击"], minCpu: 48, minGpu: 34, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 581320, name: "Insurgency: Sandstorm", zh: "叛乱：沙漠风暴", year: 2018, genres: ["射击"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 393080, name: "Squad", zh: "战术小队", year: 2020, genres: ["射击"], minCpu: 48, minGpu: 34, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 686810, name: "Hell Let Loose", zh: "人间地狱", year: 2021, genres: ["射击"], minCpu: 52, minGpu: 38, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 107410, name: "Arma 3", zh: "武装突袭3", year: 2013, genres: ["射击", "模拟"], minCpu: 36, minGpu: 20, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 552500, name: "Warhammer: Vermintide 2", zh: "战锤：末世鼠疫2", year: 2018, genres: ["动作", "合作"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 883710, name: "Resident Evil 2", zh: "生化危机2 重制版", year: 2019, genres: ["动作", "恐怖"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 952060, name: "Resident Evil 3", zh: "生化危机3 重制版", year: 2020, genres: ["动作", "恐怖"], minCpu: 46, minGpu: 32, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 214490, name: "Alien: Isolation", zh: "异形：隔离", year: 2014, genres: ["恐怖"], minCpu: 32, minGpu: 18, minRam: 4, platforms: { win: true, mac: false, linux: true } },
  { id: 2183900, name: "Warhammer 40,000: Space Marine 2", zh: "战锤40K：星际战士2", year: 2024, genres: ["射击", "动作"], minCpu: 54, minGpu: 42, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1643320, name: "S.T.A.L.K.E.R. 2", zh: "潜行者2", year: 2024, genres: ["射击", "开放世界"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 513710, name: "SCUM", zh: "人渣", year: 2018, genres: ["生存", "射击"], minCpu: 48, minGpu: 34, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 251570, name: "7 Days to Die", zh: "七日杀", year: 2013, genres: ["生存"], minCpu: 38, minGpu: 22, minRam: 8, platforms: { win: true, mac: true, linux: true } },
  { id: 108600, name: "Project Zomboid", zh: "僵尸毁灭工程", year: 2013, genres: ["生存", "独立"], minCpu: 30, minGpu: 10, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 346110, name: "ARK: Survival Evolved", zh: "方舟：生存进化", year: 2017, genres: ["生存", "开放世界"], minCpu: 44, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 322330, name: "Don't Starve Together", zh: "饥荒：联机版", year: 2016, genres: ["生存", "独立"], minCpu: 28, minGpu: 10, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 518790, name: "theHunter: Call of the Wild", zh: "猎人：荒野的呼唤", year: 2017, genres: ["模拟"], minCpu: 38, minGpu: 24, minRam: 6, platforms: { win: true, mac: false, linux: false } },
  { id: 1604030, name: "V Rising", zh: "夜族崛起", year: 2022, genres: ["生存", "ARPG"], minCpu: 46, minGpu: 32, minRam: 12, platforms: { win: true, mac: false, linux: false } },
  { id: 365590, name: "Tom Clancy's The Division 2", zh: "全境封锁2", year: 2019, genres: ["射击", "ARPG"], minCpu: 46, minGpu: 32, minRam: 8, platforms: { win: true, mac: false, linux: false } },

  /* —— 动作 3A —— */
  { id: 1817070, name: "Marvel's Spider-Man Remastered", zh: "漫威蜘蛛侠 重制版", year: 2022, genres: ["动作", "开放世界"], minCpu: 52, minGpu: 38, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1817190, name: "Marvel's Spider-Man: Miles Morales", zh: "蜘蛛侠：迈尔斯·莫拉莱斯", year: 2022, genres: ["动作", "开放世界"], minCpu: 52, minGpu: 40, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1517290, name: "The Last of Us Part I", zh: "最后生还者 第一部", year: 2023, genres: ["动作", "冒险"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1029890, name: "Horizon Zero Dawn", zh: "地平线：零之曙光", year: 2020, genres: ["动作", "开放世界"], minCpu: 44, minGpu: 32, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 2420110, name: "Horizon Forbidden West", zh: "地平线：西之绝境", year: 2024, genres: ["动作", "开放世界"], minCpu: 58, minGpu: 46, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 208650, name: "Batman: Arkham Knight", zh: "蝙蝠侠：阿卡姆骑士", year: 2015, genres: ["动作"], minCpu: 40, minGpu: 28, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 205100, name: "Dishonored", zh: "羞辱", year: 2012, genres: ["动作"], minCpu: 26, minGpu: 12, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 480490, name: "Prey", zh: "掠食", year: 2017, genres: ["射击"], minCpu: 40, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 203160, name: "Tomb Raider", zh: "古墓丽影9", year: 2013, genres: ["动作", "冒险"], minCpu: 30, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 391220, name: "Rise of the Tomb Raider", zh: "古墓丽影：崛起", year: 2016, genres: ["动作", "冒险"], minCpu: 36, minGpu: 22, minRam: 6, platforms: { win: true, mac: false, linux: false } },
  { id: 750920, name: "Shadow of the Tomb Raider", zh: "古墓丽影：暗影", year: 2018, genres: ["动作", "冒险"], minCpu: 42, minGpu: 30, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 49520, name: "Borderlands 2", zh: "无主之地2", year: 2012, genres: ["射击", "ARPG"], minCpu: 28, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 397540, name: "Borderlands 3", zh: "无主之地3", year: 2019, genres: ["射击", "ARPG"], minCpu: 46, minGpu: 32, minRam: 6, platforms: { win: true, mac: false, linux: false } },
  { id: 239140, name: "Dying Light", zh: "消逝的光芒", year: 2015, genres: ["动作", "生存"], minCpu: 38, minGpu: 24, minRam: 4, platforms: { win: true, mac: false, linux: true } },
  { id: 367500, name: "Dragon's Dogma: Dark Arisen", zh: "龙之信条", year: 2016, genres: ["ARPG"], minCpu: 32, minGpu: 18, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 2246380, name: "Monster Hunter Wilds", zh: "怪物猎人：荒野", year: 2025, genres: ["动作", "合作"], minCpu: 60, minGpu: 48, minRam: 16, platforms: { win: true, mac: false, linux: false } },

  /* —— 策略 / 模拟 / 竞速 —— */
  { id: 236850, name: "Europa Universalis IV", zh: "欧陆风云4", year: 2013, genres: ["策略"], minCpu: 32, minGpu: 8, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 1158310, name: "Crusader Kings III", zh: "十字军之王3", year: 2020, genres: ["策略"], minCpu: 42, minGpu: 14, minRam: 6, platforms: { win: true, mac: true, linux: false } },
  { id: 281990, name: "Stellaris", zh: "群星", year: 2016, genres: ["策略"], minCpu: 38, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 949230, name: "Cities: Skylines II", zh: "城市：天际线2", year: 2023, genres: ["模拟", "策略"], minCpu: 60, minGpu: 46, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 493340, name: "Planet Coaster", zh: "过山车之星", year: 2016, genres: ["模拟"], minCpu: 40, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1248130, name: "Farming Simulator 22", zh: "模拟农场22", year: 2021, genres: ["模拟"], minCpu: 42, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 916440, name: "Anno 1800", zh: "纪元1800", year: 2019, genres: ["模拟", "策略"], minCpu: 46, minGpu: 28, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 221380, name: "Age of Empires II: Definitive Edition", zh: "帝国时代2：决定版", year: 2019, genres: ["策略"], minCpu: 32, minGpu: 10, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 233450, name: "Prison Architect", zh: "监狱建筑师", year: 2015, genres: ["模拟", "策略"], minCpu: 32, minGpu: 8, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 294100, name: "RimWorld", zh: "环世界", year: 2018, genres: ["模拟", "策略"], minCpu: 32, minGpu: 8, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 457140, name: "Oxygen Not Included", zh: "缺氧", year: 2019, genres: ["模拟"], minCpu: 32, minGpu: 10, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 220200, name: "Kerbal Space Program", zh: "坎巴拉太空计划", year: 2015, genres: ["模拟"], minCpu: 32, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 244850, name: "Space Engineers", zh: "太空工程师", year: 2019, genres: ["模拟", "沙盒"], minCpu: 38, minGpu: 24, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 270880, name: "American Truck Simulator", zh: "美国卡车模拟", year: 2016, genres: ["模拟", "竞速"], minCpu: 32, minGpu: 14, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 1293830, name: "Forza Horizon 4", zh: "极限竞速：地平线4", year: 2021, genres: ["竞速", "开放世界"], minCpu: 46, minGpu: 32, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 2442190, name: "Forza Motorsport", zh: "极限竞速", year: 2023, genres: ["竞速", "模拟"], minCpu: 56, minGpu: 44, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1250410, name: "Microsoft Flight Simulator", zh: "微软模拟飞行", year: 2020, genres: ["模拟"], minCpu: 60, minGpu: 42, minRam: 16, platforms: { win: true, mac: false, linux: false } },
  { id: 1692250, name: "F1 23", zh: "F1 23", year: 2023, genres: ["竞速"], minCpu: 52, minGpu: 38, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 252950, name: "Rocket League", zh: "火箭联盟", year: 2015, genres: ["竞速", "体育", "竞技"], minCpu: 32, minGpu: 16, minRam: 4, platforms: { win: true, mac: true, linux: true }, free: true },

  /* —— 独立精品 —— */
  { id: 391540, name: "Undertale", zh: "传说之下", year: 2015, genres: ["独立"], minCpu: 16, minGpu: 4, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 113200, name: "The Binding of Isaac", zh: "以撒的结合", year: 2011, genres: ["独立"], minCpu: 18, minGpu: 4, minRam: 2, platforms: { win: true, mac: true, linux: false } },
  { id: 250900, name: "The Binding of Isaac: Rebirth", zh: "以撒的结合：重生", year: 2014, genres: ["独立"], minCpu: 28, minGpu: 10, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 311690, name: "Enter the Gungeon", zh: "挺进地牢", year: 2016, genres: ["独立", "射击"], minCpu: 28, minGpu: 10, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 588650, name: "Dead Cells", zh: "死亡细胞", year: 2018, genres: ["动作", "独立"], minCpu: 32, minGpu: 12, minRam: 6, platforms: { win: true, mac: true, linux: true } },
  { id: 1057090, name: "Ori and the Will of the Wisps", zh: "精灵与萤火意志", year: 2020, genres: ["平台", "独立"], minCpu: 40, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1145350, name: "Hades II", zh: "哈迪斯2", year: 2024, genres: ["动作", "独立"], minCpu: 52, minGpu: 32, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 1942280, name: "Brotato", zh: "土豆兄弟", year: 2022, genres: ["休闲", "独立"], minCpu: 22, minGpu: 6, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 1948280, name: "Stacklands", zh: "卡牌城镇", year: 2022, genres: ["休闲", "策略"], minCpu: 24, minGpu: 6, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 250760, name: "Shovel Knight", zh: "铲子骑士", year: 2014, genres: ["平台", "独立"], minCpu: 18, minGpu: 6, minRam: 2, platforms: { win: true, mac: true, linux: true } },
  { id: 553420, name: "TUNIC", zh: "丘尼卡传说", year: 2022, genres: ["冒险", "独立"], minCpu: 32, minGpu: 12, minRam: 4, platforms: { win: true, mac: true, linux: false } },
  { id: 262060, name: "Darkest Dungeon", zh: "暗黑地牢", year: 2016, genres: ["策略", "独立"], minCpu: 32, minGpu: 8, minRam: 4, platforms: { win: true, mac: true, linux: true } },
  { id: 1940340, name: "Darkest Dungeon II", zh: "暗黑地牢2", year: 2023, genres: ["策略", "独立"], minCpu: 46, minGpu: 20, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 632360, name: "Risk of Rain 2", zh: "雨中冒险2", year: 2020, genres: ["动作", "独立"], minCpu: 40, minGpu: 22, minRam: 4, platforms: { win: true, mac: false, linux: false } },
  { id: 219990, name: "Grim Dawn", zh: "恐怖黎明", year: 2016, genres: ["ARPG"], minCpu: 32, minGpu: 14, minRam: 4, platforms: { win: true, mac: false, linux: false } },

  /* —— 网游 / 免费 —— */
  { id: 39210, name: "FINAL FANTASY XIV Online", zh: "最终幻想14", year: 2014, genres: ["ARPG"], minCpu: 36, minGpu: 26, minRam: 8, platforms: { win: true, mac: false, linux: false } },
  { id: 386360, name: "SMITE", zh: "神之浩劫", year: 2015, genres: ["竞技"], minCpu: 32, minGpu: 16, minRam: 4, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 582660, name: "Black Desert", zh: "黑色沙漠", year: 2017, genres: ["ARPG"], minCpu: 42, minGpu: 28, minRam: 8, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 1449850, name: "Yu-Gi-Oh! Master Duel", zh: "游戏王：大师决斗", year: 2022, genres: ["策略", "休闲"], minCpu: 32, minGpu: 12, minRam: 4, platforms: { win: true, mac: false, linux: false }, free: true },
  { id: 2064650, name: "Tower of Fantasy", zh: "幻塔", year: 2022, genres: ["ARPG", "开放世界"], minCpu: 50, minGpu: 36, minRam: 16, platforms: { win: true, mac: false, linux: false }, free: true },
];
