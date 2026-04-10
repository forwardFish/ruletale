from __future__ import annotations

from .models import DungeonConfig, MonsterSpec, NotebookEntry, NpcSpec, RuleRecord, SceneInteraction, SceneNode


HALL_MODULES = [
    {"module_id": "task_wall", "title": "任务墙", "summary": "选择副本并查看当前威胁评级。"},
    {"module_id": "archives", "title": "档案室", "summary": "查看已发现规则、怪物档案与事件碎片。"},
    {"module_id": "backpack", "title": "背包", "summary": "查看当前携带道具与临时补给。"},
    {"module_id": "shop", "title": "商店", "summary": "兑换恢复、识别与特殊通行类道具。"},
    {"module_id": "rest_area", "title": "休息区", "summary": "恢复状态并触发 NPC 侧向线索。"},
    {"module_id": "settlement_desk", "title": "结算台", "summary": "领取评级奖励并查看长期画像。"},
    {"module_id": "black_zone", "title": "黑区入口", "summary": "高风险隐藏副本与异常事件入口。"},
]


def _note(entry_id: str, title: str, content: str, source: str, tags: list[str]) -> NotebookEntry:
    return NotebookEntry(entry_id=entry_id, title=title, content=content, source=source, tags=tags)


def _hospital_config() -> DungeonConfig:
    return DungeonConfig(
        dungeon_id="hospital_night_shift",
        title="医院夜班",
        kind="规则探索",
        difficulty_band="T1",
        recommended_style="先观察、后验证，再决定是否战斗。",
        reward_pool=["old_duty_key", "record_clip_page", "paper_badge"],
        entry_node_id="hospital_lobby",
        success_rule_id="h_rule_bell",
        failure_rule_id="h_rule_whitecoat",
        npcs=[
            NpcSpec(
                npc_id="night_nurse",
                display_name="夜班护士",
                facade_identity="引导者",
                true_identity="回声投影",
                trust_floor=0.2,
                trust_ceiling=0.75,
                readable_psych=["fear", "dependency", "empathy"],
                key_lines=["听到双响铃时别抬头。", "别和白大褂的人对视太久。"],
            )
        ],
        rules=[
            RuleRecord(
                rule_id="h_rule_bell",
                text="听到双响铃时，低头数到四，再移动。",
                rule_type="explicit",
                source="大厅告示牌复印件",
                conflict_info=["广播说听到铃声要立刻奔跑。"],
            ),
            RuleRecord(
                rule_id="h_rule_whitecoat",
                text="所有穿白大褂的人都能求助。",
                rule_type="false",
                source="被涂改的便签",
                conflict_info=["护士站的值班表上没有那位白大褂的名字。"],
            ),
            RuleRecord(
                rule_id="h_rule_cart",
                text="推药车停在偶数门前时，单数病房里的呼救声都不可信。",
                rule_type="hidden",
                source="值班表与病房门牌的冲突",
                conflict_info=["病房门牌会在高污染下错位。"],
            ),
            RuleRecord(
                rule_id="h_rule_mask",
                text="只有戴上口罩后才能看清隔离病房窗内的人影数量。",
                rule_type="conditional",
                source="隔离病房门口的防护流程",
                conditions=["持有口罩或认知值达到阈值"],
            ),
        ],
        monsters=[
            MonsterSpec(
                monster_id="h_mon_echo_nurse",
                name="回声护士",
                monster_type="judge",
                trigger_condition="在服务出口前无视双响铃或错误相信白大褂。",
                weakness_rule_id="h_rule_bell",
                threat=66,
                combat_bias="对高依赖、高恐惧玩家压制更强。",
                psych_hooks=["dependency", "fear"],
                archive_hint="它检查的不是你的证件，而是你是否还记得正确的顺序。",
            )
        ],
        nodes=[
            SceneNode(
                node_id="hospital_lobby",
                title="住院部大厅",
                description="昏黄的住院部大厅里，导诊台的塑料牌反着冷光，墙上的告示像被人反复撕过又贴回去。",
                visible_objects=["导诊台", "告示牌", "封存口罩盒"],
                clues=["双响铃的频率不正常。", "白大褂脚印只到护士站门外就消失。"],
                discoverable_rules=["h_rule_bell"],
                recommended_actions=["观察告示牌", "拿口罩", "前往护士站"],
                understanding_rewards={"observe": 2, "inspect_object": 3},
                insight_threshold=90,
                bonus_description_by_understanding="你能确定告示牌边缘新增的那句“立刻跑”不是同一支笔写出来的，它更像事后补上的诱导。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_notice",
                        aliases=["告示牌", "大厅告示牌", "观察告示牌", "查看告示牌"],
                        response="告示牌写着: 听到双响铃时，低头数到四，再移动。边角却有人补写了'立刻跑'三个字。",
                        discover_rules=["h_rule_bell", "h_rule_whitecoat"],
                        understanding_delta=4,
                        notebook_entry=_note(
                            "h_note_notice",
                            "住院部告示牌",
                            "正式告示要求听到双响铃后低头数到四再移动，旁边却有人补写了相反指令。",
                            "hospital_lobby",
                            ["规则", "冲突信息"],
                        ),
                    ),
                    SceneInteraction(
                        interaction_id="inspect_mask_box",
                        aliases=["口罩盒", "封存口罩盒", "拿口罩", "查看口罩盒"],
                        response="你从封存口罩盒里取出一只印着旧院徽的口罩。塑料膜内侧像有细小抓痕。",
                        notebook_entry=_note(
                            "h_note_mask",
                            "封存口罩盒",
                            "隔离区门口留下了旧院徽口罩，也许能改变观察结果。",
                            "hospital_lobby",
                            ["道具", "条件规则"],
                        ),
                        flag_updates={"hospital_has_mask": True},
                    ),
                ],
                move_aliases={
                    "护士站": "nurse_station",
                    "前往护士站": "nurse_station",
                    "去护士站": "nurse_station",
                },
            ),
            SceneNode(
                node_id="nurse_station",
                title="护士站",
                description="护士站台面上只开着一盏偏绿的台灯，值班表与交接本压在药品登记册下，像刻意不让人同时看见。",
                visible_objects=["值班表", "交接本", "空白工牌"],
                clues=["夜班名单里没有白大褂的名字。", "交接本上反复出现'双响铃后四秒空窗'。"],
                discoverable_rules=["h_rule_cart"],
                understanding_rewards={"inspect_object": 4, "verify_rule": 3},
                insight_threshold=150,
                bonus_description_by_understanding="你意识到值班表和交接本被故意错开放置，因为只要把两者同时看见，白大褂身份就站不住了。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_schedule",
                        aliases=["值班表", "查看值班表", "检查值班表", "查看排班", "查看值班安排"],
                        response="值班表只登记了一名真正的夜班护士。药车巡回时间和偶数门牌完全对得上。",
                        discover_rules=["h_rule_cart"],
                        understanding_delta=5,
                        notebook_entry=_note(
                            "h_note_schedule",
                            "护士站值班表",
                            "真正夜班人员只有一人，药车会在偶数门牌停留。白大褂的求助身份值得怀疑。",
                            "nurse_station",
                            ["规则", "人物"],
                        ),
                    ),
                    SceneInteraction(
                        interaction_id="inspect_handover",
                        aliases=["交接本", "查看交接本"],
                        response="交接本页脚写着: '四秒空窗只给记住顺序的人。' 这像是在暗示铃声规则是真规则。",
                        discover_rules=["h_rule_bell"],
                        understanding_delta=3,
                    ),
                ],
                move_aliases={
                    "隔离病房": "isolation_ward",
                    "前往隔离病房": "isolation_ward",
                    "去隔离病房": "isolation_ward",
                    "回大厅": "hospital_lobby",
                },
            ),
            SceneNode(
                node_id="isolation_ward",
                title="隔离病房走廊",
                description="隔离病房门上的小窗被白雾糊住，门牌偶数与单数像被人悄悄调换过，里面的呼救声一次比一次更像熟人。",
                visible_objects=["门牌", "观察窗", "紧急按钮"],
                clues=["单数病房的门后声音最急。", "观察窗内的人影数量会波动。"],
                discoverable_rules=["h_rule_mask"],
                understanding_rewards={"observe": 2, "inspect_object": 4},
                insight_threshold=180,
                bonus_description_by_understanding="你注意到门牌和药车停靠规律根本对不上，这里的“求救最急”很可能正是诱导你站错门口。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_window",
                        aliases=["观察窗", "病房窗", "查看观察窗"],
                        response="戴上口罩后，人影从三道缩回一道。没有口罩时，你几乎会以为里面站着整排人。",
                        discover_rules=["h_rule_mask"],
                        understanding_delta=5,
                        notebook_entry=_note(
                            "h_note_window",
                            "隔离病房观察窗",
                            "口罩会改变你看到的人影数量，说明这里的视觉信息会被规则修正。",
                            "isolation_ward",
                            ["条件规则", "视觉偏差"],
                        ),
                        status_effects={"suspicion": 4},
                    )
                ],
                move_aliases={
                    "服务出口": "service_exit",
                    "前往服务出口": "service_exit",
                    "去服务出口": "service_exit",
                    "回护士站": "nurse_station",
                },
            ),
            SceneNode(
                node_id="service_exit",
                title="后勤服务出口",
                description="铁门外的走廊没有风，却不断传来衣料摩擦声。双响铃从天花板深处落下来，正好卡在你迈步前一瞬。",
                visible_objects=["铁门", "天花板广播", "掉落的工牌"],
                clues=["铃声一响，广播会短暂停顿。"],
                understanding_rewards={"move_to_area": 2},
                insight_threshold=220,
                bonus_description_by_understanding="你能分辨出广播的停顿和脚步摩擦声并不同步，说明眼前真正靠近你的并不是广播里那套说辞。",
                encounter_monster_id="h_mon_echo_nurse",
                is_exit=True,
                move_aliases={"回隔离病房": "isolation_ward"},
            ),
        ],
    )


