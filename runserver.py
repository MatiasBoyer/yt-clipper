from subprocess import PIPE, Popen

def exec_cmd(cmd):
    with Popen(cmd, stdout=PIPE, stderr=None, shell=True) as process:
        return process.communicate()[0].decode("utf-8")

current_hash = exec_cmd("git rev-parse HEAD").strip()
hash_list = exec_cmd("git ls-remote").strip().split('\n')

print(hash_list)