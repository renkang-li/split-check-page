import { ChevronLeft, ChevronRight, Monitor, PanelLeft, Smartphone } from 'lucide-react'
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
      <div className="brand">
        <div className="brand-mark">SC</div>
        <div>
          <p className="brand-title">Split Check</p>
          <p className="brand-subtitle">页面对比工作台</p>
        </div>
      </div>

      {hasData ? (
        <div className="nav-group">
          <button
            type="button"
            className="btn"
            onClick={onPrevious}
            disabled={currentIndex <= 0}
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
          >
            <span>下一组</span>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="nav-group nav-group-empty">导入后即可开始逐条验收</div>
      )}

      <div className="preview-switch" role="tablist" aria-label="预览模式切换">
        <button
          type="button"
          className={`preview-btn${previewMode === 'mobile' ? ' active' : ''}`}
          aria-pressed={previewMode === 'mobile'}
          onClick={() => onTogglePreview('mobile')}
        >
          <Smartphone size={15} />
          <span>移动端</span>
        </button>
        <button
          type="button"
          className={`preview-btn${previewMode === 'desktop' ? ' active' : ''}`}
          aria-pressed={previewMode === 'desktop'}
          onClick={() => onTogglePreview('desktop')}
        >
          <Monitor size={15} />
          <span>PC 端</span>
        </button>
      </div>

      <div className="header-spacer" />

      <div className="kbd-hints" aria-hidden={!hasData}>
        <span>
          <kbd>{'<'}</kbd>
          <kbd>{'>'}</kbd>
          切换
        </span>
        <span>
          <kbd>L</kbd>
          列表
        </span>
      </div>

      <button type="button" className="btn btn-ghost" onClick={onToggleSidebar}>
        <PanelLeft size={16} />
        <span>菜单</span>
      </button>
    </header>
  )
}
