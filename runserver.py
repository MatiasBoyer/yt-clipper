import sched, time, asyncio
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
        return True

    print("[!] Up-to-date! Yay!")
    return False

server = None
def openServer():
    server = Popen(["npm", "run", "dev"], shell=True)
def closeServer():
    global server
    if server != None:
        server.kill()
        server.terminate()
        server = None

async def check_for_updates():
    await asyncio.sleep(10)
    needToUpdate = checkUpdates()
    if needToUpdate == True:
        closeServer()
        while server != None:
            await asyncio.sleep(1)

        exec_cmd("git reset --hard origin/prod")

        await asyncio.sleep(15)
        openServer()

async def forever_update():
    while True:
        await check_for_updates()

loop = asyncio.get_event_loop()
task = loop.create_task(forever_update())

try:
    openServer()
    loop.run_until_complete(task)
    loop.run_forever()
except asyncio.CancelledError:
    pass