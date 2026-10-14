import type { Editor } from '@open-pencil/core/editor'
import type { Rect, Vector } from '@open-pencil/scene-graph/primitives'

import { findEnclosingDrawParent } from '#vue/shared/input/drop-target'
import type { DragState } from '#vue/shared/input/types'

function boundsOf(points: readonly Vector[]): Rect {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

export function startPencilInput(
  cx: number,
  cy: number,
  editor: Editor,
  setDrag: (drag: DragState) => void
) {
  editor.pencilBegin(cx, cy)
  setDrag({ type: 'pencil-drag' })
}

/** Holding Shift draws on straight from where it was pressed, horizontally or vertically. */
export function handlePencilDragMove(cx: number, cy: number, shiftKey: boolean, editor: Editor) {
  editor.pencilAddPoint(cx, cy, shiftKey)
}

/** Adds the stroke to the frame that holds all of it, or to the page. */
export function finishPencilDrag(editor: Editor) {
  const points = editor.state.pencilState?.points
  if (!points || points.length === 0) {
    editor.pencilCancel()
    return
  }
  editor.pencilCommit(findEnclosingDrawParent(points[0], boundsOf(points), 'VECTOR', editor))
}
