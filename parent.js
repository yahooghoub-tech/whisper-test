/* =========================================================
   PARENT.JS
   پنل والد + GPS + نقشه سبک اسنپ + Supabase
   ========================================================= */


/* =========================================================
   1. SUPABASE
   ========================================================= */

   const SUPABASE_URL =
   "https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY =
   "YOUR_SUPABASE_PUBLISHABLE_KEY";

let db = null;

if (
   typeof supabase !== "undefined" &&
   supabase.createClient
) {
   db = supabase.createClient(
       SUPABASE_URL,
       SUPABASE_KEY
   );
}


/* =========================================================
  2. مختصات مدرسه
  ========================================================= */

const SCHOOL_LAT = 35.76494314018861;
const SCHOOL_LNG = 51.32257158390593;

const ALLOWED_RADIUS = 50;
const EARTH_RADIUS = 6371000;


/* =========================================================
  3. برنامه زمانی فراخوان
  ========================================================= */

const callSchedules = {
   "1":  { start: "12:00", end: "14:00" },
   "2":  { start: "12:00", end: "14:00" },
   "3":  { start: "12:00", end: "14:00" },
   "4":  { start: "12:00", end: "14:00" },
   "5":  { start: "12:00", end: "14:00" },
   "6":  { start: "12:00", end: "14:00" },
   "7":  { start: "12:00", end: "14:00" },
   "8":  { start: "12:00", end: "14:00" },
   "9":  { start: "12:00", end: "14:00" },
   "10": { start: "12:00", end: "14:00" },
   "11": { start: "12:00", end: "14:00" },
   "12": { start: "12:00", end: "14:00" },
   "13": { start: "12:00", end: "14:00" },
   "14": { start: "12:00", end: "14:00" }
};


/* =========================================================
  4. متغیرهای برنامه
  ========================================================= */

let currentStudentName = "";
let currentClassName = "";
let currentParentCode = "";

let currentParentLat = null;
let currentParentLng = null;
let currentDistance = null;

let mapInstance = null;
let schoolMarker = null;
let parentMarker = null;
let allowedCircle = null;
let accuracyCircle = null;
let parentSchoolLine = null;
let distanceLabel = null;

let locationWatchId = null;
let leafletLoaded = false;


/* =========================================================
  5. عناصر صفحه
  ========================================================= */

const loginScreen =
   document.getElementById("loginScreen");

const parentPanel =
   document.getElementById("parentPanel");

const studentNameInput =
   document.getElementById("studentName");

const parentCodeInput =
   document.getElementById("parentCode");

const loginButton =
   document.getElementById("loginButton");

const messageBox =
   document.getElementById("message");

const panelStudentName =
   document.getElementById("panelStudentName");

const panelClassName =
   document.getElementById("panelClassName");

const currentDate =
   document.getElementById("currentDate");

const currentTime =
   document.getElementById("currentTime");

const callActivationTime =
   document.getElementById("callActivationTime");

const callDescription =
   document.getElementById("callDescription");

const callButton =
   document.getElementById("callButton");

const locationStatus =
   document.getElementById("locationStatus");


/* =========================================================
  6. پیام
  ========================================================= */

function showMessage(text, type = "info") {

   if (!messageBox) {
       alert(text);
       return;
   }

   messageBox.textContent = text;

   messageBox.className =
       `message ${type}`;

   messageBox.style.display = "block";
}


/* =========================================================
  7. نرمال‌سازی کلاس
  ========================================================= */

function normalizeClassName(className) {

   if (!className) {
       return "";
   }

   return String(className)
       .replace(/[۰-۹]/g, digit =>
           String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
       )
       .replace(/[٠-٩]/g, digit =>
           String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
       )
       .replace(/\s+/g, "")
       .replace(/^کلاس/i, "");
}


/* =========================================================
  8. برنامه کلاس
  ========================================================= */

function getClassSchedule(className) {

   const normalized =
       normalizeClassName(className);

   return callSchedules[normalized] || null;
}


/* =========================================================
  9. ساعت ایران
  ========================================================= */

function getIranDate() {

   return new Date(
       new Date().toLocaleString(
           "en-US",
           {
               timeZone: "Asia/Tehran"
           }
       )
   );
}


/* =========================================================
  10. بررسی زمان فراخوان
  ========================================================= */

