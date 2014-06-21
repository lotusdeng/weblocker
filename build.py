import shutil

serverFiles = ["myhttpserver.py", "report.py", "backserver.py"]
for i in serverFiles:
    shutil.copy("../server/" + i, "../dist/server")

plugin