var m_hotkey = {}
var m_languageId = {}

function validate(e) {
	e = e || event;
	m_hotkey = getHotKey(e);
	if (m_hotkey.string.length) {
		document.getElementById('hotkeyItemInput').value = m_hotkey.string;
	}

	if (m_hotkey && m_hotkey.valid) {
		$('#save').addClass('active');
	} else {
		$('#save').removeClass('active');
	}

	e.returnValue = false;
	if (e.preventDefault)
		e.preventDefault();
}

function save_options() {

	var lang_id = document.getElementById('language').value;
	chrome.storage.sync.set({
		"language_id": lang_id
	});
	if (m_hotkey && m_hotkey.valid) {
		chrome.storage.sync.set({
			"hotkey": m_hotkey
		});
	}

	var optionStatus = chrome.i18n.getMessage('OptionStatus');
	if (!optionStatus.length) {
		optionStatus = "Saving"
	}
	var status = document.getElementById('status');
	status.textContent = optionStatus;

	setTimeout(function () {
		status.textContent = '';
		restore_options();
	}, 750);
	$('#save').removeClass('active');
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

	document.getElementById('hotkeyItemInput').addEventListener('keydown', validate);
	document.getElementById('hotkeyItemInput').setAttribute("style", "width:150px; margin-left: 10px;");

	var optionName;

	optionName = chrome.i18n.getMessage('Name');
	if (optionName.length)
		document.getElementById('title').innerHTML = optionName;

	optionName = chrome.i18n.getMessage('OptionName');
	if (optionName.length)
		document.getElementById('hotkeyItemTitle').innerHTML = optionName;

	optionName = chrome.i18n.getMessage('OptionCustom');
	if (optionName.length)
		document.getElementById('custom').innerHTML = optionName;

	optionName = chrome.i18n.getMessage('SaveBtnTitle');
	if (optionName.length)
		document.getElementById('save').innerHTML = optionName;

	optionName = chrome.i18n.getMessage('SelectLangTitle');
	if (optionName.length)
		document.getElementById('selectLangItemTitle').innerHTML = optionName;

	chrome.storage.sync.get("hotkey", function (data) {
		m_hotkey = getHotKey(data.hotkey.keys);

		var $options = $('#hotkey option');

		for (var i = 0; i < $options.length; ++i) {
			var $option = $($options[i]);
			var data = $option.attr('data');
			if (data) {
				var keys = JSON.parse(data);

				if (keysAreEqual(keys, m_hotkey.keys)) {
					$option[0].selected = true;
					break;
				}
			}
		}

		var optionSelected = $("#hotkey option:selected");

		if (optionSelected.attr("id") == "custom") {
			selectCustomOption();
			document.getElementById('hotkeyItemInput').value = m_hotkey.string;
		}
	});

	chrome.storage.sync.get("language_id", function (data) {
		m_languageId = data.language_id;

		document.getElementById('language').value = m_languageId;
	});
}

function keysAreEqual(keys1, keys2) {
	if (Object.keys(keys1).length == Object.keys(keys2).length) {
		for (var key in keys1) {
			if (keys1[key] != keys2[key]) {
				return false;
			}
		}

		return true;
	}

	return false;
}

function onDocumentReady(callback) {
	var _document = null,
		_head = null,
		_window = window;

	if (_window == _window.top) {
		try {
			// And set timeout
			(function checkDocumentReady() {
				if ((_window = window) && (_document = _window.document) && (_head = _document.head)) {
					if (callback) {
						callback(_window, _document, _head);
					}
				} else
					setTimeout(checkDocumentReady, 0);
			})();
		} catch (e) {}
	}
}

function selectCustomOption() {
	var $el = $("#hotkeyItemInput");
	$el.show();
	$el.val("");
	$el.focus();
	$('#save').removeClass('active');
}

function selectAction() {
	if (this.id == 'hotkey') {
		var optionSelected = $("option:selected", this);

		if (optionSelected.attr("id") == "custom") {
			selectCustomOption();
		} else {
			$("#hotkeyItemInput").hide();
			$('#save').addClass('active');
			var keys = JSON.parse(optionSelected.attr('data'));
			m_hotkey = getHotKey(keys);
		}
	} else {
		$('#save').addClass('active');
	}
}

(function () {
	onDocumentReady(function () {
		document.addEventListener('DOMContentLoaded', restore_options);
		document.getElementById('save').addEventListener('click', save_options);
		$('select').change(selectAction);
		restore_options();
	});
})();