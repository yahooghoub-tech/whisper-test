
const startBtn =
document.getElementById("startBtn");

const stopBtn =
document.getElementById("stopBtn");

const status =
document.getElementById("status");

const result =
document.getElementById("result");

let stream = null;

let recorder = null;

let listening = false;

let processing = false;

let chunkNumber = 0;


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

stream =
await navigator.mediaDevices.getUserMedia({
audio:true
});

listening = true;

startBtn.disabled = true;

stopBtn.disabled = false;

status.textContent =
"🟢 میکروفون فعال است";

startNextChunk();

}catch(error){

console.error(error);

status.textContent =
"❌ دسترسی به میکروفون ممکن نیست";

}

}


function stopListening(){

listening = false;

if(recorder &&
recorder.state !== "inactive"){

recorder.stop();

}

if(stream){

stream
.getTracks()
.forEach(track=>track.stop());

stream = null;

}

startBtn.disabled = false;

stopBtn.disabled = true;

status.textContent =
"⛔ شنیدن متوقف شد";

}


function startNextChunk(){

if(!listening){
return;
}

chunkNumber++;

const chunks = [];

recorder =
new MediaRecorder(stream);


recorder.ondataavailable =
event => {

if(event.data.size > 0){

chunks.push(event.data);

}

};


recorder.onstop =
async () => {

const blob =
new Blob(
chunks,
{
type:recorder.mimeType
}
);

if(listening){

processChunk(blob);

}

};


recorder.start();


status.textContent =
`🎙️ در حال شنیدن... بخش ${chunkNumber}`;


setTimeout(()=>{

if(
recorder &&
recorder.state !== "inactive"
){

recorder.stop();

}

},4000);

}


async function processChunk(blob){

if(processing){

if(listening){

startNextChunk();

}

return;

}

processing = true;

const start =
performance.now();

try{

status.textContent =
"☁️ در حال تشخیص صدا...";


const formData =
new FormData();

formData.append(
"file",
blob,
"recording.webm"
);


const response =
await fetch(
"/api/transcribe",
{
method:"POST",
body:formData
}
);


const data =
await response.json();


if(!response.ok){

throw new Error(
data.error ||
"خطا از سرور"
);

}


const time =
(
(performance.now()-start)
/
1000
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


if(data.text &&
data.text.trim()){

addResult(
data.text.trim(),
time
);

}else{

console.log(
"صدایی تشخیص داده نشد"
);

}


status.textContent =
`🟢 آماده شنیدن | پردازش: ${time} ثانیه`;

}catch(error){

console.error(
"Transcription error:",
error
);

status.textContent =
"❌ خطا در تشخیص صدا";

}

processing = false;


if(listening){

startNextChunk();

}

}


function addResult(text,time){

if(
result.textContent ===
"هنوز چیزی تشخیص داده نشده"
){

result.innerHTML = "";

}


const item =
document.createElement("div");

item.className =
"item";


item.innerHTML =
`
<strong>${text}</strong>
<br>
<small>
⏱️ ${time} ثانیه
</small>
`;


result.prepend(item);

}
