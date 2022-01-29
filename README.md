<!-- ## socket.io只能使用socket.io@2.3.0版本


通过nodejs 监听到cpu的使用率和内存使用率。
在vue项目中使用socket.io包获取监听的数据

nodejs后台部分

安装 npm install os-utils
引入包，监听的端口为 1111
使用io.sockets监听事件。注意：socket是连接那次的，绑定的监听事件也要写在这个上面。
然后通过os-utils提供的工具，获取相应的数据
其中on是监听事件，emit是发送事件（emit里面的事件，是让前端去监听的）
start()方法可以在前端调接口再启动
代码如下：
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

function start(){
  updateCPU();
  if (interval < 0) {
    interval = setInterval(function () {
      var freeMem = os.freemem()/1024/1024/1024;
      var totalMem = os.totalmem()/1024/1024/1024;
      var data = {
        cpuUsage: ( currCPU * 100.0 ).toFixed(2) + "%",
        freeMem: freeMem.toFixed(2) + "G",
        totalMem: totalMem.toFixed(2) + "G",
        usedMem: (totalMem - freeMem).toFixed(2) + "G",
        MemUsage: ( (totalMem - freeMem)/totalMem * 100.0 ).toFixed(2) + "%",
      };
      io.sockets.emit("systemUpdate",data)
      console.log(data)
    }, 1000);//每隔1s取系统数据
  }
}

function updateCPU() {
  setTimeout(function () {
    osUtils.cpuUsage(function (value) {
      currCPU = value;

      updateCPU();
    });
  }, 0);
}

//start() // 直接运行  
module.exports = {
  start
}

提供接口调用的写法供参考

var systemInfo = require('../public/javascripts/systemInfo');
router.get('/start', function(req, res, next) {
  systemInfo.start()
  const data = {
    code: 20000,
    desc: "success"
  }
  res.send(data)
});

前端vue部分代码
vue.config.js中引入下面代码 ,需要先npm安装vue-socket.io

import VueSocketIO from 'vue-socket.io'
Vue.use(
  new VueSocketIO({
    debug: false,
    connection: 'http://localhost:1111'
  })
)

使用socketio的vue文件

<template>
  <div class="co">
    <div class="systemInfo" :style="{height:height,width:width}" />
    <el-button @click="startConnection">连接</el-button>
    <el-button @click="endConnection">断开连接</el-button>
  </div>
</template>

<script>
import { start } from '@/api/systemInfo'
export default {
  props: {
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    // this.startConnection()
  },
  sockets: {
    connected(data) {
      if (data) {
        console.log('连接成功', data)
      }
    },
    systemUpdate(data) {
      console.log(data)
    },
    unConnection(data) {
      console.log(data)
      this.$socket.close()
    }
  },
  methods: {
    // 开启连接
    startConnection() {
      start()
      this.$socket.connect()
    },
    endConnection() {
      this.$socket.emit('endConnection', '断开连接')
    }
  }
}
</script>