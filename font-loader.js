// Injected at document_start so Geist @font-face resolves from chrome-extension://
// before Gmail paints. UI styles are in styles.css (manifest content_scripts).

(function () {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return;
  const id = "zc-zonecheck-fonts";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("fonts.css");
  (document.head || document.documentElement).appendChild(link);
})();
