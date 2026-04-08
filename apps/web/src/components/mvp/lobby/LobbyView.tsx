"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Archive,
  Backpack,
  BookMarked,
  ChevronRight,
  Eye,
  Flame,
  Lock,
  MoonStar,
  Shield,
  ShoppingBag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ArchivePanel } from "@/components/mvp/layout/ArchivePanel";
import { ResultPanel } from "@/components/mvp/layout/ResultPanel";
import { InventoryDrawer } from "@/components/mvp/game/InventoryDrawer";
import { Button } from "@/components/mvp/ui/Button";
import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { SurfaceHeader } from "@/components/mvp/ui/Surface";
import { ITEM_DEFINITIONS, SHOP_PRICES } from "@/lib/data/items";
import { buildDungeonCards } from "@/lib/data/lobby";
import { useGameStore, usePrimaryBehaviorLabel } from "@/store/gameStore";

type SectionTitleProps = {
  icon: ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
};

type StatusCardProps = {
  label: string;
  value: string;
  hint: string;
  accent?: string;
};

type MiniListProps = {
  title: string;
  data: string[];
  empty: string;
};

type MarketItem = {
  name: string;
  desc: string;
  priceLabel: string;
  disabled?: boolean;
  onSelect?: () => void;
};

function PosterBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#280106] via-[#120307] to-[#06080d]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,55,55,0.45),transparent_35%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent" />
      <div className="absolute left-1/2 top-[10%] h-44 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-red-200/40 to-transparent" />
      <div className="absolute bottom-0 left-[16%] h-56 w-28 skew-x-[22deg] bg-gradient-to-t from-red-700/30 to-transparent" />
      <div className="absolute bottom-0 right-[16%] h-56 w-28 -skew-x-[22deg] bg-gradient-to-t from-red-700/30 to-transparent" />
      <div className="absolute bottom-0 left-1/2 h-60 w-1 -translate-x-1/2 bg-gradient-to-b from-transparent via-red-300/35 to-red-100/80" />
      <div className="absolute bottom-12 left-[40%] h-10 w-2 rounded-t-full bg-black/90 shadow-[0_0_18px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-12 left-[58%] h-14 w-3 rounded-t-full bg-black/90 shadow-[0_0_18px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-12 left-[57.4%] h-5 w-5 rounded-full bg-black/90" />
    </div>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-rose-200">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">{eyebrow}</div>
        <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
      </div>
    </div>
  );
}

function StatusCard({ label, value, hint, accent = "from-rose-500/30 to-transparent" }: StatusCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm transition hover:bg-white/[0.08]">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.22em] text-white/40">{label}</div>
        <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
        <div className="mt-2 text-sm leading-6 text-white/55">{hint}</div>
      </div>
    </div>
  );
}

