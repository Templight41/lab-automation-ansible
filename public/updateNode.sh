sudo apt-get remove --purge nodejs
curl -0- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# Download and install nvm:

# in lieu of restarting the shell
. ~/.nvm/nvm.sh

# Download and install Node. js:
nvm install 22

# Verify the Node.js version:
node -v #Should print "v22.15.1".
nvm current #Should print "v22.15.1" 1".

# Verify npm version:
npm -v # Should print "10.9.2".