/* =========================================================
   PARENT.JS
   بخش 1 از 3
   ========================================================= */


/* =========================================================
   1. SUPABASE
   ========================================================= */

   const SUPABASE_URL =
   "https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY =
"sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

let db = null;

if (
   typeof supabase !== "undefined" &&
   typeof supabase.createClient === "function"
) {
   db = supabase.createClient(
       SUPABASE_URL,
       SUPABASE_KEY
   );
}


/* =========================================================
  2. مختصات مدرسه
  ========================================================= */

const SCHOOL_LAT =
   35.76494314018861;

const SCHOOL_LNG =
   51.32257158390593;


/* =========================================================
  3. شعاع مجاز
  ========================================================= */

const ALLOWED_RADIUS = 50;


/* =========================================================
  4. شعاع زمین
  ========================================================= */

const EARTH_RADIUS = 6371000;


/* =========================================================
  5. برنامه زمانی کلاس‌ها
  ========================================================= */

const callSchedules = {

   "1": {
       start: "12:00",
       end: "14:00"
   },

   "2": {
       start: "12:00",
       end: "14:00"
   },

   "3": {
       start: "12:00",
       end: "14:00"
   },

   "4": {
       start: "12:00",
       end: "14:00"
   },

   "5": {
       start: "12:00",
       end: "14:00"
   },

   "6": {
       start: "12:00",
       end: "14:00"
   },

   "7": {
       start: "12:00",
       end: "14:00"
   },

   "8": {
       start: "12:00",
       end: "14:00"
   },

   "9": {
       start: "12:00",
       end: "14:00"
   },

   "10": {
       start: "12:00",
       end: "14:00"
   },

   "11": {
       start: "12:00",
       end: "14:00"
   },

   "12": {
       start: "12:00",
       end: "14:00"
   },

   "13": {
       start: "12:00",
       end: "14:00"
   },

   "14": {
       start: "12:00",
       end: "14:00"
   }
};


/* =========================================================
  6. متغیرهای اصلی
  ========================================================= */

let currentStudentName = "";

let currentClassName = "";

let currentParentCode = "";

let currentParentLat = null;

let currentParentLng = null;

let currentDistance = null;


/* =========================================================
  7. متغیرهای نقشه
  ========================================================= */

let schoolMap = null;

let schoolMarker = null;

let leafletIsLoaded = false;


/* =========================================================
  8. عناصر HTML
  ========================================================= */

const loginScreen =
   document.getElementById(
       "loginScreen"
   );

const parentPanel =
   document.getElementById(
       "parentPanel"
   );

const studentNameInput =
   document.getElementById(
       "studentName"
   );

const parentCodeInput =
   document.getElementById(
       "parentCode"
   );

const loginButton =
   document.getElementById(
       "loginButton"
   );

const messageBox =
   document.getElementById(
       "message"
   );

const panelStudentName =
   document.getElementById(
       "panelStudentName"
   );

const panelClassName =
   document.getElementById(
       "panelClassName"
   );

const currentDate =
   document.getElementById(
       "currentDate"
   );

const currentTime =
   document.getElementById(
       "currentTime"
   );

const callActivationTime =
   document.getElementById(
       "callActivationTime"
   );

const callDescription =
   document.getElementById(
       "callDescription"
   );

const callButton =
   document.getElementById(
       "callButton"
   );

const locationStatus =
   document.getElementById(
       "locationStatus"
   );


/* =========================================================
  9. نمایش پیام
  ========================================================= */

function showMessage(
   text,
   type = "info"
) {

   if (!messageBox) {

       alert(text);

       return;
   }

   messageBox.textContent =
       text;

   messageBox.className =
       `message ${type}`;

   messageBox.style.display =
       "block";
}


/* =========================================================
  10. نرمال‌سازی نام کلاس
  ========================================================= */

