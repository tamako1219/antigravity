/* keep_script.js - Force Wait for Title Field & Robust Color */

console.log("Keep Saver Pro: Final Sync Loaded");

// 監視設定
setTimeout(checkPendingNote, 1000); 
setInterval(checkPendingNote, 2000);
setInterval(injectButtons, 2000); // ボタン表示も維持

let isProcessing = false;

function checkPendingNote() {
    if (isProcessing || !document.hasFocus()) return;

    chrome.storage.local.get("pendingNote", (result) => {
        if (result && result.pendingNote) {
            console.log("Keep Saver: Data detected.", result.pendingNote);
            isProcessing = true;
            
            processNoteData(result.pendingNote)
                .then(() => {
                    console.log("Keep Saver: Complete.");
                    chrome.storage.local.remove("pendingNote");
                    isProcessing = false;
                })
                .catch((err) => {
                    console.warn("Keep Saver: Error.", err);
                    isProcessing = false;
                });
        }
    });
}

async function processNoteData(data) {
    // 1. 「メモを入力...」をクリック
    const placeholder = await waitForPlaceholder();
    if (!placeholder) throw new Error("Input bar not found.");
    placeholder.click();

    // 2. 【最重要修正】入力欄が「2つ」になるまで待つ
    // これにより、タイトル欄が出現するのを確実に待ちます
    const fields = await waitForTwoFields();
    if (!fields) throw new Error("Could not identify distinct Title and Body fields.");

    const { titleField, bodyField } = fields;

    // 3. データの準備
    const titleText = data.title || ""; 
    
    // 本文の組み立て
    let bodyText = "";
    if (data.body) bodyText += `${data.body}\n\n`;
    if (data.image) bodyText += `![](${data.image})\n\n`; // 画像URL
    if (data.url) bodyText += `Source: ${data.url}\n\n`;
    if (data.tags && data.tags.length > 0) bodyText += data.tags.join(" ");

    // 4. 入力実行
    // タイトル欄へ
    if (titleField && titleText) {
        console.log("Keep Saver: Writing Title...");
        await simulateInput(titleField, titleText);
    }

    // 本文欄へ
    if (bodyField && bodyText) {
        console.log("Keep Saver: Writing Body...");
        await simulateInput(bodyField, bodyText);
    }

    // 5. 色の適用
    if (data.color) {
        setTimeout(() => {
            applyColorBruteForce(data.color);
        }, 800);
    }
}

// 入力欄が「タイトル」と「本文」の2つに分かれるのを待つ関数
function waitForTwoFields() {
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            
            // 編集可能なdivをすべて取得
            const editors = document.querySelectorAll('div[role="textbox"][contenteditable="true"]');
            
            // 見えているエディタだけを抽出
            const visibleEditors = Array.from(editors).filter(el => el.offsetParent !== null);

            // エディタが2つ以上あれば、[0]がタイトル、[1]が本文とみなす (Keepの仕様)
            if (visibleEditors.length >= 2) {
                clearInterval(interval);
                resolve({ 
                    titleField: visibleEditors[0], 
                    bodyField: visibleEditors[1] 
                });
            }

            // 15回(3秒)試行してもダメなら諦める
            if (attempts > 15) { 
                clearInterval(interval);
                // フォールバック: 1つしかなくてもそれを本文として返す
                if (visibleEditors.length === 1) {
                     resolve({ titleField: null, bodyField: visibleEditors[0] });
                } else {
                     resolve(null); 
                }
            }
        }, 200);
    });
}