function isCallTimeActive(className) {

   const schedule =
       getClassSchedule(className);

   if (!schedule) {
       return false;
   }

   const now = getIranDate();

   const currentMinutes =
       now.getHours() * 60 +
       now.getMinutes();

   const [startHour, startMinute] =
       schedule.start.split(":").map(Number);

   const [endHour, endMinute] =
       schedule.end.split(":").map(Number);

   const start =
       startHour * 60 +
       startMinute;

   const end =
       endHour * 60 +
       endMinute;

   return (
       currentMinutes >= start &&
       currentMinutes <= end
   );
}


/* =========================================================
  11. بروزرسانی وضعیت زمان
  ========================================================= */

function updateCallScheduleUI() {

   if (!currentClassName) {
       return;
   }

   const schedule =
       getClassSchedule(currentClassName);

   if (!schedule) {
       return;
   }

   if (callActivationTime) {
       callActivationTime.textContent =
           `${schedule.start} تا ${schedule.end}`;
   }

   const active =
       isCallTimeActive(currentClassName);

   if (callButton) {
       callButton.disabled = !active;
   }

   if (callDescription) {

       if (active) {

           callDescription.textContent =
               "اکنون امکان فراخوانی دانش‌آموز وجود دارد.";

       } else {

           callDescription.textContent =
               `زمان فراخوان این کلاس: ${schedule.start} تا ${schedule.end}`;
       }
   }
}


/* =========================================================
  12. محاسبه فاصله
  ========================================================= */

function calculateDistance(
   lat1,
   lon1,
   lat2,
   lon2
) {

   const dLat =
       (lat2 - lat1) *
       Math.PI / 180;

   const dLon =
       (lon2 - lon1) *
       Math.PI / 180;

   const a =
       Math.sin(dLat / 2) ** 2 +
       Math.cos(lat1 * Math.PI / 180) *
       Math.cos(lat2 * Math.PI / 180) *
       Math.sin(dLon / 2) ** 2;

   const c =
       2 *
       Math.atan2(
           Math.sqrt(a),
           Math.sqrt(1 - a)
       );

   return EARTH_RADIUS * c;
}


/* =========================================================
  13. نمایش فاصله
  ========================================================= */

function formatDistance(distance) {

   if (!Number.isFinite(distance)) {
       return "---";
   }

   if (distance < 1000) {

       return (
           Math.round(distance)
               .toLocaleString("fa-IR") +
           " متر"
       );
   }

   return (
       (distance / 1000)
           .toFixed(2)
           .toLocaleString("fa-IR") +
       " کیلومتر"
   );
}


/* =========================================================
  14. لود Leaflet
  ========================================================= */

function loadLeaflet() {

   return new Promise((resolve, reject) => {

       if (
           typeof L !== "undefined"
       ) {
           leafletLoaded = true;
           resolve();
           return;
       }

       if (
           document.querySelector(
               'script[data-leaflet="true"]'
           )
       ) {

           const check =
               setInterval(() => {

                   if (
                       typeof L !== "undefined"
                   ) {

                       clearInterval(check);
                       leafletLoaded = true;
                       resolve();
                   }

               }, 100);

           setTimeout(() => {

               clearInterval(check);

               if (
                   typeof L === "undefined"
               ) {
                   reject(
                       new Error(
                           "Leaflet load timeout"
                       )
                   );
               }

           }, 15000);

           return;
       }


       const css =
           document.createElement("link");

       css.rel = "stylesheet";

       css.href =
           "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

       document.head.appendChild(css);


       const script =
           document.createElement("script");

       script.src =
           "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

       script.dataset.leaflet = "true";

       script.onload = () => {

           leafletLoaded = true;
           resolve();

       };

       script.onerror = () => {

           reject(
               new Error(
                   "Leaflet load failed"
               )
           );
       };

       document.head.appendChild(script);
   });
}


/* =========================================================
  15. CSS مخصوص نقشه
  ========================================================= */

