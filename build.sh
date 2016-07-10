#!/bin/bash

mkdir -p build
git archive --format=zip -o build/z2csl.xpi HEAD \
	chrome.manifest \
	install.rdf \
	content/
