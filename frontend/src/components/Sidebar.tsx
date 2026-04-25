import { ClipboardPaste, FolderUp, PanelLeftClose, Trash2 } from 'lucide-react'
import type { CompareEntry } from '../types'

interface SidebarProps {
  currentIndex: number
  entries: CompareEntry[]
  isOpen: boolean
  onClear: () => void
  onClose: () => void
  onFileImport: () => void
  onJumpTo: (index: number) => void
  onPasteImport: () => void
}

export function Sidebar({
  currentIndex,
  entries,
  isOpen,
  onClear,
  onClose,
  onFileImport,
  onJumpTo,
  onPasteImport,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        className={`overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-label="关闭侧边栏"
      />
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <p className="sidebar-kicker">链接清单</p>
            <h2>批量验收面板</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭侧边栏">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="btn btn-primary" onClick={onPasteImport}>
            <ClipboardPaste size={16} />
            <span>粘贴导入</span>
          </button>
          <button type="button" className="btn" onClick={onFileImport}>
            <FolderUp size={16} />
            <span>文件导入</span>
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onClear}
            disabled={entries.length === 0}
          >
            <Trash2 size={16} />
            <span>清空</span>
          </button>
        </div>

        <div className="sidebar-hint">左边必须是源站，右边必须是复刻站。</div>

        {entries.length === 0 ? (
          <div className="sidebar-empty">
            <p>还没有可比对的数据。</p>
            <span>先导入一批链接，我们再开始逐页检查。</span>
          </div>
        ) : (
          <div className="sidebar-list">
            {entries.map((entry, index) => (
              <button
                key={`${entry.src}-${entry.dst}-${index}`}
                type="button"
                className={`sidebar-item${index === currentIndex ? ' active' : ''}`}
                onClick={() => onJumpTo(index)}
              >
                <div className="sidebar-item-top">
                  <span className="sidebar-item-index">#{index + 1}</span>
                  {entry.time ? <span className="sidebar-item-time">{entry.time}</span> : null}
                </div>
                <p className="sidebar-item-url">{entry.src}</p>
                <p className="sidebar-item-arrow">→</p>
                <p className="sidebar-item-url">{entry.dst || '未提供复刻链接'}</p>
                {entry.note ? <p className="sidebar-item-note">{entry.note}</p> : null}
              </button>
            ))}
          </div>
        )}
      </aside>
    </>
  )
}