function injectMapStyles() {

   if (
       document.getElementById(
           "snappMapStyles"
       )
   ) {
       return;
   }

   const style =
       document.createElement("style");

   style.id =
       "snappMapStyles";

   style.textContent = `

       .snapp-map-card {
           margin-top: 18px;
           background: #ffffff;
           border-radius: 24px;
           overflow: hidden;
           box-shadow:
               0 8px 30px rgba(0,0,0,.12);
           position: relative;
       }

       .snapp-map-header {
           position: absolute;
           top: 14px;
           right: 14px;
           left: 14px;
           z-index: 1000;
           display: flex;
           justify-content: space-between;
           align-items: center;
           pointer-events: none;
       }

       .snapp-map-title {
           background: rgba(255,255,255,.96);
           backdrop-filter: blur(10px);
           padding: 10px 14px;
           border-radius: 16px;
           box-shadow: 0 3px 12px rgba(0,0,0,.12);
           font-weight: bold;
           font-size: 14px;
           direction: rtl;
       }

       .snapp-map-center-btn {
           pointer-events: auto;
           width: 44px;
           height: 44px;
           border: none;
           border-radius: 50%;
           background: white;
           box-shadow: 0 3px 12px rgba(0,0,0,.16);
           font-size: 20px;
           cursor: pointer;
       }

       .snapp-map {
           width: 100%;
           height: 390px;
           background: #e9e9e9;
       }

       .snapp-bottom-panel {
           position: relative;
           margin-top: -32px;
           z-index: 900;
           background: white;
           border-radius: 28px 28px 0 0;
           padding: 18px 18px 20px;
           box-shadow:
               0 -5px 20px rgba(0,0,0,.08);
           direction: rtl;
       }

       .snapp-distance {
           font-size: 25px;
           font-weight: 800;
           text-align: center;
           margin-bottom: 8px;
       }

       .snapp-distance-label {
           color: #777;
           text-align: center;
           font-size: 13px;
           margin-bottom: 15px;
       }

       .snapp-location-status {
           border-radius: 14px;
           padding: 11px 14px;
           text-align: center;
           font-size: 14px;
           font-weight: bold;
       }

       .snapp-location-status.inside {
           background: #e8f7ed;
           color: #16833d;
       }

       .snapp-location-status.outside {
           background: #fff0f0;
           color: #c62828;
       }

       .snapp-location-status.loading {
           background: #f3f3f3;
           color: #666;
       }

       .school-pin {
           width: 44px;
           height: 44px;
           border-radius: 50% 50% 50% 0;
           background: #ff5a36;
           transform: rotate(-45deg);
           display: flex;
           justify-content: center;
           align-items: center;
           box-shadow: 0 4px 12px rgba(0,0,0,.25);
           border: 3px solid white;
       }

       .school-pin-inner {
           transform: rotate(45deg);
           color: white;
           font-size: 21px;
       }

       .parent-pin {
           width: 46px;
           height: 46px;
           border-radius: 50%;
           background: #222;
           border: 4px solid white;
           box-shadow: 0 3px 12px rgba(0,0,0,.3);
           display: flex;
           align-items: center;
           justify-content: center;
           color: white;
           font-size: 20px;
       }

       .distance-label-snapp {
           background: white;
           border-radius: 12px;
           padding: 7px 11px;
           box-shadow:
               0 3px 12px rgba(0,0,0,.18);
           border: 1px solid #eee;
           font-weight: 800;
           font-size: 12px;
           direction: rtl;
           white-space: nowrap;
       }

       .leaflet-control-attribution {
           font-size: 8px !important;
       }

       .leaflet-control-zoom {
           border: none !important;
           box-shadow: 0 3px 12px rgba(0,0,0,.15) !important;
       }

       .leaflet-control-zoom a {
           border: none !important;
       }

       @media (max-width: 600px) {

           .snapp-map {
               height: 350px;
           }

           .snapp-distance {
               font-size: 22px;
           }
       }
   `;

   document.head.appendChild(style);
}


/* =========================================================
  16. آیکون مدرسه
  ========================================================= */

function createSchoolIcon() {

   return L.divIcon({

       className: "",

       html: `
           <div class="school-pin">
               <div class="school-pin-inner">
                   🏫
               </div>
           </div>
       `,

       iconSize: [44, 44],
       iconAnchor: [22, 42]
   });
}


/* =========================================================
  17. آیکون والد
  ========================================================= */

function createParentIcon() {

   return L.divIcon({

       className: "",

       html: `
           <div class="parent-pin">
               🚗
           </div>
       `,

       iconSize: [46, 46],
       iconAnchor: [23, 23]
   });
}


/* =========================================================
  18. ساخت کارت نقشه
  ========================================================= */

