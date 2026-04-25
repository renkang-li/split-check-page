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
        isDesktop={isDesktop}
      />
      <PreviewPane
        label="复刻"
        tone="dst"
        frameTitle={isDesktop ? '复刻桌面预览' : '复刻移动预览'}
        iframeUrl={targetUrl}
        isDesktop={isDesktop}
      />
    </section>
  )
}

interface PreviewPaneProps {
  frameTitle: string
  iframeUrl: string
  isDesktop: boolean
  label: string
  tone: 'src' | 'dst'
}

function PreviewPane({ frameTitle, iframeUrl, isDesktop, label, tone }: PreviewPaneProps) {
  return (
    <article className="preview-pane">
      <div className={`preview-pane-title preview-pane-title-${tone}`}>{label}</div>
      <div className={`preview-shell${isDesktop ? ' preview-shell-desktop' : ''}`}>
        {isDesktop ? (
          <div className="desktop-shell-topbar">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            <div className="phone-notch" />
            <div className="phone-home">
              <div className="phone-home-bar" />
            </div>
          </>
        )}
        <iframe title={frameTitle} src={iframeUrl} />
      </div>
    </article>
  )
}
