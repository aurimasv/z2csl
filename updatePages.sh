#!/bin/bash

# ------
# This updates the typeMap files in the gh-pages branch
# with the version from the current branch.
# ------

BRANCH=$(git symbolic-ref --short HEAD)
echo "$BRANCH"

status=$(git status | grep 'working directory clean')
if [[ -z "$status" ]]; then
    echo "Working directory is not clean."
	exit
fi

git checkout gh-pages
git checkout "$BRANCH" typeMap.css typeMap.xml typeMap.xsl

status=$(git status | grep 'working directory clean')
if [[ ! -z "$status" ]]; then
    echo "The files for the typeMap didn't change."
	exit
fi

git add typeMap.css typeMap.xml typeMap.xsl
git commit -m "Update $(date)" -m "From branch $BRANCH"