function createLocationMapCard() {

   injectMapStyles();

   let container =
       document.getElementById(
           "locationMapCard"
       );

   if (container) {
       return container;
   }

   container =
       document.createElement("div");

   container.id =
       "locationMapCard";

   container.className =
       "snapp-map-card";

   container.innerHTML = `

       <div class="snapp-map-header">

           <div class="snapp-map-title">
               📍 موقعیت شما نسبت به مدرسه
           </div>

           <button
               type="button"
               id="centerMapButton"
               class="snapp-map-center-btn"
               title="نمایش موقعیت من"
           >
               ◎
           </button>

       </div>

       <div
           id="snappMap"
           class="snapp-map"
       ></div>

       <div class="snapp-bottom-panel">

           <div
               id="snappDistance"
               class="snapp-distance"
           >
               ---
           </div>

           <div class="snapp-distance-label">
               فاصله مستقیم تا مدرسه
           </div>

           <div
               id="snappLocationStatus"
               class="snapp-location-status loading"
           >
               در حال دریافت موقعیت شما...
           </div>

       </div>
   `;


   if (locationStatus) {

       locationStatus.parentNode.insertBefore(
           container,
           locationStatus.nextSibling
       );

   } else if (parentPanel) {

       parentPanel.appendChild(
           container
       );
   }


   const centerButton =
       document.getElementById(
           "centerMapButton"
       );

   if (centerButton) {

       centerButton.addEventListener(
           "click",
           () => {

               if (
                   mapInstance &&
                   currentParentLat !== null
               ) {

                   mapInstance.setView(
                       [
                           currentParentLat,
                           currentParentLng
                       ],
                       18,
                       {
                           animate: true
                       }
                   );
               }
           }
       );
   }

   return container;
}


/* =========================================================
  19. ساخت نقشه
  ========================================================= */

async function initializeMap() {

   try {

       await loadLeaflet();

       const card =
           createLocationMapCard();

       const mapElement =
           document.getElementById(
               "snappMap"
           );

       if (!mapElement) {
           return;
       }


       if (mapInstance) {

           setTimeout(() => {

               mapInstance.invalidateSize();

           }, 300);

           return;
       }


       mapInstance =
           L.map(
               mapElement,
               {
                   zoomControl: false,
                   attributionControl: true
               }
           );


       /* نقشه روشن و ساده */
       L.tileLayer(
           "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
           {
               maxZoom: 19,
               attribution:
                   '&copy; OpenStreetMap contributors'
           }
       ).addTo(mapInstance);


       /* کنترل زوم */
       L.control.zoom({
           position: "bottomleft"
       }).addTo(mapInstance);


       /* مرکز اولیه */
       mapInstance.setView(
           [
               SCHOOL_LAT,
               SCHOOL_LNG
           ],
           17
       );


       /* مدرسه */
       schoolMarker =
           L.marker(
               [
                   SCHOOL_LAT,
                   SCHOOL_LNG
               ],
               {
                   icon:
                       createSchoolIcon(),
                   zIndexOffset: 1000
               }
           )
           .addTo(mapInstance)
           .bindTooltip(
               "مدرسه",
               {
                   direction: "top",
                   offset: [0, -35]
               }
           );


       /* محدوده ۵۰ متری */
       allowedCircle =
           L.circle(
               [
                   SCHOOL_LAT,
                   SCHOOL_LNG
               ],
               {
                   radius:
                       ALLOWED_RADIUS,

                   color: "#18a957",

                   fillColor: "#35c878",

                   fillOpacity: 0.18,

                   weight: 2
               }
           )
           .addTo(mapInstance);


       setTimeout(() => {

           mapInstance.invalidateSize();

       }, 500);


   } catch (error) {

       console.error(
           "MAP ERROR:",
           error
       );
   }
}


/* =========================================================
  20. بروزرسانی نقشه با موقعیت والد
  ========================================================= */

