// app.js

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

async function loadVosk(){

try{

status.textContent="⏳ در حال بارگذاری مدل فارسی Vosk...";

console.log("Vosk:",Vosk);

model=await Vosk.createModel(
"./models/vosk-model-small-fa-0.42.zip"
);

console.log("Vosk model loaded:",model);

status.textContent="✅ مدل فارسی Vosk آماده است";

result.textContent="مدل آماده است";

}catch(error){

console.error("Vosk model error:",error);

status.textContent="❌ خطا در بارگذاری مدل";

result.textContent="مدل بارگذاری نشد";

}

}

async function startMicrophone(){

console.log("1. دکمه شروع میکروفون کلیک شد");

try{

if(!model){

console.log("2. مدل هنوز آماده نیست");

status.textContent="⏳ مدل هنوز آماده نشده است";

return;

}

console.log("2. مدل آماده است");

if(!navigator.mediaDevices){

console.error("mediaDevices وجود ندارد");

status.textContent="❌ مرورگر به میکروفون دسترسی ندارد";

return;

}

console.log("3. درخواست دسترسی به میکروفون");

stream=await navigator.mediaDevices.getUserMedia({
audio:true
});

console.log("4. میکروفون با موفقیت فعال شد");

status.textContent="🎙️ میکروفون فعال شد";

audioContext=new AudioContext();

console.log(
"5. AudioContext:",
audioContext.sampleRate
);

recognizer=new model.KaldiRecognizer(
audioContext.sampleRate
);

console.log("6. Recognizer ساخته شد");

recognizer.setWords(true);

recognizer.on("result",message=>{

console.log(
"Vosk result:",
message
);

if(
message.result &&
message.result.text
){

result.textContent=
message.result.text;

}

});

recognizer.on("partialresult",message=>{

console.log(
"Vosk partial:",
message
);

if(
message.result &&
message.result.partial
){

result.textContent=
message.result.partial;

}

});

microphone=
audioContext.createMediaStreamSource(
stream
);

console.log("7. microphone source ساخته شد");

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

console.log("8. processor ساخته شد");

microphone.connect(processor);

processor.connect(
audioContext.destination
);

console.log("9. اتصال صوت کامل شد");

status.textContent=
"🎙️ در حال شنیدن...";

result.textContent=
"صحبت کنید";

startBtn.disabled=true;
stopBtn.disabled=false;

}catch(error){

console.error(
"Microphone error:",
error
);

status.textContent=
"❌ خطا در میکروفون";

result.textContent=
error.message;

}

}

function stopMicrophone(){

console.log("توقف میکروفون");

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

if(recognizer){

recognizer.remove();
recognizer=null;

}

if(audioContext){

audioContext.close();
audioContext=null;

}

status.textContent=
"⏹️ میکروفون متوقف شد";

result.textContent=
"میکروفون متوقف شد";

startBtn.disabled=false;
stopBtn.disabled=true;

}

startBtn.addEventListener(
"click",
startMicrophone
);

stopBtn.addEventListener(
"click",
stopMicrophone
);

stopBtn.disabled=true;

loadVosk();