#|/bin/bash
pid=`pidof realTimeServer`
if [ -z "$pid" ]; then
        cd /home/ubuntu/realTimeServer
        exec -a realTimeServer nodejs realTimeServer.js > /dev/null &
fi


