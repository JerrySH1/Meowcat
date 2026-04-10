import { CatType, Language, ItemType, ItemCategory, CatState } from './types';

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Mobile Constants (Vertical Layout)
export const MOBILE_CANVAS_WIDTH = 720;
export const MOBILE_CANVAS_HEIGHT = 1280;

export const CAT_RADIUS = 40;
export const GRAB_THRESHOLD = 50; 
export const CATCH_DISTANCE = 55; 
// Increased MAX_HP to make it more forgiving as requested for the level system
export const MAX_HP = 5; 

// Desktop Zones
export const BATHTUB = {
  x: CANVAS_WIDTH - 350,
  y: CANVAS_HEIGHT - 250,
  width: 250,
  height: 180
};

export const MOBILE_BATHTUB = {
  x: MOBILE_CANVAS_WIDTH - 280,
  y: MOBILE_CANVAS_HEIGHT - 250,
  width: 230,
  height: 180
};

export const LITTER_BOX = {
  x: 100,
  y: CANVAS_HEIGHT - 250,
  width: 140,
  height: 100
};

export const MOBILE_LITTER_BOX = {
  x: 50,
  y: 900,
  width: 180,
  height: 140
};

export const FOOD_BOWL = {
  x: 50,
  y: 50,
  width: 80,
  height: 60
};

export const MOBILE_FOOD_BOWL = {
  x: 30,
  y: 250,
  width: 100,
  height: 80
};

export const COLORS = {
  bg: '#d2b48c',
  ink: '#2d2d2d',
  pencilWhite: '#f0f0f0',
  red: '#e74c3c',
  blue: '#3498db'
};

export const ITEMS_DATA: Record<ItemType, { category: ItemCategory, color: string, label: string }> = {
  fish: { category: 'food', color: '#3498db', label: 'Fish' },
  bun: { category: 'food', color: '#f1c40f', label: 'Bun' },
  pizza: { category: 'food', color: '#e74c3c', label: 'Pizza' },
  brush: { category: 'cleaning', color: '#9b59b6', label: 'Brush' },
  scissors: { category: 'cleaning', color: '#95a5a6', label: 'Scissors' },
  toy: { category: 'toy', color: '#e67e22', label: 'Toy' },
  catnip: { category: 'toy', color: '#2ecc71', label: 'Catnip' },
  yarn: { category: 'toy', color: '#e91e63', label: 'Yarn' }
};

export interface LevelData {
  id: number;
  catType: CatType;
  difficulty: number;
  timeTargets: [number, number]; // [3star_limit, 2star_limit]
  stateSequence: CatState[]; // New sequence of states
  availableItems: ItemType[];
}

export const LEVELS: LevelData[] = [
  { 
    id: 1, 
    catType: 'white', 
    difficulty: 1, 
    timeTargets: [15, 25],
    stateSequence: ['dirty'],
    availableItems: ['brush']
  },
  { 
    id: 2, 
    catType: 'orange', 
    difficulty: 2, 
    timeTargets: [20, 35],
    stateSequence: ['dirty', 'needs_poop'],
    availableItems: ['brush', 'scissors']
  },
  { 
    id: 3, 
    catType: 'tabby', 
    difficulty: 3, 
    timeTargets: [25, 40],
    stateSequence: ['long_hair', 'dirty'],
    availableItems: ['scissors', 'brush']
  },
  { 
    id: 4, 
    catType: 'calico', 
    difficulty: 4, 
    timeTargets: [30, 50],
    stateSequence: ['needs_poop', 'bored', 'dirty'],
    availableItems: ['toy', 'brush']
  },
  { 
    id: 5, 
    catType: 'black', 
    difficulty: 5, 
    timeTargets: [40, 60],
    stateSequence: ['long_hair', 'dirty', 'needs_poop'],
    availableItems: ['scissors', 'brush']
  },
  { 
    id: 6, 
    catType: 'tuxedo', 
    difficulty: 7, 
    timeTargets: [50, 70],
    stateSequence: ['tangled', 'bored', 'dirty'],
    availableItems: ['brush', 'toy', 'yarn']
  },
  { 
    id: 7, 
    catType: 'siamese', 
    difficulty: 8, 
    timeTargets: [60, 80],
    stateSequence: ['long_hair', 'dirty', 'bored'],
    availableItems: ['scissors', 'toy', 'brush']
  },
  { 
    id: 8, 
    catType: 'devon', 
    difficulty: 9, 
    timeTargets: [70, 90],
    stateSequence: ['long_hair', 'tangled', 'dirty', 'bored'],
    availableItems: ['scissors', 'brush', 'toy', 'yarn']
  },
  { 
    id: 9, 
    catType: 'sphynx', 
    difficulty: 9.5, 
    timeTargets: [80, 100],
    stateSequence: ['needs_poop', 'dirty', 'needs_poop'],
    availableItems: ['toy', 'brush']
  },
  { 
    id: 10, 
    catType: 'maine_coon', 
    difficulty: 10, 
    timeTargets: [90, 120],
    stateSequence: ['long_hair', 'dirty', 'tangled', 'bored', 'needs_poop'],
    availableItems: ['scissors', 'brush', 'toy', 'yarn']
  },
];

