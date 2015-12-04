#|/bin/bash
pid=`pidof procServer`
if [ "$pid" ];then
	kill $pid
fi