function normalizeClassName(
   className
) {

   if (!className) {

       return "";
   }

   return String(className)

       .replace(
           /[۰-۹]/g,
           digit =>
               String(
                   "۰۱۲۳۴۵۶۷۸۹"
                       .indexOf(digit)
               )
       )

       .replace(
           /[٠-٩]/g,
           digit =>
               String(
                   "٠١٢٣٤٥٦٧٨٩"
                       .indexOf(digit)
               )
       )

       .replace(
           /\s+/g,
           ""
       )

       .replace(
           /^کلاس/i,
           "");
}


/* =========================================================
  11. دریافت برنامه کلاس
  ========================================================= */

function getClassSchedule(
   className
) {

   const normalized =
       normalizeClassName(
           className
       );

   return (
       callSchedules[
           normalized
       ] || null
   );
}


/* =========================================================
  12. ساعت ایران
  ========================================================= */

function getIranDate() {

   return new Date(
       new Date().toLocaleString(
           "en-US",
           {
               timeZone:
                   "Asia/Tehran"
           }
       )
   );
}


/* =========================================================
  13. بررسی زمان فراخوان
  ========================================================= */

function isCallTimeActive(
   className
) {

   const schedule =
       getClassSchedule(
           className
       );

   if (!schedule) {

       return false;
   }

   const now =
       getIranDate();

   const currentMinutes =
       now.getHours() * 60 +
       now.getMinutes();

   const [
       startHour,
       startMinute
   ] =
       schedule.start
           .split(":")
           .map(Number);

   const [
       endHour,
       endMinute
   ] =
       schedule.end
           .split(":")
           .map(Number);

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
  14. بروزرسانی زمان فراخوان
  ========================================================= */

function updateCallScheduleUI() {

   if (!currentClassName) {

       return;
   }

   const schedule =
       getClassSchedule(
           currentClassName
       );

   if (!schedule) {

       return;
   }

   if (callActivationTime) {

       callActivationTime.textContent =
           `${schedule.start} تا ${schedule.end}`;
   }

   const active =
       isCallTimeActive(
           currentClassName
       );

   if (callButton) {

       callButton.disabled =
           !active;
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
  15. محاسبه فاصله GPS
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

       Math.cos(
           lat1 *
           Math.PI / 180
       ) *

       Math.cos(
           lat2 *
           Math.PI / 180
       ) *

       Math.sin(
           dLon / 2
       ) ** 2;

   const c =
       2 *
       Math.atan2(
           Math.sqrt(a),
           Math.sqrt(1 - a)
       );

   return (
       EARTH_RADIUS * c
   );
}


/* =========================================================
  16. فرمت فاصله
  ========================================================= */

function formatDistance(
   distance
) {

   if (
       !Number.isFinite(
           distance
       )
   ) {

       return "---";
   }

   if (distance < 1000) {

       return (
           Math.round(distance)
               .toLocaleString(
                   "fa-IR"
               ) +
           " متر"
       );
   }

   return (
       (
           distance / 1000
       )
           .toFixed(2) +
       " کیلومتر"
   );
}


/* =========================================================
  17. لود Leaflet
  ========================================================= */

function loadSchoolMapLibrary() {

   return new Promise(
       (
           resolve,
           reject
       ) => {

           if (
               typeof L !==
               "undefined"
           ) {

               leafletIsLoaded =
                   true;

               resolve();

               return;
           }


           const existingScript =
               document.querySelector(
                   'script[data-school-leaflet="true"]'
               );


           if (existingScript) {

               const timer =
                   setInterval(
                       () => {

                           if (
                               typeof L !==
                               "undefined"
                           ) {

                               clearInterval(
                                   timer
                               );

                               leafletIsLoaded =
                                   true;

                               resolve();
                           }

                       },
                       100
                   );


               setTimeout(
                   () => {

                       clearInterval(
                           timer
                       );

                       if (
                           typeof L ===
                           "undefined"
                       ) {

                           reject(
                               new Error(
                                   "Leaflet load timeout"
                               )
                           );
                       }

                   },
                   15000
               );

               return;
           }


           const leafletCSS =
               document.createElement(
                   "link"
               );

           leafletCSS.rel =
               "stylesheet";

           leafletCSS.href =
               "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

           document.head.appendChild(
               leafletCSS
           );


           const leafletJS =
               document.createElement(
                   "script"
               );

           leafletJS.src =
               "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

           leafletJS.dataset.schoolLeaflet =
               "true";


           leafletJS.onload =
               () => {

                   leafletIsLoaded =
                       true;

                   resolve();
               };


           leafletJS.onerror =
               () => {

                   reject(
                       new Error(
                           "Leaflet failed to load"
                       )
                   );
               };


           document.head.appendChild(
               leafletJS
           );
       }
   );
}
/* =========================================================
   PARENT.JS
   بخش 2 از 3
   ========================================================= */


/* =========================================================
   18. استایل نقشه
   ========================================================= */

   function addSchoolMapStyles() {

    if (
        document.getElementById(
            "schoolMapStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );

    style.id =
        "schoolMapStyles";


    style.textContent = `

        .school-map-card {

            width: 100%;

            margin-top: 20px;

            background: #ffffff;

            border-radius: 24px;

            overflow: hidden;

            box-shadow:
                0 8px 30px
                rgba(0,0,0,.12);

            border:
                1px solid
                rgba(0,0,0,.06);

            position: relative;
        }


        .school-map-title {

            position: absolute;

            top: 14px;

            right: 14px;

            z-index: 999;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .96
                );

            padding:
                10px 16px;

            border-radius: 16px;

            box-shadow:
                0 4px 15px
                rgba(0,0,0,.15);

            font-size: 14px;

            font-weight: 700;

            color: #222;

            direction: rtl;

            backdrop-filter:
                blur(8px);
        }


        .school-map {

            width: 100%;

            height: 390px;

            background:
                #eeeeee;
        }


        .school-logo-marker {

            width: 62px;

            height: 62px;

            border-radius: 50%;

            background:
                linear-gradient(
                    145deg,
                    #ff7043,
                    #e53935
                );

            border:
                4px solid #ffffff;

            box-shadow:
                0 5px 18px
                rgba(0,0,0,.30);

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 30px;

            position: relative;
        }


        .school-logo-marker::after {

            content: "";

            position: absolute;

            width: 76px;

            height: 76px;

            border-radius: 50%;

            border:
                2px solid
                rgba(
                    229,
                    57,
                    53,
                    .35
                );

            animation:
                schoolPulse
                2s infinite;
        }


        @keyframes schoolPulse {

            0% {

                transform:
                    scale(.85);

                opacity:
                    .9;
            }

            70% {

                transform:
                    scale(1.2);

                opacity:
                    0;
            }

            100% {

                transform:
                    scale(1.2);

                opacity:
                    0;
            }
        }


        .school-popup {

            direction: rtl;

            text-align: center;

            min-width: 190px;
        }


        .school-popup-title {

            font-size: 17px;

            font-weight: 800;

            margin-bottom: 6px;

            color: #222;
        }


        .school-popup-text {

            font-size: 12px;

            color: #777;

            line-height: 1.8;
        }


        .leaflet-popup-content-wrapper {

            border-radius: 16px;
        }


        .leaflet-popup-tip {

            box-shadow: none;
        }


        .leaflet-control-zoom {

            border:
                none !important;

            box-shadow:
                0 3px 12px
                rgba(0,0,0,.15)
                !important;
        }


        .leaflet-control-zoom a {

            border:
                none !important;
        }


        .leaflet-control-attribution {

            font-size:
                8px !important;
        }


        @media (max-width: 600px) {

            .school-map {

                height: 330px;
            }


            .school-map-title {

                font-size: 13px;

                padding:
                    9px 13px;
            }
        }
    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   19. آیکون مدرسه
   ========================================================= */

function createSchoolLogoIcon() {

    return L.divIcon({

        className:
            "school-logo-container",

        html: `

            <div
                class="school-logo-marker"
            >
                🏫
            </div>

        `,

        iconSize: [
            62,
            62
        ],

        iconAnchor: [
            31,
            31
        ],

        popupAnchor: [
            0,
            -35
        ]
    });
}


/* =========================================================
   20. ساخت نقشه مدرسه
   ========================================================= */

async function createSchoolMap() {

    try {

        await loadSchoolMapLibrary();


        addSchoolMapStyles();


        if (schoolMap) {

            setTimeout(
                () => {

                    schoolMap
                        .invalidateSize();

                },
                300
            );

            return;
        }


        let mapContainer =
            document.getElementById(
                "schoolMapCard"
            );


        if (!mapContainer) {

            mapContainer =
                document.createElement(
                    "div"
                );

            mapContainer.id =
                "schoolMapCard";

            mapContainer.className =
                "school-map-card";


            mapContainer.innerHTML = `

                <div
                    class="school-map-title"
                >
                    🏫 موقعیت مدرسه
                </div>

                <div
                    id="schoolMap"
                    class="school-map"
                ></div>

            `;


            const panel =
                document.getElementById(
                    "parentPanel"
                );


            if (panel) {

                panel.appendChild(
                    mapContainer
                );

            } else {

                document.body.appendChild(
                    mapContainer
                );
            }
        }


        const mapElement =
            document.getElementById(
                "schoolMap"
            );


        if (!mapElement) {

            console.error(
                "schoolMap element not found"
            );

            return;
        }


        /*
         * ساخت نقشه
         *
         * فقط مختصات مدرسه
         */

        schoolMap =
            L.map(
                mapElement,
                {

                    center: [
                        SCHOOL_LAT,
                        SCHOOL_LNG
                    ],

                    zoom: 17,

                    zoomControl:
                        false,

                    attributionControl:
                        true
                }
            );


        /*
         * OpenStreetMap
         */

        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                maxZoom: 19,

                minZoom: 10,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }

        ).addTo(
            schoolMap
        );


        /*
         * دکمه زوم
         */

        L.control.zoom({

            position:
                "bottomleft"

        }).addTo(
            schoolMap
        );


        /*
         * نشانگر مدرسه
         */

        schoolMarker =
            L.marker(

                [
                    SCHOOL_LAT,
                    SCHOOL_LNG
                ],

                {

                    icon:
                        createSchoolLogoIcon(),

                    zIndexOffset:
                        1000
                }

            ).addTo(
                schoolMap
            );


        /*
         * اطلاعات مدرسه
         */

        schoolMarker.bindPopup(`

            <div
                class="school-popup"
            >

                <div
                    class="school-popup-title"
                >
                    🏫 مدرسه
                </div>

                <div
                    class="school-popup-text"
                >
                    موقعیت مدرسه
                    <br>
                    مرکز ثبت فراخوان دانش‌آموزان
                </div>

            </div>

        `);


        /*
         * باز شدن خودکار اطلاعات
         */

        schoolMarker.openPopup();


        /*
         * اطمینان از نمایش کامل نقشه
         */

        setTimeout(
            () => {

                schoolMap
                    .invalidateSize();


                schoolMap.setView(

                    [
                        SCHOOL_LAT,
                        SCHOOL_LNG
                    ],

                    17,

                    {
                        animate:
                            false
                    }

                );

            },
            500
        );


        console.log(
            "School map loaded successfully."
        );


    } catch (error) {

        console.error(
            "SCHOOL MAP ERROR:",
            error
        );
    }
}


/* =========================================================
   21. درخواست مجوز GPS Median
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

    return new Promise(
        resolve => {

            if (
                window.median
            ) {

                resolve(true);

                return;
            }


            const start =
                Date.now();


            const timer =
                setInterval(
                    () => {

                        if (
                            window.median
                        ) {

                            clearInterval(
                                timer
                            );

                            resolve(true);

                            return;
                        }


                        if (
                            Date.now() -
                            start >
                            timeout
                        ) {

                            clearInterval(
                                timer
                            );

                            resolve(false);
                        }

                    },
                    100
                );
        }
    );
}


async function requestMedianLocationPermission() {

    if (
        !isMedianAndroid()
    ) {

        return;
    }


    try {

        const ready =
            await waitForMedianBridge();


        if (
            ready &&
            window.median &&
            window.median.android &&
            window.median.android
                .geoLocation &&
            typeof
                window.median.android
                    .geoLocation
                    .promptLocationServices ===
                "function"
        ) {

            window.median.android
                .geoLocation
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
            "Median location permission:",
            error
        );
    }
}


/* =========================================================
   22. دریافت موقعیت والد
   ========================================================= */

async function getParentLocation() {

    await requestMedianLocationPermission();


    return new Promise(
        (
            resolve,
            reject
        ) => {

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


            navigator.geolocation
                .getCurrentPosition(

                    position => {

                        const {
                            latitude,
                            longitude,
                            accuracy
                        } =
                            position.coords;


                        currentParentLat =
                            latitude;

                        currentParentLng =
                            longitude;


                        const distance =
                            calculateDistance(

                                SCHOOL_LAT,

                                SCHOOL_LNG,

                                latitude,

                                longitude
                            );


                        currentDistance =
                            distance;


                        if (
                            locationStatus
                        ) {

                            if (
                                distance <=
                                ALLOWED_RADIUS
                            ) {

                                locationStatus.textContent =
                                    `✓ داخل محدوده مجاز — فاصله: ${formatDistance(distance)}`;

                                locationStatus.className =
                                    "location-status success";

                            } else {

                                locationStatus.textContent =
                                    `✕ خارج از محدوده مجاز — فاصله: ${formatDistance(distance)}`;

                                locationStatus.className =
                                    "location-status error";
                            }
                        }


                        resolve({

                            latitude,

                            longitude,

                            accuracy,

                            distance,

                            inside:
                                distance <=
                                ALLOWED_RADIUS

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

                        enableHighAccuracy:
                            true,

                        timeout:
                            15000,

                        maximumAge:
                            0
                    }
                );
        }
    );
}


/* =========================================================
   23. بررسی موقعیت والد
   ========================================================= */

async function checkParentLocation() {

    try {

        if (
            locationStatus
        ) {

            locationStatus.textContent =
                "در حال دریافت موقعیت دقیق شما...";

            locationStatus.className =
                "location-status";
        }


        return await
            getParentLocation();

    } catch (error) {

        console.error(
            "LOCATION CHECK:",
            error
        );


        if (
            locationStatus
        ) {

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
        ).padStart(
            2,
            "0"
        )}-${String(
            now.getDate()
        ).padStart(
            2,
            "0"
        )}`;


    try {

        const {
            data,
            error
        } =
            await db

                .from(
                    "calls"
                )

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
                        ascending:
                            false
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
   25. نمایش وضعیت فراخوان
   ========================================================= */

function updateParentCallStatus(
    callData
) {

    if (!callData) {

        return;
    }


    if (
        callButton
    ) {

        callButton.disabled =
            true;

        callButton.textContent =
            "✓ دانش‌آموز فراخوان شده است";
    }


    if (
        callDescription
    ) {

        callDescription.textContent =
            `آخرین فراخوان در ساعت ${callData.called_time} ثبت شده است.`;
    }
}
/* =========================================================
   PARENT.JS
   بخش 3 از 3
   ========================================================= */


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


    loginButton.disabled =
        true;

    loginButton.textContent =
        "در حال ورود...";


    try {

        const {
            data,
            error
        } =
            await db

                .from(
                    "parent_accounts"
                )

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


        if (
            panelStudentName
        ) {

            panelStudentName.textContent =
                currentStudentName;
        }


        if (
            panelClassName
        ) {

            panelClassName.textContent =
                currentClassName;
        }


        if (
            loginScreen
        ) {

            loginScreen.style.display =
                "none";
        }


        if (
            parentPanel
        ) {

            parentPanel.style.display =
                "block";
        }


        updateCallScheduleUI();


        /*
         * نقشه فقط مدرسه
         */

        await createSchoolMap();


        /*
         * بررسی فراخوان قبلی
         */

        const previousCall =
            await loadExistingCall();


        if (previousCall) {

            updateParentCallStatus(
                previousCall
            );
        }


        /*
         * دریافت GPS والد
         * فقط برای بررسی شعاع.
         * روی نقشه نمایش داده نمی‌شود.
         */

        try {

            await checkParentLocation();

        } catch (locationError) {

            console.warn(
                "Initial GPS:",
                locationError
            );
        }


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

        loginButton.disabled =
            false;

        loginButton.textContent =
            "ورود به پنل";
    }
}


/* =========================================================
   27. ثبت فراخوان
   ========================================================= */

async function callStudent() {

    if (
        !currentStudentName
    ) {

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


    callButton.disabled =
        true;

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


            callButton.disabled =
                false;

            callButton.textContent =
                "📢 فراخوانی دانش‌آموز";

            return;
        }


        const now =
            getIranDate();


        const calledDate =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            )}-${String(
                now.getDate()
            ).padStart(
                2,
                "0"
            )}`;


        const calledTime =
            `${String(
                now.getHours()
            ).padStart(
                2,
                "0"
            )}:${String(
                now.getMinutes()
            ).padStart(
                2,
                "0"
            )}:${String(
                now.getSeconds()
            ).padStart(
                2,
                "0"
            )}`;


        callButton.textContent =
            "در حال ثبت فراخوان...";


        const {
            error
        } =
            await db

                .from(
                    "calls"
                )

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


        if (
            callDescription
        ) {

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
   28. تاریخ و ساعت
   ========================================================= */

function updateDateTime() {

    const now =
        getIranDate();


    if (
        currentDate
    ) {

        currentDate.textContent =
            now.toLocaleDateString(
                "fa-IR"
            );
    }


    if (
        currentTime
    ) {

        currentTime.textContent =
            now.toLocaleTimeString(
                "fa-IR",
                {

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            );
    }


    if (
        currentClassName
    ) {

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

                event:
                    "INSERT",

                schema:
                    "public",

                table:
                    "calls"
            },

            payload => {

                const row =
                    payload.new;


                if (
                    row.student_name ===
                    currentStudentName
                ) {

                    if (
                        row.class_name ===
                        currentClassName
                    ) {

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
   30. رویداد ورود
   ========================================================= */

if (
    loginButton
) {

    loginButton.addEventListener(
        "click",
        loginParent
    );
}


/* =========================================================
   31. رویداد فراخوان
   ========================================================= */

if (
    callButton
) {

    callButton.addEventListener(
        "click",
        callStudent
    );
}


/* =========================================================
   32. محدود کردن کد والد به ۴ رقم
   ========================================================= */

if (
    parentCodeInput
) {

    parentCodeInput.addEventListener(
        "input",
        () => {

            parentCodeInput.value =
                parentCodeInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        4
                    );
        }
    );
}


/* =========================================================
   33. ورود با Enter
   ========================================================= */

if (
    parentCodeInput
) {

    parentCodeInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                loginParent();
            }
        }
    );
}


/* =========================================================
   34. Median
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
   35. شروع ساعت
   ========================================================= */

updateDateTime();


setInterval(
    updateDateTime,
    1000
);


/* =========================================================
   36. شروع Realtime
   ========================================================= */

setupRealtime();


/* =========================================================
   37. آماده‌سازی اولیه نقشه
   ========================================================= */

function startSchoolMap() {

    createSchoolMap();
}


/*
 * اگر DOM هنوز کامل لود نشده
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startSchoolMap
    );

} else {

    startSchoolMap();
}