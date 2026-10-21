// UI translations (English / Simplified Chinese) and the language setting.
// Strings may contain {placeholders}; **double asterisks** mark bold text for <Rich>.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Role } from './game/rules';
import type { KnowledgeHint, KnowledgeKind } from './game/engine';

export type Lang = 'en' | 'zh';
export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '简体中文' },
];

type Params = Record<string, string | number>;
type Entry = string | ((p: Params) => string);

const en = {
  // Home & app
  'app.subtitle': 'The Battle of Loyalty and Deception',
  'home.tagline': '5–10 players · one phone · no game master',
  'home.newGame': 'New Game',
  'home.resume': 'Resume Game',
  'home.howToPlay': 'How to Play',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.done': 'Done',
  'stage.setup': 'Setup',
  'stage.reveal': 'Character reveal',
  'stage.mission': 'Mission {n}',
  'stage.assassin': 'Assassin phase',
  'stage.final': 'Final results',
  'abandon.title': 'Abandon current game?',
  'abandon.body': 'A game is in progress. Starting a new one will discard it permanently.',
  'abandon.confirm': 'Start New Game',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.home': 'Home',
  'common.continue': 'Continue',
  'team.good': 'Good',
  'team.evil': 'Evil',

  // Handover & progress
  'handover.passTo': 'Pass the phone to',
  'handover.onlyYou': 'Make sure only {name} can see the screen.',
  'progress.players': '{done} of {total} players completed',
  'progress.cards': '{done} of {total} mission cards submitted',

  // Roles
  'role.merlin.name': 'Merlin',
  'role.merlin.tagline': 'Guide the forces of Arthur while keeping your identity secret.',
  'role.merlin.description':
    'You know the agents of Evil. Steer the knights toward loyal companions — but if the Assassin discovers you at the end, Evil steals the victory.',
  'role.percival.name': 'Percival',
  'role.percival.tagline': 'Protect Merlin, whatever the cost.',
  'role.percival.description':
    'You know who Merlin might be. Shield Merlin from the Assassin by drawing suspicion and following Merlin’s quiet guidance.',
  'role.servant.name': 'Loyal Servant of Arthur',
  'role.servant.tagline': 'Serve the realm with honour.',
  'role.servant.description':
    'You have no secret knowledge. Watch the missions, question everyone, and help three missions succeed.',
  'role.assassin.name': 'Assassin',
  'role.assassin.tagline': 'Strike down Merlin and claim victory.',
  'role.assassin.description':
    'You know your fellow agents of Evil. Sabotage missions — and if Good completes three, you get one final chance: name Merlin and Evil wins.',
  'role.morgana.name': 'Morgana',
  'role.morgana.tagline': 'Wear Merlin’s face and lead the faithful astray.',
  'role.morgana.description':
    'You know your fellow agents of Evil. Percival sees you as a possible Merlin — use that confusion to mislead the loyal.',
  'role.mordred.name': 'Mordred',
  'role.mordred.tagline': 'Hidden even from Merlin’s sight.',
  'role.mordred.description':
    'You know your fellow agents of Evil, and Merlin cannot see you. Earn the trust of Good and betray it when it matters most.',
  'role.oberon.name': 'Oberon',
  'role.oberon.tagline': 'Serve Evil alone, in the shadows.',
  'role.oberon.description':
    'You do not know the other agents of Evil, and they do not know you. Only Merlin senses your darkness. Sabotage missions on your own.',
  'role.minion.name': 'Minion of Mordred',
  'role.minion.tagline': 'Sow doubt and sabotage the quests.',
  'role.minion.description':
    'You know your fellow agents of Evil. Blend in with the loyal, get onto missions, and make three of them fail.',

  // Private knowledge
  'knowledge.evilForMerlin': 'The agents of Evil',
  'knowledge.merlinCandidates': 'One of these is Merlin',
  'knowledge.merlin': 'Merlin',
  'knowledge.evilTeammates': 'Your fellow agents of Evil',
  'hint.merlinMordredHidden': 'Mordred is hidden from your sight — one Evil player is not shown.',
  'hint.merlinDefault': 'Never let them learn that you know.',
  'hint.percivalMorgana': 'The other is Morgana, wearing Merlin’s face. You do not know which is which.',
  'hint.percivalSingle': 'Protect Merlin’s identity from the Assassin.',
  'hint.oberon': 'You walk alone: you do not know the other agents of Evil, and they do not know you.',
  'hint.servant': 'Trust your judgement, and watch every mission closely.',
  'hint.evilOberonHidden': 'Oberon also serves Evil, but is hidden from you.',
  'hint.evilDefault': 'Their exact roles are hidden — work together in secret.',

  // How to play
  'howto.title': 'How to Play',
  'howto.gotIt': 'Got it',
  'howto.goalTitle': 'The goal',
  'howto.goalBody':
    'The loyal servants of Arthur (Good) must succeed three of five missions. The minions of Mordred (Evil) hide among them and need three missions to fail.',
  'howto.secretTitle': 'Secret characters',
  'howto.secretBody1':
    'Pass the phone around. Each player privately views their character and any secret knowledge they hold, then hides it before passing on.',
  'howto.secretBody2':
    '**Merlin** knows Evil — but must stay hidden. **Percival** knows who might be Merlin. Evil players know each other (except Oberon).',
  'howto.charactersTitle': 'The characters',
  'howto.knows': 'Knows:',
  'inPlay.always': 'Always in play',
  'inPlay.optional': 'Optional',
  'inPlay.optionalNeedsPercival': 'Optional (needs Percival)',
  'inPlay.fillGood': 'Fills the remaining Good seats',
  'inPlay.fillEvil': 'Fills the remaining Evil seats',
  'knows.merlin': 'Sees every Evil player except Mordred (Oberon is visible), but not their exact roles.',
  'knows.percival': 'Sees Merlin. With Morgana in play, sees two candidates and doesn’t know which is the real Merlin.',
  'knows.servant': 'Knows nothing. Watch the missions and trust your judgement.',
  'knows.assassin': 'Sees fellow Evil players except Oberon. Gets one guess at Merlin if Good wins three missions.',
  'knows.morgana': 'Sees fellow Evil players except Oberon. Appears to Percival as a possible Merlin.',
  'knows.mordred': 'Sees fellow Evil players except Oberon. Hidden from Merlin.',
  'knows.oberon': 'Sees no one, and the other Evil players don’t see Oberon. Only Merlin can spot Oberon.',
  'knows.minion': 'Sees fellow Evil players except Oberon.',
  'howto.missionTitle': 'Each mission',
  'howto.mission1':
    '**1. Choose a team.** The leader (crown) picks the required number of players: e.g. with 5 players: 2, 3, 3, then 4 and 4.',
  'howto.mission2':
    '**2. One secret vote.** Only the chosen players vote, each secretly playing Success or Fail. Everyone is free to choose either. Only the totals are revealed — never who played what.',
  'howto.mission3':
    '**3. Result.** One Fail sinks Missions 1–3. Missions 4 and 5 take one extra player and need **two** Fails to fail. The leader then passes clockwise.',
  'howto.twistTitle': 'The final twist',
  'howto.twistBody': 'If Good wins three missions, the Assassin gets one guess at Merlin. Guess right and Evil wins anyway.',
  'howto.etiquetteTitle': 'Table etiquette',
  'howto.etiquetteBody': 'Discuss freely, lie boldly — but never peek at the phone when it isn’t your turn!',

  // Player count
  'count.stage': 'Step 1 of 3 · Players',
  'count.title': 'How many players?',
  'count.subtitle': 'Gather 5 to 10 brave souls',

  // Names
  'names.stage': 'Step 2 of 3 · Names',
  'names.title': 'Who will play?',
  'names.subtitle': 'Enter names in seating order, clockwise',
  'names.player': 'Player {n}',
  'names.placeholder': 'Enter name',
  'names.required': 'Name required',
  'names.duplicate': 'Duplicate name',
  'names.errorEmpty': 'Every player needs a name.',
  'names.errorDuplicate': 'The name “{name}” is used more than once.',
  'names.continue': 'Continue to Character Setup',

  // Character configuration
  'config.stage': 'Step 3 of 3 · Characters',
  'config.title': 'Choose characters',
  'config.subtitle': '{good} Good · {evil} Evil',
  'config.shuffle': 'Shuffle & Start',
  'config.classic': 'Classic',
  'config.advanced': 'Advanced',
  'config.modeClassic': 'Merlin, the Assassin, and ordinary Good & Evil.',
  'config.modeAdvanced': 'Adds Percival and Morgana. Add more below if slots allow.',
  'config.modeCustom': 'Custom selection.',
  'config.always': 'Always included',
  'config.special': 'Special characters',
  'config.slotsLeft': (p: Params) => `${p.n} Evil slot${p.n === 1 ? '' : 's'} left`,
  'config.blurbMerlin': 'Good · Knows Evil',
  'config.blurbAssassin': 'Evil · Final strike',
  'config.blurbPercival': 'Good · Knows who Merlin may be',
  'config.blurbMorgana': 'Evil · Appears as Merlin to Percival',
  'config.blurbMordred': 'Evil · Hidden from Merlin',
  'config.blurbOberon': 'Evil · Unknown to Evil, seen by Merlin',
  'config.noSlot': 'No Evil slot available',
  'config.morganaNeedsPercival': 'Morgana requires Percival, so Percival stays in play.',
  'config.finalDeck': 'Final deck · {n} cards',

  // Distribution
  'dealt.stage': 'Characters dealt',
  'dealt.title': 'The cards are dealt',
  'dealt.subtitle': 'Every character has been assigned in secret',
  'dealt.body':
    'Each player will now view their character **privately**. When it’s your turn, take the phone, look, then hide your card before passing it on.',
  'dealt.begin': 'Begin Private Reveal',

  // Reveal
  'reveal.stage': 'Private Character Reveal',
  'reveal.iAm': 'I Am {name} – View My Character',
  'reveal.privateStage': 'Private · {name}',
  'reveal.hideNext': 'Hide Character & Next Player',
  'reveal.team': 'Team: {team}',
  'reveal.noOne': 'No one is revealed to you.',
  'ready.stage': 'Ready',
  'ready.title': 'All players are ready!',
  'ready.body': 'Discuss, deceive, and discover who you can trust.',
  'ready.start': 'Start Game',

  // Dashboard
  'board.mission': 'Mission',
  'board.stage': 'Mission {n} of 5',
  'board.title': 'The Quest Board',
  'board.chooseTeam': 'Choose Mission {n} Team',
  'board.success': 'Success',
  'board.failed': 'Failed',
  'board.current': 'Current',
  'board.knights': '{n} knights',
  'board.twoFails': '2 fails',
  'board.leader': 'Leader',
  'board.team': 'Team',
  'board.twoFailsNote': 'This mission fails only with two or more Fail cards.',
  'board.table': 'Knights at the table · clockwise',

  // Team selection
  'team.missionTeamStage': 'Mission {n} · Mission Team',
  'team.missionTeam': 'Mission Team',
  'team.chosenBy': 'Chosen by {name}',
  'team.begin': 'Begin Secret Mission',
  'team.change': 'Change Team',
  'team.note': 'These {n} players will each secretly choose Success or Fail. This is the only vote for this mission.',
  'team.selectionStage': 'Mission {n} · Team Selection',
  'team.confirm': 'Confirm Mission Team',
  'team.selectMore': 'Select {n} more',
  'team.missionN': 'Mission {n}',
  'team.selected': 'Selected',
  'team.chooseExactly': '{name}, choose exactly {n} players for this mission.',

  // Mission vote
  'vote.stage': 'Mission {n} · Secret Mission',
  'vote.reveal': 'Reveal Mission Result',
  'vote.allIn': 'All mission cards are in',
  'vote.placePhone': 'Place the phone where everyone can see it.',
  'vote.submitMissionCard': 'Submit Mission Card',
  'vote.missionTeam': 'Mission team',
  'vote.submitted': 'Mission card submitted',
  'vote.cardStage': 'Secret mission card · {name}',
  'vote.submit': 'Submit Card',
  'vote.choose': 'Choose your mission card',
  'vote.secret': 'No one else will see what you play.',
  'card.success': 'SUCCESS',
  'card.fail': 'FAIL',

  // Mission result
  'result.stage': 'Mission {n} · Result',
  'result.next': 'Continue to Next Mission',
  'result.success': 'Mission Success',
  'result.failed': 'Mission Failed',
  'result.successLabel': 'Success',
  'result.failLabel': 'Fail',
  'result.oneFail': 'One Fail was played — but this mission needed two to fail.',

  // Assassin
  'assassin.stage': 'Assassin Phase',
  'assassin.begin': 'Begin Assassin Phase',
  'assassin.threeDone': 'Arthur’s Forces Have Completed Three Missions!',
  'assassin.finalChance': 'But the Assassin Has One Final Chance…',
  'assassin.confer': 'Evil players may now reveal themselves and confer openly about who Merlin is.',
  'assassin.who': 'the Assassin',
  'assassin.onlyAssassin': 'Only the Assassin should take the phone to make the final strike.',
  'assassin.iAm': 'I Am the Assassin',
  'assassin.strikeStage': 'Assassin Phase · The Final Strike',
  'assassin.strikeButton': 'Assassinate Selected Player',
  'assassin.whoIsMerlin': 'Who is Merlin?',
  'assassin.oneChance': 'Choose one player. There is no second chance.',
  'assassin.confirmTitle': 'Strike now?',
  'assassin.confirmBody': 'You are about to assassinate **{name}**. This cannot be undone.',
  'assassin.confirm': 'Assassinate',

  // Final
  'final.stage': 'Final Results',
  'final.goodWins': 'GOOD WINS',
  'final.evilWins': 'EVIL WINS',
  'final.assassinMissed': 'The Assassin struck down {name} — but Merlin lives on!',
  'final.assassinHit': 'The Assassin found Merlin: {name}.',
  'final.threeFails': 'Three missions were sabotaged.',
  'final.missionsGood': 'Missions · Good',
  'final.missionsEvil': 'Missions · Evil',
  'final.allCharacters': 'All characters',
  'final.revealAll': 'Reveal All Characters',
  'final.history': 'Mission history',
  'final.histSuccess': (p: Params) => `Success · ${p.n} fail${p.n === 1 ? '' : 's'}`,
  'final.histFailed': (p: Params) => `Failed · ${p.n} fail${p.n === 1 ? '' : 's'}`,
  'final.notCompleted': 'Not completed',
  'final.teamChosenBy': 'Team chosen by {name}',
  'final.playAgain': 'Play Again – Same Players',
  'final.newGame': 'New Game',
  'final.home': 'Return Home',
  'final.revealTitle': 'Reveal all characters?',
  'final.revealBody': 'Every player’s secret character and allegiance will be shown to the whole table.',
  'final.reveal': 'Reveal',
} satisfies Record<string, Entry>;

