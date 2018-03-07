try {
	function EventManager() {
		var __listeners__ = {};
		this.dispatch = function (type, message) {
			if (__listeners__[type]) {
				var callbacks = __listeners__[type];
				for (var i = 0, li = callbacks.length; i < li; ++i) {
					callbacks[i](type, message);
				}
			}
		};

		this.addEventListener = function (type, callback) {
			if (!__listeners__[type]) {
				__listeners__[type] = [callback];
			} else {
				__listeners__[type].push(callback);
			}
		};

		this.removeEventListener = function (type, callback) {
			if (__listeners__[type]) {
				var callbacks = __listeners__[type];
				for (var i = 0, li = callbacks.length; i < li; ++i) {
					if (callbacks[i] == callback) {
						callbacks.splice(i, 1);
						return;
					}
				}
			}
		};
	}

} catch (ex) {
	catchUnhandledError(ex);
}

try {

	function WebSpeechAPIManager() {
		var self = this,
			recognition = null,
			final_transcript = '';

		this.recognizing = false;
		this.autoChangeTextField = false;

		var first_char = /\S/;

		function capitalize(s) {
			return s.replace(first_char, function (m) {
				return m.toUpperCase();
			});
		}

		if (!('webkitSpeechRecognition' in window)) {} else {
			recognition = new webkitSpeechRecognition();
			recognition.continuous = true;
			recognition.interimResults = true;
		}
		recognition.onstart = function (event) {
			self.recognizing = true;
			self.dispatch("onstart", {
				recognizing: true
			});
		}

		recognition.onend = function (event) {
			self.recognizing = false;
			self.dispatch("onend", {
				recognizing: false
			});
		}

		recognition.onresult = function (event) {
			var interim_transcript = '';

			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					final_transcript += event.results[i][0].transcript;
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}

			if (final_transcript || interim_transcript) {
				var result = capitalize(final_transcript + interim_transcript);
				self.dispatch("onresult", result);
			}
		}

		recognition.onerror = function (event) {}

		this.startRecognition = function (defaultText) {
			final_transcript = typeof defaultText == 'string' ? defaultText : '';
			if (self.recognizing) {
				recognition.abort();
				self.recognizing = false;
			}
			recognition.start();
		}

		this.setLanguage = function (lang) {
			recognition.lang = lang;
		}

		this.stopRecognition = function () {
			recognition.stop();
		}

		this.abortRecognition = function () {
			recognition.abort();
		}
	}

	WebSpeechAPIManager.prototype = new EventManager();
	WebSpeechAPIManager.prototype.constructor = WebSpeechAPIManager;

	var webSpeechAPIManager = new WebSpeechAPIManager();

} catch (ex) {
	catchUnhandledError(ex);
}