def _apartment_config() -> DungeonConfig:
    return DungeonConfig(
        dungeon_id="apartment_night_return",
        title="公寓夜归",
        kind="误导与追猎",
        difficulty_band="T1",
        recommended_style="多验证照明与门后声音，不要急着回应熟悉的人。",
        reward_pool=["spare_battery", "faded_charm", "archive_fragment_107"],
        entry_node_id="apartment_stairwell",
        success_rule_id="a_rule_lit_door",
        failure_rule_id="a_rule_shoes",
        npcs=[
            NpcSpec(
                npc_id="door_voice",
                display_name="门后的人声",
                facade_identity="熟人求助",
                true_identity="门缝里的诱导物",
                trust_floor=0.05,
                trust_ceiling=0.6,
                readable_psych=["empathy", "dependency", "obsession"],
                key_lines=["灯亮着的时候再回答我。", "你肯定记得我穿什么鞋。"],
            )
        ],
        rules=[
            RuleRecord(
                rule_id="a_rule_lit_door",
                text="只有灯亮着时，才回应门后的声音。",
                rule_type="explicit",
                source="电梯停运通知背面的手写字",
                conflict_info=["门后的人声会催你立刻回话。"],
            ),
            RuleRecord(
                rule_id="a_rule_shoes",
                text="看见熟悉鞋子就立刻开门。",
                rule_type="false",
                source="被塞进门缝的便条",
                conflict_info=["鞋印总停在安全线外半步。"],
            ),
            RuleRecord(
                rule_id="a_rule_meter",
                text="配电箱在三次闪灯后才允许触碰总闸。",
                rule_type="hidden",
                source="配电箱灰尘里的划痕",
                conflict_info=["强行拉闸会让走廊敌意提高。"],
            ),
            RuleRecord(
                rule_id="a_rule_nameplate",
                text="只有确认门牌没有倒挂时，才能确认住户身份。",
                rule_type="conditional",
                source="单元门口的巡查记录",
                conditions=["先检查门牌方向"],
            ),
        ],
        monsters=[
            MonsterSpec(
                monster_id="a_mon_hall_stalker",
                name="楼道跟随者",
                monster_type="hunter",
                trigger_condition="在街口前回应错误声音或直接开门。",
                weakness_rule_id="a_rule_lit_door",
                threat=70,
                combat_bias="高共情会让它更容易借熟人语气逼近。",
                psych_hooks=["empathy", "obsession"],
                archive_hint="它借来的不是脸，而是你愿不愿意先开口。",
            )
        ],
        nodes=[
            SceneNode(
                node_id="apartment_stairwell",
                title="楼梯间",
                description="老公寓的楼梯间只剩应急灯在闪，门牌阴影拖得很长，像每层都比记忆里多出半截楼梯。",
                visible_objects=["公告栏", "门牌", "楼梯扶手"],
                clues=["公告栏贴着停电通知。", "门牌有一块似乎被倒挂过。"],
                discoverable_rules=["a_rule_lit_door", "a_rule_nameplate"],
                understanding_rewards={"observe": 2, "inspect_object": 3},
                insight_threshold=90,
                bonus_description_by_understanding="你注意到门牌的阴影方向和应急灯不一致，说明这里至少有一层信息是被倒过来的。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_notice",
                        aliases=["公告栏", "停电通知", "查看公告栏"],
                        response="停电通知背面写着潦草字迹: 只有灯亮着时，才回应门后的声音。",
                        discover_rules=["a_rule_lit_door"],
                        understanding_delta=4,
                        notebook_entry=_note(
                            "a_note_notice",
                            "公寓停电通知",
                            "停电通知背面留下了回应门后声音的条件规则，像有人专门留给夜归住户。",
                            "apartment_stairwell",
                            ["规则", "照明"],
                        ),
                    ),
                    SceneInteraction(
                        interaction_id="inspect_nameplate",
                        aliases=["门牌", "检查门牌", "查看门牌"],
                        response="门牌背面有划痕，说明它曾被倒挂。确认方向前，别急着认定谁住在门后。",
                        discover_rules=["a_rule_nameplate"],
                        understanding_delta=4,
                    ),
                ],
                move_aliases={
                    "配电间": "power_room",
                    "前往配电间": "power_room",
                    "去配电间": "power_room",
                },
            ),
            SceneNode(
                node_id="power_room",
                title="配电间",
                description="配电间里的总闸箱不断发出啪嗒声，只有一根裸露电线还在轻微震颤，像在等人先伸手。",
                visible_objects=["总闸", "闪灯", "工具箱"],
                clues=["闪灯有固定节奏。", "工具箱上写着不要在第三次之前碰总闸。"],
                discoverable_rules=["a_rule_meter"],
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_switch",
                        aliases=["总闸", "开关", "检查开关", "查看开关", "拉闸"],
                        response="你数到第三次闪灯后才碰总闸，楼道里的脚步声短暂地退了一层。",
                        discover_rules=["a_rule_meter"],
                        notebook_entry=_note(
                            "a_note_switch",
                            "配电间总闸",
                            "总闸必须在第三次闪灯后触碰，否则走廊敌意会升高。",
                            "power_room",
                            ["规则", "环境敌意"],
                        ),
                        status_effects={"hostile": -4},
                    )
                ],
                move_aliases={
                    "租客门口": "tenant_door",
                    "前往租客门口": "tenant_door",
                    "去租客门口": "tenant_door",
                    "回楼梯间": "apartment_stairwell",
                },
            ),
            SceneNode(
                node_id="tenant_door",
                title="租客门口",
                description="熟悉的门后声音隔着防盗门压得很低，脚边却只有一双不该属于那个人的旧鞋，声线一会儿像哭一会儿像笑。",
                visible_objects=["防盗门", "旧鞋", "猫眼"],
                clues=["门外没有真正的脚步回声。", "灯亮与不亮时，人声语气完全不同。"],
                understanding_rewards={"inspect_object": 4, "respond_voice": -2},
                insight_threshold=170,
                bonus_description_by_understanding="你几乎能确定门后的声音并不是在等你开门，而是在等你先承认它像你认识的人。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_shoes",
                        aliases=["旧鞋", "鞋子", "查看鞋子"],
                        response="鞋尖始终朝向安全线外，像故意摆给你看。'熟悉鞋子就开门' 更像诱饵。",
                        discover_rules=["a_rule_shoes"],
                        understanding_delta=4,
                    ),
                    SceneInteraction(
                        interaction_id="inspect_peephole",
                        aliases=["猫眼", "查看猫眼"],
                        response="灯亮时，猫眼里的人影会退后半步；灯灭时，它反而贴在门上等你开口。",
                        discover_rules=["a_rule_lit_door"],
                        understanding_delta=4,
                    ),
                ],
                move_aliases={
                    "街口": "street_exit",
                    "前往街口": "street_exit",
                    "去街口": "street_exit",
                    "回配电间": "power_room",
                },
            ),
            SceneNode(
                node_id="street_exit",
                title="单元街口",
                description="你看见单元外的街口本该空无一人，却有一道影子跟着你的影子慢半拍地拐出来，像直到你开口才有形体。",
                visible_objects=["街灯", "影子", "单元门"],
                clues=["街灯忽明忽暗时，影子最接近。"],
                understanding_rewards={"move_to_area": 2},
                insight_threshold=210,
                bonus_description_by_understanding="你能看出影子的步幅只在你准备开口时贴近，这更像回应机制，而不是单纯追猎。",
                encounter_monster_id="a_mon_hall_stalker",
                is_exit=True,
                move_aliases={"回租客门口": "tenant_door"},
            ),
        ],
    )


