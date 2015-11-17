require('string.prototype.startswith');

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream('realTimeServer.log', {flags : 'a'});
var log_stdout = process.stdout;
var socketIOPort = 8030;
var tcpPort = 8040;

function placeZero(n)
{
	return n<10?'0'+n:n;
}

function getUTCDate()
{
	var date = new Date();
	var day = placeZero(date.getUTCDate());
	var month = placeZero(date.getUTCMonth()+1);
	var year = date.getUTCFullYear();

	var seconds = placeZero(date.getUTCSeconds());
	var minutes = placeZero(date.getUTCMinutes());
	var hours = placeZero(date.getUTCHours());

	return hours+':'+minutes+':'+seconds+' '+day+'-'+month+'-'+year+' (UTC)';
}

console.log = function(d) { //
	log_file.write(util.format(d) + '\n');
	log_stdout.write(util.format(d) + '\n');
};
log = function(msg,error)
{
	console.log((error==true?'ERROR ':'INFO ')+'['+getUTCDate()+'] - '+msg);;
}

try
{
	var io = require('socket.io')(socketIOPort)
	var net = require('net')
	
	
	
	log("TCP server listening on: http://localhost:"+tcpPort);
	log("Socket.IO server listening on: http://localhost:"+socketIOPort);
	var ws = net.createServer(function(socket)
	{
		var remoteAddress = socket.remoteAddress;
		log('New client connected: '+remoteAddress+':'+tcpPort);
		socket.on('data',function(msg_)
		{
			var msg=msg_.toString();
			log('Message received by '+remoteAddress+':'+tcpPort+': '+msg_);
			try
			{
				var objMsg = JSON.parse(msg);
				io.send(objMsg);
				log('Message broadcasted on port '+socketIOPort+': '+JSON.stringify(objMsg));
			}
			catch(error)
			{
				log(error,true);
			}
		});
		socket.on('error',function(error)
		{
			log(error,true);
		});
		socket.on('close',function()
		{
			log(remoteAddress+':'+tcpPort+' Disconnected');
		});
		
	});
	ws.listen(tcpPort);
	io.on('connection',function(socket){
		var remoteAddress = socket.client.conn.remoteAddress;
		log('New client connected: '+remoteAddress+':'+socketIOPort);
		socket.on('disconnect',function(client)
		{
			log(remoteAddress+':'+socketIOPort+' Disconnected');
		})
	})
}
catch(error)
{
	log(error,true);
}

