// Only create main object once
if (!Zotero.Z2CSL) {
	const loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://z2csl/content/z2csl.js");
}
