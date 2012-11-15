Zotero.Z2CSL = {
	init: function() {
		//load utilities.js so we can fetch the CSL mappings
		var context = { Zotero: {} };
		Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader)
			.loadSubScript("chrome://zotero/content/xpcom/utilities.js", context);
		this.cslTypeMap = context.CSL_TYPE_MAPPINGS;
		this.cslFieldMap = context.CSL_TEXT_MAPPINGS;
		this.cslDateMap = context.CSL_DATE_MAPPINGS;
		this.cslCreatorMap = context.CSL_NAMES_MAPPINGS;
		this.zoteroTypes = Zotero.ItemTypes.getTypes();
	},

	exportMappings: function() {
		var map = {name:'map', childNodes:[] };

		var type, fields, baseField;
		var nodes = [];

		for(var i=0, n=this.zoteroTypes.length; i<n; i++) {
			type = {name:'typeMap',
							attributes:{
								zType:this.zoteroTypes[i].name,
								cslType:this.cslTypeMap[this.zoteroTypes[i].name]
							},
							childNodes:[]
				};

			fields = Zotero.ItemFields.getItemTypeFields(this.zoteroTypes[i].id);
			var fieldMap, baseField;
			for(var j=0, m=fields.length; j<m; j++) {
				fieldMap = {name:'field', attributes:{ value:Zotero.ItemFields.getName(fields[j]) } };

				//Also retrieve base field so we can map to CSL
				if(!Zotero.ItemFields.isBaseField(fields[j])) {
					baseField = Zotero.ItemFields.getBaseIDFromTypeAndField(this.zoteroTypes[i].id, fields[j]);
					if(baseField !== false) {
						fieldMap.attributes.baseField = Zotero.ItemFields.getName(baseField);
					}
				}
	
				type.childNodes.push(fieldMap);
			}

			//add valid creator types
			var creators = Zotero.CreatorTypes.getTypesForItemType(this.zoteroTypes[i].id);
			var primaryID = Zotero.CreatorTypes.getPrimaryIDForType(this.zoteroTypes[i].id);
			var creator, creatorNodes;
			if(creators.length) {
				creatorNodes = {name:'field', attributes:{ value:'creator'}, childNodes: []};
				for(var j=0, m=creators.length; j<m; j++) {
					creator = {name:'creatorType', attributes:{ value:creators[j].name } };
					//1 is author anyway
					if(primaryID != 1 && creators[j].id == primaryID) {
						creator.attributes.baseField = 'author';
					}
					creatorNodes.childNodes.push(creator);
				}
				type.childNodes.push(creatorNodes);
			}
			nodes.push(type);
		}
		map.childNodes.push({name:'zTypes', childNodes:nodes}) ;

		nodes = [];
		var f;
		for(f in this.cslFieldMap) {
			for(var i=0, n=this.cslFieldMap[f].length; i<n; i++) {
				nodes.push({name:'fieldMap', attributes:{zField: this.cslFieldMap[f][i], cslField: f}});
			}
		}

		//add dates
		for(f in this.cslDateMap) {
			nodes.push({name:'fieldMap', attributes:{zField: this.cslDateMap[f], cslField: f}});
		}
		map.childNodes.push({name:'cslFieldMap', childNodes:nodes});

		//add csl creator map
		nodes = [];
		for(f in this.cslCreatorMap) {
			nodes.push({name:'creatorMap', attributes:{zCreator: f, cslCreator: this.cslCreatorMap[f]}});
		}
		map.childNodes.push({name:'cslCreatorMap', childNodes:nodes});

		this.writeFile(this.jsonToXML(map));
	},

	writeFile: function(data) {
		//output XML data
		Components.utils.import("resource://gre/modules/NetUtil.jsm");
		Components.utils.import("resource://gre/modules/FileUtils.jsm"); 

		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select a file to save to", nsIFilePicker.modeSave);

		fp.appendFilters(nsIFilePicker.filterXML)
		fp.appendFilters(nsIFilePicker.filterAll);

		fp.defaultExtension = 'xml';
		fp.defaultString = 'typeMap';

		var res = fp.show();

		if (res != nsIFilePicker.returnCancel){
			var file = fp.file;
			var ostream = FileUtils.openSafeFileOutputStream(file)

			var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
										 createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
			converter.charset = "UTF-8";
			var istream = converter.convertToInputStream(data);
			NetUtil.asyncCopy(istream, ostream);
		}
	},

	jsonToXML: function(obj, indent) {
		if(typeof(attributes) != 'object') {
			attributes = {};
		}

		var indentDelim = '  ';	//two spaces

		var xml = '';
		//top level
		if(typeof(indent) == 'undefined') {
			xml += '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="typeMap.xsl"?>\n\n';
			indent = '';
		} else {
			indent += indentDelim;
		}

		xml += indent + '<' + obj.name;
		var attr;
		if(obj.attributes) {
			for(attr in obj.attributes) {
				xml += ' ' + attr + '="' + this.stringify(obj.attributes[attr]) + '"';
			}
		}

		if(obj.value || obj.childNodes) {
			xml += '>';

			if(obj.value) {
				xml += this.stringify(obj.value);
			} else if(obj.childNodes) {
				xml += '\n';
				for(var i=0, n=obj.childNodes.length; i<n; i++) {
					xml += this.jsonToXML(obj.childNodes[i], indent) + '\n';
				}
				xml += indent;
			}
			xml += '</' + obj.name + '>';
		} else {
			xml += ' />';
		}

		return xml;
	},

	stringify: function(obj) {
		if(typeof(obj) == 'undefined' || typeof(obj) == 'null') {
			return '';
		} else {
			return '' + obj;
		}
	}
};

// Initialize the utility
window.addEventListener('load', function(e) { Zotero.Z2CSL.init(); }, false);