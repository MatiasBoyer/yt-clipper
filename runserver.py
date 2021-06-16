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
async def openServer():
    server = Popen(["npm", "run", "dev"], shell=True)
async def closeServer():
    global server
    if server != None:
        server.kill()
        server.terminate()
        server = None
        await asyncio.sleep(5)

async def check_for_updates():
    await asyncio.sleep(10)
    return checkUpdates()    

async def main():
    await openServer()
    while True:
        needToUpdate = await check_for_updates()
        if needToUpdate:
            await closeServer()
            exec_cmd("git reset --hard origin/prod")
            await openServer()

loop = asyncio.get_event_loop()
task = loop.create_task(main())

try:
    loop.run_until_complete(task)
    loop.run_forever()
except asyncio.CancelledError:
    pass