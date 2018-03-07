function getHotKey(e) {
	e = e || event;
	var optionKey = ["altKey", "ctrlKey", "shiftKey"];
	var optionKeyName = {
		"altKey": "Alt",
		"ctrlKey": "Ctrl",
		"shiftKey": "Shift",
	};

	var valid = false;
	var keys = {};
	var str = "";
	for (var i = 0; i < optionKey.length; ++i) {
		if (e[optionKey[i]] == true) {
			if (str.length) {
				str += " + "
			}
			str += optionKeyName[optionKey[i]];
			keys[optionKey[i]] = true;
		}
	}

	var keyCode = e.which || e.keyCode;
	var ch = String.fromCharCode(keyCode);
	if (str.length && ("A" <= ch && ch <= "Z")) {
		str += " + " + String.fromCharCode(keyCode);
		keys["keyCode"] = keyCode;
		valid = true;
	}

	return {
		keys: keys,
		string: str,
		valid: valid
	};
}