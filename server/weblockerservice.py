
import win32serviceutil
import win32service
import win32event
import logging  
import os  
import inspect  
import time
import sys
import httplib
from multiprocessing import current_process
import thread
import win32traceutil
import myhttpserver

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
         

         
class WebLockerService(win32serviceutil.ServiceFramework):
    _svc_name_ = "WebLockerService"
    _svc_display_name_ = "WebLockerService"
    _svc_description_ = ""

    def __init__(self, args):
        print 'WebLockerService current dir:' + os.getcwd()
        print "WebLockerService.__init__ enter"
        try:
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            self.logger, self.handler = self._getLogger()
            self.isAlive = True
            p = current_process()
            self.logger.info("WebLockerService.__init__ enter")
            self.handler.flush()
            self.logger.info("pid:{0}|name:{1}".format(p.pid, p.name))
            self.handler.flush()
            try:
                self.http_server = myhttpserver.MyHTTPServer(('127.0.0.1', 8080), myhttpserver.MyHTTPHandle)
                pass
            except Exception, e:
               self.logger.error(str(e))
            self.logger.info("WebLockerService.__init__ leave")
            self.handler.flush()
        except Exception, e:
            print "WebLockerService.__init__ catch a exception", e
        
    def _getLogger(self):
        logger = logging.getLogger('WebLockerService')
        
        this_file = inspect.getfile(inspect.currentframe())  
        dirpath = os.path.abspath(os.path.dirname(this_file))
        logFilePath = os.path.join(dirpath, "WebLockerService.log")
        print "log to " + logFilePath
        handler = logging.FileHandler(logFilePath)  
          
        formatter = logging.Formatter('%(asctime)s %(name)-12s %(levelname)-8s %(message)s')  
        handler.setFormatter(formatter)  
          
        logger.addHandler(handler)
        
        sl = StreamToLogger(logger, logging.INFO)
        sys.stdout = sl
        sys.stderr = sl
        
        logger.setLevel(logging.INFO)  
          
        return logger, handler
    
    def SvcDoRun(self):  
        try:
            self.logger.info("WebLockerService::SvcDoRun enter")
            self.handler.flush()
            thread.start_new(self.http_server.start, ())
            self.logger.info("WebLockerService::SvcDoRun WaitForSingleObject for stop") 
            self.handler.flush()
            win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)   
            self.logger.info("WebLockerService::SvcDoRun leave")
            self.handler.flush()
        except Exception, e:
            self.logger.error("WebLockerService::SvcDoRun catch a exception:" + str(e))
    def SvcStop(self):   
        try:
            self.logger.info("WebLockerService::SvcStop enter")  
            self.handler.flush()
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)   
            self.http_server.stop()
            self.logger.info("WebLockerService::SvcStop SetEvent for stop")
            self.handler.flush()
            win32event.SetEvent(self.hWaitStop)
            self.logger.info("WebLockerService::SvcStop leave")
            self.handler.flush()
        except Exception, e:
            self.logger.error("WebLockerService::SvcStop catch a exception:" + str(e))
if __name__=='__main__':
    win32serviceutil.HandleCommandLine(WebLockerService)  
