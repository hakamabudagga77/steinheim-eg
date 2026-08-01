import type { RoomGroup, RoomProductNeed, TradeProject } from "@/lib/trade-project";
import { getProductBySlug } from "@/lib/utils";

/**
 * The Trade Studio collects two separate numbers and they must be multiplied:
 * `group.count` is how many rooms of this type the development has, and
 * `need.quantity` is how many units ONE of those rooms needs.
 *
 * Every coverage read-out used to compare the basket against `need.quantity`
 * alone, so a 40-room hotel was told it needed a single basin mixer and one
 * unit marked the room complete. These helpers are the one place that maths
 * lives now.
 */
export function requiredUnitsFor(group: Pick<RoomGroup, "count">, need: Pick<RoomProductNeed, "quantity">): number {
  if (group.count <= 0 || need.quantity <= 0) return 0;
  return group.count * need.quantity;
}

/** Total units a single room group requires across all of its product needs. */
export function requiredUnitsForGroup(group: RoomGroup): number {
  return group.productNeeds.reduce((sum, need) => sum + requiredUnitsFor(group, need), 0);
}

/** Units already on the board for one room scope and one product type. */
export function selectedUnitsFor(project: TradeProject, scopeId: string, type: string): number {
  return project.items
    .filter((item) => item.scopeId === scopeId && getProductBySlug(item.slug)?.type === type)
    .reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Project-wide coverage. `selected` is clamped per need so over-ordering one
 * line cannot mask a line that is still missing.
 */
export function projectCoverage(project: TradeProject): {
  needed: number;
  selected: number;
  remaining: number;
  percent: number;
} {
  let needed = 0;
  let selected = 0;

  for (const group of project.roomPlan?.groups ?? []) {
    if (group.count <= 0) continue;
    for (const need of group.productNeeds) {
      const required = requiredUnitsFor(group, need);
      if (required <= 0) continue;
      needed += required;
      selected += Math.min(selectedUnitsFor(project, group.scopeId, need.type), required);
    }
  }

  return {
    needed,
    selected,
    remaining: Math.max(0, needed - selected),
    percent: needed > 0 ? Math.round((selected / needed) * 100) : 0,
  };
}