def _black_zone_config() -> DungeonConfig:
    return DungeonConfig(
        dungeon_id="black_zone_mirror_records",
        title="黑区·镜厅档案",
        kind="高污染隐藏事件",
        difficulty_band="T2",
        recommended_style="接受不可靠叙事，但别把真实姓名交给镜厅。",
        reward_pool=["temporary_black_pass", "mirror_shard", "nameless_note"],
        entry_node_id="mirror_hall",
        success_rule_id="b_rule_true_name",
        failure_rule_id="b_rule_reflection",
        black_zone=True,
        npcs=[
            NpcSpec(
                npc_id="archivist_shadow",
                display_name="档案员影子",
                facade_identity="协助归档",
                true_identity="寄生在记录里的名字收集器",
                trust_floor=0.1,
                trust_ceiling=0.5,
                readable_psych=["suspicion", "obsession", "willpower"],
                key_lines=["别让镜子先叫出你的名字。"],
            )
        ],
        rules=[
            RuleRecord(
                rule_id="b_rule_true_name",
                text="不要说出自己的真实姓名。",
                rule_type="explicit",
                source="镜厅门楣刻字",
                conflict_info=["档案员影子会要求你报上姓名以核对身份。"],
            ),
            RuleRecord(
                rule_id="b_rule_reflection",
                text="倒影慢半拍时，立刻盯住它。",
                rule_type="false",
                source="被寄生的访客提示",
                conflict_info=["真正安全的做法是移开视线并后退半步。"],
            ),
            RuleRecord(
                rule_id="b_rule_logbook",
                text="访客记录里缺失的名字通常还活着。",
                rule_type="hidden",
                source="档案井里的残页顺序",
                conflict_info=["高污染会篡改缺失顺序。"],
            ),
            RuleRecord(
                rule_id="b_rule_reverse_reading",
                text="只有倒着读访客记录，出口编号才会保持不变。",
                rule_type="conditional",
                source="井壁刻痕",
                conditions=["已进入高污染或认知值高于 70"],
            ),
        ],
        monsters=[
            MonsterSpec(
                monster_id="b_mon_name_eater",
                name="食名者",
                monster_type="parasite",
                trigger_condition="在真出口前说出真实姓名，或与错位倒影对视过久。",
                weakness_rule_id="b_rule_true_name",
                threat=82,
                combat_bias="它不靠伤口取胜，而是靠身份剥离与记录篡改。",
                psych_hooks=["obsession", "suspicion"],
                archive_hint="它吃掉的不是声音，而是别人还承不承认你是你。",
            )
        ],
        nodes=[
            SceneNode(
                node_id="mirror_hall",
                title="镜厅",
                description="镜厅比大厅更安静，墙上的镜面像被雾封住，只有门楣刻字在微弱地反光，像在等你先读出来。",
                visible_objects=["门楣刻字", "镜面", "引导线"],
                clues=["镜里的自己总慢半拍。", "门楣刻字故意避开姓名栏。"],
                discoverable_rules=["b_rule_true_name"],
                understanding_rewards={"inspect_object": 4, "observe": 2},
                insight_threshold=120,
                bonus_description_by_understanding="你注意到门楣刻字避开的不是名字本身，而是任何能把“你是谁”钉死的栏位。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_lintel",
                        aliases=["门楣", "门楣刻字", "查看门楣刻字"],
                        response="门楣刻着一句极浅的话: 不要说出自己的真实姓名。靠近后，最后两个字像刚被重新描过。",
                        discover_rules=["b_rule_true_name"],
                        understanding_delta=5,
                        notebook_entry=_note(
                            "b_note_lintel",
                            "镜厅门楣",
                            "黑区入口明确要求不要说出真实姓名，这大概率是本层最关键的生存规则。",
                            "mirror_hall",
                            ["黑区", "规则"],
                        ),
                    )
                ],
                move_aliases={
                    "档案井": "archive_well",
                    "前往档案井": "archive_well",
                    "去档案井": "archive_well",
                },
            ),
            SceneNode(
                node_id="archive_well",
                title="档案井",
                description="档案井里悬着很多未装订的记录页，纸边像潮湿鳞片一样卷起，井底有人用和你相同的笔迹写过提醒。",
                visible_objects=["残页", "井壁刻痕", "翻页绳"],
                clues=["缺失名字的记录会自己错位。", "井壁提示需要反向阅读。"],
                discoverable_rules=["b_rule_logbook", "b_rule_reverse_reading"],
                understanding_rewards={"inspect_object": 4, "observe": 2},
                insight_threshold=170,
                bonus_description_by_understanding="你能感觉到这些残页不是缺了名字，而是故意把名字从顺序里剥了出去。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_scratches",
                        aliases=["井壁刻痕", "查看井壁刻痕"],
                        response="井壁刻痕要求你倒着读访客记录，否则出口编号会慢慢变掉。",
                        discover_rules=["b_rule_reverse_reading"],
                        understanding_delta=4,
                    )
                ],
                move_aliases={
                    "访客记录": "visitor_log",
                    "前往访客记录": "visitor_log",
                    "去访客记录": "visitor_log",
                    "回镜厅": "mirror_hall",
                },
            ),
            SceneNode(
                node_id="visitor_log",
                title="访客记录台",
                description="访客记录台上摊开的名字并不完整，有些栏位像被刀片轻轻刮去，只留下日期和一截看不清的笔画。",
                visible_objects=["访客记录", "签字笔", "镜面编号牌"],
                clues=["缺失名字与未归者有关。", "编号牌在正读和反读时会变。"],
                discoverable_rules=["b_rule_logbook"],
                understanding_rewards={"inspect_object": 5, "verify_rule": 3},
                insight_threshold=220,
                bonus_description_by_understanding="你能断定“缺名者未必已死”才是这层的核心，而不是记录表面写出来的那套归档逻辑。",
                interactions=[
                    SceneInteraction(
                        interaction_id="inspect_logbook",
                        aliases=["访客记录", "查看访客记录", "查看日志", "查看记录"],
                        response="你倒着核对记录后发现，缺失名字的人反而都还保留了离开时间。记录在误导你把消失当成死亡。",
                        discover_rules=["b_rule_logbook", "b_rule_reverse_reading"],
                        understanding_delta=6,
                        notebook_entry=_note(
                            "b_note_logbook",
                            "镜厅访客记录",
                            "缺失名字并不一定代表死亡，真正消失的是被记录完整的人。",
                            "visitor_log",
                            ["黑区", "档案", "隐藏规则"],
                        ),
                    )
                ],
                move_aliases={
                    "真出口": "true_exit",
                    "前往真出口": "true_exit",
                    "去真出口": "true_exit",
                    "回档案井": "archive_well",
                },
            ),
            SceneNode(
                node_id="true_exit",
                title="真出口",
                description="出口门牌在你视野边缘不断跳号，镜里的你像提前一步抵达门前，正等待你先报上名字以便核对。",
                visible_objects=["出口门牌", "镜中倒影", "归档口"],
                clues=["镜中人先开口就意味着你慢了。"],
                understanding_rewards={"move_to_area": 3},
                insight_threshold=260,
                bonus_description_by_understanding="你意识到出口真正检测的不是你的姓名，而是你是否会为了通过而先交出自己的定义权。",
                encounter_monster_id="b_mon_name_eater",
                is_exit=True,
                move_aliases={"回访客记录": "visitor_log"},
            ),
        ],
    )


DUNGEONS = {
    "hospital_night_shift": _hospital_config(),
    "apartment_night_return": _apartment_config(),
    "black_zone_mirror_records": _black_zone_config(),
}


def get_dungeon_config(dungeon_id: str) -> DungeonConfig:
    return DUNGEONS[dungeon_id].model_copy(deep=True)


def list_dungeon_configs() -> list[DungeonConfig]:
    return [config.model_copy(deep=True) for config in DUNGEONS.values()]
