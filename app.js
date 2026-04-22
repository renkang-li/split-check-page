let data = [];
let idx = 0;
const STORAGE_KEY = 'split-check-data';
const PREVIEW_MODE_KEY = 'split-check-preview-mode';
let previewMode = 'mobile';

function parseLine(line) {
    line = line.trim();
    if (!line) return null;

    let time = '';
    const tm = line.match(/^\[(.+?)\]\s*/);
    if (tm) {
        time = tm[1];
        line = line.slice(tm[0].length);
    }

    let parts = null;
    if (line.includes(' | ')) {
        // 带空格的 | 分隔：源站URL | 复刻URL
        parts = line.split(' | ');
    } else if (line.match(/\|https?:\/\//)) {
        // 不带空格的 | 分隔：源站URL|复刻URL（| 后紧跟 http 才视为分隔符）
        const splitIdx = line.indexOf('|http');
        parts = [line.slice(0, splitIdx), line.slice(splitIdx + 1)];
    } else if (line.match(/https?:\/\/\S+\s+-\s+https?:\/\//)) {
        // 带空格的 - 分隔：源站URL - 复刻URL
        const match = line.match(/^(https?:\/\/\S+)\s+-\s+(.*)/);
        if (match) {
            parts = [match[1], match[2]];
        }
    }

    if (!parts || parts.length < 2) {
        return null;
    }

    const src = parts[0].trim();
    const dstRaw = parts.slice(1).join(' | ').trim();
    let dst = dstRaw;
    let note = '';

    const match = dstRaw.match(/^(https?:\/\/\S+)\s*([\u4e00-\u9fff].+)?$/);
    if (match) {
        dst = match[1];
        note = match[2] || '';
    } else if (!dstRaw.startsWith('http')) {
        dst = '';
    }

    if (!src.startsWith('http')) {
        return null;
    }

    return { time, src, dst, note };
}

function parseText(text) {
    return text.split(/\r?\n/).filter((line) => line.trim()).map(parseLine).filter(Boolean);
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        // Ignore storage quota and privacy mode failures.
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            data = parsed;
            idx = 0;
            activateUI();
            renderSidebar();
            render();
        }
    } catch (error) {
        // Ignore malformed storage and fall back to empty state.
    }
}

function savePreviewMode() {
    try {
        localStorage.setItem(PREVIEW_MODE_KEY, previewMode);
    } catch (error) {
        // Ignore storage failures and keep the current in-memory mode.
    }
}

function updatePreviewModeButtons() {
    const mobileBtn = document.getElementById('mobileModeBtn');
    const desktopBtn = document.getElementById('desktopModeBtn');
    const isDesktop = previewMode === 'desktop';

    mobileBtn.classList.toggle('active', !isDesktop);
    desktopBtn.classList.toggle('active', isDesktop);
    mobileBtn.setAttribute('aria-pressed', String(!isDesktop));
    desktopBtn.setAttribute('aria-pressed', String(isDesktop));
}

function setPreviewMode(mode) {
    if (mode !== 'mobile' && mode !== 'desktop') {
        return;
    }

    previewMode = mode;
    document.body.classList.toggle('preview-desktop', previewMode === 'desktop');
    updatePreviewModeButtons();
    savePreviewMode();
}

function loadPreviewMode() {
    let nextMode = 'mobile';

    try {
        const stored = localStorage.getItem(PREVIEW_MODE_KEY);
        if (stored === 'mobile' || stored === 'desktop') {
            nextMode = stored;
        }
    } catch (error) {
        // Ignore storage failures and use the default mobile mode.
    }

    setPreviewMode(nextMode);
}

function proxyUrl(url) {
    return '/proxy?url=' + encodeURIComponent(url);
}

function openImportModal() {
    document.getElementById('importModal').classList.add('open');
    document.getElementById('importTextarea').focus();
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('open');
}

function doImport() {
    const text = document.getElementById('importTextarea').value.trim();
    if (!text) {
        return;
    }

    const parsed = parseText(text);
    if (parsed.length === 0) {
        alert('未解析到有效数据，请检查格式');
        return;
    }

    data = parsed;
    idx = 0;
    closeImportModal();
    saveToStorage();
    activateUI();
    renderSidebar();
    render();
}

