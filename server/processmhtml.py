# -*- coding: utf-8 -*-
import os
from mylog import *
import hashlib
import time
import sys
import shutil
import traceback

def trace(msg):
    msgFile = os.path.join(os.path.expanduser('~'), "WebLocker/processmhtml.txt")
    with open(msgFile, 'a') as fd:
        fd.write(msg + "\n")
            

def calcMD5(stream):
    md5Obj = hashlib.md5()
    md5Obj.update(stream)
    return md5Obj.hexdigest()

def calcSHA256(stream):
    sha256Obj = hashlib.sha256()
    sha256Obj.update(stream)
    return sha256Obj.hexdigest()

def appendCapturedUrlRecord(uuid, url, title, localMHTMLFilePath, md5, sha256, caseMyDir):
    if not os.path.isdir(caseMyDir.decode('UTF-8')):
        os.makedirs(caseMyDir.decode('UTF-8'))
    captureUrls = os.path.join(caseMyDir, '抓取的网址.txt')
    captureUrls = captureUrls.decode('UTF-8')
    with open(captureUrls, 'a') as fd:
        fd.write(uuid + '\t' + url + '\t' + title + '\t' + localMHTMLFilePath + '\t' + md5 + '\t' + sha256 + '\n')

def appendTryCaptureUrlRecord(uuid, url, title, caseMyDir):
    if not os.path.isdir(caseMyDir.decode('UTF-8')):
        os.makedirs(caseMyDir.decode('UTF-8'))
    tryCaptureUrls = os.path.join(caseMyDir, '点击的网址.txt')
    tryCaptureUrls = tryCaptureUrls.decode('UTF-8')
    with open(tryCaptureUrls, 'a') as fd:
        fd.write(uuid + '\t' + url + '\t' + title + '\n')


def ProcessSaveMhtml(uuid, url, title, data, md5, sha256, filePath, fileDirName, fileName, capturePic, caseMyDir):
    t1 = time.time()
    
    with open(filePath.decode('UTF-8'), 'wb') as fd:
        fd.write(data)
            
    md5Str = "md5"
    if(md5 == "enable"):
         md5Str = calcMD5(data)
    sha256Str = "sha256"
    if(sha256 == "enable"):
        sha256Str = calcSHA256(data)
    
    appendCapturedUrlRecord(uuid, url, title, os.path.join("./", fileDirName, fileName), md5Str, sha256Str, caseMyDir)

    if capturePic == "true":
        generatePng(uuid, url, title, filePath, md5, sha256, caseMyDir)
    pass
    t2 = time.time()
    trace("process save mthml use:" + str(t2-t1))

def generatePng(uuid, url, title, mhtmlFilePath, md5, sha256, caseMyDir):
    t1 = time.time()
    try:    
        dirName = os.path.dirname(mhtmlFilePath)
        dirName = os.path.join(dirName, "../截图")
        baseName = os.path.basename(mhtmlFilePath)
        li = os.path.splitext(baseName)
        fileName = li[0]
        
        if(not os.path.isdir(dirName.decode('UTF-8'))):
            os.makedirs(dirName.decode('UTF-8'))
        
        pngFilePath = os.path.join(dirName, fileName+".png")
        tmp = os.path.abspath(sys.argv[0])
        tmp = os.path.dirname(tmp)
        cuty = os.path.join(tmp, "../CutyCapt/CutyCapt.exe")
        tmpMhtmlFilePath = os.path.join(os.path.expanduser('~'), "WebLocker", baseName)
        trace("cp " + mhtmlFilePath + " " + tmpMhtmlFilePath)
        shutil.copyfile(mhtmlFilePath.decode("UTF-8"), tmpMhtmlFilePath.decode("UTF-8"))
        tmpPngFilePath = os.path.join(os.path.expanduser('~'), "WebLocker", fileName+".png")
        cmd = '{0} --url=file:///"{1}" --out="{2}"'.format(cuty, tmpMhtmlFilePath, tmpPngFilePath)
        trace(cmd)
        
        os.system(cmd)
        os.remove(tmpMhtmlFilePath)
        shutil.copyfile(tmpPngFilePath, pngFilePath.decode("UTF-8"))
        os.remove(tmpPngFilePath)

        if os.path.exists(pngFilePath.decode('UTF-8')):
            with open(pngFilePath.decode('UTF-8'), "rb") as fd:
                data = fd.read()
                md5Str = "md5"
                if(md5 == "true"):
                     md5Str = calcMD5(data)
                sha256Str = "sha256"
                if(sha256 == "true"):
                    sha256Str = calcSHA256(data)
                appendCapturedUrlRecord(uuid, url, title, pngFilePath, md5Str, sha256Str, caseMyDir)
            pass
        else:
            trace("mhtml to png fail")
    except Exception, e:
        import StringIO
        fp = StringIO.StringIO()    #创建内存文件对象
        traceback.print_exc(file=fp)
        msg = fp.getvalue()
        trace(msg)
    t2 = time.time()
    trace("mthml to png use: " + str(t2-t1))

if __name__ == "__main__":
    trace( "processmhtml.py main")
    
    
    import sys
    print sys.argv
    
        