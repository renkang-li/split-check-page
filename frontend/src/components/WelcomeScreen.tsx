import { ClipboardPaste, Upload } from 'lucide-react'

interface WelcomeScreenProps {
  onFileImport: () => void
  onPasteImport: () => void
}

export function WelcomeScreen({ onFileImport, onPasteImport }: WelcomeScreenProps) {
  return (
    <section className="welcome">
      <div className="welcome-panel">
        <p className="welcome-kicker">Split Check Workspace</p>
        <h1>把源站和复刻站放在同一张工作台里。</h1>
        <p className="welcome-copy">
          适合做页面复刻验收、视觉回归比对和链接批量走查。先导入一份链接清单，
          然后按组逐条切换查看移动端或桌面端效果。
        </p>
        <div className="welcome-actions">
          <button type="button" className="btn btn-primary" onClick={onPasteImport}>
            <ClipboardPaste size={16} />
            <span>粘贴导入</span>
          </button>
          <button type="button" className="btn" onClick={onFileImport}>
            <Upload size={16} />
            <span>文件导入</span>
          </button>
        </div>
        <p className="welcome-format">
          支持格式：`[时间] 源站URL | 复刻URL`
          <span style={{ opacity: 0.5, fontSize: '12px', marginLeft: '6px', fontWeight: 'normal' }}>（*时间为选填项）</span>
        </p>
      </div>
    </section>
  )
}
