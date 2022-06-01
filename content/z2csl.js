Zotero.Z2CSL = {
	cslVars: null,

	init: function() {
		//load utilities.js so we can fetch the CSL mappings
		var context = { Zotero: {}, XRegExp: {} };
		Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader)
			.loadSubScript("chrome://zotero/content/xpcom/utilities/schema.js", context);
		this.debug(context)
		this.cslTypeMap = Zotero.Schema.CSL_TYPE_MAPPINGS;
		this.debug("starting z2scl")
		
		
		this.debug(Zotero.Schema.CSL_TYPE_MAPPINGS);
		this.cslFieldMap = Zotero.Schema.CSL_TEXT_MAPPINGS;
		if (Zotero.version.charAt(0)<5) {
			// In Zotero 4.0 version instead of versionNumber is used
			// see https://github.com/zotero/zotero/blob/4.0/chrome/content/zotero/xpcom/utilities.js#L1515
			this.cslFieldMap["version"] = ["version"];
		}
<<<<<<< Updated upstream
		this.cslDateMap = context.CSL_DATE_MAPPINGS;
		this.cslCreatorMap = context.CSL_NAMES_MAPPINGS;
		this.zoteroTypes = Zotero.ItemTypes.getTypes();
=======
		this.cslDateMap = Zotero.Schema.CSL_DATE_MAPPINGS;
		this.cslCreatorMap = Zotero.Schema.CSL_NAMES_MAPPINGS;
>>>>>>> Stashed changes
	},

	exportMappings: function() {
		var map = {name:'map', childNodes:[] };
		
		this.debug("Compiling header...");
		
		//add current Zotero version and date of creation
		map.childNodes.push({ name:'zoteroVersion',
													attributes: { value: Zotero.version }
												});
		map.childNodes.push({ name:'date',
													attributes: { value: (new Date()).toUTCString()}
												});

		var type, fields, baseField;
		var nodes = [];
		
		this.debug("Creating item type map...");
<<<<<<< Updated upstream
		
=======
		this.debug("Checking on debug")
		this.zoteroTypes = Zotero.ItemTypes.getTypes();
>>>>>>> Stashed changes
		for(var i=0, n=this.zoteroTypes.length; i<n; i++) {
			type = {name:'typeMap',
							attributes:{
								zType:this.zoteroTypes[i].name,
								cslType:this.cslTypeMap[this.zoteroTypes[i].name]
							},
							childNodes:[]
				};
				
			this.debug("* Adding fields for " + this.zoteroTypes[i].name);
			fields = Zotero.ItemFields.getItemTypeFields(this.zoteroTypes[i].id);
			var fieldMap, baseField;
			for(var j=0, m=fields.length; j<m; j++) {
				fieldMap = {
										name:'field',
										attributes:{
												label:Zotero.ItemFields.getLocalizedString(this.zoteroTypes[i].id,fields[j]),
												value:Zotero.ItemFields.getName(fields[j])
										}
								};

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
			this.debug("* Adding creator types");
			var creators = Zotero.CreatorTypes.getTypesForItemType(this.zoteroTypes[i].id);
			var primaryID = Zotero.CreatorTypes.getPrimaryIDForType(this.zoteroTypes[i].id);
			var creator, creatorNodes;
			if(creators.length) {
				creatorNodes = {name:'field', attributes:{ value:'creator'}, childNodes: []};
				for(var j=0, m=creators.length; j<m; j++) {
					creator = {
												name:'creatorType',
												attributes:{
														label:Zotero.getString('creatorTypes.' + creators[j].name),
														value:creators[j].name
												}
										};
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

		this.debug("Mapping zotero fields to CSL...");
		nodes = [];
		var f;
		for(f in this.cslFieldMap) {
			for(var i=0, n=this.cslFieldMap[f].length; i<n; i++) {
				nodes.push({name:'map', attributes:{zField: this.cslFieldMap[f][i], cslField: f}});
			}
		}

		//add dates
		this.debug("...adding date fields...");
		for(f in this.cslDateMap) {
			nodes.push({name:'map', attributes:{zField: this.cslDateMap[f], cslField: f}});
		}
		map.childNodes.push({name:'cslFieldMap', childNodes:nodes});

		//add csl creator map
		this.debug("Mapping creators...");
		nodes = [];
		for(f in this.cslCreatorMap) {
			nodes.push({name:'map', attributes:{zField: f, cslField: this.cslCreatorMap[f]}});
		}
		map.childNodes.push({name:'cslCreatorMap', childNodes:nodes});

		//add internal remapping that occurs within citeproc.js
		//see http://forums.zotero.org/discussion/26312/csl-variables-used-in-zotero-but-not-in-documentation/
		this.debug("Adding re-mappings...");
		nodes = [];
		nodes.push({ name:'remap', attributes:{
			citeprocField: 'shortTitle',
			cslUsage: 'title-short or &lt;text variable=&quot;title&quot; form=&quot;short&quot;/&gt;',
			descKey: 'title-short'
		}});
		nodes.push({ name:'remap', attributes:{
			citeprocField: 'journalAbbreviation',
			cslUsage: 'container-title-short or &lt;text variable=&quot;container-title&quot; form=&quot;short&quot;/&gt;',
			descKey: 'container-title-short'
		}});
		map.childNodes.push({name:'citeprocJStoCSLmap', childNodes:nodes});

		this.debug("Fetching CSL variable descriptions...");
		var me = this;
		this.retrieveCSLVariables(function(cslVars) {
			map.childNodes.push(cslVars);
			me.writeFile(me.jsonToXML(map));
		});
	},

	writeFile: async function(data) {
		//output XML data
		this.debug("Opening File Picker...");
		
		var FilePicker = require('zotero/filePicker').default;
		Components.utils.import("resource://gre/modules/NetUtil.jsm");
		Components.utils.import("resource://gre/modules/FileUtils.jsm");

		/*
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select a file to save to", nsIFilePicker.modeSave);

		fp.appendFilters(nsIFilePicker.filterXML)
		fp.appendFilters(nsIFilePicker.filterAll);

		fp.defaultExtension = 'xml';
		fp.defaultString = 'typeMap';

		var res = fp.show();

		if (res != nsIFilePicker.returnCancel){
			this.debug("Writing data to file...");
			var file = fp.file;
			var ostream = FileUtils.openSafeFileOutputStream(file)

			var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
										 createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
			converter.charset = "UTF-8";
			var istream = converter.convertToInputStream(data);
			NetUtil.asyncCopy(istream, ostream);
		} */
		let fp = new FilePicker();
	  fp.init(window, "Select a file to save to", fp.modeSave);
		fp.appendFilters(fp.filterAll);
		
		let res = await fp.show();
		if (res != fp.returnCancel) {
			this.debug("Writing data to file...");
			this.debug(data)
			var file = fp.file;
			var ostream = FileUtils.openSafeFileOutputStream(file)

			var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
										 createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
			converter.charset = "UTF-8";
			var istream = converter.convertToInputStream(data);
			this.debug("NetUtil")
			NetUtil.asyncCopy(istream, ostream);

		}

		this.debug("Done");
	},

	retrieveCSLVariables: function(callback) {
		if(this.cslVars) callback(this.cslVars);

<<<<<<< Updated upstream
		var url = 'http://citationstyles.org/downloads/specification.html';
=======
		var url = 'https://docs.citationstyles.org/en/stable/specification.html';
>>>>>>> Stashed changes
		var me = this;

		Zotero.HTTP.processDocuments(url, function(doc) {
				me.debug("...got data from server...");
				var cslVars = { name: 'cslVars', childNodes: [] };

				var namespaces = {"xhtml": "http://www.w3.org/1999/xhtml"};
				//types
				me.debug("* getting type descriptions...");
				var types = Zotero.Utilities.xpath(doc, '//xhtml:div[@id="appendix-iii-types"]/xhtml:ul/xhtml:li', namespaces);
				var t = { name: 'itemTypes', childNodes: [] };
				for(var i=0, n=types.length; i<n; i++) {
					t.childNodes.push({
						name: 'type',
						attributes: { name: types[i].textContent }
					});
				}
				cslVars.childNodes.push(t);
				
				//variables
				me.debug("* getting variable descriptions...");
				var variables = Zotero.Utilities.xpath(doc, '//xhtml:div[@id="appendix-iv-variables"]', namespaces)[0];
				if(!variables) throw new Error('Could not locate CSL variables');

				var varXPath = {
					standard: './xhtml:div[@id="standard-variables"]/xhtml:dl/*[self::xhtml:dt or self::xhtml:dd]',
					number: './/xhtml:div[@id="number-variables"]/xhtml:dl/*[self::xhtml:dt or self::xhtml:dd]',
					date: './xhtml:div[@id="date-variables"]/xhtml:dl/*[self::xhtml:dt or self::xhtml:dd]',
					name: './xhtml:div[@id="name-variables"]/xhtml:dl/*[self::xhtml:dt or self::xhtml:dd]'
				};

				var vars = { name: 'vars', childNodes: [] };
				/**
				 * At the time of writing, the following are not found on citationstyles.org page.
				 * We add a description to them later, but make sure we don't overwrite or double-up
				 * on these fields
				 * see http://forums.zotero.org/discussion/26312/csl-variables-used-in-zotero-but-not-in-documentation/
				 */
				me.debug("* adding missing descriptions...");
				var missing = {
					'language': {
						type: 'standard',
						description: 'Language code. Not intended for display purposes.'
					}
				};
				var m, node;
				for(var v in varXPath) {
					var vbt = Zotero.Utilities.xpath(variables, varXPath[v], namespaces);
					for(var i=0, n=vbt.length; i<n; i+=2) {
						node = {
							name: 'var',
							attributes: {
								name: vbt[i].textContent,
								type: v,
								description: me.escapeQuotes(
									Zotero.Utilities.trimInternal(vbt[i+1].textContent)
									)
							}
						};
						
						//remove missing items that were found
						if(missing[node.attributes.name]) {
							delete missing[node.attributes.name];
						}
						
						vars.childNodes.push(node);
					}
				}
				
				//fill in missing fields
				for(var field in missing) {
					vars.childNodes.push({
							name: 'var',
							attributes: {
								name: field,
								type: missing[field].type,
								description: missing[field].description
							}
					});
				}
				
				cslVars.childNodes.push(vars);

				me.cslVars = cslVars;
				callback(cslVars);
			},
			null,
			function(e) {
				throw e;
			}
		);
	},

	escapeQuotes: function(str) {
		return str.replace(/"/g, '&quot;');
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
	},
	
	debug: function(msg) {
		Zotero.debug("z2csl: " + msg);
	}
};

// Initialize the utility
window.addEventListener('load', function(e) { Zotero.Z2CSL.init(); }, false);
