# -*- coding: utf-8 -*-
from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler  
from urlparse import urlparse, parse_qs
import os
import sys
import hashlib
import ConfigParser
import httplib
import urllib
import time
import multiprocessing
from multiprocessing import current_process, Process
import traceback
import threading
import htmlreport
import shutil
from mylog import *
from processmhtml import *

reload(sys)    
sys.setdefaultencoding('utf-8')   #修改默认编码方式，默认为ascci 




class CaseInfo:
    def __init__(self, cfFilePath):
        self.cfFilePath = cfFilePath
        print os.getcwd()
        self.name = ""
        self.investigator = ""
        self.location = ""
    def load(self):
        cf = ConfigParser.ConfigParser()
        cf.read(self.cfFilePath)
        self.location = cf.get('case', 'caseLocation')
        self.name = cf.get('case', 'caseName')
        self.investigator = cf.get('case', 'caseInvestigator')
        self.url = cf.get('case', 'caseUrl')
        self.myDir = os.path.join(self.location, self.name)
        self.md5 = cf.get('case', 'md5')
        self.sha256 = cf.get('case', 'sha256')
        self.capturePic = cf.get('case', 'capturePic')
        self.startTime = cf.get('case', 'startTime')
        self.endTime = cf.get('case', 'endTime')
        if self.location == "":
            self.location = os.path.join(os.path.expanduser('~'), "WebLocker")
            self.save()
        
    def save(self):
        cf = ConfigParser.ConfigParser()
        cf.read(self.cfFilePath)
        cf.set('case', 'caseName', self.name)
        cf.set('case', 'caseLocation', self.location)
        cf.set('case', 'caseInvestigator', self.investigator)
        cf.set('case', 'caseUrl', self.url)
        cf.set('case', 'md5', self.md5)
        cf.set('case', 'sha256', self.sha256)
        cf.set('case', 'capturePic', self.capturePic)
        cf.set('case', 'startTime', self.startTime)
        cf.set('case', 'endTime', self.endTime)
        cf.write(open(self.cfFilePath, 'w'))
        self.myDir = os.path.join(self.location, self.name)
    
