(function () {
	chrome.storage.sync.get("hotkey", function (data) {
		var hotkey = data.hotkey;
		if (!hotkey || !hotkey.keys || !hotkey.valid) {
			hotkey = {
				"keys": {
					"ctrlKey": true,
					"keyCode": 81
				}
			};
			hotkey = getHotKey(hotkey.keys);
			chrome.storage.sync.set({
				"hotkey": hotkey
			});
		}
	});
	chrome.storage.sync.get("language_id", function (data) {
		var lang_id = data.language_id;
		if (!lang_id) {
			lang_id = "auto";
		}
		chrome.storage.sync.set({
			"language_id": lang_id
		});
	});

})();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action == 'pageActionShow') {
		chrome.pageAction.show(sender.tab.id);
	}
});