export type MsgKey = keyof typeof en;

const zh: Record<MsgKey, Entry> = {
  'app.subtitle': '忠诚与欺骗之战',
  'home.tagline': '5–10 名玩家 · 一部手机 · 无需主持人',
  'home.newGame': '新游戏',
  'home.resume': '继续游戏',
  'home.howToPlay': '玩法说明',
  'settings.title': '设置',
  'settings.language': '语言',
  'settings.done': '完成',
  'stage.setup': '设置中',
  'stage.reveal': '查看身份',
  'stage.mission': '第 {n} 轮任务',
  'stage.assassin': '刺杀阶段',
  'stage.final': '最终结果',
  'abandon.title': '放弃当前游戏？',
  'abandon.body': '有一局游戏正在进行中。开始新游戏将永久删除它。',
  'abandon.confirm': '开始新游戏',
  'common.cancel': '取消',
  'common.back': '返回',
  'common.home': '主页',
  'common.continue': '继续',
  'team.good': '正义',
  'team.evil': '邪恶',

  'handover.passTo': '请把手机交给',
  'handover.onlyYou': '请确保只有 {name} 能看到屏幕。',
  'progress.players': '{done}/{total} 名玩家已查看',
  'progress.cards': '已提交 {done}/{total} 张任务牌',

  'role.merlin.name': '梅林',
  'role.merlin.tagline': '引导亚瑟的军队，同时隐藏你的身份。',
  'role.merlin.description': '你知道谁是邪恶的爪牙。引导骑士们选择忠诚的同伴——但如果最后被刺客识破，邪恶将夺走胜利。',
  'role.percival.name': '派西维尔',
  'role.percival.tagline': '不惜一切代价保护梅林。',
  'role.percival.description': '你知道谁可能是梅林。吸引怀疑、追随梅林的暗示，保护梅林不被刺客发现。',
  'role.servant.name': '亚瑟的忠臣',
  'role.servant.tagline': '以荣誉守护王国。',
  'role.servant.description': '你没有任何秘密信息。观察任务结果，质疑每一个人，帮助三轮任务取得成功。',
  'role.assassin.name': '刺客',
  'role.assassin.tagline': '刺杀梅林，夺取胜利。',
  'role.assassin.description': '你知道你的邪恶同伴。破坏任务——如果正义完成三轮任务，你还有最后一次机会：找出梅林，邪恶即可获胜。',
  'role.morgana.name': '莫甘娜',
  'role.morgana.tagline': '伪装成梅林，误导忠诚之士。',
  'role.morgana.description': '你知道你的邪恶同伴。派西维尔会把你当作可能的梅林——利用这种混乱误导正义一方。',
  'role.mordred.name': '莫德雷德',
  'role.mordred.tagline': '连梅林也无法看见你。',
  'role.mordred.description': '你知道你的邪恶同伴，而梅林看不到你。赢得正义一方的信任，在关键时刻背叛他们。',
  'role.oberon.name': '奥伯伦',
  'role.oberon.tagline': '独自在暗影中效忠邪恶。',
  'role.oberon.description': '你不知道其他邪恶玩家，他们也不知道你。只有梅林能察觉你的黑暗。独自破坏任务吧。',
  'role.minion.name': '莫德雷德的爪牙',
  'role.minion.tagline': '散布怀疑，破坏任务。',
  'role.minion.description': '你知道你的邪恶同伴。混入忠诚者之中，加入任务，让其中三轮任务失败。',

  'knowledge.evilForMerlin': '邪恶的爪牙',
  'knowledge.merlinCandidates': '其中一人是梅林',
  'knowledge.merlin': '梅林',
  'knowledge.evilTeammates': '你的邪恶同伴',
  'hint.merlinMordredHidden': '莫德雷德对你隐藏——有一名邪恶玩家没有显示。',
  'hint.merlinDefault': '绝不能让他们发现你知道这一切。',
  'hint.percivalMorgana': '另一人是伪装成梅林的莫甘娜。你不知道谁是谁。',
  'hint.percivalSingle': '保护梅林的身份，不让刺客发现。',
  'hint.oberon': '你独自行动：你不知道其他邪恶玩家，他们也不知道你。',
  'hint.servant': '相信你的判断，仔细观察每一轮任务。',
  'hint.evilOberonHidden': '奥伯伦也效忠邪恶，但对你隐藏。',
  'hint.evilDefault': '他们的具体角色是隐藏的——秘密合作吧。',

  'howto.title': '玩法说明',
  'howto.gotIt': '知道了',
  'howto.goalTitle': '游戏目标',
  'howto.goalBody': '亚瑟的忠臣（正义）需要在五轮任务中成功三轮。莫德雷德的爪牙（邪恶）隐藏在他们之中，需要让三轮任务失败。',
  'howto.secretTitle': '秘密身份',
  'howto.secretBody1': '轮流传递手机。每位玩家私下查看自己的角色和掌握的秘密信息，然后隐藏后再交给下一位。',
  'howto.secretBody2': '**梅林**知道谁是邪恶——但必须隐藏自己。**派西维尔**知道谁可能是梅林。邪恶玩家互相认识（奥伯伦除外）。',
  'howto.charactersTitle': '角色介绍',
  'howto.knows': '知晓：',
  'inPlay.always': '必定登场',
  'inPlay.optional': '可选',
  'inPlay.optionalNeedsPercival': '可选（需要派西维尔）',
  'inPlay.fillGood': '填补剩余的正义位置',
  'inPlay.fillEvil': '填补剩余的邪恶位置',
  'knows.merlin': '能看到除莫德雷德以外的所有邪恶玩家（包括奥伯伦），但不知道他们的具体角色。',
  'knows.percival': '能看到梅林。如果莫甘娜在场，会看到两名候选人，但不知道谁才是真正的梅林。',
  'knows.servant': '没有任何信息。观察任务结果，相信你的判断。',
  'knows.assassin': '能看到除奥伯伦以外的邪恶同伴。如果正义赢得三轮任务，可以猜一次谁是梅林。',
  'knows.morgana': '能看到除奥伯伦以外的邪恶同伴。在派西维尔眼中可能是梅林。',
  'knows.mordred': '能看到除奥伯伦以外的邪恶同伴。梅林看不到他。',
  'knows.oberon': '看不到任何人，其他邪恶玩家也看不到奥伯伦。只有梅林能发现奥伯伦。',
  'knows.minion': '能看到除奥伯伦以外的邪恶同伴。',
  'howto.missionTitle': '每轮任务',
  'howto.mission1': '**1. 选择队伍。** 队长（王冠）选出规定人数的玩家：例如 5 人局为 2、3、3，然后 4 和 4。',
  'howto.mission2': '**2. 一次秘密投票。** 只有被选中的玩家投票，每人秘密打出成功或失败。每个人都可以自由选择。只公布总数——绝不公开谁出了什么。',
  'howto.mission3': '**3. 结果。** 第 1–3 轮任务只要有一张失败牌就会失败。第 4 和第 5 轮任务多一名队员，需要**两张**失败牌才会失败。之后队长按顺时针传递。',
  'howto.twistTitle': '最后的反转',
  'howto.twistBody': '如果正义赢得三轮任务，刺客有一次机会猜出梅林。猜中的话，邪恶依然获胜。',
  'howto.etiquetteTitle': '游戏礼仪',
  'howto.etiquetteBody': '尽情讨论，大胆说谎——但轮不到你的时候，千万别偷看手机！',

  'count.stage': '第 1/3 步 · 人数',
  'count.title': '有几位玩家？',
  'count.subtitle': '召集 5 到 10 位勇士',

  'names.stage': '第 2/3 步 · 名字',
  'names.title': '谁来参战？',
  'names.subtitle': '按座位顺时针顺序输入名字',
  'names.player': '玩家 {n}',
  'names.placeholder': '输入名字',
  'names.required': '请输入名字',
  'names.duplicate': '名字重复',
  'names.errorEmpty': '每位玩家都需要名字。',
  'names.errorDuplicate': '名字“{name}”重复了。',
  'names.continue': '继续设置角色',

  'config.stage': '第 3/3 步 · 角色',
  'config.title': '选择角色',
  'config.subtitle': '{good} 名正义 · {evil} 名邪恶',
  'config.shuffle': '洗牌并开始',
  'config.classic': '经典',
  'config.advanced': '进阶',
  'config.modeClassic': '梅林、刺客，以及普通的正义与邪恶角色。',
  'config.modeAdvanced': '加入派西维尔和莫甘娜。如有名额，可在下方添加更多角色。',
  'config.modeCustom': '自定义选择。',
  'config.always': '必选角色',
  'config.special': '特殊角色',
  'config.slotsLeft': (p: Params) => `剩余 ${p.n} 个邪恶名额`,
  'config.blurbMerlin': '正义 · 知晓邪恶',
  'config.blurbAssassin': '邪恶 · 最后一击',
  'config.blurbPercival': '正义 · 知道谁可能是梅林',
  'config.blurbMorgana': '邪恶 · 在派西维尔眼中像梅林',
  'config.blurbMordred': '邪恶 · 梅林看不到',
  'config.blurbOberon': '邪恶 · 邪恶同伴不认识，梅林能看到',
  'config.noSlot': '没有可用的邪恶名额',
  'config.morganaNeedsPercival': '莫甘娜需要派西维尔，因此派西维尔会保留。',
  'config.finalDeck': '最终牌组 · {n} 张',

  'dealt.stage': '角色已分发',
  'dealt.title': '身份牌已发出',
  'dealt.subtitle': '每个角色都已秘密分配',
  'dealt.body': '现在每位玩家将**私下**查看自己的角色。轮到你时，拿起手机查看，然后隐藏身份牌再交给下一位。',
  'dealt.begin': '开始私密查看',

  'reveal.stage': '私密查看身份',
  'reveal.iAm': '我是 {name} – 查看我的身份',
  'reveal.privateStage': '私密 · {name}',
  'reveal.hideNext': '隐藏身份并交给下一位',
  'reveal.team': '阵营：{team}',
  'reveal.noOne': '没有人向你显露身份。',
  'ready.stage': '准备就绪',
  'ready.title': '所有玩家已准备就绪！',
  'ready.body': '讨论、欺骗，找出你可以信任的人。',
  'ready.start': '开始游戏',

  'board.mission': '任务',
  'board.stage': '第 {n}/5 轮任务',
  'board.title': '任务面板',
  'board.chooseTeam': '选择第 {n} 轮任务队伍',
  'board.success': '成功',
  'board.failed': '失败',
  'board.current': '当前',
  'board.knights': '{n} 人',
  'board.twoFails': '需 2 败',
  'board.leader': '队长',
  'board.team': '人数',
  'board.twoFailsNote': '本轮任务需要至少两张失败牌才会失败。',
  'board.table': '圆桌骑士 · 顺时针',

  'team.missionTeamStage': '第 {n} 轮 · 任务队伍',
  'team.missionTeam': '任务队伍',
  'team.chosenBy': '由 {name} 选择',
  'team.begin': '开始秘密任务',
  'team.change': '更换队伍',
  'team.note': '这 {n} 名玩家将各自秘密选择成功或失败。这是本轮任务唯一的一次投票。',
  'team.selectionStage': '第 {n} 轮 · 选择队伍',
  'team.confirm': '确认任务队伍',
  'team.selectMore': '还需选择 {n} 人',
  'team.missionN': '第 {n} 轮任务',
  'team.selected': '已选',
  'team.chooseExactly': '{name}，请为本轮任务选择 {n} 名玩家。',

  'vote.stage': '第 {n} 轮 · 秘密任务',
  'vote.reveal': '揭晓任务结果',
  'vote.allIn': '所有任务牌已提交',
  'vote.placePhone': '请把手机放在所有人都能看到的地方。',
  'vote.submitMissionCard': '提交任务牌',
  'vote.missionTeam': '任务队伍',
  'vote.submitted': '任务牌已提交',
  'vote.cardStage': '秘密任务牌 · {name}',
  'vote.submit': '提交',
  'vote.choose': '选择你的任务牌',
  'vote.secret': '其他人看不到你出的牌。',
  'card.success': '成功',
  'card.fail': '失败',

  'result.stage': '第 {n} 轮 · 结果',
  'result.next': '进入下一轮任务',
  'result.success': '任务成功',
  'result.failed': '任务失败',
  'result.successLabel': '成功',
  'result.failLabel': '失败',
  'result.oneFail': '出现了一张失败牌——但本轮任务需要两张才会失败。',

  'assassin.stage': '刺杀阶段',
  'assassin.begin': '开始刺杀阶段',
  'assassin.threeDone': '亚瑟的军队已完成三轮任务！',
  'assassin.finalChance': '但刺客还有最后一次机会……',
  'assassin.confer': '邪恶玩家现在可以亮明身份，公开讨论谁是梅林。',
  'assassin.who': '刺客',
  'assassin.onlyAssassin': '只有刺客可以拿起手机，进行最后一击。',
  'assassin.iAm': '我是刺客',
  'assassin.strikeStage': '刺杀阶段 · 最后一击',
  'assassin.strikeButton': '刺杀所选玩家',
  'assassin.whoIsMerlin': '谁是梅林？',
  'assassin.oneChance': '选择一名玩家。没有第二次机会。',
  'assassin.confirmTitle': '确定出手？',
  'assassin.confirmBody': '你即将刺杀**{name}**。此操作无法撤销。',
  'assassin.confirm': '刺杀',

  'final.stage': '最终结果',
  'final.goodWins': '正义获胜',
  'final.evilWins': '邪恶获胜',
  'final.assassinMissed': '刺客刺杀了 {name}——但梅林依然活着！',
  'final.assassinHit': '刺客找到了梅林：{name}。',
  'final.threeFails': '三轮任务遭到破坏。',
  'final.missionsGood': '任务 · 正义',
  'final.missionsEvil': '任务 · 邪恶',
  'final.allCharacters': '所有角色',
  'final.revealAll': '揭晓所有角色',
  'final.history': '任务记录',
  'final.histSuccess': (p: Params) => `成功 · ${p.n} 张失败`,
  'final.histFailed': (p: Params) => `失败 · ${p.n} 张失败`,
  'final.notCompleted': '未完成',
  'final.teamChosenBy': '队伍由 {name} 选择',
  'final.playAgain': '再来一局 – 相同玩家',
  'final.newGame': '新游戏',
  'final.home': '返回主页',
  'final.revealTitle': '揭晓所有角色？',
  'final.revealBody': '所有玩家的秘密角色和阵营将向全桌公开。',
  'final.reveal': '揭晓',
};

