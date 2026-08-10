// app.js

const status=document.getElementById("status");
const result=document.getElementById("result");

let model=null;

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

result.textContent=
"مدل بارگذاری نشد";

}

}

loadVosk();