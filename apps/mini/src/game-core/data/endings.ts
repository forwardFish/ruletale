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
  subway_normal_clear: {
    id: "subway_normal_clear",
    title: "错开末班车",
    summary: "你没有被最后一次报站完全带走，活着离开了站台，但仍知道那列车真正想带走的不是人，而是判断顺序。",
  },
  subway_wrong_clear: {
    id: "subway_wrong_clear",
    title: "把终点站当成答案",
    summary: "你确实离开了月台，可你顺着错误报站走完了最后一程，回来时已经说不清自己究竟在哪一站下了车。",
  },
  subway_insight_clear: {
    id: "subway_insight_clear",
    title: "在报站前下车",
    summary: "你识破了列车编号、报站和倒影人数之间的错位，在它真正关门前把自己从那套秩序里抽了出来。",
  },
  campus_normal_clear: {
    id: "campus_normal_clear",
    title: "巡夜后撤",
    summary: "你没有把校园夜巡当成安全巡逻，而是保住了自己的确认链，带着一部分可用记录撤出了教学楼。",
  },
  campus_wrong_clear: {
    id: "campus_wrong_clear",
    title: "点名之后",
    summary: "你顺着最像校规的一道声音做了判断。楼层还在，教室也还在，但你把最重要的那一步确认留在了广播里。",
  },
  campus_insight_clear: {
    id: "campus_insight_clear",
    title: "在点名前识破带路人",
    summary: "你同时拆开了广播、巡夜身份和门牌错位三层诱导，在它们重新闭合前带着更完整的秩序真相离开了校园。",
  },
} as const;
