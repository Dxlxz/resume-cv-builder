/**
 * Which pages hold a canvas: those on screen first, then those in the margin around the screen nearest to it, never
 * more than `max`. Choosing by page number instead would leave a visible page blank on a long document.
 */
export function pickLivePages(onScreen: Iterable<number>, near: Iterable<number>, max: number): number[] {
  const screen = [...onScreen].sort((a, b) => a - b)
  const anchors = screen.length > 0 ? screen : [1]
  const distance = (page: number) => Math.min(...anchors.map((a) => Math.abs(a - page)))
  const rest = [...near].filter((p) => !screen.includes(p)).sort((a, b) => distance(a) - distance(b) || a - b)
  return [...screen, ...rest].slice(0, max)
}
