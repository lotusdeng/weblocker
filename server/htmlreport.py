# -*- coding: utf-8 -*-
import sys
import os
import shutil
import time
from ConfigParser import ConfigParser
from jinja2 import Environment
from jinja2.loaders import FileSystemLoader
import logging
import traceback
import inspect  

reload(sys)
sys.setdefaultencoding("utf-8")

class StreamToLogger(object):
   """
   Fake file-like stream object that redirects writes to a logger instance.
   """
   def __init__(self, logger, log_level=logging.INFO):
      self.logger = logger
      self.log_level = log_level
      self.linebuf = ''
 
   def write(self, buf):
      for line in buf.rstrip().splitlines():
         self.logger.log(self.log_level, line.rstrip())

         
class Report():
    def __init__(self):
        """Constructor"""
        cf = ConfigParser()
        tmp = os.path.abspath(sys.argv[0])
        tmp = os.path.dirname(tmp)
        tmp = os.path.join(tmp, "case.ini")
        self.logger, self.handler = self._getLogger()
        
        self.logger.info("case.init: " + tmp)
        
        cf.read(tmp)
        self.caseLocation = cf.get('case', 'caseLocation')
        self.caseName = cf.get('case', 'caseName')
        self.caseUrl = cf.get('case', 'caseUrl')
        self.caseInvestigator = cf.get('case', 'caseInvestigator')
        self.md5 = cf.get('case', 'md5')
        self.sha256 = cf.get('case', 'sha256')
        self.capturePic = cf.get('case', 'capturePic')
        self.caseStartTime = cf.get('case', 'startTime')
        self.caseEndTime = cf.get('case', 'endTime')
        
    def _getLogger(self):
       
        logger = logging.getLogger('htmlreport')
        
        this_file = inspect.getfile(inspect.currentframe())  
        dirpath = os.path.abspath(os.path.dirname(this_file))
        logFilePath = os.path.join(dirpath, "htmlreport.log")
        print "log to " + logFilePath
        handler = logging.FileHandler(logFilePath)  
          
        formatter = logging.Formatter('%(asctime)s %(name)-12s %(levelname)-8s %(message)s')  
        handler.setFormatter(formatter)  
          
        logger.addHandler(handler)
        
        #sl = StreamToLogger(logger, logging.INFO)
        #sys.stdout = sl
        #sys.stderr = sl
        
        logger.setLevel(logging.INFO)  
          
        return logger, handler
    
    def get_urls(self):
        tryCaptureUrlsFile = os.path.join(self.caseLocation, self.caseName, "点击的网址.txt")
        tryCaptureUrls = {}
        with open(tryCaptureUrlsFile.decode('UTF-8'), "r") as fd:
            lines = fd.readlines()
            #fd.write(uuid + '\t' + url + '\n')
            for i in lines:
                words = i.split('\t')
                if len(words) == 3:
                    tryCaptureUrls[words[0]] = {"url": words[1], "title":words[2]}

        captureUrlsFile = os.path.join(self.caseLocation, self.caseName, "抓取的网址.txt")
        captureUrls = {}
        with open(captureUrlsFile.decode('UTF-8'), 'r') as fd:
            lines = fd.readlines()
            #fd.write(uuid + '\t' + url + '\t' + localMHTMLFilePath + '\t' + md5 + '\t' + sha256 + '\n')
            for i in lines:
                print i
                words = i.split('\t')
                if len(words) == 6:
                    uuid = words[0]
                    url = words[1]
                    title = words[2]
                    localFile  = words[3]
                    md5 = words[4]
                    sha256 = words[5]
                    #print uuid, url, title, localFile, md5, sha256
                    
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
                        value["title"] = title
                        if tmp[1] == ".mhtml":
                            value['mhtml'] = localFile
                        else:
                            value['png'] = localFile
                        captureUrls[uuid] = value
                        pass

        return tryCaptureUrls, captureUrls

    def generate_data(self):
        data = {}
        data["case_name"] = self.caseName
        data["case_end_time"] = self.caseEndTime
        data["case_investigator"] = self.caseInvestigator
        data["case_user"] = ""
        data["case_urls"] = self.caseUrl
        data["case_passwd"] = ""
        data["case_start_time"] = self.caseStartTime
        if self.md5 == "true":
            data["md5"] = "是"
        else:
            data["md5"] = "否"

        if self.sha256 == "true":
            data["sha256"] = "是"
        else:
            data["sha256"] = "否"
        
        if self.capturePic == "true":
            data["capturePic"] = "是"
        else:
            data["capturePic"] = "否"
        data["case_location"] = self.caseLocation
        urls = []

        tryCaptureUrls, captureUrls = self.get_urls()
        success_url_num = 0
        id = 1
        for uuid in tryCaptureUrls:
            if uuid in captureUrls:
                item = captureUrls[uuid]
                item["id"] = id
                item["result"] = "成功"
                urls.append(item)
                success_url_num += 1
            else:
                item = tryCaptureUrls[uuid]
                item["id"] = id
                item["result"] = "失败"
                item["png"] = " "
                item["md5"] = " "
                urls.append(item)
                pass
            id += 1
        data["urls"] = urls
        data["total_url"] = len(urls)
        data["total_success_url"] = success_url_num
        data["total_fail_url"] = len(urls) - success_url_num
        print urls
        return data

    def run(self):
	try:
            print "Report.run start"
            self.logger.info("htmlreport start")
            css_path = os.path.join(self.caseLocation, self.caseName, "报告/css")
            css_path = css_path.decode('UTF-8')
            if not os.path.exists(css_path):
                shutil.copytree("report_template/css", css_path)
                
            env = Environment(loader=FileSystemLoader('report_template'))
            tmpl = env.get_template('template.html')
            data = self.generate_data()
            file_content = tmpl.render(data)
            report_path = os.path.join(self.caseLocation, self.caseName, "报告/报告.html")
            with open(report_path.decode('UTF-8'), "w") as fd:
                fd.write(file_content)
        except Exception, e:
            import StringIO
            fp = StringIO.StringIO()    #创建内存文件对象
            traceback.print_exc(file=fp)
            msg = fp.getvalue()
            self.logger.warn(msg)   

if __name__ == "__main__":
    r = Report()
    r.run()

