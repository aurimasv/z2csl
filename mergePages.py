#!/usr/bin/python
#-*- coding: utf-8 -*-

from lxml import html
import sys,re

class Pages:

    def __init__(self, old_page="oldpage.html", new_page="newpage.html", output_page="page.html"):
        self.old_page = old_page
        self.new_page = new_page
        self.output_page = output_page
        self.typedata = {}
        self.doc = html.parse("newpage.html")
    
    def readOldData(self):
        doc = html.parse(self.old_page)
        start = False
        firstrow = True
        elems = doc.xpath("//h3[following-sibling::table]|//h3/following-sibling::table//tr/td");
        for i in range(0, len(elems), 1):
            elem = elems[i]
            if elem.tag == "h3":
                if firstrow:
                    firstrow = False
                    continue
                start = True
                mytype = re.split(u"\s*→\s*",elem.text_content())[0]
                self.typedata[mytype] = {}
                rowdata  = {}
                tagcount = 0
            elif elem.tag == "td" and start:
                if tagcount % 3 == 0:
                    rowdata["label"] = elem.text_content()
                elif tagcount % 3 == 1:
                    zVar = re.sub("\s*\([^)]*\)\s*","",elem.text_content())
                elif tagcount % 3 == 2:
                    rowdata["cVar"] = elem.text_content()
                    self.typedata[mytype][zVar] = rowdata
                    rowdata  = {}
                tagcount += 1

    def putOldDataInNewPage(self):
        self.doc = html.parse("newpage.html")
        elems = self.doc.xpath("//h3[following-sibling::table]|//h3/following-sibling::table//tr/td");
        start = False
        firstrow = True
        
        for i in range(0, len(elems), 1):
            elem = elems[i]
            if elem.tag == "h3":
                if firstrow:
                    firstrow = False
                    continue
                start = True
                mytype = re.split(u"\s*→\s*",elem.text_content())[0]
                if not self.typedata.has_key(mytype):
                    print "New type: %s" % mytype
                    elem.set("class","onew");
                tagcount = 0
            elif elem.tag == "td" and start:
                if tagcount % 3 == 0:
                    pass
                elif tagcount % 3 == 1:
                    zVar = re.sub("\s*\([^)]*\)\s*","",elem.text_content())
                    if not self.typedata.has_key(mytype) or not self.typedata[mytype].has_key(zVar):
                        elem.getparent().set("class","onew")
                elif tagcount % 3 == 2:
                    if self.typedata.has_key(mytype) and self.typedata[mytype].has_key(zVar) and self.typedata[mytype][zVar]["cVar"] != elem.text_content():
                        elem.set("class","onew")
                tagcount += 1

    def writePage(self):
        self.doc.write(open(self.output_page,"w+"))

if __name__ == '__main__':

    from optparse import OptionParser

    usage = '\n%prog <old>.html <new>.html <output>.html'

    description="Merge the composed HTML output from z2csl + typeMap.xsl run against official Zotero and MLZ into a single page."

    parser = OptionParser(usage=usage,description=description,epilog="Happy converting!")

    if len(sys.argv) != 4:
        print "\nERROR: script takes exactly 3 arguments\n"
        print parser.print_help()
        sys.exit()

    pg = Pages(sys.argv[1], sys.argv[2], sys.argv[3])
    pg.readOldData()
    pg.putOldDataInNewPage()
    pg.writePage()