const DICTS: Record<Lang, Record<MsgKey, Entry>> = { en, zh };

export function translate(lang: Lang, key: MsgKey, params: Params = {}): string {
  const entry = DICTS[lang][key] ?? en[key];
  if (typeof entry === 'function') return entry(params);
  return entry.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

// ---- Language setting ------------------------------------------------------

const STORAGE_KEY = 'avalon.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    // Storage unavailable: fall back to the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore: the choice still applies for this session.
    }
  }, [lang]);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const { lang, setLang } = useContext(LangContext);
  const t = useCallback((key: MsgKey, params?: Params) => translate(lang, key, params), [lang]);
  const roleName = useCallback((r: Role) => translate(lang, `role.${r}.name` as MsgKey), [lang]);
  const roleText = useCallback(
    (r: Role, field: 'tagline' | 'description') => translate(lang, `role.${r}.${field}` as MsgKey),
    [lang],
  );
  const knowledgeTitle = useCallback(
    (k: Exclude<KnowledgeKind, 'none'>) => translate(lang, `knowledge.${k}` as MsgKey),
    [lang],
  );
  const hint = useCallback((h: KnowledgeHint) => translate(lang, `hint.${h}` as MsgKey), [lang]);
  return { lang, setLang, t, roleName, roleText, knowledgeTitle, hint };
}

/** Renders a translated string, turning **text** into bold. */
export function Rich({ text, boldClass }: { text: string; boldClass?: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} className={boldClass}>
            {part}
          </b>
        ) : (
          part
        ),
      )}
    </>
  );
}
