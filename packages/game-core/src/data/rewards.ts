export const REWARD_POOLS = {
  hospital_night_shift: {
    baseline: [
      ["old_duty_key", "你带回来的不是普通见闻，而是能继续打开门的秩序碎片。"],
      ["spare_battery", "你在观察里活了下来，所以大厅更愿意给你照明而不是止痛。"],
    ],
    stableMind: [
      ["tranquilizer_ampoule", "你把恐惧控制在了还能判断的范围内。"],
      ["paper_badge", "你没有被身份诱导带跑，得到了一张能反制伪装的工牌。"],
    ],
    ruleSharp: [
      ["record_clip_page", "你抓住了规则冲突，适合得到能补记对照信息的夹页。"],
      ["nameless_note", "你识破了伪规则，大厅把更危险的一页残片交给了你。"],
    ],
    highRisk: [["mirror_shard", "你从镜面那边带回了一块不该属于大厅的东西。"]],
    premium: [["temporary_pass", "你摸到了超过普通通关层级的出口线。"]],
  },
  apartment_night_return: {
    baseline: [
      ["paper_badge", "你在熟悉感里没有完全失去身份边界。"],
      ["spare_battery", "你把照明留给了验证，而不是留给惊慌。"],
    ],
    stableMind: [
      ["tranquilizer_ampoule", "你没有让门外的声音替你做决定。"],
      ["faded_charm", "你扛住了“回家”这层伪安全感留下的余波。"],
    ],
    ruleSharp: [
      ["record_clip_page", "你把门牌、猫眼和声音的冲突钉在了一起。"],
      ["nameless_note", "你从日常缝隙里带回了一张更危险的注释。"],
    ],
    highRisk: [["mirror_shard", "你从猫眼和镜面交错的死角里带回了一块可疑碎片。"]],
    premium: [["temporary_pass", "大厅确认你已经摸到第二层伪安全区的出口逻辑。"]],
  },
  subway_last_train: {
    baseline: [
      ["spare_battery", "你在列车编号、报站和倒影冲突里活了下来，大厅更愿意继续把光留给你。"],
      ["old_duty_key", "你带回来的不是阻挡物，而是能把下一道门多卡住半拍的秩序碎片。"],
    ],
    stableMind: [
      ["tranquilizer_ampoule", "你没有被最后一次报站彻底拖走。"],
      ["faded_charm", "你在终点站前保住了自己的判断链。"],
    ],
    ruleSharp: [
      ["record_clip_page", "你抓住了报站、车窗和人数之间的冲突。"],
      ["nameless_note", "你从最像标准答案的末班车上带回了一张更危险的注释。"],
    ],
    highRisk: [["mirror_shard", "你从车窗的倒影里带回了一块还会反看你的碎片。"]],
    premium: [["temporary_pass", "大厅开始承认你已经接近更高层的出站逻辑。"]],
  },
  campus_night_patrol: {
    baseline: [
      ["paper_badge", "你没有把最像老师的人直接认成老师，大厅更愿意把身份筹码交给你。"],
      ["spare_battery", "你把光用在了门牌和名单上，而不是用在顺从本身上。"],
    ],
    stableMind: [
      ["tranquilizer_ampoule", "你没有被点名广播整齐地带走。"],
      ["faded_charm", "你没有把校规感错认成安全感。"],
    ],
    ruleSharp: [
      ["record_clip_page", "你把广播、门牌和巡夜身份的冲突一起钉住了。"],
      ["nameless_note", "你从点名之后带回了一页更危险的旁注。"],
    ],
    highRisk: [["mirror_shard", "你从教学楼的门窗反射和点名回声里带回了不该属于校园的碎片。"]],
    premium: [["temporary_pass", "大厅开始承认你已经能在秩序伪装里保住自己的判断。"]],
  },
} as const;
