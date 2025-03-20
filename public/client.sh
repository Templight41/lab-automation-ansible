#!/bin/bash

# Default server URL - replace with your actual server URL
SERVER_URL="http://172.1.14.168:8085/api/script"
CONFIG_FILE="/etc/lab-automation/config"
LAB_NAME=""
SETUP_SERVICE=false

# Check if running with sudo privileges
check_sudo() {
    if [ "$EUID" -ne 0 ]; then
        echo "This script requires sudo privileges to run properly."
        echo "Please run the script again with sudo: sudo $0 $*"
        exit 1
    fi
}

# Check for sudo permissions right away
check_sudo "$@"

# Usage information
usage() {
    echo "Usage: $0 [-s SERVER_URL] [-l LAB_NAME] [-i] [-h]"
    echo "  -s SERVER_URL  Specify the server URL (default: $SERVER_URL)"
    echo "  -l LAB_NAME    Specify the lab name (required for first run)"
    echo "  -i            Install as a system service (requires sudo)"
    echo "  -h            Show this help message"
    exit 1
}

# Check and install OpenSSH
ensure_openssh_installed() {
    echo "Checking for OpenSSH server..."
    
    # Detect OS type
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        if ! dpkg -s openssh-server >/dev/null 2>&1; then
            echo "Installing OpenSSH server..."
            apt-get update
            apt-get install -y openssh-server
            systemctl enable ssh
            systemctl start ssh
            echo "OpenSSH server installed and enabled."
        else
            echo "OpenSSH server is already installed."
            # Make sure it's enabled and running
            systemctl enable ssh
            systemctl start ssh
        fi
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        if ! rpm -q openssh-server >/dev/null 2>&1; then
            echo "Installing OpenSSH server..."
            yum install -y openssh-server
            systemctl enable sshd
            systemctl start sshd
            echo "OpenSSH server installed and enabled."
        else
            echo "OpenSSH server is already installed."
            # Make sure it's enabled and running
            systemctl enable sshd
            systemctl start sshd
        fi
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        if ! pacman -Q openssh >/dev/null 2>&1; then
            echo "Installing OpenSSH server..."
            pacman -Sy --noconfirm openssh
            systemctl enable sshd
            systemctl start sshd
            echo "OpenSSH server installed and enabled."
        else
            echo "OpenSSH server is already installed."
            # Make sure it's enabled and running
            systemctl enable sshd
            systemctl start sshd
        fi
    else
        echo "Warning: Unsupported OS distribution. Please install OpenSSH server manually."
    fi
}

# Setup service function
setup_service() {
    SCRIPT_PATH=$(realpath "$0")
    SERVICE_NAME="lab-automation-client"
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

    # Check if running with sudo privileges
    if [ "$EUID" -ne 0 ]; then
        echo "Error: Please run with sudo when using the -i option"
        exit 1
    fi

    # Ensure OpenSSH is installed
    ensure_openssh_installed

    # Create config directory if it doesn't exist
    mkdir -p /etc/lab-automation
    chmod 755 /etc/lab-automation

    # If we have a local config file, migrate it
    if [ -f "$HOME/.lab_automation_config" ]; then
        cp "$HOME/.lab_automation_config" "$CONFIG_FILE"
    fi

    # Ensure proper permissions for the config file
    touch "$CONFIG_FILE"
    chmod 644 "$CONFIG_FILE"

    # Create a permanent copy of the script in a system location
    SYSTEM_SCRIPT="/usr/local/bin/lab-automation-client"
    cp "$SCRIPT_PATH" "$SYSTEM_SCRIPT"
    chmod 755 "$SYSTEM_SCRIPT"

    # Also copy the update-system script to system location
    UPDATE_SCRIPT_PATH=$(dirname "$SCRIPT_PATH")/update-system.sh
    SYSTEM_UPDATE_SCRIPT="/usr/local/bin/lab-automation-update-system"
    
    if [ -f "$UPDATE_SCRIPT_PATH" ]; then
        cp "$UPDATE_SCRIPT_PATH" "$SYSTEM_UPDATE_SCRIPT"
        chmod 755 "$SYSTEM_UPDATE_SCRIPT"
        echo "System update script has been installed to $SYSTEM_UPDATE_SCRIPT"
    else
        echo "Warning: update-system.sh not found in same directory as client.sh"
    fi

    # Create service file
    cat <<EOF >"$SERVICE_FILE"
[Unit]
Description=Lab Automation Client
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$SYSTEM_SCRIPT
Restart=always
RestartSec=10
User=root
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start the service
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl start "$SERVICE_NAME"

    echo "Service $SERVICE_NAME has been created and enabled to start on boot."
    echo "The script has been installed to $SYSTEM_SCRIPT"
    echo "Configuration will be stored in $CONFIG_FILE"
    echo "You can check service status with: systemctl status $SERVICE_NAME"
    exit 0
}

