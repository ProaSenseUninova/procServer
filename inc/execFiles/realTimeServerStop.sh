#|/bin/bash
pid=`pidof realTimeServer`
if [ "$pid" ];then
	kill $pid
fi
