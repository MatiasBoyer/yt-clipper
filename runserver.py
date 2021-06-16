import sched, threading
from subprocess import PIPE, Popen

CHECK_EVERY_N = 60 #seconds

def exec_cmd(cmd):
    with Popen(cmd, stdout=PIPE, stderr=None, shell=True) as process:
        return process.communicate()[0].decode("utf-8")

def checkUpdates():
    exec_cmd("git fetch --all")
    origin_hash = exec_cmd("git rev-parse origin/prod")
    local_hash = exec_cmd("git rev-parse prod")

    if origin_hash != local_hash:
        print("[!] Out of date!")
        return False

    print("[!] Up-to-date! Yay!")
    return True

server = None
def openServer():
    server = Popen(["npm", "run", "dev"], shell=True)

def doCheck():
    threading.Timer(CHECK_EVERY_N, doCheck).start()
    if checkUpdates() == False:
        if server != None:
            server.terminate()
        exec_cmd("git reset --hard origin/prod")
        openServer()

openServer()
doCheck()