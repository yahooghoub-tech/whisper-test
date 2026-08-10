
const status=document.getElementById("status");
const result=document.getElementById("result");

const startBtn=document.getElementById("startBtn");
const stopBtn=document.getElementById("stopBtn");

let model=null;
let recognizer=null;
let audioContext=null;
let microphone=null;
let processor=null;
let stream=null;

let isRunning=false;

async function loadVosk(){

try{

status.textContent="⏳ در حال بارگذاری مدل فارسی Vosk...";

console.log("Vosk:",Vosk);

model=await Vosk.createModel(
"./models/vosk-model-small-fa-0.42.zip"
);

console.log("Vosk model loaded:",model);

status.textContent="✅ مدل فارسی Vosk آماده است";
result.textContent="مدل با موفقیت آماده شد";

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

try{

console.log("1. دکمه شروع میکروفون کلیک شد");

if(!model){

status.textContent="⏳ مدل هنوز آماده نیست";
console.log("مدل آماده نیست");
return;

}

console.log("2. مدل آماده است");

status.textContent="🎙️ در حال فعال کردن میکروفون...";

stream=await navigator.mediaDevices.getUserMedia({
audio:true
});

console.log("3. میکروفون با موفقیت فعال شد");

audioContext=new AudioContext();

console.log(
"4. AudioContext:",
audioContext.sampleRate
);

if(audioContext.state==="suspended"){

await audioContext.resume();

}

recognizer=new model.KaldiRecognizer(
audioContext.sampleRate
);

console.log("5. Recognizer ساخته شد");

recognizer.on("result",(message)=>{

console.log(
"Vosk result:",
message
);

if(message.result){

const text=message.result.text || "";

if(text.trim()){

result.textContent=text;

}

}

});


recognizer.on("partialresult",(message)=>{

console.log(
"Vosk partial:",
message
);

if(message.result){

const text=
message.result.partial || "";

if(text.trim()){

result.textContent=text;

}

}

});


microphone=
audioContext.createMediaStreamSource(stream);

console.log(
"6. microphone source ساخته شد"
);


processor=
audioContext.createScriptProcessor(
4096,
1,
1
);

console.log(
"7. processor ساخته شد"
);


processor.onaudioprocess=function(event){

if(!isRunning){

return;

}

try{

const inputBuffer=
event.inputBuffer;

recognizer.acceptWaveform(
inputBuffer
);

}catch(error){

console.error(
"acceptWaveform error:",
error
);

}

};


microphone.connect(processor);

processor.connect(
audioContext.destination
);

console.log(
"8. اتصال صوت کامل شد"
);

isRunning=true;

status.textContent=
"🟢 میکروفون فعال است — صحبت کنید";

}catch(error){

console.error(
"Microphone error:",
error
);

status.textContent=
"❌ خطا در فعال کردن میکروفون";

result.textContent=
error.message;

}

}


function stopMicrophone(){

console.log(
"⛔ توقف میکروفون"
);

isRunning=false;

if(processor){

processor.disconnect();

processor.onaudioprocess=null;

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

recognizer=null;

status.textContent=
"⏹️ میکروفون متوقف شد";

}


startBtn.addEventListener(
"click",
startMicrophone
);

stopBtn.addEventListener(
"click",
stopMicrophone
);


loadVosk();