function updateMapPosition(
   lat,
   lng,
   accuracy = null
) {

   if (!mapInstance) {
       return;
   }


   currentParentLat = lat;
   currentParentLng = lng;


   const parentLatLng =
       [lat, lng];

   const schoolLatLng =
       [
           SCHOOL_LAT,
           SCHOOL_LNG
       ];


   /* -----------------------------------------
      مارکر والد
      ----------------------------------------- */

   if (!parentMarker) {

       parentMarker =
           L.marker(
               parentLatLng,
               {
                   icon:
                       createParentIcon(),
                   zIndexOffset: 2000
               }
           )
           .addTo(mapInstance)
           .bindTooltip(
               "موقعیت شما",
               {
                   direction: "top",
                   offset: [0, -24]
               }
           );

   } else {

       parentMarker.setLatLng(
           parentLatLng
       );
   }


   /* -----------------------------------------
      دایره دقت GPS
      ----------------------------------------- */

   if (
       Number.isFinite(accuracy) &&
       accuracy > 0
   ) {

       if (!accuracyCircle) {

           accuracyCircle =
               L.circle(
                   parentLatLng,
                   {
                       radius: accuracy,
                       color: "#777",
                       fillColor: "#777",
                       fillOpacity: 0.08,
                       weight: 1,
                       dashArray: "4, 5"
                   }
               ).addTo(mapInstance);

       } else {

           accuracyCircle.setLatLng(
               parentLatLng
           );

           accuracyCircle.setRadius(
               accuracy
           );
       }
   }


   /* -----------------------------------------
      فاصله
      ----------------------------------------- */

   const distance =
       calculateDistance(
           SCHOOL_LAT,
           SCHOOL_LNG,
           lat,
           lng
       );

   currentDistance =
       distance;


   /* -----------------------------------------
      خط بین مدرسه و والد
      ----------------------------------------- */

   if (!parentSchoolLine) {

       parentSchoolLine =
           L.polyline(
               [
                   schoolLatLng,
                   parentLatLng
               ],
               {
                   color: "#333",
                   weight: 4,
                   opacity: 0.85,
                   dashArray: "7, 8"
               }
           )
           .addTo(mapInstance);

   } else {

       parentSchoolLine.setLatLngs(
           [
               schoolLatLng,
               parentLatLng
           ]
       );
   }


   /* -----------------------------------------
      فاصله روی خط
      ----------------------------------------- */

   const middleLat =
       (
           SCHOOL_LAT +
           lat
       ) / 2;

   const middleLng =
       (
           SCHOOL_LNG +
           lng
       ) / 2;


   if (!distanceLabel) {

       distanceLabel =
           L.marker(
               [
                   middleLat,
                   middleLng
               ],
               {
                   interactive: false,

                   icon:
                       L.divIcon({
                           className: "",
                           html: `
                               <div class="distance-label-snapp">
                                   📏 ${formatDistance(distance)}
                               </div>
                           `,
                           iconSize: null
                       })
               }
           )
           .addTo(mapInstance);

   } else {

       distanceLabel.setLatLng(
           [
               middleLat,
               middleLng
           ]
       );

       distanceLabel.setIcon(
           L.divIcon({
               className: "",
               html: `
                   <div class="distance-label-snapp">
                       📏 ${formatDistance(distance)}
                   </div>
               `,
               iconSize: null
           })
       );
   }


   /* -----------------------------------------
      پنل پایین
      ----------------------------------------- */

   const distanceElement =
       document.getElementById(
           "snappDistance"
       );

   if (distanceElement) {

       distanceElement.textContent =
           formatDistance(distance);
   }


   const statusElement =
       document.getElementById(
           "snappLocationStatus"
       );


   const inside =
       distance <= ALLOWED_RADIUS;


   if (statusElement) {

       statusElement.className =
           "snapp-location-status " +
           (
               inside
                   ? "inside"
                   : "outside"
           );

       statusElement.textContent =
           inside
               ? "✓ شما داخل محدوده مجاز هستید"
               : "✕ شما خارج از محدوده مجاز هستید";
   }


   /* -----------------------------------------
      وضعیت قبلی
      ----------------------------------------- */

   if (locationStatus) {

       locationStatus.textContent =
           inside
               ? `✓ داخل محدوده مجاز — فاصله: ${formatDistance(distance)}`
               : `✕ خارج از محدوده مجاز — فاصله: ${formatDistance(distance)}`;

       locationStatus.className =
           inside
               ? "location-status success"
               : "location-status error";
   }


   /* -----------------------------------------
      فعال / غیرفعال کردن فراخوان
      ----------------------------------------- */

   if (callButton) {

       const timeActive =
           isCallTimeActive(
               currentClassName
           );

       callButton.disabled =
           !(
               inside &&
               timeActive
           );
   }


   /* -----------------------------------------
      تنظیم کادر نقشه
      ----------------------------------------- */

   const bounds =
       L.latLngBounds([
           schoolLatLng,
           parentLatLng
       ]);


   if (
       distance > 100
   ) {

       mapInstance.fitBounds(
           bounds,
           {
               padding: [70, 70],
               maxZoom: 17,
               animate: true
           }
       );

   } else {

       mapInstance.setView(
           parentLatLng,
           18,
           {
               animate: true
           }
       );
   }
}