try {

	function WebSpeecTargetDetector() {
		var m_self = this;

		var m_cursor = {
			"clientX": 0,
			"clientY": 0
		};
		var m_curObj = {};
		var m_newObj = {};

		var _location = document.location;

		function getAllTextNodes(target) {
			var t_nodes = [];

			var childs = target.childNodes;

			for (var i = 0; i < childs.length; ++i) {
				if (t_nodes.length > 0 && childs[i].nodeName.toLowerCase() == 'div' && t_nodes[t_nodes.length - 1].nodeName.toLowerCase() != 'br') {
					t_nodes.push(document.createElement('br'));
				}
				if (childs[i].firstChild) {
					var arr = getAllTextNodes(childs[i]);
					t_nodes.push.apply(t_nodes, arr);
				} else {
					t_nodes.push(childs[i]);
				}
			}

			return t_nodes;
		}

		function setText(target, text, caretPos) {
			if (typeof target.setSelectionRange != "undefined") {
				webSpeechAPIManager.autoChangeTextField = true;
				target.value = text;
				target.setSelectionRange(caretPos, caretPos);
			} else {
				var curLength = 0,
					lastLength = 0,
					rangeNode;
				webSpeechAPIManager.autoChangeTextField = true;
				target.innerHTML = text;

				var childs = target.childNodes;
				var i;
				for (i = 0, l = childs.length; i < l; i++) {
					if (childs[i].outerHTML) {
						lastLength = childs[i].outerHTML.length;
						curLength += lastLength;
					} else {
						lastLength = childs[i].nodeValue.length;
						curLength += lastLength;
					}

					if (curLength > caretPos) {
						rangeNode = childs[i];
						break;
					}
				}

				if (!rangeNode) {
					rangeNode = childs[i - 1];
				}
				if (!rangeNode) {
					return;
				}

				var sel = window.getSelection();
				var range = document.createRange();

				if (rangeNode.nodeName == '#text') {
					range.setStart(rangeNode, caretPos - (curLength - lastLength));
				} else {
					if (caretPos >= text.length) {
						range.setStart(target, target.childNodes.length);
					} else {
						range.setStart(rangeNode, 0);
					}
				}
				range.collapse(true);

				sel.removeAllRanges();
				sel.addRange(range);
			}
		}

		function getTextWithOffset(target) {
			var text,
				offset,
				start,
				end;

			start = end = -1;

			if (typeof target.selectionStart != "undefined") {
				text = target.value;
				start = target.selectionStart;
				end = target.selectionEnd;
			} else {
				var t_nodes = getAllTextNodes(target);
				var selection = document.getSelection();
				var anchorNode,
					anchorOffset,
					focusNode,
					focusOffset;

				anchorNode = selection.anchorNode;
				anchorOffset = selection.anchorOffset;
				focusNode = selection.focusNode;
				focusOffset = selection.focusOffset;
				if (t_nodes.length > 0) {
					if (anchorNode && ($.contains(target, anchorNode) || target == anchorNode) && anchorNode.nodeName != 'BR' && anchorNode.nodeName != '#text') {
						if (anchorNode.childNodes.length > anchorOffset) {
							anchorNode = anchorNode.childNodes[anchorOffset];
							anchorOffset = 0;
						} else {
							anchorNode = anchorNode.childNodes[anchorNode.childNodes.length - 1];
							anchorOffset = anchorNode.outerHTML.length;
						}
					}
					if (focusNode && ($.contains(target, focusNode) || target == focusNode) && focusNode.nodeName != 'BR' && focusNode.nodeName != '#text') {
						if (focusNode.childNodes.length > focusOffset) {
							focusNode = focusNode.childNodes[focusOffset];
							focusOffset = 0;
						} else {
							focusNode = focusNode.childNodes[focusNode.childNodes.length - 1];
							focusOffset = focusNode.outerHTML.length;
						}
					}
				}

				text = "";

				for (var i = 0; i < t_nodes.length; ++i) {
					if (t_nodes[i] == anchorNode) {
						start = anchorOffset + text.length;
					}

					if (t_nodes[i] == focusNode) {
						end = focusOffset + text.length;
					}

					if (t_nodes[i].nodeValue) {
						text += t_nodes[i].nodeValue;
					} else if (t_nodes[i].nodeName.toLowerCase() == 'br') {
						text += '<br>';
					} else {
						text += t_nodes[i].outerHTML;
					}
				}
			}

			if (start == -1 && end == -1) {
				start = end = text.length;
			}

			if (start == -1) {
				start = end;
			} else if (end == -1) {
				end = start;
			} else if (start > end) {
				var tmp = start;
				start = end;
				end = tmp;
			}

			text = text.slice(0, start) + text.slice(end, text.length);
			offset = start;

			return {
				"value": text,
				"offset": offset
			};
		}

		function pushText(type, result) {
			if (m_curObj.target) {
				var text = m_curObj.text.value;
				var offset = m_curObj.text.offset;
				var newOffset = offset + result.length;

				var newText = [text.slice(0, offset), result, text.slice(offset)].join('');
				setText(m_curObj.target, newText, newOffset);
				m_newObj = getWebSpeechParams(m_curObj.web_speech);
			}
		}

		function isCursorOverAnElement(cursor, target) {
			var bcRect = target.getBoundingClientRect();

			if (bcRect.left < cursor.clientX && cursor.clientX < bcRect.right &&
				bcRect.top < cursor.clientY && cursor.clientY < bcRect.bottom) {
				return true;
			}

			return false;
		}

		function getPagePosition(clientX, clientY) {
			var x, y;
			x = clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
			y = clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);

			return {
				"pageX": x,
				"pageY": y
			};
		}

		function getCursorXY(event) {
			event = event || window.event;

			m_cursor.clientX = event.clientX;
			m_cursor.clientY = event.clientY;
		}

		function getWebSpeechParams(ws) {
			var $ws = $(ws);
			var $parent = $ws.data('parent');
			var $target = $parent.find($ws.data('selector'));

			$target.data('ws-object', $ws);

			return {
				"web_speech": $ws[0],
				"target": $target[0],
				"text": getTextWithOffset($target[0])
			};
		}

		function onMouseoverWS(event) {
			if (!webSpeechAPIManager.recognizing) {
				m_newObj = {};
				m_curObj = getWebSpeechParams(this);
			}

			event.stopPropagation();
		}

		function onClickWS(event) {
			if (webSpeechAPIManager.recognizing) {
				webSpeechAPIManager.abortRecognition();
			} else {
				if (m_curObj.target == m_newObj.target) {
					m_curObj = getWebSpeechParams(m_curObj.web_speech);
					m_newObj = {};
				}
				webSpeechAPIManager.startRecognition();
			}

			event.stopPropagation();
		}

		function onClickHandler(event) {
			webSpeechAPIManager.abortRecognition();
		}

		function onMousedownHandler(event) {
			webSpeechAPIManager.abortRecognition();
		}

		function onKeydownHandler(event) {
			var hotkey = getHotKey(event).keys;
			var $this = $(this);

			chrome.storage.sync.get("hotkey", function (data) {
				if (data && data.hotkey) {
					var keys = data.hotkey.keys;
					var isTrue = true;
					for (var key in keys) {
						if (keys[key] != hotkey[key]) {
							isTrue = false;
							break;
						}
					}

					if (isTrue) {
						if (!webSpeechAPIManager.recognizing) {
							var $ws = $this.data('ws-object');

							m_curObj = getWebSpeechParams($ws[0]);
							webSpeechAPIManager.startRecognition();
						} else {
							webSpeechAPIManager.abortRecognition();
						}
					}

					if (webSpeechAPIManager.recognizing &&
						!(event.altKey | event.ctrlKey | event.shiftKey | event.metaKey)) {
						webSpeechAPIManager.abortRecognition();
					} else if (!webSpeechAPIManager.recognizing) {
						m_newObj = {};
						m_curObj = getWebSpeechParams($this.data('ws-object'));
					}
				}
			});
		}

		function onKeyupHandler(event) {
			var keyCode = event.which || event.keyCode;
			if (webSpeechAPIManager.recognizing && keyCode == 13) {
				webSpeechAPIManager.abortRecognition();
			}
		}

		function onBlurHandler(event) {
			var $this = $(this);
			var $ws = $this.data('ws-object');

			var icoaEl = isCursorOverAnElement(m_cursor, $ws[0]);

			if (webSpeechAPIManager.recognizing) {
				if (icoaEl) {
					if (m_curObj.web_speech != $ws[0]) {
						webSpeechAPIManager.abortRecognition();
					} else {
						if (m_curObj.target == $this[0]) {
							$this.focus();
						}
					}
				} else {
					webSpeechAPIManager.abortRecognition();
				}
			}
		}

		function onStart(type, result) {
			if (m_curObj.target) {
				var $target = $(m_curObj.target);
				var $ws = $(m_curObj.web_speech);
				var text = m_curObj.text;

				$ws.attr('recognizing', 'true');
				$target.focus();

				setText($target[0], text.value, text.offset);

				$ws.data('parent').find('.placeholder').hide();
			} else {
				webSpeechAPIManager.abortRecognition();
			}
		}

		function onEnd(type, result) {
			var $ws = $(m_curObj.web_speech);

			try {
				var text = getTextWithOffset(m_curObj.target);
				if (!text.value.length) {
					$ws.data('parent').find('.placeholder').show();
				}
			} catch (e) {}

			$ws.attr('recognizing', '');
		}

		function addWSTargetHandlers($target) {
			$target
				.off('click', onClickHandler)
				.on('click', onClickHandler);

			$target
				.off('mousedown', onMousedownHandler)
				.on('mousedown', onMousedownHandler);

			$target
				.off('keydown', onKeydownHandler)
				.on('keydown', onKeydownHandler);

			$target
				.off('keyup', onKeyupHandler)
				.on('keyup', onKeyupHandler);

			$target
				.off('blur', onBlurHandler)
				.on('blur', onBlurHandler);

			if ($target[0]) {
				var observer = new MutationObserver(observerHandler);
				observer.observe($target[0], {
					childList: true,
					characterData: true,
					subtree: true
				});
			}
		}

		function applyToContentEditable() {
			var $items;

			$items = $('.emoji_smile_wrap:not([data-ws="true"])');

			for (var i = 0, l = $items.length; i < l; ++i) {
				var $item = $($items[i]);
				$item.attr('data-ws', 'true');

				var $ws = $('<div class="ws"></div>');
				$item.append($ws);

				$ws.on('click', onClickWS);
				$ws.on('mouseover', onMouseoverWS);

				$ws.data('type', 'div');

				var selector = '[contenteditable="true"]';
				var $parent = $item.parent().parent();
				var $target = $parent.find(selector);

				$ws.data('parent', $parent);
				$ws.data('selector', selector);
				$target.data('ws-object', $ws);

				addWSTargetHandlers($target);
			}
		}

		function applyToTextarea() {
			var $items = $('textarea:not([data-ws="true"])');
			for (var i = 0, l = $items.length; i < l; ++i) {
				var $target = $($items[i]);
				$target.attr('data-ws', 'true');

				var $ws_wrap = $('<div class="ws-wrap"></div>');
				var $ws = $('<div class="ws"></div>');

				$ws_wrap.append($ws);
				$ws_wrap.insertBefore($target);

				$ws.on('click', onClickWS);
				$ws.on('mouseover', onMouseoverWS);

				$ws.data('type', 'textarea');

				var $parent = $target.parent().parent();

				$ws.data('parent', $parent);
				$ws.data('selector', 'textarea');
				$target.data('ws-object', $ws);

				addWSTargetHandlers($target);
			}
		}

		function observerHandler(mutations) {
			if (!webSpeechAPIManager.autoChangeTextField && webSpeechAPIManager.recognizing) {
				webSpeechAPIManager.abortRecognition();
			}
			webSpeechAPIManager.autoChangeTextField = false;
		}

		this.detect = function () {
			applyToContentEditable();
			applyToTextarea();
		}

		$(window)
			.off('mousemove', getCursorXY)
			.on('mousemove', getCursorXY);

		$(document)
			.off('click', onClickHandler)
			.on('click', onClickHandler);

		webSpeechAPIManager.addEventListener("onresult", pushText);
		webSpeechAPIManager.addEventListener("onstart", onStart);
		webSpeechAPIManager.addEventListener("onend", onEnd);
	}

	WebSpeecTargetDetector.prototype = new EventManager();
	WebSpeecTargetDetector.prototype.constructor = WebSpeecTargetDetector;

	var webSpeecTargetDetector = new WebSpeecTargetDetector();

} catch (ex) {
	catchUnhandledError(ex);
}


