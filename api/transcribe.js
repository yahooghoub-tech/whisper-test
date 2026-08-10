
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
api: {
bodyParser: false
}
};

function parseForm(req) {
return new Promise((resolve,reject)=>{
const form=new IncomingForm({
multiples:false
});
form.parse(req,(error,fields,files)=>{
if(error){
reject(error);
return;
}
resolve({fields,files});
});
});
}

export default async function handler(req,res) {

if(req.method!=="POST"){
return res.status(405).json({
error:"Method not allowed"
});
}

try {

const {files}=await parseForm(req);

let file=files.file;

if(Array.isArray(file)){
file=file[0];
}

if(!file){
return res.status(400).json({
error:"فایل صوتی دریافت نشد"
});
}

const audioBuffer=fs.readFileSync(file.filepath);

const audioBlob=new Blob(
[audioBuffer],
{
type:file.mimetype||"audio/webm"
}
);

const groqForm=new FormData();

groqForm.append(
"file",
audioBlob,
"recording.webm"
);

groqForm.append(
"model",
"whisper-large-v3-turbo"
);

groqForm.append(
"language",
"fa"
);

groqForm.append(
"response_format",
"json"
);

groqForm.append(
"temperature",
"0"
);

const groqResponse=await fetch(
"https://api.groq.com/openai/v1/audio/transcriptions",
{
method:"POST",
headers:{
Authorization:
`Bearer ${process.env.GROQ_API_KEY}`
},
body:groqForm
}
);

const data=await groqResponse.json();

console.log("GROQ STATUS:",groqResponse.status);
console.log("GROQ RESPONSE:",data);

if(!groqResponse.ok){
return res.status(groqResponse.status).json({
error:data?.error?.message||"خطا از Groq",
groq:data
});
}

return res.status(200).json({
text:data.text||""
});

}catch(error){

console.error("SERVER ERROR:",error);

return res.status(500).json({
error:error.message||"خطای داخلی سرور"
});

}

}