/* =========================================================
  21. درخواست مجوز GPS در Median
  ========================================================= */

function isMedianAndroid() {

   return (
       window.median &&
       window.median.android
   );
}


function waitForMedianBridge(
   timeout = 7000
) {

   return new Promise(resolve => {

       if (
           window.median
       ) {
           resolve(true);
           return;
       }


       const start =
           Date.now();


       const timer =
           setInterval(() => {

               if (
                   window.median
               ) {

                   clearInterval(timer);
                   resolve(true);
                   return;
               }


               if (
                   Date.now() -
                   start >
                   timeout
               ) {

                   clearInterval(timer);
                   resolve(false);
               }

           }, 100);
   });
}


async function requestMedianLocationPermission() {

   if (!isMedianAndroid()) {
       return;
   }


   try {

       const ready =
           await waitForMedianBridge();


       if (
           ready &&
           window.median &&
           window.median.android &&
           window.median.android.geoLocation &&
           typeof
               window.median.android.geoLocation
                   .promptLocationServices ===
               "function"
       ) {

           window.median.android.geoLocation
               .promptLocationServices();

           await new Promise(
               resolve =>
                   setTimeout(
                       resolve,
                       700
                   )
           );
       }

   } catch (error) {

       console.warn(
           "Median GPS permission:",
           error
       );
   }
}


/* =========================================================
  22. دریافت موقعیت والد
  ========================================================= */

async function getParentLocation() {

   await initializeMap();

   await requestMedianLocationPermission();


   return new Promise(
       (resolve, reject) => {

           if (
               !navigator.geolocation
           ) {

               reject(
                   new Error(
                       "GPS در این دستگاه در دسترس نیست."
                   )
               );

               return;
           }


           navigator.geolocation.getCurrentPosition(

               position => {

                   const {
                       latitude,
                       longitude,
                       accuracy
                   } =
                       position.coords;


                   updateMapPosition(
                       latitude,
                       longitude,
                       accuracy
                   );


                   resolve({
                       latitude,
                       longitude,
                       accuracy
                   });

               },

               error => {

                   console.error(
                       "GPS ERROR:",
                       error
                   );


                   let message =
                       "دریافت موقعیت ناموفق بود.";


                   if (
                       error.code === 1
                   ) {

                       message =
                           "دسترسی به موقعیت مکانی داده نشده است.";

                   } else if (
                       error.code === 2
                   ) {

                       message =
                           "موقعیت مکانی قابل دریافت نیست.";

                   } else if (
                       error.code === 3
                   ) {

                       message =
                           "دریافت موقعیت بیش از حد طول کشید.";
                   }


                   reject(
                       new Error(
                           message
                       )
                   );

               },

               {
                   enableHighAccuracy: true,

                   timeout: 15000,

                   maximumAge: 0
               }
           );
       }
   );
}


/* =========================================================
  23. بررسی موقعیت
  ========================================================= */

async function checkParentLocation() {

   try {

       if (locationStatus) {

           locationStatus.textContent =
               "در حال دریافت موقعیت دقیق شما...";

           locationStatus.className =
               "location-status";
       }


       const position =
           await getParentLocation();


       const distance =
           calculateDistance(
               SCHOOL_LAT,
               SCHOOL_LNG,
               position.latitude,
               position.longitude
           );


       currentParentLat =
           position.latitude;

       currentParentLng =
           position.longitude;

       currentDistance =
           distance;


       return {
           ...position,
           distance,
           inside:
               distance <=
               ALLOWED_RADIUS
       };


   } catch (error) {

       console.error(
           "LOCATION CHECK:",
           error
       );


       if (locationStatus) {

           locationStatus.textContent =
               error.message;

           locationStatus.className =
               "location-status error";
       }


       throw error;
   }
}


/* =========================================================
  24. بررسی فراخوان قبلی
  ========================================================= */

async function loadExistingCall() {

   if (!db) {
       return null;
   }


   const now =
       getIranDate();


   const calledDate =
       `${now.getFullYear()}-${String(
           now.getMonth() + 1
       ).padStart(2, "0")}-${String(
           now.getDate()
       ).padStart(2, "0")}`;


   try {

       const {
           data,
           error
       } =
           await db
               .from("calls")
               .select("*")
               .eq(
                   "student_name",
                   currentStudentName
               )
               .eq(
                   "class_name",
                   currentClassName
               )
               .eq(
                   "called_date",
                   calledDate
               )
               .order(
                   "called_time",
                   {
                       ascending: false
                   }
               )
               .limit(1)
               .maybeSingle();


       if (error) {

           console.error(
               "LOAD CALL ERROR:",
               error
           );

           return null;
       }


       return data;

   } catch (error) {

       console.error(
           error
       );

       return null;
   }
}


