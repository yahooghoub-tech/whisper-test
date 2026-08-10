// app.js

const startBtn=document.getElementById("startBtn");
const stopBtn=document.getElementById("stopBtn");
const status=document.getElementById("status");
const result=document.getElementById("result");

let stream=null;
let audioContext=null;
let source=null;
let processor=null;

let running=false;

startBtn.addEventListener(
"click",
startMicrophone
);

stopBtn.addEventListener(
"click",
stopMicrophone
);

stopBtn.disabled=true;

async function startMicrophone(){

if(running){
return;
}

try{

status.textContent=
"⏳ در حال دسترسی به میکروفون...";

stream=
await navigator.mediaDevices.getUserMedia({
audio:{
channelCount:1,
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
}
});

audioContext=
new AudioContext();

source=
audioContext.createMediaStreamSource(
stream
);

processor=
audioContext.createScriptProcessor(
4096,
1,
1
);

processor.onaudioprocess=
event=>{

if(!running){
return;
}

const input=
event.inputBuffer.getChannelData(0);

console.log(
"Audio samples:",
input.length
);

};

source.connect(processor);

processor.connect(
audioContext.destination
);

running=true;

startBtn.disabled=true;
stopBtn.disabled=false;

status.textContent=
"🟢 میکروفون فعال است";

result.textContent=
"صدای شما دریافت می‌شود...";

}catch(error){

console.error(
"Microphone error:",
error
);

status.textContent=
"❌ دسترسی به میکروفون انجام نشد";

}

}

function stopMicrophone(){

running=false;

if(processor){

processor.disconnect();

processor=null;

}

if(source){

source.disconnect();

source=null;

}

if(audioContext){

audioContext.close();

audioContext=null;

}

if(stream){

stream
.getTracks()
.forEach(
track=>track.stop()
);

stream=null;

}

startBtn.disabled=false;

stopBtn.disabled=true;

status.textContent=
"⛔ میکروفون متوقف شد";

result.textContent=
"برای شروع دوباره دکمه شروع را بزنید";

}