import { X } from 'lucide-react'

interface ImportModalProps {
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  open: boolean
  value: string
}

export function ImportModal({ onChange, onClose, onSubmit, open, value }: ImportModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-layer" role="presentation">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="关闭导入弹窗" />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        <div className="modal-header">
          <div>
            <p className="sidebar-kicker">批量导入</p>
            <h2 id="import-modal-title">粘贴对比链接</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭导入弹窗">
            <X size={16} />
          </button>
        </div>

        <label className="modal-label" htmlFor="import-textarea">
          每行一组，支持 `|` 或 `-` 分隔
        </label>
        <textarea
          id="import-textarea"
          className="modal-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
          placeholder={`[10:30] https://example.com/page-a | https://clone.com/page-a
https://example.com/page-b | https://clone.com/page-b 备注`}
        />

        <p className="modal-hint">
          导入后数据会保存在浏览器本地，刷新页面不会丢。源站仍然会走服务端代理，保持和旧工具一致。
        </p>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit}>
            导入
          </button>
        </div>
      </div>
    </div>
  )
}