class MyHTTPHandle(BaseHTTPRequestHandler):
    def do_POST(self):
        t1 = time.time()
        log('<<<<<<<<<<<<<<<<<<----------------------------------')
        log(time.strftime("%Y-%m-%d %H:%M:%S"))
        log("POST " + self.path)
        log(self.headers)

        parsedURI = urlparse(self.path)
        paras = parse_qs(parsedURI.query)
        log(paras)
        uriPath = parsedURI.path

        try:
            if(uriPath == '/capturedUrl/add'):
                self.handlePostCapturedUrl()
            elif(uriPath == "/tryCaptureUrl/add"):
                self.handlPostTryCaptureUrl()
            elif(uriPath == "/setCaseInfo"):
                self.handlePostSetCaseInfo()
            elif(uriPath == "/generateReport"):
                self.handlePostGenerateReport()
            elif(uriPath == "/caseStart"):
                self.handlePostCaseStart()
            elif(uriPath == "/caseEnd"):
                self.handlePostCaseEnd()
            else:
                self.sendHttpFail("unknown uri:" + uriPath)
            
        except Exception, e:
            import StringIO
            fp = StringIO.StringIO()    #创建内存文件对象
            traceback.print_exc(file=fp)
            msg = fp.getvalue()
            log(msg)   
        t2 = time.time()
        log("use {0} ".format(t2 - t1));
        log('>>>>>>>>>>>>>>>>>>>----------------------------------')

    def do_GET(self): 
        t1 = time.time()
        log('<<<<<<<<<<<<<<<<<<----------------------------------')
        log(time.strftime("%Y-%m-%d %H:%M:%S"))
        log("GET " + self.path)
        log(self.headers)
        parsedURI = urlparse(self.path)
        uriPath = parsedURI.path
        
        try:
            if(uriPath == '/capturedUrl/list'):
                self.handleGetFileList()
                pass
            elif(uriPath == "/caseInfo"):
                self.handleGetCaseInfo();
                pass
            elif(uriPath == "/status"):
                self.handleGetStatus()
                pass
            elif(uriPath =="/quit"):
                self.handleGetQuit()
            elif(uriPath == "/log"):
                self.handleGetLog();
            elif(uriPath == "/clearlog"):
                self.handleGetClearLog()
            else:
                self.sendHttpFail("unknown uri:" + uriPath)
        except SystemExit:
            log('Exception SystemExit occur, so exit with 0')
            exit(0)
        except Exception, e:
            import StringIO
            fp = StringIO.StringIO()    #创建内存文件对象
            traceback.print_exc(file=fp)
            msg = fp.getvalue()
            log(msg)
            self.sendHttpFail(msg)
        t2 = time.time()
        log("use {0} ".format(t2 - t1));
        log('>>>>>>>>>>>>>>>>>>>----------------------------------') 
        
    def handlePostCapturedUrl(self):
        parsedURI = urlparse(self.path)
        paras = parse_qs(parsedURI.query)
        contentLen = int(self.headers['content-length'])
        data = self.rfile.read(contentLen)
        url = paras['url'][0]
        uuid = paras['uuid'][0]
        title = paras['title'][0]
        fileFormat = paras['fileFormat'][0]
        md5 = paras['md5'][0]
        sha256 = paras['sha256'][0]
        
        fileName = urlparse(url).netloc
        tmpFileName = fileName
        fileDirName = ""
        if(fileFormat == "mhtml"):
            fileDirName = "网页源文件"
        elif(fileFormat == "png" or fileFormat == "jpeg"):
            fileDirName = "截图"
        fileDirPath = os.path.join(self.server.case.myDir, fileDirName)
        #print "myDir:" + self.server.case.myDir.decode('UTF-8')
        if(not os.path.isdir(fileDirPath.decode('UTF-8'))):
            os.makedirs(fileDirPath.decode('UTF-8'))
            
        i = 1
        while True:
            tmpFilePath = os.path.join(fileDirPath, tmpFileName + '.' + fileFormat)
            if os.path.exists(tmpFilePath.decode('UTF-8')):
                tmpFileName = fileName + '_' + str(i)
            else:
                break
            i += 1
        tmpFileName += '.' + fileFormat
        fileName = tmpFileName
        print 'save as ', fileName

        filePath = os.path.join(fileDirPath, fileName)
        
        t1 = Process(target=ProcessSaveMhtml, args=(uuid, url, title, data, md5, sha256, filePath,
                                                    fileDirName, fileName, self.server.case.capturePic
                                                    , self.server.case.myDir
                                                    ))
        t1.start()
        self.sendHttpOk()
        
    def handlPostTryCaptureUrl(self):
        parsedURI = urlparse(self.path)
        paras = parse_qs(parsedURI.query)
        contentLen = int(self.headers['content-length'])
        data = self.rfile.read(contentLen)
        url = paras['url'][0]
        uuid = paras['uuid'][0]
        title = paras['title'][0]
        
        appendTryCaptureUrlRecord(uuid, url, title, self.server.case.myDir)
        self.sendHttpOk()
        
    def handleGetQuit(self):
        self.sendHttpOk()
        self.server.stopped = True
        
    def handlePostSetCaseInfo(self):
        parsedURI = urlparse(self.path)
        paras = parse_qs(parsedURI.query)
        contentLen = int(self.headers['content-length'])
        data = self.rfile.read(contentLen)
       
        if paras.has_key('caseName'):
            self.server.case.name = paras['caseName'][0]
        if paras.has_key('caseInvestigator'):
            self.server.case.investigator = paras['caseInvestigator'][0]
        if paras.has_key('caseLocation'):
            self.server.case.location = paras['caseLocation'][0]
        if paras.has_key('caseUrl'):
            self.server.case.url =  paras['caseUrl'][0]
        if paras.has_key('md5'):
            self.server.case.md5 =  paras['md5'][0]
        if paras.has_key('sha256'):
            self.server.case.sha256 =  paras['sha256'][0]
        if paras.has_key('capturePic'):
            self.server.case.capturePic =  paras['capturePic'][0]
        self.server.case.save()
        self.sendHttpOk()
        
    def handleGetCaseInfo(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        import json
        data = json.dumps({"caseName": self.server.case.name,
                          "caseInvestigator": self.server.case.investigator,
                          "caseUrl": self.server.case.url,
                          "caseLocation": self.server.case.location})
        data = data + "\r\n"
        self.send_header("Content-Length", str(len(data)))
        print data
        self.end_headers()
        self.wfile.write(data)

        
    def handlePostGenerateReport(self):
        #with open(os.path.join(self.server.case.myDir.decode('UTF-8'), 'report.txt'), 'a') as fd:
        #    fd.write("to do")

        report = htmlreport.Report(self.server.caseIni)
        #report.run()
        #t1 = threading.Thread(target=report.run, args=())
        #os.system("htmlreport.exe")
    
        t1 = Process(target=report.run, args=())
        t1.start()
        
        self.sendHttpOk()
        
    def handlePostCaseStart(self):
        self.server.case.startTime = time.strftime('%Y-%m-%d %H:%M',time.localtime(time.time()))
        self.server.case.save()
        self.sendHttpOk()
        pass
    
    def handlePostCaseEnd(self):
        self.server.case.endTime = time.strftime('%Y-%m-%d %H:%M',time.localtime(time.time()))
        self.server.case.save()
        self.sendHttpOk()
        pass
    
    def handleGetFileList(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        data = "<html><head><title>file list</title></head>"
        with open(os.path.join(self.server.case.myDir.decode('UTF-8'), 'capturedUrls.txt'), 'r') as fd:
            lines = fd.readlines()
            for i in lines:
                par = "<p>" + i + "</p>"
                data += par
        data += "</html>\r\n"
        print data
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        pass
        
    def handleGetLog(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        global logs
        tmp = ""
        for i in logs:
            l = "<p>{0}</p>".format(i)
            tmp += l
        print tmp
        data = "<html><head><title>status</title></head><body>{0}</body></html>\r\n".format(tmp)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        pass
    def handleGetClearLog(self):
        clear_log()
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        data = "<html><head><title>status</title></head><body>clear log ok</body></html>\r\n"
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        pass
        
    def handleGetStatus(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        data = "<html><head><title>status</title></head><body>ok</body></html>\r\n"
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

        pass
    def sendHttpOk(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        data = "<html>ok</html>\r\n"
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        
    def sendHttpFail(self, error):
        self.send_response(500)
        self.send_header("Content-type", "text/html")
        data = "<html>{0}</html>\r\n".format(error)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

        

    
    

class MyHTTPServer(HTTPServer):
    def __init__(self, server_address, RequestHandlerClass):
        HTTPServer.__init__(self, server_address, RequestHandlerClass)
        self.ip, self.port = server_address
        #import inspect
        #this_file = inspect.getfile(inspect.currentframe())  
        #dirpath = os.path.abspath(os.path.dirname(this_file))
        #caseIniFilePath = os.path.join(dirpath, "case.ini")
        #print caseIniFilePath
        tmp = ""
        if sys.platform == "win32":
            self.caseIni = os.path.join(os.path.expanduser('~'), "WebLocker/case.ini")
            if not os.path.exists(self.caseIni):
                tmp = os.path.abspath(sys.argv[0])
                tmp = os.path.dirname(tmp)
                self.caseIni = os.path.join(tmp, "case.ini")
        else:
            tmp = os.path.abspath(sys.argv[0])
            tmp = os.path.dirname(tmp)
            self.caseIni = os.path.join(tmp, "case.ini")
        
        log("case.ini:" + self.caseIni)
        self.case = CaseInfo(self.caseIni)
        self.case.load()
        self.currentUse = 0
        self.maxUse = 2
        self.tryVersion = True
    def start(self):
        print "HttpServer server_forever start"
        try:
            p = current_process()
            print "pid:{0}|name:{1}".format(p.pid, p.name)
            self.stopped = False
            while not self.stopped:
                print "HTTPServer::handle_request"
                self.handle_request()
        except Exception, e:
            print "HTTPServer::handle_request throw a exception:" + e;
            pass
        print "HttpServer server_forever exit"
    def stop(self):
        print "HttpServer stop start"
        self.stopped = True
        try:
            conn = httplib.HTTPConnection("{0}:{1}".format(self.ip, self.port), timeout=5)
            conn.request("GET", "/quit")
            res = conn.getresponse()
            conn.close()
        except:
            pass
        print "HttpServer stop exit"

if __name__ == '__main__':
    multiprocessing .freeze_support()
    try:
        http_server = MyHTTPServer(('127.0.0.1', 8080), MyHTTPHandle)
        http_server.start()
        time.sleep(100)
    except Exception, e:
        print e