export const STORY_DATA = [
  {
    id: 1,
    title: { zh: "小白", en: "Snow" },
    breed: { zh: "白色田园猫", en: "White Domestic Shorthair" },
    difficulty: "★☆☆☆☆☆☆☆☆☆",
    personality: { zh: "温顺、亲人", en: "Gentle, Affectionate" },
    intro: { zh: "「小白是浴室的第一位客人。」", en: "\"Snow was the first guest of the bathhouse.\"" },
    content: {
      zh: "小白是楼下奶茶店老板养的猫，从小被人摸着长大，谁抱都行。老板每个月都带她来洗一次澡。她洗澡的时候会闭着眼睛打呼噜。\n\n她不是流浪猫——但她是你开店的原因。\n\n去年冬天，你在路边看到一只浑身泥巴的小白猫，正是她。你把她抱回去洗干净，送到奶茶店老板那里。老板说：\"要不你开个给猫洗澡的店吧？\"\n\n于是就有了这间「毛茸茸浴室」。",
      en: "Snow belongs to the owner of the bubble tea shop downstairs. She grew up being petted by everyone and lets anyone hold her. The owner brings her for a bath every month. She purrs with her eyes closed while bathing.\n\nShe isn't a stray—but she is the reason you opened this shop.\n\nLast winter, you found a muddy little white cat by the roadside. It was her. You took her in, cleaned her up, and returned her to the owner. The owner said, \"Why don't you open a cat bathhouse?\"\n\nAnd so, \"Furry Bathhouse\" was born."
    },
    unlockText: { zh: "每一个故事都有一个起点。小白是我们的。", en: "Every story has a beginning. Snow is ours." },
    egg: { zh: "洗澡过程中，背景里能看到奶茶店的招牌在窗外闪烁。", en: "During the bath, the bubble tea shop sign flickers outside the window." },
    realImage: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: { zh: "大橘", en: "Marmalade" },
    breed: { zh: "橘猫", en: "Orange Tabby" },
    difficulty: "★★☆☆☆☆☆☆☆☆",
    personality: { zh: "贪吃、慵懒、稍微有点抗拒但容易用食物收买", en: "Gluttonous, Lazy, Easily bribed with food" },
    intro: { zh: "「大橘是小区里最著名的流浪猫。」", en: "\"Marmalade is the most famous stray in the neighborhood.\"" },
    content: {
      zh: "他已经在这个小区住了三年，所有人都认识他。便利店的阿姨每天给他留火腿肠，遛狗的大爷会帮他赶走别的猫。他胖得像个橘色皮球，走路一颠一颠的。\n\n他其实有过家的。三年前的搬家季，他的主人留下了一碗猫粮和一扇敞开的门，再也没有回来。\n\n大橘在那扇门前等了七天。\n\n后来他学会了不再等。他学会了在便利店门口卖萌，在垃圾桶旁边找晚餐，在下雨天钻进汽车底下。\n\n今天他被志愿者带来洗澡。他有点害怕，但你手里有零食——这对一只橘猫来说，是无法抗拒的。",
      en: "He has lived in this neighborhood for three years, and everyone knows him. The lady at the convenience store saves sausages for him, and the grandpa walking his dog chases other cats away for him. He's as fat as an orange ball.\n\nHe used to have a home. Three years ago, during moving season, his owner left a bowl of food and an open door, and never came back.\n\nMarmalade waited by that door for seven days.\n\nEventually, he learned not to wait. He learned to act cute at the store, find dinner near trash cans, and hide under cars when it rains.\n\nToday, a volunteer brought him in. He's scared, but you have treats—and for an orange cat, that is irresistible."
    },
    unlockText: { zh: "他不是不想要家，他只是不敢再相信'家'这个字了。", en: "It's not that he doesn't want a home. He's just afraid to believe in the word 'home' again." },
    egg: { zh: "背景角落里有一碗猫粮和一扇打开的门的涂鸦。", en: "In the background corner, there's a doodle of a food bowl and an open door." },
    realImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 3,
    title: { zh: "虎斑", en: "Tiger" },
    breed: { zh: "美短虎斑", en: "American Shorthair" },
    difficulty: "★★★☆☆☆☆☆☆☆",
    personality: { zh: "机警、敏捷、不太信任人、动作快", en: "Alert, Agile, Distrustful, Fast" },
    intro: { zh: "「虎斑来自一个被取缔的后院猫舍。」", en: "\"Tiger came from a shut-down backyard breeder.\"" },
    content: {
      zh: "三个月前，志愿者们联合动物保护协会端掉了一个非法繁殖场。四十多只猫被解救出来，虎斑是其中之一。\n\n他从小生活在铁笼里，从没踩过草地，从没晒过太阳。铁笼外面的一切对他来说都是未知的、危险的。\n\n他的耳朵永远竖着，眼睛永远警觉地转动。不是因为他凶——而是因为他的世界里，\"安全\"这个概念从来不存在。\n\n给他洗澡需要更多耐心。他会突然弹起来，会用爪子试探你。但只要你动作轻柔、不突然，他会慢慢把竖起的耳朵放下来。",
      en: "Three months ago, volunteers and animal control shut down an illegal breeding facility. Over forty cats were rescued, and Tiger was one of them.\n\nHe grew up in a wire cage, never touching grass, never feeling the sun. Everything outside the cage is unknown and dangerous to him.\n\nHis ears are always perked, his eyes always darting. Not because he's mean—but because in his world, \"safety\" never existed.\n\nBathing him requires patience. He might jump or swat at you. But if you are gentle and slow, he will eventually lower his ears."
    },
    unlockText: { zh: "信任是一厘米一厘米建立的。他走出笼子的每一步都很勇敢。", en: "Trust is built inch by inch. Every step he takes out of the cage is brave." },
    egg: { zh: "关卡开始时背景能看到一个铁笼的轮廓，洗完后铁笼消失，变成了一扇窗户，窗外有阳光。", en: "At the start, a cage outline is visible. By the end, it fades into a window with sunlight." },
    realImage: "https://images.unsplash.com/photo-1519052537078-e6302a4968ef?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 4,
    title: { zh: "三花", en: "Patches" },
    breed: { zh: "三花猫（玳瑁三色）", en: "Calico" },
    difficulty: "★★★★☆☆☆☆☆☆",
    personality: { zh: "傲娇、有脾气、时而配合时而不配合、典型\"猫格分裂\"", en: "Sassy, Moody, Unpredictable" },
    intro: { zh: "「三花是一位独居老人留下的猫。」", en: "\"Patches was left behind by an elderly woman living alone.\"" },
    content: {
      zh: "王奶奶今年82岁了，上个月摔了一跤，住进了医院，可能要住很久。她最放心不下的不是自己，而是家里的三花。\n\n\"她只吃我煮的鸡胸肉，别的不吃的。\"\n\"她晚上要睡在我枕头旁边，不然会叫。\"\n\"她不让生人碰，你们要慢一点……\"\n\n王奶奶的儿子把三花送来的时候，三花对着门叫了二十分钟。她不理解为什么世界突然变了，为什么那个每天给她梳毛的人不见了。\n\n三花脾气大，不是因为她坏，是因为她在想念一个人。",
      en: "Grandma Wang is 82. Last month she fell and was hospitalized for a long stay. Her biggest worry wasn't herself, but Patches.\n\n\"She only eats the chicken breast I boil.\"\n\"She sleeps by my pillow, or she cries.\"\n\"She doesn't like strangers, please be slow...\"\n\nWhen her son brought Patches in, the cat meowed at the door for twenty minutes. She doesn't understand why the world changed, or where the person who brushed her every day went.\n\nPatches is grumpy not because she's bad, but because she misses someone."
    },
    unlockText: { zh: "她不是难搞。她只是还在等那个，把她抱在怀里轻声说'乖'的人。", en: "She's not difficult. She's just waiting for the one who holds her and whispers 'good girl'." },
    egg: { zh: "背景墙上挂着一张老人和猫的合照（像素画/简笔画风格）。洗完澡后三花叫了一声，文字气泡显示：\"……喵？\"（像在问：她什么时候来接我？）", en: "A photo of an elder and a cat hangs on the wall. After the bath, Patches meows: \"...Meow?\" (As if asking: When is she coming?)" },
    realImage: "https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 5,
    title: { zh: "小黑", en: "Midnight" },
    breed: { zh: "纯黑猫", en: "Black Cat" },
    difficulty: "★★★★★☆☆☆☆☆",
    personality: { zh: "胆小、容易受惊、对声音和突然动作很敏感", en: "Timid, Skittish, Sensitive to noise" },
    intro: { zh: "「小黑是被退养三次的猫。」", en: "\"Midnight has been returned to the shelter three times.\"" },
    content: {
      zh: "第一次：领养人说\"黑猫不吉利，我妈不让养。\"\n第二次：领养人说\"它太胆小了，叫都叫不过来，没意思。\"\n第三次：领养人说\"我要搬家了，新房子不让养宠物。\"\n\n三次被退回来，三次被装进航空箱，三次看着一扇门在面前关上。\n\n小黑现在听到航空箱的声音就会发抖。她把自己缩成一个黑色的球，躲在角落里，用金色的大眼睛看着你——不是愤怒，是恐惧。\n\n她在问：这次你也会把我送回来吗？\n\n洗澡的时候，请轻一点。她已经被这个世界吓过太多次了。",
      en: "First time: \"Black cats are bad luck.\"\nSecond time: \"She's too timid, not fun.\"\nThird time: \"I'm moving, no pets allowed.\"\n\nThree times returned, three times in a carrier, three times watching a door close.\n\nMidnight shakes when she hears a carrier now. She curls into a black ball, watching you with big golden eyes—not in anger, but in fear.\n\nShe's asking: Will you send me back too?\n\nPlease be gentle. The world has scared her enough."
    },
    unlockText: { zh: "黑色不是不吉利。是星空的颜色，是夜晚拥抱你的颜色。", en: "Black isn't bad luck. It's the color of the stars, the color of the night hugging you." },
    egg: { zh: "洗澡过程中如果有一段时间不操作（不碰她），小黑会慢慢把蜷缩的身体展开。背景从阴暗角落渐变成温暖的灯光。", en: "If left alone for a moment, Midnight uncurls. The background shifts from dark to warm light." },
    realImage: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 6,
    title: { zh: "警长", en: "Sheriff" },
    breed: { zh: "奶牛猫（黑白双色）", en: "Tuxedo Cat" },
    difficulty: "★★★★★★★☆☆☆",
    personality: { zh: "精力旺盛、爱搞破坏、疯跑、不停扭动、典型奶牛猫性格", en: "Energetic, Chaotic, Zoomies" },
    intro: { zh: "「警长是建筑工地上的猫老大。」", en: "\"Sheriff is the boss cat of the construction site.\"" },
    content: {
      zh: "没有人知道他是什么时候出现在工地上的。工人们只知道，每天早上六点半，这只黑白色的猫就会准时出现在工棚门口，等着大家分他一口盒饭。\n\n他管着工地上所有的流浪猫——哪只猫能吃第一口，哪只猫能睡在最暖的纸箱上，全是他说了算。工人们叫他\"警长\"。\n\n上个月工地要开始新一期的施工了。推土机来的那天，别的猫都跑了，只有警长站在工棚前面，对着推土机\"呜呜\"地叫，像是在保护他的地盘、他的猫民们。\n\n工头是个粗犷的中年男人，那天他蹲在警长面前看了很久，然后打了一个电话：\"喂，有个动物救助的电话是多少？\"\n\n警长来洗澡了。他特别不配合，不是因为害怕，是因为他是警长，他不允许自己被摆弄。",
      en: "No one knows when he appeared. Workers only know that at 6:30 AM, this black and white cat waits for a bite of lunch.\n\nHe rules the stray cats—who eats first, who sleeps in the warmest box. They call him \"Sheriff\".\n\nLast month, bulldozers arrived. Other cats ran, but Sheriff stood his ground, growling at the machine, protecting his turf.\n\nThe foreman watched him for a long time, then made a call: \"Hey, what's the number for animal rescue?\"\n\nSheriff is here for a bath. He fights not out of fear, but because he is the Sheriff, and he demands respect."
    },
    unlockText: { zh: "他守护了整个工地的猫，现在轮到我们守护他了。", en: "He protected all the cats at the site. Now it's our turn to protect him." },
    egg: { zh: "背景窗户能看到微缩的建筑工地元素（安全帽、推土机轮廓）。洗完后警长昂首挺胸的pose不变——即使浑身湿漉漉的也要保持\"老大\"的尊严。", en: "Construction elements visible in the window. After the bath, Sheriff stands tall—maintaining his dignity even when wet." },
    realImage: "https://images.unsplash.com/photo-1586289883499-f11d280003f6?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 7,
    title: { zh: "挖煤", en: "Smudge" },
    breed: { zh: "玄猫（深棕色/烟黑色）", en: "Smoky Black" },
    difficulty: "★★★★★★★★☆☆",
    personality: { zh: "极度不信任人、会哈气、会低吼、但不会真的攻击", en: "Distrustful, Hisses, Growls, But won't bite" },
    intro: { zh: "「挖煤是从桥洞下面救出来的。」", en: "\"Smudge was rescued from under a bridge.\"" },
    content: {
      zh: "志愿者发现他的时候，他已经在那个桥洞下面住了至少两年。他的毛结成了厚厚的毡块，身上有旧伤，左耳缺了一角——那是和别的流浪猫争地盘时留下的。\n\n他浑身都是黑灰色的灰尘和泥，志愿者们叫他\"挖煤\"。\n\n抓捕他用了整整三天。第一天他跑了，第二天他躲起来了，第三天他实在太饿了，走进了诱捕笼。\n\n他对人类没有恨意，也没有爱意。他只是不理解：你们要对我做什么？\n\n两年没被人碰过了。水的温度、手的触感、洗发水的香味——这些对他来说都是外星球的东西。\n\n他会哈气，会低吼，会把背弓成一座拱桥。但他不会伸爪子。因为在他模糊的记忆深处，好像有过一双温暖的手。",
      en: "He lived under that bridge for two years. His fur was matted, he had old scars, and his left ear was chipped from fights.\n\nCovered in dust and mud, volunteers called him \"Smudge\".\n\nIt took three days to catch him. On the third day, hunger drove him into the trap.\n\nHe has no hate for humans, nor love. He just doesn't understand: What do you want?\n\nTwo years without touch. Warm water, hands, shampoo—these are alien to him.\n\nHe hisses and arches his back. But he doesn't scratch. Because deep in his memory, he remembers a warm hand."
    },
    unlockText: { zh: "两年的流浪，让他忘了被爱的感觉。但身体还记得。", en: "Two years of wandering made him forget love. But his body remembers." },
    egg: { zh: "洗澡过程中，挖煤身上的\"泥垢\"被洗掉后，露出的皮毛颜色比一开始亮了很多，他原来不是黑色的，是深棕色。背景从灰暗的桥洞渐变成温暖的室内。", en: "As mud washes off, his fur reveals a deep brown color. The background shifts from a bridge to a warm room." },
    realImage: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 8,
    title: { zh: "卷毛", en: "Curly" },
    breed: { zh: "灰色长毛猫（疑似英短混血）", en: "Grey Longhair Mix" },
    difficulty: "★★★★★★★★★☆",
    personality: { zh: "毛很长很难洗、会不停扭动、洗到一半容易\"逃跑\"", en: "Matted fur, Squirmy, Tries to escape" },
    intro: { zh: "「卷毛是宠物医院门口被发现的。」", en: "\"Curly was found at the vet clinic's door.\"" },
    content: {
      zh: "有人在宠物医院门口的纸箱里发现了他。纸箱上写着一行字：\n\n\"我养不起了，对不起。\"\n\n卷毛的毛发已经严重打结，有些地方甚至结成了硬块贴在皮肤上。医生检查后说，他大概有两三个月没被梳过毛了。\n\n长毛猫不梳毛会怎样？毛结会越来越紧，拉扯皮肤，引起疼痛和皮肤病。每一步走路都会扯到打结的毛发，像穿着一件带刺的衣服。\n\n他的主人可能真的养不起了——但在放弃之前的那两三个月，他也放弃了梳毛、放弃了照顾、放弃了去在乎。\n\n卷毛需要先洗澡，再剃掉那些严重打结的毛发。这个过程很漫长，也很痛苦。但每剪掉一个毛结，他就轻松一点。\n\n你能感觉到他在变轻。不只是重量，是他背负的那些东西。",
      en: "Found in a box at the vet. The note read: \"I can't afford him. Sorry.\"\n\nCurly's fur was severely matted, tight against his skin. The vet said he hadn't been brushed in months.\n\nMats pull on the skin, causing pain with every step. Like wearing a suit of thorns.\n\nHis owner gave up long before leaving him there.\n\nCurly needs a bath and a shave. It's painful, but with every mat cut, he gets lighter. Not just in weight, but in burden."
    },
    unlockText: { zh: "养一只猫是承诺，不是尝试。但没关系，现在换我们来承诺。", en: "Owning a cat is a promise. It's okay, now we make that promise." },
    egg: { zh: "洗澡过程中每解开/洗掉一个\"毛结区域\"，会有一小段文字闪过，像是旧主人的内心独白碎片。洗完后这些文字全部消失，只剩下一句：\"现在你很漂亮了，卷毛。\"", en: "Flashbacks of the old owner's thoughts appear as mats are removed. At the end, only: \"You are beautiful now, Curly.\"" },
    realImage: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 9,
    title: { zh: "无毛", en: "Sphinx" },
    breed: { zh: "斯芬克斯无毛猫", en: "Sphynx" },
    difficulty: "★★★★★★★★★½",
    personality: { zh: "极度敏感、皮肤脆弱、不能用力、需要特殊温度的水、操作窗口非常小", en: "Sensitive skin, Fragile, Needs specific temp" },
    intro: { zh: "「无毛是从一个非法宠物交易群里解救出来的。」", en: "\"Sphinx was rescued from an illegal trading group.\"" },
    content: {
      zh: "她是一只斯芬克斯——那种被当作\"高端品种\"售卖的无毛猫。繁殖场给她配种了五次，生了十九只小猫。当她的身体再也生不出小猫的时候，她就\"没有价值\"了。\n\n繁殖场准备把她\"处理掉\"。一个卧底志愿者在最后一刻把她带了出来。\n\n她没有毛发保护皮肤，身上有多处旧伤和皮肤问题。无毛猫需要定期洗澡来清洁皮肤分泌的油脂——但她的皮肤太敏感了，水温差一度都会让她不舒服。\n\n她不会哈气，也不会挣扎。她只是安静地看着你，眼睛很大，像两颗琥珀。\n\n在繁殖场里，安静和服从是唯一能让自己少受苦的方式。\n\n但那种安静不是信任，是放弃。\n\n我们要让她重新学会：安静，也可以是因为安心。",
      en: "She is a Sphynx—sold as a \"luxury breed\". She was bred five times, birthing nineteen kittens. When she couldn't breed anymore, she had \"no value\".\n\nRescuers saved her just in time.\n\nWithout fur, her skin is scarred and sensitive. She needs baths for her oils, but the water must be perfect.\n\nShe doesn't hiss or struggle. She just watches you with amber eyes.\n\nIn the mill, silence was survival.\n\nBut that silence isn't trust, it's resignation.\n\nWe need to teach her: Silence can also mean peace."
    },
    unlockText: { zh: "她被当作商品活了五年。从今天起，她是一只猫，只是一只猫。这就够了。", en: "She lived as a product for five years. From today, she is just a cat. That is enough." },
    egg: { zh: "洗澡过程中，如果操作特别轻柔（慢速、不出错），无毛会慢慢闭上眼睛，这是整个游戏里唯一一只会在洗澡时闭眼睛的猫。", en: "If you are very gentle, she closes her eyes—the only cat in the game to do so." },
    realImage: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?q=80&w=1000"
  },
  {
    id: 10,
    title: { zh: "缅因猫", en: "Maine" },
    breed: { zh: "缅因猫（深棕色长毛大型猫）", en: "Maine Coon" },
    difficulty: "★★★★★★★★★★（最高难度）",
    personality: { zh: "体型巨大、力气大、一旦不配合很难控制、但内心其实很温柔", en: "Huge, Strong, Gentle giant" },
    intro: { zh: "「缅因是全游戏最后一只猫，也是这个故事的终点。」", en: "\"Maine is the final cat, and the end of this story.\"" },
    content: {
      zh: "缅因没有悲惨的过去。\n\n他是一只被好好爱过的猫。他的主人是一个叫小林的女孩，养了他整整八年。小林每天给他梳毛，给他拍照片发朋友圈，叫他\"我儿子\"。\n\n上个月，小林确诊了一种需要长期住院治疗的病。她不知道自己什么时候能出院，也不知道还能不能继续养猫。\n\n她花了一个星期，给缅因写了一份详细的\"使用手册\"：\n\n\"他早上六点会饿，要先给湿粮再给干粮。\"\n\"他怕打雷，打雷的时候要抱着他。\"\n\"他喜欢被摸下巴，但不喜欢被摸肚子。\"\n\"他洗澡的时候会很凶，但其实他不会咬人，只是在虚张声势。\"\n\"他是全世界最好的猫。\"\n\"拜托你们，帮他找一个好的家。\"\n\n那份手册有整整四页。\n\n小林把缅因送来的时候没有哭。她把他抱得很紧，在他耳朵边说了很长很长的话。然后她松手了。\n\n缅因回头看了三次。\n\n他不配合洗澡——不是因为害怕，不是因为愤怒。是因为他觉得：如果我表现得很乖，你们是不是就会把我送走？\n\n他不想再被送走了。他想让所有人觉得他很难搞，这样就没人会领养他，他就可以一直待在这里，等小林来接他。\n\n……\n\n缅因，你不知道的是，小林每天都会打电话来问你的情况。",
      en: "Maine was loved. His owner, Lin, raised him for eight years. She brushed him daily and called him \"my son\".\n\nLast month, Lin was hospitalized indefinitely. She didn't know if she could keep him.\n\nShe wrote a four-page manual:\n\n\"He eats at 6 AM.\"\n\"He's scared of thunder.\"\n\"He loves chin scratches.\"\n\"He acts tough in the bath, but won't bite.\"\n\"He is the best cat in the world.\"\n\"Please find him a good home.\"\n\nLin didn't cry when she dropped him off. She hugged him tight, whispered to him, and let go.\n\nMaine looked back three times.\n\nHe fights the bath not because he's mad, but because he thinks: If I'm bad, maybe they won't adopt me out. Maybe I can stay here until Lin comes back.\n\n...Maine, you don't know this, but Lin calls every day to check on you."
    },
    unlockText: { zh: "不是所有的分别都是遗弃。有些放手，是因为太爱了。\n小林，缅因洗好了。他很乖。他在等你。", en: "Not all goodbyes are abandonment. Some let go because they love too much.\nLin, Maine is clean. He's waiting." },
    egg: { zh: "这是唯一一关通关后会出现额外动画的关卡。洗完澡后，画面慢慢淡出，出现一张手机屏幕的画面——是小林发来的微信消息：\"今天的检查结果出来了。医生说情况比想象的好。❤️\" \"等我好了，第一件事就是来接他。\" \"谢谢你们。\"", en: "After the bath, a phone screen appears. A message from Lin: \"Doctor says I'm improving. ❤️ I'll come for him as soon as I'm well. Thank you.\"" },
    realImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1000&auto=format&fit=crop"
  }
];

