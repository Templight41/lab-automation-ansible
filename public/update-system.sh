#!/bin/bash

# Configuration
CONFIG_FILE="/etc/lab-automation/config"
LOCAL_CONFIG_FILE="$HOME/.lab_automation_config"
API_ENDPOINT="http://172.1.14.168:8085/api/systems"
UUID_FILE="/etc/lab-automation/system-uuid"
UUID=""
LAB_NAME=""

# Function to generate UUID if it doesn't exist
generate_uuid() {
    if command -v uuidgen >/dev/null 2>&1; then
        UUID=$(uuidgen)
    elif [ -f /proc/sys/kernel/random/uuid ]; then
        UUID=$(cat /proc/sys/kernel/random/uuid)
    else
        # Fallback to random string if uuidgen not available
        UUID=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    fi
    
    # Store the UUID - use sudo if needed
    if [ -w "$(dirname "$UUID_FILE")" ]; then
        echo "$UUID" > "$UUID_FILE"
        chmod 644 "$UUID_FILE"
    else
        echo "$UUID" | sudo tee "$UUID_FILE" > /dev/null
        sudo chmod 644 "$UUID_FILE"
    fi
}

# Function to get primary IP address
get_primary_ip() {
    # Try to get the IP address that would be used to reach the internet
    IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K[0-9.]+')
    
    # Fallback if the above method fails
    if [ -z "$IP" ]; then
        IP=$(hostname -I | awk '{print $1}')
    fi
    
    echo "$IP"
}

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
elif [ -f "$LOCAL_CONFIG_FILE" ]; then
    source "$LOCAL_CONFIG_FILE"
else
    echo "Error: No configuration file found. Please run client.sh first."
    exit 1
fi

# Get lab name from config
if [ -z "$SAVED_LAB_NAME" ]; then
    echo "Error: Lab name not found in configuration."
    exit 1
else
    LAB_NAME="$SAVED_LAB_NAME"
fi

# Get or generate UUID
if [ -f "$UUID_FILE" ]; then
    UUID=$(cat "$UUID_FILE")
else
    generate_uuid
fi

# Get system IP address
IP_ADDRESS=$(get_primary_ip)

if [ -z "$IP_ADDRESS" ]; then
    echo "Error: Could not determine system IP address."
    exit 1
fi

# Prepare JSON payload
JSON_DATA="{\"lab\":\"$LAB_NAME\",\"address\":\"$IP_ADDRESS\",\"id\":\"$UUID\"}"

# Send PUT request to API
echo "Updating system information..."
echo "Lab: $LAB_NAME"
echo "ID: $UUID"
echo "IP Address: $IP_ADDRESS"

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    "$API_ENDPOINT")

# Check if curl command succeeded
if [ $? -eq 0 ]; then
    echo "System update successful: $RESPONSE"
else
    echo "Error: Failed to update system information."
    exit 1
fi

exit 0
