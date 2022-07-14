#!/bin/bash

mkdir -p build
rm -f build/z2csl.xpi
zip -r  build/z2csl.xpi \
	chrome.manifest \
	install.rdf \
	content/
