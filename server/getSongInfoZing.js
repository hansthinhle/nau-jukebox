/**
 * Zing MP3 URL parser module
 */
/*global getSongInfoZing:true, getGzipURL, xml2js*/
var xmlURLReg = /http:\/\/mp3.zing.vn\/xml\/song-xml\/(\w+)/;

/**
 * Get Zing stream URL and other info
 *
 * @param  {[type]} songurl [description]
 * @return {[type]}         [description]
 */
getSongInfoZing = function(songurl) {
	var linkRes, xmlURLResults, xmlURL;

	// First Step: parse the HTML page to get the XML data URL for the flash-based player

	try {
		linkRes = getGzipURL(songurl);
	} catch (err) {
		console.error('Get Zing MP3 URL Error', err);
	}

	linkRes = (linkRes.content) ? linkRes.content : '';
	// console.log('linkRes:', linkRes);

	// run the html against regexp to get XML URL
	xmlURLResults = xmlURLReg.exec(linkRes);

	if (xmlURLResults) {
		xmlURL = xmlURLResults[0];
		console.log('xmlURLResults:', xmlURLResults[0]);
	} else {
		console.log('xmlURL parse failed');
		return null;
	}

	// Second Step: get the XML data file for the sone

	var xmlRes, json;

	// Note: Manually install the node package in server folder
	var parser = new xml2js.Parser({
		trim: true
	});

	// console.log('XML2JS:', XML2JS);

	try {
		xmlRes = getGzipURL(xmlURL);
		xmlRes = xmlRes.content;
		// console.log('Response:', xmlRes);

		// Third Step: parse and convert the XML string to JSON object

		parser.parseString(xmlRes, function(error, result) {
			json = result;
		});
		console.log('==> ' + JSON.stringify(json));
		// see sample JSON below

	} catch (err) {
		console.error('Get Zing stream Error', err);
	}

	// Fourth Step: normalize the JSON object to a song record

	if (json && json.data && json.data.item[0]) {
		console.log('Checking the XML data');
		var jsonItem = json.data.item[0];

		//Not so soon, some Zing URL are blocked due to copyright issue
		if (jsonItem.source[0] && String(jsonItem.errorcode[0]) === '0') {
			console.log('URL is valid. Adding new song.');
			return {
				timeAdded: Date.now(),
				originalURL: songurl,
				origin: 'Zing',
				name: jsonItem.title[0],
				artist: jsonItem.performer[0],
				streamURL: jsonItem.source[0]
			};
		} else {
			//TODO: find out away to throw custom error
			return null;
		}

	} else {
		return null;
	}
};

// sample JSON response:
// {
//   "data": {
//     "$": {
//       "page": "http://mp3.zing.vn/bai-hat/Nhu-Nhung-Phut-Ban-Dau-Hoai-Lam/ZW6D0IBA.html"
//     },
//     "item": [
//       {
//         "$": {
//           "type": "mp3"
//         },
//         "title": [
//           "Như Những Phút Ban Đầu"
//         ],
//         "performer": [
//           "Hoài Lâm"
//         ],
//         "link": [
//           "http://mp3.zing.vn/tim-kiem/bai-hat.html?q=Hoai+Lam"
//         ],
//         "source": [
//           "http://mp3.zing.vn/xml/load-song/MjAxNCUyRjA4JTJGMDUlMkZhJTJGMSUyRmExZjIxMDNhZDNiOWRkZGJiNmQxZWI2ZGM3ZjQwMGE2Lm1wMyU3QzI="
//         ],
//         "hq": [
//           "require vip"
//         ],
//         "duration": [
//           "335"
//         ],
//         "errorcode": [
//           "0"
//         ],
//         "errormessage": [
//           ""
//         ]
//       }
//     ]
//   }
// }