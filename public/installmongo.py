import subprocess
import sys
import os

def run_cmd(cmd, sudo_password=None, check=False):
    """
    Run a shell command.
    If sudo_password is given, it will be passed to sudo via stdin.
    check: If True, raises subprocess.CalledProcessError on failure.
    Returns (returncode, stdout, stderr).
    """
    try:
        if sudo_password:
            full_cmd = f"echo {sudo_password} | sudo -S {cmd}"
            proc = subprocess.run(full_cmd, shell=True, capture_output=True, text=True)
        else:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if check and proc.returncode != 0:
            raise subprocess.CalledProcessError(proc.returncode, cmd, proc.stdout, proc.stderr)

        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except Exception as e:
        print(f"Error running command: {cmd}\n{e}")
        if check:
            raise
        return 1, "", str(e)

def main():
    # Accept sudo password from environment or first argument or default to "cselab3"
    sudo_password = None
    if len(sys.argv) > 1:
        sudo_password = sys.argv[1]
    else:
        sudo_password = os.environ.get("SUDO_PASS")

    if sudo_password is None:
        # Provide default password here instead of exiting
        sudo_password = "cselab3"

    steps = [
	    ("service mongod stop", True),
	    ("apt-get purge -y mongodb-org*", True),
	    ("rm -rf /var/log/mongodb /var/lib/mongodb", True),
	    # Add --yes flag to gpg to avoid overwrite prompt
	    ("curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor", False),
	    ("""echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list""", True),
	    ("apt-get update -y", True),
	    ("apt-get install -y mongodb-org", True),
	    ("systemctl start mongod", True),
	    ("systemctl daemon-reload", True),
	    ("systemctl enable mongod", True),
    ]

    for cmd, needs_sudo in steps:
        print(f"Running: {cmd}")
        ret, out, err = run_cmd(cmd, sudo_password if needs_sudo else None, check=False)

        if ret != 0:
            print(f"Warning: Command failed with code {ret}")
            print(f"stderr: {err}")
        else:
            print(f"Success: {out}")

    print("MongoDB 8.0 install process finished.")

if __name__ == "__main__":
    main()

