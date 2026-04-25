import { ExternalLink, Lock } from 'lucide-react'
import type { CompareEntry, PreviewMode } from '../types'

interface CompareAreaProps {
  entry: CompareEntry
  previewMode: PreviewMode
}

function buildProxyUrl(value: string) {
  return `/proxy?url=${encodeURIComponent(value)}`
}

export function CompareArea({ entry, previewMode }: CompareAreaProps) {
  const sourceUrl = entry.src.startsWith('http') ? buildProxyUrl(entry.src) : 'about:blank'
  const targetUrl = entry.dst.startsWith('http') ? entry.dst : 'about:blank'
  const isDesktop = previewMode === 'desktop'

  return (
    <section className={`compare-area${isDesktop ? ' compare-area-desktop' : ''}`}>
      <PreviewPane
        label="源站"
        tone="src"
        frameTitle={isDesktop ? '源站桌面预览' : '源站移动预览'}
        iframeUrl={sourceUrl}
        displayUrl={entry.src}
        isDesktop={isDesktop}
      />
      <PreviewPane
        label="复刻"
        tone="dst"
        frameTitle={isDesktop ? '复刻桌面预览' : '复刻移动预览'}
        iframeUrl={targetUrl}
        displayUrl={entry.dst || ''}
        isDesktop={isDesktop}
      />
    </section>
  )
}

interface PreviewPaneProps {
  frameTitle: string
  iframeUrl: string
  displayUrl: string
  isDesktop: boolean
  label: string
  tone: 'src' | 'dst'
}

function PreviewPane({ frameTitle, iframeUrl, displayUrl, isDesktop, label, tone }: PreviewPaneProps) {
  return (
    <article className="preview-pane">
      <div className={`preview-shell${isDesktop ? ' preview-shell-desktop' : ''}`}>
        <div className="desktop-shell-topbar">
          {displayUrl && isDesktop ? (
            <div className="mac-buttons">
              <span />
              <span />
              <span />
            </div>
          ) : <div className="mac-spacer" />}
          {displayUrl && (
            <div className="browser-address-bar">
              <span className={`inline-badge inline-badge-${tone}`}>{label}</span>
              <Lock size={12} className="address-icon" />
              <a href={displayUrl} target="_blank" rel="noreferrer" className="address-text">
                {displayUrl}
              </a>
              <a href={displayUrl} target="_blank" rel="noreferrer" className="address-external" title="在新标签页打开">
                <ExternalLink size={12} />
              </a>
            </div>
          )}
          <div className="mac-spacer" />
        </div>
        <iframe title={frameTitle} src={iframeUrl} />
      </div>
    </article>
  )
}

