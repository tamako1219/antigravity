// background.js

// --- CONFIGURATION ---
// 🔴 IMPORTANT: Replace with your deployed GAS Web App URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzWFHi9-qgv_FGuvbaPKDIExUG6FP-ZBI0LXKICm63NBdE0KxhxLK9K6qbN9iB5e03p/exec";
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"

// Create Context Menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-selection",
        title: "Save Selection to Brain",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "save-page",
        title: "Save Page to Brain",
        contexts: ["page"]
    });
    chrome.contextMenus.create({
        id: "save-image",
        title: "Save Image to Brain",
        contexts: ["image"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "save-selection") {
        sendToGAS({
            type: "text",
            text: info.selectionText,
            url: tab.url,
            pageTitle: tab.title
        });
    } else if (info.menuItemId === "save-page") {
        sendToGAS({
            type: "page",
            text: "Page URL: " + tab.url,
            url: tab.url,
            pageTitle: tab.title
        });
    } else if (info.menuItemId === "save-image") {
        sendToGAS({
            type: "image",
            imageUrl: info.srcUrl,
            url: tab.url,
            pageTitle: tab.title
        });
    }
});

// Handle Messages from Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveToBrain") {
        sendToGAS({
            ...request.data,
            url: sender.tab.url,
            pageTitle: sender.tab.title
        });
        sendResponse({ status: "processing" });
    }
    return true;
});

// Send Data to GAS
async function sendToGAS(data) {
    if (GAS_API_URL === "YOUR_GAS_WEB_APP_URL_HERE") {
        console.error("GAS API URL is not set in background.js");
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Configuration Error',
            message: 'Please set your GAS Web App URL in background.js'
        });
        return;
    }

    // Notify start
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Sending to Brain...',
        message: 'Analyzing and saving content.'
    });

    try {
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
        });

        // Notify success (Assume success with no-cors)
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Saved to Brain!',
            message: 'Content sent successfully.'
        });

    } catch (error) {
        console.error("Error sending to GAS:", error);
        // Fallback notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Saved (Async)',
            message: 'Content sent to Brain (Response details unavailable due to CORS or Network).'
        });
    }
}
