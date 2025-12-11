/* content_script.js - Simple & Robust Data Capture */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture_content") {
        handleCapture(request.menuInfo)
            .then((noteData) => sendResponse({ success: true, data: noteData }))
            .catch((err) => {
                console.error("Capture failed:", err);
                sendResponse({ success: false, error: err.toString() });
            });
        return true; 
    }
});

async function handleCapture(menuInfo) {
    // 1. ページ情報の取得
    const pageTitle = document.title || "No Title";
    let pageUrl = location.href;
    
    // URLのゴミ除去
    try {
        const urlObj = new URL(pageUrl);
        const paramsToRemove = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"];
        paramsToRemove.forEach(p => urlObj.searchParams.delete(p));
        pageUrl = urlObj.toString();
    } catch(e) {}

    // 2. 選択情報の取得
    let selectionText = menuInfo.selectionText || "";
    let imageUrl = menuInfo.srcUrl || ""; 

    // 3. タグと色の決定 (シンプル化)
    const domain = location.hostname;
    let tags = [];
    let colorPreference = "DEFAULT"; // デフォルト

    const dateStr = new Date().toISOString().split('T')[0];
    tags.push(`#Date/${dateStr}`);

    // ドメイン別色分けルール
    if (domain.includes("youtube") || domain.includes("youtu.be")) {
        tags.push("#Video");
        colorPreference = "Red";
    } 
    else if (domain.includes("github") || domain.includes("qiita") || domain.includes("stackoverflow")) {
        tags.push("#Dev");
        colorPreference = "DarkBlue"; 
    }
    else if (domain.includes("amazon") || domain.includes("rakuten")) {
        tags.push("#Shopping");
        colorPreference = "Green"; 
    }
    else if (domain.includes("news") || domain.includes("yahoo")) {
        tags.push("#News");
        colorPreference = "Yellow";
    }
    else if (domain.includes("twitter") || domain.includes("x.com") || domain.includes("instagram")) {
        tags.push("#Social");
        colorPreference = "Blue";
    }
    else {
        tags.push("#Web");
        colorPreference = "Teal"; // その他Webページ用
    }

    // 4. データパッケージ作成
    // ここでタイトルと本文を明確に分ける
    const noteData = {
        title: pageTitle,    // ページのタイトル -> Keepのタイトル欄へ
        url: pageUrl,
        body: selectionText, // 選択したテキスト -> Keepの本文欄へ
        image: imageUrl,
        tags: tags,
        color: colorPreference
    };

    return noteData;
}

// --- フローティングボタン機能 ---
let floatingBtn = null;

document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', handleSelection);
document.addEventListener('mousedown', (e) => {
    if (floatingBtn && e.target !== floatingBtn && !floatingBtn.contains(e.target)) {
        removeFloatingButton();
    }
});

function handleSelection(e) {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) return;
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0) return;

    // 画像同時選択のサポート
    let foundImage = null;
    const fragment = range.cloneContents();
    const imgs = fragment.querySelectorAll('img');
    if (imgs.length > 0) {
        for (let img of imgs) {
            if (img.src && img.src.startsWith('http') && img.width > 50) {
                foundImage = img.src;
                break;
            }
        }
    }

    const text = selection.toString().trim();
    showFloatingButton(rect.left + window.scrollX + (rect.width / 2), rect.top + window.scrollY - 10, text, foundImage);
}

function showFloatingButton(x, y, selectionText, foundImage) {
    if (floatingBtn) removeFloatingButton();

    floatingBtn = document.createElement('div');
    floatingBtn.innerHTML = '📝 Keep it!';
    Object.assign(floatingBtn.style, {
        position: 'absolute', left: `${x}px`, top: `${y - 45}px`,
        transform: 'translateX(-50%)', backgroundColor: '#fbbc04', color: '#202124',
        padding: '6px 14px', borderRadius: '24px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        cursor: 'pointer', zIndex: '2147483647', fontWeight: 'bold', fontSize: '14px',
        border: '2px solid white', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif'
    });

    floatingBtn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();

        const menuInfo = { selectionText: selectionText, srcUrl: foundImage };

        floatingBtn.innerHTML = '✅ Saving...';
        floatingBtn.style.backgroundColor = '#34a853';
        floatingBtn.style.color = 'white';

        try {
            const noteData = await handleCapture(menuInfo);
            removeFloatingButton();
            chrome.storage.local.set({ pendingNote: noteData }, () => {
                chrome.runtime.sendMessage({ action: "open_keep" });
            });
        } catch (err) {
            console.error("Keep Saver Error:", err);
            floatingBtn.innerHTML = '❌ Error';
        }
    };
    document.body.appendChild(floatingBtn);
}

function removeFloatingButton() {
    if (floatingBtn) { floatingBtn.remove(); floatingBtn = null; }
}