function triggerFileImport() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (loadEvent) {
        const text = loadEvent.target.result;
        const parsed = parseText(text);
        if (parsed.length === 0) {
            alert('未解析到有效数据，请检查文件格式');
            return;
        }

        data = parsed;
        idx = 0;
        saveToStorage();
        activateUI();
        renderSidebar();
        render();
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
    };

    reader.readAsText(file, 'utf-8');
    event.target.value = '';
}

function clearData() {
    if (!confirm('确定要清空当前数据吗？')) {
        return;
    }

    data = [];
    idx = 0;
    localStorage.removeItem(STORAGE_KEY);
    deactivateUI();
    renderSidebar();
}

function activateUI() {
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('compareArea').style.display = 'flex';
    document.getElementById('urlBar').style.display = 'flex';
    document.getElementById('navGroup').style.display = 'flex';
    document.getElementById('kbdHints').style.display = 'flex';
    document.getElementById('clearBtn').style.display = '';
    document.getElementById('sbEmpty').style.display = 'none';
}

function deactivateUI() {
    document.getElementById('welcome').classList.remove('hidden');
    document.getElementById('compareArea').style.display = 'none';
    document.getElementById('urlBar').style.display = 'none';
    document.getElementById('navGroup').style.display = 'none';
    document.getElementById('kbdHints').style.display = 'none';
    document.getElementById('clearBtn').style.display = 'none';
    document.getElementById('sbEmpty').style.display = '';
    document.getElementById('srcFrame').src = 'about:blank';
    document.getElementById('dstFrame').src = 'about:blank';
}

function go(dir) {
    const nextIndex = idx + dir;
    if (nextIndex < 0 || nextIndex >= data.length) {
        return;
    }

    idx = nextIndex;
    render();
    highlightSb();
}

function jumpTo(index) {
    idx = index;
    render();
    highlightSb();
}

function render() {
    const current = data[idx];
    if (!current) {
        return;
    }

    document.getElementById('curNum').textContent = idx + 1;
    document.getElementById('totalNum').textContent = data.length;

    document.getElementById('srcLink').textContent = current.src;
    document.getElementById('srcLink').href = current.src;
    document.getElementById('dstLink').textContent = current.dst || '-';
    document.getElementById('dstLink').href = current.dst || '#';
    document.getElementById('timeTag').textContent = current.time;
    document.getElementById('noteText').textContent = current.note ? '💬 ' + current.note : '';

    document.getElementById('srcFrame').src = current.src.startsWith('http') ? proxyUrl(current.src) : 'about:blank';
    document.getElementById('dstFrame').src = current.dst && current.dst.startsWith('http') ? current.dst : 'about:blank';

    document.getElementById('prevBtn').disabled = idx <= 0;
    document.getElementById('nextBtn').disabled = idx >= data.length - 1;
}

function renderSidebar() {
    const list = document.getElementById('sbList');
    const emptyEl = document.getElementById('sbEmpty');

    list.querySelectorAll('.sb-item').forEach((element) => element.remove());

    if (data.length === 0) {
        emptyEl.style.display = '';
        return;
    }

    emptyEl.style.display = 'none';

    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'sb-item' + (index === idx ? ' active' : '');
        div.onclick = function () {
            jumpTo(index);
        };

        const noteHtml = item.note ? `<div class="sb-note">💬 ${item.note}</div>` : '';
        div.innerHTML = `<div class="sb-idx">#${index + 1} · ${item.time}</div><div class="sb-urls">${item.src} <span class="sb-arrow">→</span> ${item.dst || '-'}</div>${noteHtml}`;
        list.appendChild(div);
    });
}

function highlightSb() {
    document.querySelectorAll('.sb-item').forEach((element, index) => {
        element.classList.toggle('active', index === idx);
    });

    const active = document.querySelector('.sb-item.active');
    if (active) {
        active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
}

document.addEventListener('keydown', function (event) {
    if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
        return;
    }

    if (event.key === 'ArrowLeft') {
        go(-1);
        event.preventDefault();
    }

    if (event.key === 'ArrowRight') {
        go(1);
        event.preventDefault();
    }

    if (event.key === 'l' || event.key === 'L') {
        toggleSidebar();
        event.preventDefault();
    }
});

window.go = go;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.doImport = doImport;
window.toggleSidebar = toggleSidebar;
window.triggerFileImport = triggerFileImport;
window.handleFileImport = handleFileImport;
window.clearData = clearData;
window.setPreviewMode = setPreviewMode;

loadPreviewMode();
loadFromStorage();
