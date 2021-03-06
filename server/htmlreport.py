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


         
class Report():
    def __init__(self, caseIni):
        """Constructor"""
        cf = ConfigParser()
        print "Report start"
        print "case.ini: " + caseIni
        
        cf.read(caseIni)
        self.caseLocation = cf.get('case', 'caseLocation')
        self.caseName = cf.get('case', 'caseName')
        self.caseUrl = cf.get('case', 'caseUrl')
        self.caseInvestigator = cf.get('case', 'caseInvestigator')
        self.md5 = cf.get('case', 'md5')
        self.sha256 = cf.get('case', 'sha256')
        self.capturePic = cf.get('case', 'capturePic')
        self.caseStartTime = cf.get('case', 'startTime')
        self.caseEndTime = cf.get('case', 'endTime')
    
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
        
        total_size = 0
        caseMyDir = os.path.join(self.caseLocation, self.caseName)
        for dirpath, dirnames, filenames in os.walk(caseMyDir.decode("UTF-8")):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                total_size += os.path.getsize(fp)
        total_size = total_size * 1.0 / 1024 / 1024
        data['case_size'] = str(total_size) + "M"

        urls = []

        tryCaptureUrls, captureUrls = self.get_urls()
        success_url_num = 0
        id = 1
        for uuid in tryCaptureUrls:
            if uuid in captureUrls:
                item = captureUrls[uuid]
                item["id"] = id
                item["result"] = "成功"
                if item.has_key("png"):
                    item["png"] = os.path.basename(item["png"])
                    item["pnglink"] = os.path.join("../截图", item["png"])
                else:
                    item["png"] = ""
                    item["png"] = ""
                if item.has_key("mhtml"):
                    item["mhtml"] = os.path.basename(item["mhtml"])
                    item["mhtmllink"] = os.path.join("../网页源文件", item["mhtml"])
                else:
                    item["mhtml"] = ""
                    item["mhtmllink"] = ""
                urls.append(item)
                success_url_num += 1
            else:
                item = tryCaptureUrls[uuid]
                item["id"] = id
                item["result"] = "失败"
                item["png"] = " "
                item["pnglink"] = " "
                item["md5"] = " "
                item["mhtml"] = ""
                item["mhtmllink"] = ""
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
            print msg   

if __name__ == "__main__":
    tmp = os.path.abspath(sys.argv[0])
    tmp = os.path.dirname(tmp)
    tmp = os.path.join(tmp, "case.ini")
    r = Report(tmp)
    r.run()