/* =========================================================
  25. وضعیت فراخوان
  ========================================================= */

function updateParentCallStatus(
   callData
) {

   if (!callData) {
       return;
   }


   if (callButton) {

       callButton.disabled = true;

       callButton.textContent =
           "✓ دانش‌آموز فراخوان شده است";
   }


   if (callDescription) {

       callDescription.textContent =
           `آخرین فراخوان در ساعت ${callData.called_time} ثبت شده است.`;
   }
}


/* =========================================================
  26. ورود والد
  ========================================================= */

async function loginParent() {

   const studentName =
       studentNameInput
           ?.value
           ?.trim();

   const parentCode =
       parentCodeInput
           ?.value
           ?.trim();


   if (!studentName) {

       showMessage(
           "لطفاً نام دانش‌آموز را وارد کنید.",
           "error"
       );

       return;
   }


   if (
       !/^\d{4}$/.test(
           parentCode
       )
   ) {

       showMessage(
           "کد والد باید ۴ رقمی باشد.",
           "error"
       );

       return;
   }


   if (!db) {

       showMessage(
           "اتصال Supabase برقرار نشده است.",
           "error"
       );

       console.error(
           "Supabase client is not initialized."
       );

       return;
   }


   loginButton.disabled = true;

   loginButton.textContent =
       "در حال ورود...";


   try {

       const {
           data,
           error
       } =
           await db
               .from("parent_accounts")
               .select(
                   "student_name, parent_code, class_name"
               )
               .eq(
                   "student_name",
                   studentName
               )
               .eq(
                   "parent_code",
                   parentCode
               )
               .maybeSingle();


       if (error) {

           console.error(
               "SUPABASE LOGIN ERROR:",
               error
           );


           showMessage(
               "خطای Supabase: " +
               (
                   error.message ||
                   "خطای نامشخص"
               ),
               "error"
           );


           return;
       }


       if (!data) {

           showMessage(
               "نام دانش‌آموز یا کد والد صحیح نیست.",
               "error"
           );

           return;
       }


       currentStudentName =
           data.student_name;

       currentClassName =
           data.class_name;

       currentParentCode =
           data.parent_code;


       if (panelStudentName) {

           panelStudentName.textContent =
               currentStudentName;
       }


       if (panelClassName) {

           panelClassName.textContent =
               currentClassName;
       }


       if (loginScreen) {
           loginScreen.style.display =
               "none";
       }


       if (parentPanel) {
           parentPanel.style.display =
               "block";
       }


       updateCallScheduleUI();


       await initializeMap();


       try {

           const previousCall =
               await loadExistingCall();

           if (previousCall) {

               updateParentCallStatus(
                   previousCall
               );
           }

       } catch (error) {

           console.warn(
               "Previous call check:",
               error
           );
       }


       await checkParentLocation();


   } catch (error) {

       console.error(
           "LOGIN ERROR:",
           error
       );


       showMessage(
           "خطا در ارتباط با سامانه: " +
           (
               error.message ||
               "خطای نامشخص"
           ),
           "error"
       );

   } finally {

       loginButton.disabled = false;

       loginButton.textContent =
           "ورود به پنل";
   }
}


/* =========================================================
  27. فراخوانی دانش‌آموز
  ========================================================= */

