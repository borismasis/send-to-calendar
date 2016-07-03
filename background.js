// Create the context menu
var cmSendToCalendar = chrome.contextMenus.create({ "title": "Send To Calendar", "contexts": ["all"], "onclick": SendToCalendarOuter });

// Do all the things
function SendToCalendarOuter(data, tab) {
    // Preserve newlines in the selection
    chrome.tabs.executeScript( {
        code: "window.getSelection().toString();"
    }, function(selection) {
        if (selection) {
            // selection[0] contains text including line breaks
            SendToCalendar(selection[0], tab);
        } else if (data.selectionText) {
            // data.selectionText contains text without line breaks
            SendToCalendar(data.selectionText, tab);
        } else {
            SendToCalendar("", tab);
        }
    });
}

function SendToCalendar(selection, tab) {

    // Max URI length is 2000 chars, but let's keep under 1600
    // to also allow a buffer for google login/redirect urls etc.
    // (This limit is not a hard limit in the code,
    // but we don't surpass it by more than a few tens of chars.)
    var maxLength = 1600;

    // Start building the URL
	var url = "http://www.google.com/calendar/event?action=TEMPLATE";
    
    // Page title to event title
    // url += "&text=" + TrimURITo(tab.title, maxLength);

    // Check if the selected text contains a US formatted address
    // and it its first 100 chars to URI if so
    var address = selection.match(/(\d+\s+[':.,\s\w]*,\s*[A-Za-z]+\s*\d{5}(-\d{4})?)/m);
    if (address) {
        // Location goes to location
        url += "&location=" + TrimURITo(address[0], maxLength - url.length);
    }

    // URL goes to star of details (event description)
    url += "&details=" + TrimURITo(tab.url + "\n\n", maxLength - url.length);

    // Selection goes to end of details, and to ctext (google calendar quick add),
    // (trim to half of the available length cause its twice in the URI)
    // ctext is also prepended with tab.title,
    // so that Google Calendar can use it to generate the text,
    // but can also include other info.
    var title = TrimURITo(tab.title + "\n", maxLength - url.length);
    var selection = TrimURITo(selection, (maxLength - url.length)/2 - title.length);
    url += selection + "&ctext=" + title + selection;
	
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

// TODO: configuration to include tab.url in description?
