import { useEffect, useEffectEvent, useRef, useState } from 'react'
import './App.css'
import { CompareArea } from './components/CompareArea'
import { Header } from './components/Header'
import { ImportModal } from './components/ImportModal'
import { Sidebar } from './components/Sidebar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { parseText } from './lib/parse'
import { readStorage, removeStorage, writeStorage } from './lib/storage'
import type { CompareEntry, PreviewMode } from './types'

function App() {
  const [entries, setEntries] = useState<CompareEntry[]>(() =>
    readStorage<CompareEntry[]>('split-check-data', []),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<PreviewMode>(() => {
    const storedMode = readStorage<PreviewMode | null>('split-check-preview-mode', null)
    return storedMode === 'desktop' ? 'desktop' : 'mobile'
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [draftText, setDraftText] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeIndex = entries.length === 0 ? 0 : Math.min(currentIndex, entries.length - 1)
  const currentEntry = entries[activeIndex] ?? null

  useEffect(() => {
    writeStorage('split-check-data', entries)
  }, [entries])

  useEffect(() => {
    writeStorage('split-check-preview-mode', previewMode)
  }, [previewMode])

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target
    if (target instanceof HTMLElement) {
      const tagName = target.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
    }

    if (event.key === 'ArrowLeft') {
      goToOffset(-1)
      event.preventDefault()
    }

    if (event.key === 'ArrowRight') {
      goToOffset(1)
      event.preventDefault()
    }

    if (event.key === 'l' || event.key === 'L') {
      setIsSidebarOpen((value) => !value)
      event.preventDefault()
    }
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleKeyDown(event)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function openImportModal() {
    setDraftText('')
    setIsImportOpen(true)
    setIsSidebarOpen(false)
  }

  function closeImportModal() {
    setIsImportOpen(false)
  }

  function commitEntries(nextEntries: CompareEntry[]) {
    setEntries(nextEntries)
    setCurrentIndex(0)
    setIsImportOpen(false)
    setIsSidebarOpen(false)
  }

  function submitImport() {
    const parsedEntries = parseText(draftText.trim())
    if (parsedEntries.length === 0) {
      window.alert('未解析到有效数据，请检查格式')
      return
    }

    commitEntries(parsedEntries)
  }

  function triggerFileImport() {
    fileInputRef.current?.click()
  }

  function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      const text = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : ''
      const parsedEntries = parseText(text)
      if (parsedEntries.length === 0) {
        window.alert('未解析到有效数据，请检查文件格式')
        return
      }

      commitEntries(parsedEntries)
    }
    reader.readAsText(file, 'utf-8')
    event.target.value = ''
  }

  function clearEntries() {
    if (!window.confirm('确定要清空当前数据吗？')) {
      return
    }

    setEntries([])
    setCurrentIndex(0)
    setIsSidebarOpen(false)
    removeStorage('split-check-data')
  }

  function goToOffset(offset: number) {
    setCurrentIndex((value) => {
      const baseIndex = entries.length === 0 ? 0 : Math.min(value, entries.length - 1)
      const nextIndex = baseIndex + offset
      if (nextIndex < 0 || nextIndex >= entries.length) {
        return baseIndex
      }
      return nextIndex
    })
  }

  function jumpTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(index, entries.length - 1)))
    setIsSidebarOpen(false)
  }

  return (
    <div className={`app-shell preview-${previewMode}`}>
      <Header
        currentIndex={activeIndex}
        hasData={entries.length > 0}
        previewMode={previewMode}
        total={entries.length}
        onNext={() => goToOffset(1)}
        onPrevious={() => goToOffset(-1)}
        onTogglePreview={setPreviewMode}
        onToggleSidebar={() => setIsSidebarOpen((value) => !value)}
      />

      <main className="app-main">
        {currentEntry ? (
          <>
            {currentEntry.note && (
              <div className="global-note-banner">
                <span className="note-badge">备注</span>
                <span className="note-text">{currentEntry.note}</span>
              </div>
            )}
            <CompareArea entry={currentEntry} previewMode={previewMode} />
          </>
        ) : (
          <WelcomeScreen onFileImport={triggerFileImport} onPasteImport={openImportModal} />
        )}
      </main>

      <Sidebar
        currentIndex={activeIndex}
        entries={entries}
        isOpen={isSidebarOpen}
        onClear={clearEntries}
        onClose={() => setIsSidebarOpen(false)}
        onFileImport={triggerFileImport}
        onJumpTo={jumpTo}
        onPasteImport={openImportModal}
      />

      <ImportModal
        open={isImportOpen}
        value={draftText}
        onChange={setDraftText}
        onClose={closeImportModal}
        onSubmit={submitImport}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.csv"
        className="hidden-input"
        onChange={handleFileImport}
      />
    </div>
  )
}

export default App