# Load configuration if exists
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
elif [ -f "$HOME/.lab_automation_config" ]; then
    # Try the old location as fallback
    source "$HOME/.lab_automation_config"
fi

# Process command line arguments
while getopts "s:l:ih" opt; do
    case $opt in
    s) SERVER_URL="$OPTARG" ;;
    l) LAB_NAME="$OPTARG" ;;
    i) SETUP_SERVICE=true ;;
    h) usage ;;
    *) usage ;;
    esac
done

# Check if service installation was requested
if [ "$SETUP_SERVICE" = true ]; then
    setup_service
fi

# If no lab name provided and none saved, prompt for it
if [ -z "$LAB_NAME" ] && [ -z "$SAVED_LAB_NAME" ]; then
    echo "Lab name is required for first run."
    echo -n "Please enter lab name: "
    read LAB_NAME

    if [ -z "$LAB_NAME" ]; then
        echo "Error: Lab name cannot be empty."
        exit 1
    fi

    # Save the configuration - use sudo if needed
    if [ -w "$(dirname "$CONFIG_FILE")" ]; then
        echo "SERVER_URL=\"$SERVER_URL\"" >"$CONFIG_FILE"
        echo "SAVED_LAB_NAME=\"$LAB_NAME\"" >>"$CONFIG_FILE"
        chmod 644 "$CONFIG_FILE"
    else
        echo "SERVER_URL=\"$SERVER_URL\"" | sudo tee "$CONFIG_FILE" >/dev/null
        echo "SAVED_LAB_NAME=\"$LAB_NAME\"" | sudo tee -a "$CONFIG_FILE" >/dev/null
        sudo chmod 644 "$CONFIG_FILE"
    fi
elif [ -n "$LAB_NAME" ] && [ "$LAB_NAME" != "$SAVED_LAB_NAME" ]; then
    # Update the lab name in the config file - use sudo if needed
    echo "Updating lab name from \"$SAVED_LAB_NAME\" to \"$LAB_NAME\"..."
    if [ -w "$(dirname "$CONFIG_FILE")" ]; then
        echo "SERVER_URL=\"$SERVER_URL\"" >"$CONFIG_FILE"
        echo "SAVED_LAB_NAME=\"$LAB_NAME\"" >>"$CONFIG_FILE"
        chmod 644 "$CONFIG_FILE"
    else
        echo "SERVER_URL=\"$SERVER_URL\"" | sudo tee "$CONFIG_FILE" >/dev/null
        echo "SAVED_LAB_NAME=\"$LAB_NAME\"" | sudo tee -a "$CONFIG_FILE" >/dev/null
        sudo chmod 644 "$CONFIG_FILE"
    fi
elif [ -z "$LAB_NAME" ] && [ -n "$SAVED_LAB_NAME" ]; then
    # Use the saved lab name
    LAB_NAME="$SAVED_LAB_NAME"
    echo "Using saved lab name: $LAB_NAME"
fi

# Run the update-system script if it exists
if [ -x "$(dirname "$0")/update-system.sh" ]; then
    "$(dirname "$0")/update-system.sh"
elif [ -x "/usr/local/bin/lab-automation-update-system" ]; then
    "/usr/local/bin/lab-automation-update-system"
fi

echo "Fetching script from $SERVER_URL..."

# Create a temporary file for the script
TEMP_SCRIPT=$(mktemp)

# Fetch the script from the server with lab name as a parameter
if ! curl -s -o "$TEMP_SCRIPT" "$SERVER_URL?lab=$LAB_NAME"; then
    echo "Error: Failed to fetch script from server."
    rm "$TEMP_SCRIPT"
    exit 1
fi

# Verify we got some content
if [ ! -s "$TEMP_SCRIPT" ]; then
    echo "Error: The server returned an empty script."
    rm "$TEMP_SCRIPT"
    exit 1
fi

# Make the script executable
chmod +x "$TEMP_SCRIPT"

echo "Executing script from server for lab: $LAB_NAME"
echo "----------------------------------------"

# Execute the received script
"$TEMP_SCRIPT"
SCRIPT_EXIT_CODE=$?

echo "----------------------------------------"
if [ $SCRIPT_EXIT_CODE -eq 0 ]; then
    echo "Script executed successfully."
else
    echo "Script execution failed with exit code $SCRIPT_EXIT_CODE."
fi

# Clean up
rm "$TEMP_SCRIPT"

exit $SCRIPT_EXIT_CODE
