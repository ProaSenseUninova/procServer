require('string.prototype.startswith');
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream('/var/log/procServer.log', {flags : 'a'});
var log_stdout = process.stdout;
var socketIOPort = 8030;
var tcpPort = 8040;
var funcPort = 8080;
var sys = require('sys')
var exec = require('child_process').exec;
var http = require('http');


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

function handleRequest(request, response){
	var data = '';
	request.on('data',function(chunk){
			data=data+chunk;
		});
	request.on('end',function(){
		var address = request.headers['x-forwarded-for'];
		log(request.method+' - Request from: '+address);
		var names = request.url.split('/')
		if(names.length>1)
		{
			if(names[1].toLowerCase()=="git")
			{
				if(names.length>2)
				{
					if(names[2].toLowerCase()=="pull")
					{
						if(names.length>3)
						{
							exec("git -C /var/www/"+names[3]+" pull",function(err,out,code)
							{
								if(err==null)
								{
									response.end(out)
								}
								else
								{
									response.end(err.toString());
								}
							});
						}
						else
						{
							response.end('');
						}
					}
					else
					{
						response.end('');
					}
				}
				else
				{
					response.end('');
				}
			}
			else if(names[1].split("?")[0].toLowerCase()=="startvncserver")
			{
				var el = names[1].split("?")[1];
				var objs = {};
				var cmd = "sudo -H -u ubuntu vncserver";
				if(el!==undefined)
				{
					objs=QueryString(el);
				}
				if(objs.x!==undefined && objs.y!==undefined)
				{
					cmd=cmd + " -geometry "+objs.x+"x"+objs.y;
				}
				exec(cmd,function(err,out,code)
				{
					if(err==null)
					{
						response.end(code)
					}
					else
					{
						response.end(err.toString());
					}
				});				
			}
			else if(names[1].toLowerCase()=="log")
			{
				if(names.length>2)
				{
					if(names[2].toLowerCase()=="workspace")
					{

						exec("tail -n 50 /home/ubuntu/dataServer/dataServer.log",function(err,out,code)
						{
							if(err==null)
							{
								response.end(out)
							}
							else
							{
								response.end(err.toString());
							}
						});
						
					}
					else
					{
						response.end('');
					}
				}
				else
				{
					response.end('');
				}
			}
			else
			{
				response.end('');
			}
		
		}
		else
		{
			response.end('');
		}
	})
}

function QueryString(str) {
	// This function is anonymous, is executed immediately and
	// the return value is assigned to QueryString!
	var query_string = {};
	var query = str;
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	} 
	return query_string;
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(funcPort, function(){
    log("Data server listening on: http://localhost:"+funcPort);
});
