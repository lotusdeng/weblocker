import myhttpserver
import os
import sys
os.environ["PATH"] = sys.prefix + ";" + os.environ["PATH"]
import win32con
import win32file
import pywintypes
import win32gui
import win32api
import threading
import time
import traceback

#import ctypes

LOCK_EX = win32con.LOCKFILE_EXCLUSIVE_LOCK
LOCK_SH = 0 # the default
LOCK_NB = win32con.LOCKFILE_FAIL_IMMEDIATELY
__overlapped = pywintypes.OVERLAPPED( )

def lock(file, flags):
    hfile = win32file._get_osfhandle(file.fileno( ))
    win32file.LockFileEx(hfile, flags, 0, 0xffff0000, __overlapped)

def unlock(file):
    hfile = win32file._get_osfhandle(file.fileno( ))
    win32file.UnlockFileEx(hfile, 0, 0xffff0000, __overlapped)

def start_browser():
     tmp = os.path.abspath(__file__)
     tmp = os.path.dirname(tmp)
     tmp = os.path.join(tmp, "../browser", "browser.exe")
     os.system("start /b {0} --user-data-dir=userdata -enable-easy-off-store-extension-install".format(tmp))
     
def hide_console():
    #time.sleep(30)
    print "hide"
    hd = win32gui.FindWindow(None, "WebLockerServer")
    if hd:
        print "find window"
        win32gui.ShowWindow(hd, 0)
        #sleep(10)
        #win32gui.ShowWindow(hd, 1)
        pass
    else:
        print "not find"
        pass
     
def start_one_instance_httpserver():
    fd = open("myhttpserver.lock", "w")
    lock(fd, LOCK_EX | LOCK_NB) 
   
    http_server = myhttpserver.MyHTTPServer(('127.0.0.1', 8080), myhttpserver.MyHTTPHandle)
    http_server.start()

if __name__ == '__main__':
    try:
        win32api.SetConsoleTitle("WebLockerServer") 
        start_browser();
        threads = []
        threads.append(threading.Thread(target=hide_console, args=()))
        threads.append(threading.Thread(target=start_one_instance_httpserver, args=()))
        for i in threads:
            i.start()
        for i in threads:
            i.join()
        
    except Exception, e:
        print traceback.print_exc()
        print e
        