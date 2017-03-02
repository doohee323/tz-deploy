alias debug='./debug.sh'

node-inspector &
sleep 3;
node --debug app.js &
sleep 3;
open http://localhost:3000
open http://127.0.0.1:8080/debug?port=5858

# killall node; debug
# killall node; node app.js