# -*- coding: utf-8 -*- 
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from ConfigParser import ConfigParser
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle, TA_CENTER
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, SimpleDocTemplate, Spacer
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('msyh', 'msyh.ttf'))
import os
import sys

reload(sys)    
sys.setdefaultencoding('utf-8')   #修改默认编码方式，默认为ascci  

########################################################################
class Report(object):
    """"""
 
    #----------------------------------------------------------------------
    def __init__(self):
        """Constructor"""
        self.width, self.height = letter
        self.styles = getSampleStyleSheet()
        
        cf = ConfigParser()
        tmp = os.path.abspath(sys.argv[0])
        tmp = os.path.dirname(tmp)
        tmp = os.path.join(tmp, "case.ini")
        print "case.ini:" + tmp
        cf.read(tmp)
        self.caseLocation = cf.get('case', 'caseLocation')
        self.caseName = cf.get('case', 'caseName')
        self.caseUrl = cf.get('case', 'caseUrl')
        self.caseInvestigator = cf.get('case', 'caseInvestigator')
 
    #----------------------------------------------------------------------
    def coord(self, x, y, unit=1):
        """


        Helper class to help position flowables in Canvas objects
        """
        x, y = x * unit, self.height -  y * unit
        return x, y
 
    #----------------------------------------------------------------------
    def run(self):
        """
        Run the report
        """
        reportPath = os.path.join(self.caseLocation, self.caseName, "报告.pdf")
        self.doc = SimpleDocTemplate(reportPath.decode('UTF-8'))
        self.story = [Spacer(1, 1.7*inch)]
        self.createLineItems()
 
        self.doc.build(self.story, onFirstPage=self.createDocument)
        print "finished!"
    def _getCaptureUrls(self):
        captureUrlsFile = os.path.join(self.caseLocation, self.caseName, "capturedUrls.txt")
        captureUrls = {}
        with open(captureUrlsFile.decode('UTF-8'), 'r') as fd:
            lines = fd.readlines()
            #fd.write(uuid + '\t' + url + '\t' + localMHTMLFilePath + '\t' + md5 + '\t' + sha256 + '\n')
            for i in lines:
                print i
                words = i.split('\t')
                if len(words) == 5:
                    uuid = words[0]
                    url = words[1]
                    localFile  = words[2]
                    md5 = words[3]
                    sha256 = words[4]
                    print uuid, url, localFile, md5, sha256
                    
                    tmp = os.path.splitext(localFile)
                    print 'filetype:' + tmp[1]
                    if uuid in captureUrls:
                        value = captureUrls[uuid]
                        if tmp[1] == ".mhtml":
                            value['mhtml'] = localFile
                        else:
                            value['png'] = localFile
                        captureUrls[uuid] = value
                    else:
                        value = {}
                        value['url'] = url
                        if tmp[1] == ".mhtml":
                            value['mhtml'] = localFile
                        else:
                            value['png'] = localFile
                        captureUrls[uuid] = value
                        pass
        return captureUrls
    #----------------------------------------------------------------------
    def createDocument(self, canvas, doc):
        """
        Create the document
        """
		
        self.c = canvas
        self.c.setFont('msyh', 8)  
        normal = self.styles["Normal"]
        
        
        
        #title
        header_text = "<font name='msyh' size=14><b>{0}</b></font>".format(self.caseName)
        p = Paragraph(header_text, normal)
        p.wrapOn(self.c, self.width, self.height)
        p.drawOn(self.c, self.width / 2 - len(self.caseName) * 8 / 2, self.height - 16)
        
        p = Paragraph("<b>Case Info</b>", normal)
        p.wrapOn(self.c, self.width, self.height)
        p.drawOn(self.c, 20, self.height - 32 )
        self.c.line(20, self.height - 32,self.width, self.height - 32)
        
        self.c.drawString(30, self.height - 48, 'Investigator:')
        #self.c.line(150, self.height - 48, 580, self.height - 48)
        self.c.drawString(150,self.height - 48, self.caseInvestigator)
		
        self.c.drawString(30, self.height - 64,'URL:')
        #self.c.line(150, self.height - 64, 580, self.height - 64)
        self.c.drawString(150, self.height - 64, self.caseUrl)
        
        tryCaptureUrlsFile = os.path.join(self.caseLocation, self.caseName, "tryCaptureUrls.txt")
        tryCaptureUrls = {}
        with open(tryCaptureUrlsFile.decode('UTF-8'), "r") as fd:
            lines = fd.readlines()
            #fd.write(uuid + '\t' + url + '\n')
            for i in lines:
                words = i.split('\t')
                if len(words) == 2:
                    tryCaptureUrls[words[0]] = words[1]
        
        
        captureUrls = self._getCaptureUrls()
        self.c.drawString(30, self.height - 80, 'CapturedUrl total:')
        #self.c.line(150, self.height - 80, 580, self.height - 80)
        self.c.drawString(150, self.height - 80, str(len(tryCaptureUrls)))
        
        self.c.drawString(30, self.height - 96, 'CapturedUrl success:')
        #self.c.line(150, self.height - 96, 580, self.height - 96)
        self.c.drawString(150, self.height - 96, str(len(captureUrls)))
 
        self.c.drawString(30, self.height - 112, 'CapturedUrl fail:')
        #self.c.line(150, self.height - 112,580, self.height - 112)
        self.c.drawString(150, self.height - 112, str(len(tryCaptureUrls) - len(captureUrls)))
        
        p = Paragraph("<b>Captured Success URL</b>", self.styles["Normal"])
        p.wrapOn(self.c, self.width, self.height)
        p.drawOn(self.c, 20, self.height - 150 )
        self.c.line(20, self.height - 150,self.width, self.height - 150)
    #----------------------------------------------------------------------
    def createLineItems(self):
        """
        Create the line items
        """
        
        text_data = ["ID", "URL", "MHTML", "PNG"]
        d = []
        font_size = 8
        centered = ParagraphStyle(name="centered", alignment=TA_CENTER)
        for text in text_data:
            ptext = "<font size=%s><b>%s</b></font>" % (font_size, text)
            p = Paragraph(ptext, centered)
            d.append(p)
 
        data = [d]
 
        line_num = 1
 
        formatted_line_data = []
 
        captureUrls = self._getCaptureUrls()
        for k in captureUrls:
            value = captureUrls[k]
            line_data = [str(line_num), value['url'], value['mhtml'], 
                         value.get('png', "")]
 
            for item in line_data:
                ptext = "<font size=%s>%s</font>" % (font_size-1, item)
                p = Paragraph(ptext, centered)
                formatted_line_data.append(p)
            data.append(formatted_line_data)
            formatted_line_data = []
            line_num += 1
 
        table = Table(data, colWidths=[20, 330, 100, 100])
 
        self.story.append(table)
 
#----------------------------------------------------------------------
if __name__ == "__main__":
    t = Report()
    t.run()