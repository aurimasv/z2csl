#!/bin/bash

# ------
# This updates the typeMap files in the gh-pages branch
# with the version form the master branch.
# ------

status=$(git status | grep 'working directory clean')
if [[ -z "$status" ]]; then
    echo "Working directory is not clean."
	exit
fi

git checkout gh-pages
git checkout master typeMap.css typeMap.xml typeMap.xsl

status=$(git status | grep 'working directory clean')
if [[ ! -z "$status" ]]; then
    echo "The files for the typeMap didn't change."
	exit
fi

git add typeMap.css typeMap.xml typeMap.xsl
git commit -m "Update $(date)"

git checkout master
