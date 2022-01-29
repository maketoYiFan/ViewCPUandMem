var os = require("os");
var io = require("socket.io").listen("1111");
var osUtils = require("os-utils");
var interval = -1;
var currCPU = 0;

io.sockets.on('connection', socket=> {//连接事件
  socket.emit("connected", "连接成功")
  console.log("连接成功")

  socket.on("disconnect",()=>{
    console.log("disconnect")
  })

  socket.on('endConnection', function (data) {
    console.log("endConnection")
    console.log(data)
    socket.emit("unConnection", "服务器端已停止")
    clearInterval(interval)
    interval = -1;
  })
})

function updateCPU() {
  setTimeout(function () {
    osUtils.cpuUsage(function (value) {
      currCPU = value;

      updateCPU();
    });
  }, 0);
}

function start(){
  updateCPU();
  if (interval < 0) {
    //每隔1s取系统数据
    interval = setInterval(function () {
      var freeMem = os.freemem()/1024/1024/1024;
      var totalMem = os.totalmem()/1024/1024/1024;
      var data = {
        cpuUsage: ( currCPU * 100.0 ).toFixed(2) + "%" + "————" + "(cpu使用率)", 
        freeMem: freeMem.toFixed(2) + "G"  + "————" + "(空闲内存)",
        totalMem: totalMem.toFixed(2) + "G"  + "————" + "(全部内存)",  //全部内存
        usedMem: (totalMem - freeMem).toFixed(2) + "G"  + "————" + "(已占内存)",
        MemUsage: ( (totalMem - freeMem)/totalMem * 100.0 ).toFixed(2) + "%"  + "————" + "(内存占用率)",
      };
      io.sockets.emit("systemUpdate",data)
      console.log(data)
    }, 1000);
  }
}

// 直接运行 
start() 
// module.exports = {
//   start
// }