try {

	var m_language = {
		"3": {
			lang: "en",
			desc: "English"
		},
		"0": {
			lang: "ru",
			desc: "Russian"
		},
		"1": {
			lang: "uk",
			desc: "Ukrainian"
		},
		"4": {
			lang: "es-ES",
			desc: "Spanish"
		},
		"12": {
			lang: "pt-PT",
			desc: "Portuguese"
		},
		"73": {
			lang: "pt-BR",
			desc: "Brazilian Portuguese"
		},
		"6": {
			lang: "de-DE",
			desc: "German"
		},
		"16": {
			lang: "fr-FR",
			desc: "French"
		},
		"7": {
			lang: "it-IT",
			desc: "Italian"
		},
		"61": {
			lang: "nl-NL",
			desc: "Dutch"
		},
		"18": {
			lang: "zh-CN",
			desc: "Chinese"
		},
		"15": {
			lang: "pl",
			desc: "Polish"
		},
		"10": {
			lang: "hu",
			desc: "Hungarian"
		},
		"60": {
			lang: "sv-SE",
			desc: "Swedish"
		},
		"55": {
			lang: "no-NO",
			desc: "Norwegian"
		},
		"53": {
			lang: "sk",
			desc: "Slovak"
		},
		"11": {
			lang: "sr-SP",
			desc: "Serbian"
		},
		"8": {
			lang: "bg",
			desc: "Bulgarian"
		},
		"5": {
			lang: "fi",
			desc: "Finnish"
		},
		"54": {
			lang: "ro-RO",
			desc: "Romanian"
		},
		"21": {
			lang: "cs",
			desc: "Czech"
		},
		"17": {
			lang: "ko",
			desc: "Korean"
		},
		"20": {
			lang: "ja",
			desc: "Japanese"
		},
		"98": {
			lang: "ar-EG",
			desc: "Arabic"
		},
		"69": {
			lang: "id",
			desc: "Indonesian"
		},
		"99": {
			lang: "he",
			desc: "Hebrew"
		},
		"82": {
			lang: "tr",
			desc: "Turkish"
		},
		"777": {
			lang: "ru",
			desc: "Soviet"
		}
	};


	function detectVKLangugeInterface() {
		var language;
		chrome.storage.sync.get("language_id", function (data) {
			if (data.language_id != "auto") {
				language = m_language[data.language_id];
			} else {
				var scripts = document.querySelectorAll('script');
				for (var i = 0; i < scripts.length && !language; ++i) {
					var script = scripts[i].innerHTML;
					if (script != "") {
						var match_arr = script.match(/(?:lang).*(?=,)/);
						if (match_arr && match_arr.length) {
							try {
								var lang_id = match_arr[0].replace(/[^0-9]/g, '');
								language = m_language[lang_id];
								break;
							} catch (e) {}
						}
					}
				}
			}

			webSpeechAPIManager.setLanguage(language ? language.lang : "en");
		});
	}

	function main() {
		this.chrome.runtime.sendMessage({
			action: "pageActionShow"
		});
		var _location = document.location;
		var oldUrl = _location.host + _location.pathname;

		detectVKLangugeInterface();
		var intervalID = setInterval(function () {
			webSpeecTargetDetector.detect();
			var currUrl = _location.host + _location.pathname;
			if (oldUrl != currUrl) {
				webSpeechAPIManager.abortRecognition();
				oldUrl = currUrl;
			}

		}, 250);
	}

} catch (ex) {
	catchUnhandledError(ex);
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

(function () {
	onDocumentReady(function () {
		main();
	});
})();