function MiniList({ title, data, empty }: MiniListProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
      <div className="mb-3 text-sm font-medium text-white">{title}</div>
      <div className="space-y-2">
        {data.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white/45">{empty}</div>
        ) : (
          data.map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2.5 text-sm text-white/70">
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ShopCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  items: MarketItem[];
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm transition hover:bg-white/[0.07]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">{eyebrow}</div>
          <div className="mt-2 text-lg font-semibold text-white">{title}</div>
          <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-rose-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3 text-sm leading-6 text-white/45">当前没有可显示的商品。</div>
        ) : (
          items.map((item) => {
            const content = (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{item.name}</div>
                  <div className="mt-1 text-sm leading-6 text-white/55">{item.desc}</div>
                </div>
                <div className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/72">
                  {item.priceLabel}
                </div>
              </div>
            );

            if (!item.onSelect) {
              return (
                <div key={item.name} className="rounded-2xl border border-white/8 bg-black/20 p-3">
                  {content}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                type="button"
                onClick={item.onSelect}
                disabled={item.disabled}
                className="block w-full rounded-2xl border border-white/8 bg-black/20 p-3 text-left transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {content}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function DungeonCardArt({ locked }: { locked: boolean }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-[20px] border border-white/10 bg-[#12060a]">
      <PosterBackground />
      <div className="absolute inset-0 bg-black/20" />
      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
          <div className="rounded-2xl border border-white/10 bg-black/55 px-4 py-2 text-sm text-white/80">尚未开放</div>
        </div>
      ) : null}
    </div>
  );
}

function AccessCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-white/10 bg-white/[0.05] p-5 text-left backdrop-blur-sm transition hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">{eyebrow}</div>
          <div className="mt-2 text-lg font-semibold text-white">{title}</div>
          <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-rose-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function OverlayPanel({
  open,
  title,
  eyebrow,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  eyebrow: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/72 p-3 backdrop-blur-sm md:p-6">
          <div className="flex min-h-full items-end justify-center md:items-center">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="w-full max-w-6xl rounded-[28px] border border-white/10 bg-[#0f1217] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.34)] md:p-6"
            >
              <SurfaceHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
                action={
                  <Button type="button" variant="ghost" onClick={onClose} className="rounded-full p-3">
                    <X className="h-4 w-4" />
                  </Button>
                }
              />
              <div className="mt-5 max-h-[72vh] overflow-auto pr-1">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function LobbyView() {
  const router = useRouter();
  const [showSettlement, setShowSettlement] = useState(false);
  const player = useGameStore((state) => state.player);
  const progress = useGameStore((state) => state.progress);
  const inventory = useGameStore((state) => state.inventory);
  const lobby = useGameStore((state) => state.lobby);
  const drawer = useGameStore((state) => state.meta.currentDrawer);
  const enterDungeon = useGameStore((state) => state.enterDungeon);
  const setDrawer = useGameStore((state) => state.setDrawer);
  const purchaseItem = useGameStore((state) => state.purchaseItem);
  const primaryBehavior = usePrimaryBehaviorLabel();

  const dungeonCards = buildDungeonCards(progress, lobby, player);
  const playableDungeons = dungeonCards.filter((entry) => entry.id !== "black_zone_entry");
  const blackZoneCard = dungeonCards.find((entry) => entry.id === "black_zone_entry");
  const latestReward = progress.recentRewards[0];
  const latestRewardName = latestReward ? ITEM_DEFINITIONS[latestReward.itemId]?.name ?? latestReward.itemId : "暂无";
  const blackTalkValue = String(lobby.blackZone.conditions.filter((item) => item.satisfied).length).padStart(2, "0");

  const recentRules = useMemo(
    () => progress.archive.rules.slice(-3).reverse().map((rule) => rule.title || rule.text),
    [progress.archive.rules],
  );

  const recentItems = useMemo(() => {
    if (progress.recentRewards.length > 0) {
      return progress.recentRewards
        .slice(0, 4)
        .map((reward) => ITEM_DEFINITIONS[reward.itemId]?.name ?? reward.itemId);
    }

    return inventory.slice(0, 4).map((item) => ITEM_DEFINITIONS[item.id]?.name ?? item.id);
  }, [inventory, progress.recentRewards]);

  const recentFragments = useMemo(() => progress.archive.adminFragments.slice(-3).reverse(), [progress.archive.adminFragments]);

  const shopItems = useMemo<MarketItem[]>(
    () =>
      lobby.shopStockIds.map((itemId) => ({
        name: ITEM_DEFINITIONS[itemId]?.name ?? itemId,
        desc: ITEM_DEFINITIONS[itemId]?.description ?? "暂无说明。",
        priceLabel: `${SHOP_PRICES[itemId] ?? 0} 怪谈币`,
        disabled: progress.supplyMarks < (SHOP_PRICES[itemId] ?? 0),
        onSelect: () => purchaseItem(itemId),
      })),
    [lobby.shopStockIds, progress.supplyMarks, purchaseItem],
  );

  const blackMarketItems = useMemo<MarketItem[]>(
    () =>
      lobby.blackMarketInventory.map((itemId) => ({
        name: ITEM_DEFINITIONS[itemId]?.name ?? itemId,
        desc: ITEM_DEFINITIONS[itemId]?.description ?? "暂无说明。",
        priceLabel: `${Math.max(3, (ITEM_DEFINITIONS[itemId]?.rarity === "rare" ? 5 : 3))} 怪谈值`,
      })),
    [lobby.blackMarketInventory],
  );

  return (
    <>
      <div className="min-h-screen bg-[#07090d] text-white">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#170107] via-[#090b10] to-[#05070a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(172,0,24,0.28),transparent_26%)]" />
          <div className="absolute inset-y-0 left-1/2 w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(255,44,44,0.08),transparent_40%)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] backdrop-blur-md"
          >
            <PosterBackground />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06080a]/90 via-[#06080a]/70 to-[#06080a]/55" />

            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-white/45">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Ruletale Hall</span>
                  <span>2026 Revision</span>
                </div>

                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-[58px]">
                  规则之外，
                  <span className="block text-white/90">才是大厅真正的入口。</span>
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 sm:text-[17px]">
                  这里不是菜单，而是一处会持续记录你判断方式的外层空间。你带回来的理解、污染、物品与错误，都会在这里留下痕迹。真正危险的从来不是没有规则，而是你开始分不清哪些规则在保护你，哪些规则想把你引向更深处。
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById("task-wall")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="rounded-2xl border border-rose-300/25 bg-gradient-to-r from-rose-500/18 to-red-500/8 px-5 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(120,12,24,0.22)] transition hover:border-rose-300/40 hover:bg-rose-500/15"
                  >
                    继续进入大厅
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettlement(true)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/78 transition hover:bg-white/8"
                  >
                    查看上次结算
                  </button>
                </div>
              </div>

              <div className="grid content-end gap-4 lg:pl-8">
                <div className="rounded-[24px] border border-white/10 bg-black/25 p-5 backdrop-blur-sm">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-white/40">Hall Mood</div>
                  <div className="mt-3 text-lg font-semibold text-white">深红压迫感作为背景，而不是单独插画卡片</div>
                  <p className="mt-2 text-sm leading-7 text-white/60">
                    背景改为整块 Hero 氛围底图，文字与状态悬浮在其上，让画面更像真正的首页背景，而不是右侧单独摆了一张图。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <StatusCard label="理解度" value={String(player.understanding)} hint="窥界者 · 更容易发现规则冲突" accent="from-rose-500/28 via-red-400/10 to-transparent" />
                  <StatusCard label="污染值" value={String(player.contamination).padStart(2, "0")} hint="处于可控范围，但镜面异常更容易靠近" accent="from-orange-500/16 via-red-500/10 to-transparent" />
                  <StatusCard label="行为标签" value={primaryBehavior} hint="偏向观察、求证与延迟回应" accent="from-white/8 via-white/4 to-transparent" />
                  <StatusCard label="怪谈币" value={String(progress.supplyMarks)} hint="用于普通商店购买常规道具与补给。" accent="from-amber-400/18 via-transparent to-transparent" />
                  <StatusCard label="怪谈值" value={blackTalkValue} hint="用于黑市交易高风险、高收益物品。" accent="from-fuchsia-500/18 via-transparent to-transparent" />
                  <StatusCard label="最近奖励" value={latestRewardName} hint={latestReward ? "识别镜像异常，但会轻度提升污染" : "完成正式副本后，这里会记录最近带回大厅的奖励。"} accent="from-rose-400/18 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, delay: 0.06 }}>
              <div id="task-wall">
                <SectionTitle
                  icon={MoonStar}
                  eyebrow="Task Wall"
                  title="可进入副本"
                  description="大厅不会替你判断哪条路更安全，它只会把已经浮出水面的入口整齐地推到你面前。"
                />
              </div>

              <div className="grid gap-4">
                {playableDungeons.map((dungeon) => (
                  <div key={dungeon.id} className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm transition hover:bg-white/[0.07]">
                    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                      <DungeonCardArt locked={dungeon.locked} />

                      <div className="flex min-h-full flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/45">
                              {dungeon.statusLabel || "可进入副本"}
                            </span>
                            <span className="rounded-full border border-rose-300/15 bg-rose-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-rose-100/75">
                              {dungeon.riskLabel}
                            </span>
                          </div>

                          <h2 className="mt-4 text-2xl font-semibold text-white">{dungeon.title}</h2>
                          <p className="mt-2 text-sm leading-7 text-white/58">{dungeon.subtitle}</p>
                          <p className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-white/70">
                            推荐风格：{dungeon.recommendedStyle}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="text-sm text-white/42">{dungeon.recommendationNote || "当前建议：先观察，再回应，最后决定是否接近。"}</div>
                          <button
                            type="button"
                            disabled={dungeon.locked}
                            onClick={() => {
                              if (dungeon.locked) return;
                              enterDungeon(dungeon.id);
                              router.push(`/mvp/dungeon/${dungeon.id}`);
                            }}
                            className={
                              dungeon.locked
                                ? "inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/35"
                                : "inline-flex items-center gap-2 rounded-2xl border border-rose-300/20 bg-gradient-to-r from-rose-500/16 to-red-500/8 px-4 py-3 text-sm font-medium text-white transition hover:border-rose-300/35 hover:bg-rose-500/15"
                            }
                          >
                            {dungeon.locked ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {dungeon.locked ? "尚未开放" : "进入副本"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.1 }}
              className="space-y-4"
            >
              {blackZoneCard ? (
                <div className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm transition hover:bg-white/[0.07]">
                  <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                    <DungeonCardArt locked />
                    <div className="flex min-h-full flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/45">
                            {blackZoneCard.statusLabel || "尚未开放"}
                          </span>
                          <span className="rounded-full border border-rose-300/15 bg-rose-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-rose-100/75">
                            {blackZoneCard.riskLabel}
                          </span>
                        </div>

                        <h2 className="mt-4 text-2xl font-semibold text-white">{blackZoneCard.title}</h2>
                        <p className="mt-2 text-sm leading-7 text-white/58">需要更高理解度与关键物品后才可进入</p>
                        <p className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-7 text-white/70">
                          推荐风格：{blackZoneCard.recommendedStyle}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="text-sm text-white/42">{blackZoneCard.lockReason}</div>
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/35"
                        >
                          <Lock className="h-4 w-4" />
                          尚未开放
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <SectionTitle
                icon={Eye}
                eyebrow="Status Rail"
                title="当前状态"
                description="这些数值不是摆设，它们会一起决定你接下来更容易看见真相，还是更容易被规则利用。"
              />

              <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["HP", String(player.visibleStats.HP)],
                    ["SAN", String(player.visibleStats.SAN)],
                    ["STA", String(player.visibleStats.STA)],
                    ["COG", String(player.visibleStats.COG)],
                    ["COR", String(player.visibleStats.COR)],
                    ["RES", String(player.visibleStats.RES)],
                    ["SUSP", String(player.psych.SUSP)],
                    ["WILL", String(player.psych.WILL)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">{k}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <AccessCard eyebrow="Inventory" title="背包入口" description="消耗品、规则辅助物、剧情碎片与高风险污染物都在这里管理。" icon={Backpack} onClick={() => setDrawer("inventory")} />
                <AccessCard eyebrow="Archive" title="档案室" description="查看已发现规则、怪物记录、结局摘要与管理员碎片。" icon={Archive} onClick={() => setDrawer("archives")} />

                <ShopCard
                  eyebrow="Shop"
                  title="普通商店"
                  description="使用怪谈币购买常规补给、探索工具与低风险规则辅助物。"
                  icon={ShoppingBag}
                  items={shopItems}
                />

                <ShopCard
                  eyebrow="Black Market"
                  title="黑市"
                  description="使用怪谈值进行交易。这里的东西更强，也更容易把你推向异常深处。"
                  icon={Flame}
                  items={blackMarketItems}
                />

                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm transition hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Long-term Gate</div>
                      <div className="mt-2 text-lg font-semibold text-white">黑区入口</div>
                      <p className="mt-2 text-sm leading-6 text-white/58">需要更高理解度、关键物品与错误通关记录后才可开启。</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white/55">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettlement(true)}
                  className="rounded-[24px] border border-white/10 bg-gradient-to-br from-rose-500/10 via-white/[0.04] to-white/[0.03] p-5 text-left backdrop-blur-sm transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.26em] text-white/40">Recent Result</div>
                      <div className="mt-2 text-lg font-semibold text-white">最近结算摘要</div>
                      <p className="mt-2 text-sm leading-6 text-white/58">{progress.lastSettlement ? progress.lastSettlement.summary : "你还没有带回任何一局正式结算。"}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-rose-200">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                </button>
              </div>
            </motion.aside>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="mt-8"
          >
            <SectionTitle
              icon={BookMarked}
              eyebrow="Recent Traces"
              title="大厅里已经留下的痕迹"
              description="真正的大厅不会替你总结正确答案，它只保存你曾经看见过什么、带回过什么，以及你开始相信了什么。"
            />

            <div className="grid gap-4 xl:grid-cols-3">
              <MiniList title="最近发现规则" data={recentRules} empty="你还没有掌握足够稳定的规则线索。" />
              <MiniList title="最近获得物品" data={recentItems} empty="完成一轮正式探索后，这里会出现最新带回大厅的物品。" />
              <MiniList title="管理员碎片记录" data={recentFragments} empty="管理员相关碎片还没有足够完整地浮出水面。" />
            </div>
          </motion.section>
        </div>
      </div>

      <InventoryDrawer open={drawer === "inventory"} title="大厅背包" items={inventory} scope="lobby" onClose={() => setDrawer(null)} />

      <OverlayPanel
        open={drawer === "archives"}
        title="大厅档案室"
        eyebrow="Archive"
        description="这里保存你已经带回大厅的规则、事件、结局与管理员碎片。它记录的是你真正看见过什么。"
        onClose={() => setDrawer(null)}
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
            <ArchivePanel rules={progress.archive.rules} understanding={player.understanding} />
          </div>
          <div className="space-y-4">
            <MiniList title="已见事件" data={progress.archive.events.slice(-6).reverse()} empty="还没有足够稳定的事件记录。" />
            <MiniList title="已达成结局" data={progress.archive.endings.slice(-6).reverse()} empty="正式通关之后，这里会保留结局摘要。" />
            <MiniList title="管理员碎片" data={progress.archive.adminFragments.slice(-6).reverse()} empty="高理解结局和特定节点才会留下管理员相关记录。" />
          </div>
        </div>
      </OverlayPanel>

      <OverlayPanel
        open={showSettlement}
        title="最近结算"
        eyebrow="Settlement"
        description="这不是简单的通关页，而是大厅判断你这次到底带回了什么的方式。"
        onClose={() => setShowSettlement(false)}
      >
        {progress.lastSettlement ? (
          <ResultPanel result={progress.lastSettlement} onReturn={() => setShowSettlement(false)} />
        ) : (
          <EmptyState title="还没有最近结算" description="完成一轮正式副本后，这里会展示完整结算、奖励和黑区推进情况。" />
        )}
      </OverlayPanel>
    </>
  );
}
