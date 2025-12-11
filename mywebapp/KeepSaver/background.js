/* background.js */

// コンテキストメニュー作成
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-keep",
        title: "Keepに保存 (Markdown)",
        contexts: ["selection", "page", "image"]
    });
});

// コンテキストメニュークリック時の処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-to-keep") {
        // コンテンツスクリプトにデータ取得を依頼
        chrome.tabs.sendMessage(tab.id, {
            action: "capture_content",
            menuInfo: info
        }, (response) => {
            // エラーハンドリング
            if (chrome.runtime.lastError) {
                console.warn("Message failed:", chrome.runtime.lastError.message);
                return;
            }

            // データ取得成功時、Storageに保存してKeepを開く
            if (response && response.success && response.data) {
                saveAndOpenKeep(response.data);
            }
        });
    }
});

// メッセージハンドリング (フローティングボタン等からの要求)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_keep") {
        if (request.data) {
            // データが送られてきた場合は保存してから開く
            saveAndOpenKeep(request.data);
        } else {
            // 既に保存済みの場合は単に開く
            openGoogleKeep();
        }
    }
});

/**
 * データをストレージに保存してからGoogle Keepを開く
 * (Manifest V3のService Worker停止対策として必須)
 */
function saveAndOpenKeep(text) {
    chrome.storage.local.set({ pendingNote: text }, () => {
        openGoogleKeep();
    });
}

function openGoogleKeep() {
    const keepUrl = "https://keep.google.com/";

    chrome.tabs.query({ url: keepUrl + "*" }, (tabs) => {
        if (tabs.length > 0) {
            // 既存のタブがあればアクティブ化
            chrome.tabs.update(tabs[0].id, { active: true });
            chrome.windows.update(tabs[0].windowId, { focused: true });
        } else {
            // 新規タブで開く
            chrome.tabs.create({ url: keepUrl });
        }
    });
}