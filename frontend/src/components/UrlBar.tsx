import { ExternalLink, Link2 } from 'lucide-react'
import type { CompareEntry } from '../types'

interface UrlBarProps {
  entry: CompareEntry
  currentIndex: number
}

export function UrlBar({ entry, currentIndex }: UrlBarProps) {
  return (
    <section className="url-bar" aria-label="当前链接信息">
      <div className="url-item">
        <span className="url-label url-label-src">源站</span>
        <a href={entry.src} target="_blank" rel="noreferrer">
          <Link2 size={14} />
          <span>{entry.src}</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="url-item">
        <span className="url-label url-label-dst">复刻</span>
        {entry.dst ? (
          <a href={entry.dst} target="_blank" rel="noreferrer">
            <Link2 size={14} />
            <span>{entry.dst}</span>
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="url-empty">未提供复刻链接</span>
        )}
      </div>

      <div className="meta-strip">
        <span className="meta-chip">#{currentIndex + 1}</span>
        {entry.time ? <span className="meta-chip">{entry.time}</span> : null}
        {entry.note ? <span className="meta-note">{entry.note}</span> : null}
      </div>
    </section>
  )
}
