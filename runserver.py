from subprocess import PIPE, Popen

def exec_cmd(cmd):
    with Popen(cmd, stdout=PIPE, stderr=None, shell=True) as process:
        return process.communicate()[0].decode("utf-8")

def checkUpdates():
    origin_hash = exec_cmd("git rev-parse origin/prod")
    local_hash = exec_cmd("git rev-parse prod")

    if origin_hash != local_hash:
        print("[!] Out of date! Doing git pull..")
    else:
        print("[!] Up-to-date! Yay!")

checkUpdates()