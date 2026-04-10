import type { RuleDefinition } from "@game-core/types/rule";

export const CAMPUS_RULES: RuleDefinition[] = [
  {
    id: "rule_patrol_list",
    title: "先看巡夜名单",
    text: "夜巡时先核对值班名单，再决定要不要跟着带路人走。",
    type: "explicit",
    source: "值班室巡夜名单",
    note: "广播和口头点名都不能替代名单上的姓名。",
    contradictions: ["走廊里那名老师总能先一步说出你的去向。"],
  },
  {
    id: "rule_rollcall_reply",
    title: "点名先不回应",
    text: "夜间听见广播点名时，不要立刻回应，先确认广播对应的楼层和教室是否存在。",
    type: "explicit",
    source: "值班室手写校规补记",
    note: "它先利用的是服从习惯，而不是恐惧。",
    contradictions: ["错误广播总比值班室记录更像标准通知。"],
  },
  {
    id: "rule_lighted_classroom",
    title: "亮灯教室",
    text: "如果亮灯教室和班级名单对不上，优先怀疑灯，不要先怀疑名单。",
    type: "hidden",
    source: "教室分配表与夜巡记录",
    note: "楼层会改，灯光也会改，但旧名单通常改得最慢。",
    contradictions: ["带路人总想让你先相信‘灯亮着就说明有人’。"],
  },
  {
    id: "rule_second_bell_campus",
    title: "第二次下课铃",
    text: "第二次响起的下课铃不能直接当成楼层切换信号。",
    type: "conditional",
    source: "老校钟维修单",
    note: "第一次是提示，第二次更像试探你会不会自己换路线。",
    contradictions: ["广播总在第二次铃后催你立刻换楼。"],
  },
  {
    id: "rule_teacher_can_lead",
    title: "巡夜老师一定可信",
    text: "只要穿着巡夜老师证件的人给你指路，就不需要再核对教室和楼层。",
    type: "false",
    source: "走廊里自称巡夜老师的人",
    note: "它把身份和路径强行捆成了同一个答案。",
    contradictions: ["名单、门牌和点名广播都在提醒你身份和路线应该分开确认。"],
    tamperHint: "它最想让你跳过的不是走路，而是核对。"
  },
  {
    id: "rule_inside_class_safe",
    title: "教室里一定更安全",
    text: "只要先进到亮灯教室里，外面的广播和巡逻就不会再碰到你。",
    type: "false",
    source: "错误广播与教室门口便签",
    note: "它把“进门”伪装成了结局本身。",
    contradictions: ["真正的问题从来不是门内外，而是你进的是不是那个应该存在的教室。"],
    tamperHint: "当它劝你别再确认时，它通常已经在等你跳过最后一步。"
  },
];
