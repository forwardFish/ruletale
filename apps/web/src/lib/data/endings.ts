export const ENDINGS = {
  normal_clear: {
    id: "normal_clear",
    title: "带着残页离开",
    summary: "你活着离开了住院部，也带走了一部分还算可靠的记录，但你知道自己并没有看穿全部。",
  },
  wrong_clear: {
    id: "wrong_clear",
    title: "错误出口",
    summary: "你确实走出了医院，可你把一段关键判断留在了错误出口里，回来时已经无法确认自己究竟错在哪一步。",
  },
  insight_clear: {
    id: "insight_clear",
    title: "识破后撤离",
    summary: "你不是靠运气离开的。你带走了真正有用的病历，也把这一层规则的核心诱导链拆开了一部分。",
  },
  apartment_normal_clear: {
    id: "apartment_normal_clear",
    title: "关门但未安睡",
    summary: "你把门重新关上，活着撑到了天亮，却仍然知道这栋楼没有真正把你送回家里。",
  },
  apartment_wrong_clear: {
    id: "apartment_wrong_clear",
    title: "把家错认成出口",
    summary: "你最终还是顺着熟悉感做了判断。门开了，但你失去的是那道最该保留下来的确认步骤。",
  },
  apartment_insight_clear: {
    id: "apartment_insight_clear",
    title: "在门外识破回家",
    summary: "你没有把“回家”当成现成答案，而是把门外、门内与楼层错位一起看清了。你带回的不只是平安，还有第二层规则的入口线索。",
  },
} as const;
