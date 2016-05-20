// Create the context menu
var cmSendToCalendar = chrome.contextMenus.create({ "title": "Send To Calendar", "contexts": ["all"], "onclick": SendToCalendarOuter });

// Do all the things
function SendToCalendarOuter(data, tab) {
    // Preserve newlines in the selection
    chrome.tabs.executeScript( {
        code: "window.getSelection().toString();"
    }, function(selection) {
        // selection[0] contains text including line breaks
        SendToCalendar(selection[0], tab);
    });
}

function SendToCalendar(selection, tab) {

    // Max URI length is 2000 chars, but let's keep under 1600
    // to also allow a buffer for google login/redirect urls etc.
    // (This limit is not a hard limit in the code,
    // but we don't surpass it by more than a few tens of chars.)
    var maxLength = 1600;

    // Page title to event title
	var url = "http://www.google.com/calendar/event?action=TEMPLATE"
        + "&text=" + TrimURITo(tab.title, maxLength);

    // Check if the selected text contains a US formatted address
    // and it its first 100 chars to URI if so
    var address = selection.match(/(\d+\s+[':.,\s\w]*,\s*[A-Za-z]+\s*\d{5}(-\d{4})?)/m);
    if (address) {
        // Location goes to location
        url += "&location=" + TrimURITo(address[0], maxLength - url.length);
    }

    // URL goes to star of details (event description)
    var taburl = TrimURITo(tab.url + "\n\n", maxLength - url.length);

    // Selection goes to end of details, and to ctext (google calendar quick add),
    // (trim to half of the available length cause its twice in the URI)
    var selection = TrimURITo(selection, (maxLength - url.length)/2);
    url += "&details=" + selection + "&ctext=" + selection;
	
    // Open the created url in a new tab
	chrome.tabs.create({ "url": url}, function (tab) {});
}

// Trim text so that its URI encoding fits into the length limit
// and return its URI encoding
function TrimURITo(text, length) {
    var textURI = encodeURI(text);
    if (textURI.length > length) {
        // Different charsets can lead to a different blow-up after passing the
        // text through encodeURI, so let's estimate the blow up first,
        // and then trim the text so that it fits the limit...
        var blowUp = textURI.length/text.length;
        var newLength = Math.floor(length / blowUp) - 3;  // -3 for "..."
        do {
            // trim the text & show that it was trimmed...
            text = text.substring(0, newLength) + "...";
            textURI = encodeURI(text);
            newLength = Math.floor(0.9 * newLength);
        } while (textURI.length > length);
    }

    return textURI;
}

// TODO: configuration to choose whether I want tab.title to fill the text,
// or wherher to allow Google calendar to fill it by itself from ctext

