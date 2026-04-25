import type { CompareEntry } from '../types'

export function parseLine(line: string): CompareEntry | null {
  const trimmed = line.trim()
  if (!trimmed) {
    return null
  }

  let content = trimmed
  let time = ''

  const timeMatch = content.match(/^\[(.+?)\]\s*/)
  if (timeMatch) {
    time = timeMatch[1]
    content = content.slice(timeMatch[0].length)
  }

  let parts: string[] | null = null

  if (content.includes(' | ')) {
    parts = content.split(' | ')
  } else if (/\|https?:\/\//.test(content)) {
    const splitIndex = content.indexOf('|http')
    if (splitIndex > -1) {
      parts = [content.slice(0, splitIndex), content.slice(splitIndex + 1)]
    }
  } else if (/https?:\/\/\S+\s+-\s+https?:\/\//.test(content)) {
    const match = content.match(/^(https?:\/\/\S+)\s+-\s+(.*)/)
    if (match) {
      parts = [match[1], match[2]]
    }
  }

  if (!parts || parts.length < 2) {
    return null
  }

  const src = parts[0].trim()
  const dstRaw = parts.slice(1).join(' | ').trim()
  let dst = dstRaw
  let note = ''

  const match = dstRaw.match(/^(https?:\/\/\S+)\s*([\u4e00-\u9fff].+)?$/)
  if (match) {
    dst = match[1]
    note = match[2] ?? ''
  } else if (!dstRaw.startsWith('http')) {
    dst = ''
  }

  if (!src.startsWith('http')) {
    return null
  }

  return { time, src, dst, note }
}

export function parseText(text: string): CompareEntry[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map(parseLine)
    .filter((entry): entry is CompareEntry => entry !== null)
}
