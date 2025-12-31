// Background service worker
console.log("ScriptFlow Background Service Worker Loaded");

chrome.runtime.onInstalled.addListener(() => {
    console.log("ScriptFlow Extension Installed");
});
