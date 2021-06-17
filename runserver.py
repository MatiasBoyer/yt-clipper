import sched, time, asyncio
from subprocess import PIPE, Popen

CHECK_EVERY_N = 5 * 60

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
    server = Popen(["npm", "run", "dev"], shell=True)#"nodemon", ".\\server.js", "--watch *.*"], shell=True)
async def closeServer():
    global server
    if server != None:
        server.kill()
        server.terminate()
        server = None
        await asyncio.sleep(5)

async def check_for_updates():
    needToUpdate = checkUpdates()
    print(f"Need to update: {needToUpdate}")
    if needToUpdate:
        exec_cmd("git reset --hard origin/prod")
        await openServer()

async def main():
    await check_for_updates()
    await openServer()
    while True:
        await asyncio.sleep(CHECK_EVERY_N)
        await check_for_updates()

loop = asyncio.get_event_loop()
task = loop.create_task(main())

print("Starting...")
try:
    loop.run_until_complete(task)
    loop.run_forever()
except asyncio.CancelledError:
    pass