async function callStudent() {

   if (!currentStudentName) {

       alert(
           "ابتدا وارد حساب والد شوید."
       );

       return;
   }


   if (
       !isCallTimeActive(
           currentClassName
       )
   ) {

       alert(
           "در حال حاضر زمان فراخوان این کلاس نیست."
       );

       return;
   }


   callButton.disabled = true;

   callButton.textContent =
       "در حال بررسی موقعیت...";


   try {

       const location =
           await checkParentLocation();


       if (
           location.distance >
           ALLOWED_RADIUS
       ) {

           alert(
               `❌ خارج از محدوده مجاز هستید.

فاصله شما تا مدرسه:
${formatDistance(location.distance)}

شعاع مجاز:
${formatDistance(ALLOWED_RADIUS)}`
           );


           callButton.disabled = false;

           callButton.textContent =
               "📢 فراخوانی دانش‌آموز";

           return;
       }


       const now =
           getIranDate();


       const calledDate =
           `${now.getFullYear()}-${String(
               now.getMonth() + 1
           ).padStart(2, "0")}-${String(
               now.getDate()
           ).padStart(2, "0")}`;


       const calledTime =
           `${String(
               now.getHours()
           ).padStart(2, "0")}:${String(
               now.getMinutes()
           ).padStart(2, "0")}:${String(
               now.getSeconds()
           ).padStart(2, "0")}`;


       callButton.textContent =
           "در حال ثبت فراخوان...";


       const {
           error
       } =
           await db
               .from("calls")
               .insert([
                   {
                       student_name:
                           currentStudentName,

                       class_name:
                           currentClassName,

                       status:
                           "فراخوان شد",

                       called_date:
                           calledDate,

                       called_time:
                           calledTime
                   }
               ]);


       if (error) {

           console.error(
               "CALL INSERT ERROR:",
               error
           );

           throw error;
       }


       callButton.textContent =
           "✓ فراخوان ثبت شد";

       callButton.disabled =
           true;


       if (callDescription) {

           callDescription.textContent =
               `فراخوان دانش‌آموز در ساعت ${calledTime} ثبت شد.`;
       }


       showMessage(
           "✓ فراخوان با موفقیت ثبت شد.",
           "success"
       );


   } catch (error) {

       console.error(
           "CALL ERROR:",
           error
       );


       alert(
           "خطا در ثبت فراخوان:\n" +
           (
               error.message ||
               "خطای نامشخص"
           )
       );


       callButton.disabled =
           false;

       callButton.textContent =
           "📢 فراخوانی دانش‌آموز";
   }
}


/* =========================================================
  28. ساعت و تاریخ پنل
  ========================================================= */

function updateDateTime() {

   const now =
       getIranDate();


   if (currentDate) {

       currentDate.textContent =
           now.toLocaleDateString(
               "fa-IR"
           );
   }


   if (currentTime) {

       currentTime.textContent =
           now.toLocaleTimeString(
               "fa-IR",
               {
                   hour: "2-digit",
                   minute: "2-digit",
                   second: "2-digit"
               }
           );
   }


   if (currentClassName) {

       updateCallScheduleUI();
   }
}


/* =========================================================
  29. Realtime Supabase
  ========================================================= */

function setupRealtime() {

   if (!db) {
       return;
   }


   db
       .channel(
           "parent-calls-channel"
       )
       .on(
           "postgres_changes",
           {
               event: "INSERT",
               schema: "public",
               table: "calls"
           },
           payload => {

               const row =
                   payload.new;


               if (
                   row.student_name ===
                   currentStudentName
               ) {

                   if (row.class_name ===
                       currentClassName) {

                       updateParentCallStatus(
                           row
                       );
                   }
               }
           }
       )
       .subscribe();
}


/* =========================================================
  30. Event ها
  ========================================================= */

if (loginButton) {

   loginButton.addEventListener(
       "click",
       loginParent
   );
}


if (callButton) {

   callButton.addEventListener(
       "click",
       callStudent
   );
}


if (parentCodeInput) {

   parentCodeInput.addEventListener(
       "input",
       () => {

           parentCodeInput.value =
               parentCodeInput.value
                   .replace(/\D/g, "")
                   .slice(0, 4);
       }
   );
}


if (parentCodeInput) {

   parentCodeInput.addEventListener(
       "keydown",
       event => {

           if (
               event.key === "Enter"
           ) {

               loginParent();
           }
       }
   );
}


/* =========================================================
  31. Median آماده شد
  ========================================================= */

window.median_library_ready =
   function () {

       console.log(
           "Median library ready"
       );
   };


window.median_geolocation_ready =
   function () {

       console.log(
           "Median geolocation ready"
       );
   };


/* =========================================================
  32. شروع برنامه
  ========================================================= */

updateDateTime();

setInterval(
   updateDateTime,
   1000
);

setupRealtime();


/* =========================================================
  33. آماده‌سازی اولیه نقشه
  ========================================================= */

document.addEventListener(
   "DOMContentLoaded",
   () => {

       if (
           parentPanel &&
           parentPanel.style.display !==
               "none"
       ) {

           initializeMap();
       }
   }
);