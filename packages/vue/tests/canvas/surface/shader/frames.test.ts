import { describe, expect, test } from 'bun:test'

import type { Editor } from '@open-pencil/core/editor'

import { shaderFrames } from '#vue/canvas/surface/shader/frames'

describe('shader frames', () => {
  test('a shader is listened to while an island shows it', () => {
    const frames = shaderFrames({} as Editor)
    const draw = (source: CanvasImageSource) => void source
    expect(frames.listened('a')).toBe(false)

    const first = frames.listen('a', draw)
    const second = frames.listen('a', (source) => draw(source))
    expect(frames.listened('a')).toBe(true)
    expect(frames.listened('b')).toBe(false)

    first()
    expect(frames.listened('a')).toBe(true)
    second()
    expect(frames.listened('a')).toBe(false)
  })

  test('each listener of a shader gets the frame published for it', () => {
    const frames = shaderFrames({} as Editor)
    const seen: string[] = []
    frames.listen('a', () => seen.push('a'))
    frames.listen('b', () => seen.push('b'))

    frames.publish('a', {} as CanvasImageSource)
    expect(seen).toEqual(['a'])
  })
})
