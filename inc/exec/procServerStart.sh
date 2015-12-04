#|/bin/bash
pid=`pidof procServer`
if [ -z "$pid" ]; then
        cd /home/ubuntu/procServer
        exec -a procServer nodejs procServer.js > /dev/null &
fi


