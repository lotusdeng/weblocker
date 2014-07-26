# -*- coding: utf-8 -*-

logs = []

def log(msg):
    print msg
    global logs
    logs.append(str(msg))
    if len(logs) > 1000:
        clear_log()
        
def clear_log():
    global logs
    logs[:] = []