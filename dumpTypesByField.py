#!/usr/bin/python
#-*- coding: utf-8 -*-

from lxml import html
import sys,re

class Page:
    
    def __init__(self, page_name):
        self.page_name = page_name
        self.lists = {}
        self.listoflistkeys = []
        self.alltypes = []

    def extractData(self):
        doc = html.parse(self.page_name)
        elems = doc.xpath("//table[@class='type-fields']");
        for i in range(0,len(elems),1):
            label = elems[i].attrib['label']
            if label == "Attachment" or label == "Note":
                continue
            self.alltypes.append(label)
            zType = elems[i].attrib['name']
            fieldelems = doc.xpath("//table[@class='type-fields' and @label='%s']/tbody/tr/td[1]" % (label,));
            fieldelemscsl = doc.xpath("//table[@class='type-fields' and @label='%s']/tbody/tr/td[3]" % (label,));
        
            for i in range(0,len(fieldelems),1):
                fieldelem = fieldelems[i]
                cslelem = fieldelemscsl[i]
                if fieldelem.text_content():
                    fieldlabel = re.sub("\(.*\)","",fieldelem.text_content())
                    if not self.lists.has_key(fieldlabel):
                        cslname = cslelem.text_content()
                        if not cslname:
                            continue
                        self.lists[fieldlabel] = [cslname,[],[]];
                    self.lists[fieldlabel][1].append(label)
                    if not fieldlabel in self.listoflistkeys:
                        self.listoflistkeys.append(fieldlabel)
        self.listoflistkeys.sort()
        self.alltypes.sort()

    def dumpData(self):
        
        for fieldlabel in self.listoflistkeys:
            print "   :label: %s" % fieldlabel
            print "   :csl-variable: %s" % self.lists[fieldlabel][0]
            self.lists[fieldlabel][1].sort()
            for f in self.alltypes:
                if not f in self.lists[fieldlabel][1]:
                    self.lists[fieldlabel][2].append(f)
            self.lists[fieldlabel][2]
            print "   :csl-types: %s" % (",".join(self.lists[fieldlabel][1]),)
            print "   :csl-types-unused: %s" % (",".join(self.lists[fieldlabel][2]),)
            print ""

if __name__ == '__main__':

    from optparse import OptionParser

    usage = '\n%prog <filename>.html'

    description="Dump lists of item types for each field."

    parser = OptionParser(usage=usage,description=description,epilog="Happy scripting!")

    if len(sys.argv) != 2:
        print "\nERROR: script takes exactly one argument\n"
        print parser.print_help()
        sys.exit()

    pg = Page(sys.argv[1])
    pg.extractData()
    pg.dumpData()
