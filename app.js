
// app.js

const status=document.getElementById("status");
const result=document.getElementById("result");

let model=null;
let recognizer=null;
let audioContext=null;
let processor=null;
let microphone=null;
let stream=null;

async function loadVosk(){

try{

status.textContent="⏳ در حال بارگذاری مدل فارسی Vosk...";

console.log("Vosk:",Vosk);

model=await Vosk.createModel(
"./models/vosk-model-small-fa-0.42.zip"
);

console.log("Vosk model loaded:",model);

status.textContent="✅ مدل فارسی Vosk آماده است";
result.textContent="مدل آماده است؛ حالا دکمه شروع را بزن";

}catch(error){

console.error(
"Vosk model error:",
error
);

status.textContent="❌ خطا در بارگذاری Vosk";
result.textContent="مدل بارگذاری نشد";

}

}

async function startMicrophone(){

if(!model){

result.textContent="ابتدا صبر کن مدل Vosk آماده شود";
return;

}

try{

stream=await navigator.mediaDevices.getUserMedia({
audio:true
});

audioContext=new AudioContext({
sampleRate:16000
});

microphone=
audioContext.createMediaStreamSource(stream);

recognizer=new model.KaldiRecognizer(
16000
);

recognizer.on("result",event=>{

const text=event.result.text;

if(text){

console.log("Vosk:",text);

result.textContent=text;

}

});

recognizer.on("partialresult",event=>{

const text=event.result.partial;

if(text){

result.textContent=text;

}

});

processor=
audioContext.createScriptProcessor(
4096,
1,
1
);

processor.onaudioprocess=function(event){

const input=
event.inputBuffer.getChannelData(0);

recognizer.acceptWaveform(input);

};

microphone.connect(processor);

processor.connect(
audioContext.destination
);

status.textContent="🎙️ میکروفون فعال است";
result.textContent="صحبت کن...";

}catch(error){

console.error(
"Microphone error:",
error
);

status.textContent="❌ خطا در میکروفون";

}

}

function stopMicrophone(){

if(processor){

processor.disconnect();
processor=null;

}

if(microphone){

microphone.disconnect();
microphone=null;

}

if(stream){

stream.getTracks().forEach(
track=>track.stop()
);

stream=null;

}

if(audioContext){

audioContext.close();
audioContext=null;

}

status.textContent="⏹️ میکروفون متوقف شد";

}

loadVosk();

document.getElementById("startButton")
.addEventListener(
"click",
startMicrophone
);

document.getElementById("stopButton")
.addEventListener(
"click",
stopMicrophone
);