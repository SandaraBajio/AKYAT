import type { Activity } from "../types";

const WEEK = 7 * 24 * 60 * 60 * 1000;
export const WEEKLY_GOAL_KM = 20; // TODO: let the hiker change this in settings

export interface MyStats {
  hikes: number;
  totalKm: number;
  totalElevationM: number;
  weeklyKm: number;
  weeklyHikes: number;
  /** Total moving time in seconds */
  totalSec: number;
  level: number;
  /** 0-1 progress to the next level */
  levelProgress: number;
  xp: number;
}

/** XP: 10 per km + 1 per 10 m climbed. Level n needs 100 * n * (n + 1) / 2 XP in total (100, 300, 600, ...). */
export function levelFor(xp: number): { level: number; progress: number } {
  let level = 1;
  let floor = 0;
  let next = 100;
  while (xp >= next) {
    level++;
    floor = next;
    next += 100 * level;
  }
  return { level, progress: (xp - floor) / (next - floor) };
}

export function computeStats(activities: Activity[], now = Date.now()): MyStats {
  const totalKm = activities.reduce((s, a) => s + a.distanceKm, 0);
  const totalElevationM = activities.reduce((s, a) => s + a.elevationGainM, 0);
  const week = activities.filter((a) => a.startedAt >= now - WEEK && a.startedAt <= now);
  const xp = Math.round(totalKm * 10 + totalElevationM / 10);
  const { level, progress } = levelFor(xp);
  return {
    hikes: activities.length,
    totalKm: Math.round(totalKm * 10) / 10,
    totalElevationM: Math.round(totalElevationM),
    weeklyKm: Math.round(week.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10,
    weeklyHikes: week.length,
    totalSec: activities.reduce((s, a) => s + a.durationSec, 0),
    level,
    levelProgress: progress,
    xp,
  };
}

export interface Badge {
  id: string;
  icon: "footsteps" | "flag" | "trending-up" | "flame" | "sunny" | "trophy";
  title: string;
  hint: string;
  earned: boolean;
}

export function computeBadges(activities: Activity[], stats: MyStats): Badge[] {
  const longest = Math.max(0, ...activities.map((a) => a.distanceKm));
  const biggestClimb = Math.max(0, ...activities.map((a) => a.elevationGainM));
  return [
    { id: "first", icon: "footsteps", title: "First steps", hint: "Record your first hike", earned: stats.hikes >= 1 },
    { id: "five", icon: "flag", title: "Trail regular", hint: "Complete 5 hikes", earned: stats.hikes >= 5 },
    { id: "km50", icon: "trophy", title: "50 km club", hint: "Hike 50 km in total", earned: stats.totalKm >= 50 },
    { id: "climb", icon: "trending-up", title: "Summit seeker", hint: "Climb 500 m in one hike", earned: biggestClimb >= 500 },
    { id: "long", icon: "sunny", title: "Long haul", hint: "Finish a 10 km hike", earned: longest >= 10 },
    { id: "week", icon: "flame", title: "On a roll", hint: "3 hikes in one week", earned: stats.weeklyHikes >= 3 },
  ];
}
