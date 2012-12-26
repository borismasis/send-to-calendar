//create the context menu 
var cmSendToCalendar = chrome.contextMenus.create({ "title": "Send To Calendar", "contexts": ["all"], "onclick": SendToCalendar });

//do all the things
function SendToCalendar(data, tab) {
    
	var location = "";
	var selection = "";
	
	if (data.selectionText) {
		//get the selected text and uri encode it
		selection = data.selectionText;
		
		//check if the selected text contains a US formatted address
		var address = data.selectionText.match(/(\d+\s+[':.,\s\w]*,\s*[A-Za-z]+\s*\d{5}(-\d{4})?)/m);
		if (address) 
			location = "&location=" + address[0];
	}
	
	//build the url: selection goes to ctext (google calendar quick add), page title to event title, and include url in description
	var url = "http://www.google.com/calendar/event?action=TEMPLATE&text=" + tab.title + location +
	"&details=" + tab.url + "  " + selection + "&ctext=" + selection;
	
	//url encode (with special attention to spaces & paragraph breaks) 
	//and trim at 1,000 chars to account for 2,000 character limit with buffer for google login/redirect urls
	url = encodeURI(url.replaceAll("  ", "\n\n")).replaceAll("%20", "+").replaceAll("%2B", "+").substring(0,1000);
	
	//the substring might cut the url in the middle of a url encoded value, so we need to strip any trailing % or %X chars to avoid an error 400
	if (url.substr(url.length-1) === "%") {url = url.substring(0,url.length-1)}
	else if(url.substr(url.length-2,1) === "%" ) {url = url.substring(0,url.length-2)}
	
	//open the created url in a new tab
	chrome.tabs.create({ "url": url}, function (tab) {});
	
}

//helper replaceAll function
String.prototype.replaceAll = function(strTarget, strSubString){
	var strText = this;
	var intIndexOfMatch = strText.indexOf( strTarget );
	 
	while (intIndexOfMatch != -1){
		strText = strText.replace( strTarget, strSubString )
		intIndexOfMatch = strText.indexOf( strTarget );
	}

	return( strText );
	
}