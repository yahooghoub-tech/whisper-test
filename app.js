
const startBtn=document.getElementById("startBtn");
const stopBtn=document.getElementById("stopBtn");
const status=document.getElementById("status");
const result=document.getElementById("result");

let stream=null;
let recorder=null;
let audioContext=null;
let analyser=null;
let microphone=null;
let animationId=null;

let chunks=[];
let listening=false;
let speaking=false;
let silenceStart=null;

const SILENCE_TIME=800;
const MIN_SPEECH_TIME=300;
const MIN_AUDIO_SIZE=2000;

let speechStart=0;


startBtn.addEventListener(
"click",
startListening
);

stopBtn.addEventListener(
"click",
stopListening
);


async function startListening(){

if(listening){
return;
}

try{

stream=await navigator.mediaDevices.getUserMedia({
audio:{
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
}
});

audioContext=new AudioContext();

await audioContext.resume();

analyser=audioContext.createAnalyser();

analyser.fftSize=2048;

analyser.smoothingTimeConstant=0.85;

microphone=
audioContext.createMediaStreamSource(stream);

microphone.connect(analyser);

listening=true;

startBtn.disabled=true;

stopBtn.disabled=false;

status.textContent=
"🟢 آماده شنیدن...";

startRecorder();

detectSound();

}catch(error){

console.error(error);

status.textContent=
"❌ دسترسی به میکروفون ممکن نیست";

}

}


function startRecorder(){

chunks=[];

recorder=new MediaRecorder(
stream,
{
mimeType:"audio/webm"
}
);

recorder.ondataavailable=
event=>{

if(event.data.size>0){

chunks.push(event.data);

}

};

recorder.onstop=async()=>{

const blob=
new Blob(
chunks,
{
type:"audio/webm"
}
);

if(
blob.size>=MIN_AUDIO_SIZE
){

await sendAudio(blob);

}

if(listening){

startRecorder();

}

};

recorder.start();

}


function detectSound(){

if(!listening){
return;
}

const data=
new Uint8Array(
analyser.fftSize
);

analyser.getByteTimeDomainData(data);

let sum=0;

for(let i=0;i<data.length;i++){

const value=
(data[i]-128)/128;

sum+=value*value;

}

const rms=
Math.sqrt(
sum/data.length
);

const volume=
20*Math.log10(rms||0.00001);

const SPEECH_THRESHOLD=-42;

const now=performance.now();

if(volume>SPEECH_THRESHOLD){

if(!speaking){

speaking=true;

speechStart=now;

silenceStart=null;

status.textContent=
"🔴 در حال شنیدن صحبت...";

}

}else{

if(
speaking &&
now-speechStart>=MIN_SPEECH_TIME
){

if(silenceStart===null){

silenceStart=now;

}

if(
now-silenceStart>=SILENCE_TIME
){

speaking=false;

silenceStart=null;

status.textContent=
"☁️ جمله تمام شد؛ در حال تشخیص...";

if(
recorder &&
recorder.state!=="inactive"
){

recorder.stop();

}

}

}

}

animationId=
requestAnimationFrame(
detectSound
);

}


async function sendAudio(blob){

const start=
performance.now();

try{

const formData=
new FormData();

formData.append(
"file",
blob,
"recording.webm"
);

const response=
await fetch(
"/api/transcribe",
{
method:"POST",
body:formData
}
);

const data=
await response.json();

if(!response.ok){

throw new Error(
data.error||
"خطا از سرور"
);

}

const time=
(
(performance.now()-start)/1000
).toFixed(2);

console.log(
"Groq response:",
data
);

console.log(
"Processing time:",
time,
"seconds"
);

if(
data.text &&
data.text.trim()
){

addResult(
data.text.trim(),
time
);

status.textContent=
`🟢 آماده شنیدن | پردازش ${time} ثانیه`;

}else{

status.textContent=
"🟢 آماده شنیدن...";

}

}catch(error){

console.error(
"Transcription error:",
error
);

status.textContent=
"❌ خطا در تشخیص صدا";

}

}


function addResult(text,time){

if(
result.textContent.trim()===
"هنوز چیزی تشخیص داده نشده"
){

result.innerHTML="";
}

const item=
document.createElement("div");

item.className="item";

item.innerHTML=
`
<strong>${escapeHtml(text)}</strong>
<br>
<small>⏱️ ${time} ثانیه</small>
`;

result.prepend(item);

}


function escapeHtml(text){

const div=
document.createElement("div");

div.textContent=text;

return div.innerHTML;

}


function stopListening(){

listening=false;

speaking=false;

silenceStart=null;

if(animationId){

cancelAnimationFrame(
animationId
);

animationId=null;

}

if(
recorder &&
recorder.state!=="inactive"
){

recorder.stop();

}

if(stream){

stream
.getTracks()
.forEach(
track=>track.stop()
);

stream=null;

}

if(audioContext){

audioContext.close();

audioContext=null;

}

startBtn.disabled=false;

stopBtn.disabled=true;

status.textContent=
"⛔ شنیدن متوقف شد";

}