// 色変更（総当り・位置指定版）
function applyColorBruteForce(targetColorName) {
    console.log(`Keep Saver: Applying color [${targetColorName}]`);
    
    // 現在アクティブなメモのツールバーを探す
    // bodyFieldにフォーカスが当たっているはずなので、activeElement周辺から探す
    const activeEl = document.activeElement;
    const noteCard = activeEl.closest('.IZ65Hb-n0tgWb') || activeEl.closest('.VIpgJd-TU7Sb');
    
    if (!noteCard) {
        console.warn("Active note card not found for coloring.");
        return;
    }

    // ツールバー内のアイコンボタンをすべて取得
    const buttons = noteCard.querySelectorAll('div[role="button"]');
    let paletteBtn = null;

    // 戦略A: 名前で探す ("背景" "Background" "Color")
    for (const btn of buttons) {
        const label = (btn.getAttribute('aria-label') || "").toLowerCase();
        if (label.includes("背景") || label.includes("background") || label.includes("color")) {
            paletteBtn = btn;
            break;
        }
    }

    // 戦略B: 名前で見つからない場合、位置で探す (左から1番目か2番目がパレットであることが多い)
    if (!paletteBtn && buttons.length > 2) {
        // 通常、リマインダーの次あたりにある
        // 左から2番目(index 1)を試す
        paletteBtn = buttons[1]; 
    }

    if (!paletteBtn) {
        console.warn("Palette button not found.");
        return;
    }

    // パレットを開く
    paletteBtn.click();

    // 色を選ぶ
    setTimeout(() => {
        const colorMap = {
            "Red": ["赤", "red", "レッド"],
            "Orange": ["オレンジ", "orange"],
            "Yellow": ["黄", "yellow", "イエロー"],
            "Green": ["緑", "green", "グリーン"],
            "Teal": ["ティール", "teal", "青緑"],
            "Blue": ["青", "blue", "ブルー"], // 水色っぽい
            "DarkBlue": ["紺", "dark blue", "ダークブルー", "青"],
            "Purple": ["紫", "purple", "パープル"],
            "Pink": ["ピンク", "pink"],
            "Brown": ["茶", "brown", "ブラウン"],
            "Gray": ["灰", "gray", "グレー"]
        };
        
        const keywords = colorMap[targetColorName] || ["teal"];
        const options = document.querySelectorAll('div[role="button"], div[role="option"]');
        
        for (const opt of options) {
            // パレットメニューが開いている前提で、可視状態のボタンをチェック
            if (opt.offsetParent === null) continue;

            const label = (opt.getAttribute('aria-label') || opt.title || "").toLowerCase();
            if (keywords.some(k => label.includes(k))) {
                opt.click();
                console.log("Keep Saver: Color clicked.");
                break;
            }
        }
    }, 300);
}

// 入力ヘルパー
async function simulateInput(element, text) {
    element.focus();
    await new Promise(r => setTimeout(r, 50));
    const success = document.execCommand('insertText', false, text);
    if (!success) {
        element.innerText = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// プレースホルダー検索
function waitForPlaceholder() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkLoop = setInterval(() => {
            attempts++;
            const el = findPlaceholder();
            if (el) { clearInterval(checkLoop); resolve(el); }
            else if (attempts >= 15) { clearInterval(checkLoop); resolve(null); }
        }, 500);
    });
}

function findPlaceholder() {
    const ariaCandidates = document.querySelectorAll('div[aria-label]');
    for (const el of ariaCandidates) {
        const label = el.getAttribute('aria-label');
        if (label && (label.includes("メモを入力") || label.includes("Take a note"))) {
            if (el.offsetParent !== null) return el;
        }
    }
    const divs = document.querySelectorAll('div');
    for (const d of divs) {
        if (d.childElementCount === 0 && d.innerText) {
            const txt = d.innerText;
            if (txt.includes("メモを入力") || txt.includes("Take a note")) {
                return d.closest('[role="button"]') || d.parentElement || d;
            }
        }
    }
    return document.querySelector('div.notranslate.IZ65Hb-n0tgWb.IZ65Hb-haAclf');
}

// UI注入（維持）
function injectButtons() {
    const moreOptionsBtns = document.querySelectorAll('div[role="button"][aria-label="More options"], div[role="button"][aria-label="その他のアクション"]');
    moreOptionsBtns.forEach(btn => {
        const toolbar = btn.parentElement;
        if (!toolbar || toolbar.querySelector('.keep-saver-btn-group')) return;
        if (toolbar.offsetParent === null) return;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'keep-saver-btn-group';
        btnGroup.style.display = 'flex';
        btnGroup.style.marginRight = '4px';

        const dlBtn = createIconBtn('⬇️', 'DL', () => alert("Download"));
        btnGroup.appendChild(dlBtn);
        toolbar.insertBefore(btnGroup, btn);
    });
}
function createIconBtn(icon, title, onClick) {
    const el = document.createElement('div');
    Object.assign(el.style, { cursor: 'pointer', margin: '0 6px', fontSize: '18px', opacity: '0.7' });
    el.innerHTML = icon; el.title = title;
    el.onclick = (e) => { e.stopPropagation(); e.preventDefault(); onClick(); };
    return el;
}