export const TRANSLATIONS = {
  en: {
    title: "Hellycat",
    subtitle: "Can you give the mischievous cat a bath?",
    controls_wasd: "Move Hand",
    controls_space: "Hold to Grab",
    controls_tub: "Drop here",
    controls_move_mobile: "Drag to Move",
    controls_grab_mobile: "Pinch to Grab",
    controls_tub_mobile: "Drop in Tub",
    start_btn: "Start Catching!",
    level_objective: "Objective",
    level_objective_desc: "Clean the cat! Use the available tools to resolve its needs, then drag it to the bathtub.",
    available_tools: "Available Tools:",
    start_level_btn: "Start Level!",
    choose_cat: "Select Level",
    temperament: "Temperament",
    chill: "Chill",
    spicy: "Spicy",
    go_btn: "GO!",
    caught_title: "Caught!",
    caught_msg: "The cat scratched you too much!",
    try_again: "Retry",
    win_title: "Squeaky Clean!",
    win_msg: "Level Complete!",
    play_again: "Next Level",
    back_to_levels: "Levels",
    restart_level: "Restart Level",
    return_menu: "Return to Menu",
    meow_txt: "Meow~",
    level: "Level",
    locked: "Locked",
    time: "Time",
    stars: "Stars",
    new_record: "New Record!",
    gallery: "Cat Gallery",
    locked_story: "Complete the level to unlock this story.",
    global_ending: "Every cat that comes here deserves to be treated gently.\nEvery bath is a new beginning.",
    cat_names: {
      white: 'Snow', black: 'Void', tuxedo: 'Tux', calico: 'Cali', 
      siamese: 'Meezer', devon: 'Rex', orange: 'Gingy', sphynx: 'Nakey', tabby: 'Tiger', maine_coon: 'Maine'
    },
    bath_messages: [
      "Good kitty!", "Almost done~", "So fluffy!", "Don't cry baby~", 
      "Love you!", "Squeaky clean!", "My precious~", "Just a bit more~", "Be a good boy/girl~"
    ],
    ouch_messages: [
      "OUCH!", "Bad kitty!", "No biting!", "It hurts!", "Mean!", "Hey!"
    ],
    fat_tub_title: "Oops!",
    fat_tub_msg: "Your bathtub can't fit this cat anymore!",
    fat_roll_msg: "Look what you did! Bad owner, your cat needs a walk.",
    free_title: "Freedom!",
    free_msg: "Your cat yearns for freedom and has escaped."
  },
  zh: {
    title: "Hellycat",
    subtitle: "你能给这只淘气猫洗个澡吗？",
    controls_wasd: "移动手",
    controls_space: "按住抓取",
    controls_tub: "放入澡盆",
    controls_move_mobile: "单指拖动",
    controls_grab_mobile: "双指捏合",
    controls_tub_mobile: "放入澡盆",
    start_btn: "开始抓猫！",
    level_objective: "关卡目标",
    level_objective_desc: "给猫咪洗个澡！使用可用的工具解决它的需求，然后把它拖进澡盆里。",
    available_tools: "可用工具：",
    start_level_btn: "开始关卡！",
    choose_cat: "选择关卡",
    temperament: "脾气",
    chill: "温顺",
    spicy: "暴躁",
    go_btn: "开始！",
    caught_title: "被抓伤了！",
    caught_msg: "猫咪抓伤你太多次了！",
    try_again: "重试",
    win_title: "洗白白！",
    win_msg: "关卡完成！",
    play_again: "下一关",
    back_to_levels: "返回选关",
    restart_level: "重新进入本关",
    return_menu: "返回选关",
    meow_txt: "喵~",
    level: "第",
    locked: "未解锁",
    time: "用时",
    stars: "评价",
    new_record: "新纪录！",
    gallery: "猫咪图鉴",
    locked_story: "通关该关卡以解锁故事。",
    global_ending: "每一只来到这里的猫，都值得被温柔对待。\n每一次洗澡，都是一次新的开始。",
    cat_names: {
      white: '小白', black: '小黑', tuxedo: '警长', calico: '三花', 
      siamese: '挖煤', devon: '卷毛', orange: '大橘', sphynx: '无毛', tabby: '虎斑', maine_coon: '缅因猫'
    },
    bath_messages: [
      "乖猫猫！", "快洗好了~", "好软乎！", "不哭不哭~", 
      "爱你哟！", "干干净净！", "我的宝贝~", "再坚持一下~", "做个好孩子~"
    ],
    ouch_messages: [
      "好痛！", "咪咪不乖！", "别咬我！", "痛痛痛！", "坏猫猫！", "哎呀！"
    ],
    fat_tub_title: "哎呀！",
    fat_tub_msg: "你的浴缸已经塞不下这只猫了！",
    fat_roll_msg: "看看你干了什么！坏主人，你的猫撑得需要散步。",
    free_title: "自由！",
    free_msg: "你的猫向往自由"
  },
  ja: {
    title: "Hellycat",
    subtitle: "いたずら猫をお風呂に入れられるかな？",
    controls_wasd: "移動",
    controls_space: "掴む",
    controls_tub: "お風呂",
    controls_move_mobile: "ドラッグ移動",
    controls_grab_mobile: "ピンチで掴む",
    controls_tub_mobile: "お風呂へ",
    start_btn: "捕獲開始！",
    choose_cat: "レベル選択",
    temperament: "気性",
    chill: "大人しい",
    spicy: "激しい",
    go_btn: "スタート！",
    caught_title: "やられた！",
    caught_msg: "猫に引っかかれすぎた！",
    try_again: "リトライ",
    win_title: "ピカピカ！",
    win_msg: "クリア！",
    play_again: "次のレベル",
    back_to_levels: "レベル選択",
    restart_level: "リスタート",
    return_menu: "メニューへ戻る",
    meow_txt: "ニャー",
    level: "レベル",
    locked: "未開放",
    time: "タイム",
    stars: "評価",
    new_record: "新記録！",
    gallery: "猫図鑑",
    locked_story: "レベルをクリアしてストーリーを解放。",
    global_ending: "ここに来るすべての猫は、優しく扱われる価値があります。\nすべてのお風呂は、新しい始まりです。",
    cat_names: {
      white: 'シロ', black: 'クロ', tuxedo: 'タキシード', calico: 'ミケ', 
      siamese: 'シャム', devon: 'レックス', orange: 'チャトラ', sphynx: 'スフィンクス', tabby: 'トラ', maine_coon: 'メインクーン'
    },
    bath_messages: [
      "いい子だね！", "もうすぐ終わるよ~", "ふわふわ！", "泣かないで~", 
      "大好きだよ！", "ピカピカ！", "愛しい子~", "あとちょっと~", "いい子にしてて~"
    ],
    ouch_messages: [
      "痛い！", "ダメよ！", "噛まないで！", "ひどい！", "悪い子！", "ああっ！"
    ],
    fat_tub_title: "おっと！",
    fat_tub_msg: "猫が大きすぎてお風呂に入りません！",
    fat_roll_msg: "何てことを！悪い飼い主だ、猫は散歩が必要だよ。",
    free_title: "自由！",
    free_msg: "あなたの猫は自由を求めて飛んでいきました。"
  },
  fr: {
    title: "Hellycat",
    subtitle: "Peux-tu donner un bain à ce chat espiègle ?",
    controls_wasd: "Bouger",
    controls_space: "Attraper",
    controls_tub: "Baignoire",
    controls_move_mobile: "Glisser",
    controls_grab_mobile: "Pincer",
    controls_tub_mobile: "Baignoire",
    start_btn: "Commencer !",
    choose_cat: "Choisir Niveau",
    temperament: "Caractère",
    chill: "Calme",
    spicy: "Épicé",
    go_btn: "YALLAH !",
    caught_title: "Griffé !",
    caught_msg: "Le chat t'a trop griffé !",
    try_again: "Réessayer",
    win_title: "Tout propre !",
    win_msg: "Niveau terminé !",
    play_again: "Niveau suivant",
    back_to_levels: "Niveaux",
    restart_level: "Recommencer",
    return_menu: "Menu Principal",
    meow_txt: "Miaou~",
    level: "Niveau",
    locked: "Verrouillé",
    time: "Temps",
    stars: "Étoiles",
    new_record: "Nouveau record !",
    gallery: "Galerie",
    locked_story: "Terminez le niveau pour débloquer.",
    global_ending: "Chaque chat qui vient ici mérite d'être traité avec douceur.\nChaque bain est un nouveau départ.",
    cat_names: {
      white: 'Flocon', black: 'Minuit', tuxedo: 'Smoking', calico: 'Cali', 
      siamese: 'Siam', devon: 'Rex', orange: 'Roux', sphynx: 'Nu', tabby: 'Tigré', maine_coon: 'Maine Coon'
    },
    bath_messages: [
      "Gentil chat !", "Presque fini~", "Tout doux !", "Ne pleure pas~", 
      "Je t'aime !", "Tout propre !", "Mon précieux~", "Encore un peu~", "Sois sage~"
    ],
    ouch_messages: [
      "AÏE !", "Vilain chat !", "Pas mordre !", "Ça fait mal !", "Méchant !", "Hé !"
    ],
    fat_tub_title: "Oups !",
    fat_tub_msg: "Ta baignoire est trop petite pour ce chat !",
    fat_roll_msg: "Regarde ce que tu as fait ! Mauvais maître, ton chat a besoin d'une promenade.",
    free_title: "Liberté !",
    free_msg: "Votre chat aspire à la liberté et s'est envolé."
  },
  de: {
    title: "Hellycat",
    subtitle: "Kannst du die schelmische Katze baden?",
    controls_wasd: "Bewegen",
    controls_space: "Greifen",
    controls_tub: "Badewanne",
    controls_move_mobile: "Ziehen",
    controls_grab_mobile: "Kneifen",
    controls_tub_mobile: "Badewanne",
    start_btn: "Starten!",
    choose_cat: "Levelwahl",
    temperament: "Temperament",
    chill: "Ruhig",
    spicy: "Wild",
    go_btn: "LOS!",
    caught_title: "Erwischt!",
    caught_msg: "Die Katze hat dich zu oft gekratzt!",
    try_again: "Nochmal",
    win_title: "Blitzblank!",
    win_msg: "Level geschafft!",
    play_again: "Nächstes Level",
    back_to_levels: "Level",
    restart_level: "Neustart",
    return_menu: "Hauptmenü",
    meow_txt: "Miau~",
    level: "Level",
    locked: "Gesperrt",
    time: "Zeit",
    stars: "Sterne",
    new_record: "Neuer Rekord!",
    gallery: "Galerie",
    locked_story: "Schließe das Level ab, um die Geschichte freizuschalten.",
    global_ending: "Jede Katze, die hierher kommt, verdient es, sanft behandelt zu werden.\nJedes Bad ist ein neuer Anfang.",
    cat_names: {
      white: 'Schneeball', black: 'Schatten', tuxedo: 'Smoking', calico: 'Bunt', 
      siamese: 'Siam', devon: 'Rex', orange: 'Rot', sphynx: 'Nackt', tabby: 'Tiger', maine_coon: 'Maine Coon'
    },
    bath_messages: [
      "Gute Katze!", "Fast fertig~", "So flauschig!", "Nicht weinen~", 
      "Hab dich lieb!", "Sauber!", "Mein Schatz~", "Nur noch kurz~", "Sei brav~"
    ],
    ouch_messages: [
      "AUA!", "Böse Katze!", "Nicht beißen!", "Das tut weh!", "Gemein!", "Hey!"
    ],
    fat_tub_title: "Hoppla!",
    fat_tub_msg: "Deine Badewanne ist zu klein für diese Katze!",
    fat_roll_msg: "Schau, was du getan hast! Schlechter Besitzer, deine Katze braucht einen Spaziergang.",
    free_title: "Freiheit!",
    free_msg: "Deine Katze sehnt sich nach Freiheit und ist geflogen."
  },
  ru: {
    title: "Hellycat",
    subtitle: "Сможешь искупать этого озорного кота?",
    controls_wasd: "Рука",
    controls_space: "Хватать",
    controls_tub: "Ванна",
    controls_move_mobile: "Тяни",
    controls_grab_mobile: "Щипок",
    controls_tub_mobile: "Ванна",
    start_btn: "Начать!",
    choose_cat: "Уровни",
    temperament: "Характер",
    chill: "Тихий",
    spicy: "Дикий",
    go_btn: "Вперед!",
    caught_title: "Пойман!",
    caught_msg: "Кот слишком сильно исцарапал тебя!",
    try_again: "Еще раз",
    win_title: "Чистота!",
    win_msg: "Уровень пройден!",
    play_again: "След. уровень",
    back_to_levels: "В меню",
    restart_level: "Рестарт",
    return_menu: "В меню",
    meow_txt: "Мяу~",
    level: "Уровень",
    locked: "Закрыто",
    time: "Время",
    stars: "Звезды",
    new_record: "Рекорд!",
    gallery: "Галерея",
    locked_story: "Пройдите уровень, чтобы открыть историю.",
    global_ending: "Каждая кошка, приходящая сюда, заслуживает ласки.\nКаждое купание — это новое начало.",
    cat_names: {
      white: 'Снежок', black: 'Уголек', tuxedo: 'Феликс', calico: 'Пятно', 
      siamese: 'Сиам', devon: 'Рекс', orange: 'Рыжий', sphynx: 'Сфинкс', tabby: 'Тигр', maine_coon: 'Мейн-кун'
    },
    bath_messages: [
      "Хороший котик!", "Почти всё~", "Такой пушистый!", "Не плачь~", 
      "Люблю тебя!", "Чистенький!", "Моя прелесть~", "Еще чуть-чуть~", "Будь умницей~"
    ],
    ouch_messages: [
      "АЙ!", "Плохой кот!", "Не кусайся!", "Больно!", "Злюка!", "Эй!"
    ],
    fat_tub_title: "Ой!",
    fat_tub_msg: "Твоя ванна слишком мала для этого кота!",
    fat_roll_msg: "Смотри, что ты наделал! Плохой хозяин, коту нужно гулять.",
    free_title: "Свобода!",
    free_msg: "Твой кот жаждет свободы и улетел."
  }
};