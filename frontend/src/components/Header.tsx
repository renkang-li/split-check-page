import { ChevronLeft, ChevronRight, Layers, List, Monitor, Smartphone } from 'lucide-react'
import type { PreviewMode } from '../types'

interface HeaderProps {
  currentIndex: number
  hasData: boolean
  previewMode: PreviewMode
  total: number
  onNext: () => void
  onPrevious: () => void
  onTogglePreview: (mode: PreviewMode) => void
  onToggleSidebar: () => void
}

export function Header({
  currentIndex,
  hasData,
  previewMode,
  total,
  onNext,
  onPrevious,
  onTogglePreview,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="brand">
          <Layers size={22} className="brand-icon" />
          <div className="brand-text">Split Check</div>
        </div>

        <div className="preview-switch" role="tablist" aria-label="预览模式切换">
          <button
            type="button"
            className={`preview-btn${previewMode === 'mobile' ? ' active' : ''}`}
            aria-pressed={previewMode === 'mobile'}
            onClick={() => onTogglePreview('mobile')}
            title="移动端预览"
          >
            <Smartphone size={15} />
            <span>移动端</span>
          </button>
          <button
            type="button"
            className={`preview-btn${previewMode === 'desktop' ? ' active' : ''}`}
            aria-pressed={previewMode === 'desktop'}
            onClick={() => onTogglePreview('desktop')}
            title="PC端预览"
          >
            <Monitor size={15} />
            <span>PC端</span>
          </button>
        </div>
      </div>

      <div className="header-center">
        {hasData ? (
          <div className="nav-group">
            <button
              type="button"
              className="btn"
              onClick={onPrevious}
              disabled={currentIndex <= 0}
              title="上一组"
            >
              <ChevronLeft size={16} />
              <span>上一组</span>
            </button>
            <div className="counter">
              <span className="counter-current">{currentIndex + 1}</span>
              <span className="counter-divider">/</span>
              <span>{total}</span>
            </div>
            <button
              type="button"
              className="btn"
              onClick={onNext}
              disabled={currentIndex >= total - 1}
              title="下一组"
            >
              <span>下一组</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="nav-group nav-group-empty">导入后即可开始逐条验收</div>
        )}
      </div>

      <div className="header-right">
        {hasData && (
          <div className="kbd-hints" aria-hidden={true}>
            <span><kbd>{'<'}</kbd> <kbd>{'>'}</kbd> 切换</span>
            <span><kbd>L</kbd> 列表</span>
          </div>
        )}

        <button type="button" className="btn btn-ghost" onClick={onToggleSidebar} title="打开链接清单">
          <List size={16} />
          <span>清单</span>
        </button>
      </div>
    </header>
  )
}
