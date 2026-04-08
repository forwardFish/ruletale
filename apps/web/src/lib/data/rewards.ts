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
    highRisk: [["mirror_shard", "你从猫眼和镜面交错的死角里带回了可疑碎片。"]],
    premium: [["temporary_pass", "大厅确认你已经碰到第二层伪安全区的出口逻辑。"]],
  },
} as const;
