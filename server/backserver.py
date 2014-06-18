import myhttpserver
import os
import win32con, win32file, pywintypes

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


if __name__ == '__main__':
    try:
        fd = open("backserver.lock", "w")
        lock(fd, LOCK_EX | LOCK_NB) 
        http_server = myhttpserver.MyHTTPServer(('127.0.0.1', 8080), myhttpserver.MyHTTPHandle)
        http_server.start()
        time.sleep(100)
    except Exception, e:
        print e
        