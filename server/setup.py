from distutils.core import setup
import py2exe

setup(
    service = ["weblockerservice"],
    description = "A dummy SMTP server that logs to file.",
    modules = ["WebLockerService"],
    cmdline_style='pywin32',
   )
