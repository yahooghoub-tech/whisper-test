const SUPABASE_URL =
"https://ghnpiijihybuhfetnxjp.supabase.co";

const SUPABASE_KEY =
"sb_publishable_SEGca8-w1pAO3_TQgMd-qA_vOvkj6jq";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =====================================================
   ELEMENTS
===================================================== */

const loginScreen =
document.getElementById("loginScreen");

const parentPanel =
document.getElementById("parentPanel");

const loginButton =
document.getElementById("loginButton");

const studentNameInput =
document.getElementById("studentName");

const parentCodeInput =
document.getElementById("parentCode");

const message =
document.getElementById("message");

const panelStudentName =
document.getElementById("panelStudentName");

const panelClassName =
document.getElementById("panelClassName");

const currentDate =
document.getElementById("currentDate");

const currentTime =
document.getElementById("currentTime");

const callButton =
document.getElementById("callButton");

const locationStatus =
document.getElementById("locationStatus");

const callActivationTime =
document.getElementById("callActivationTime");

const callDescription =
document.getElementById("callDescription");

const parentMapElement =
document.getElementById("parentMap");

const locationRefreshButton =
document.getElementById("locationRefreshButton");

const parentLocationText =
document.getElementById("parentLocationText");

const distanceText =
document.getElementById("distanceText");

const mapResultCard =
document.getElementById("mapResultCard");

const mapResultIcon =
document.getElementById("mapResultIcon");

const mapResultText =
document.getElementById("mapResultText");


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentStudentName = "";
let currentClassName = "";

let parentCallChannel = null;
let parentRefreshInterval = null;

let parentMap = null;
let schoolMarker = null;
let parentMarker = null;
let allowedCircle = null;
let distanceLine = null;

let lastParentPosition = null;

let locationRequestInProgress = false;


/* =====================================================
   LOCATION CONFIGURATION
===================================================== */

/*
   مختصات مدرسه
*/

const SCHOOL_LAT =
35.76494314018861;

const SCHOOL_LNG =
51.32257158390593;


/*
   محدوده مجاز:
   50 متر = 5 کیلومتر
*/

const ALLOWED_RADIUS =
50;


/*
   شعاع زمین برای محاسبه فاصله
*/

const EARTH_RADIUS =
6371000;


/* =====================================================
   CALL SCHEDULE
===================================================== */

function getCallSchedule(className) {

    if (
        className === "پیش-1" ||
        className === "پیش-2"
    ) {

        return {
            start: 1 * 60,
            end: 14 * 60,
            text: "۱:۰۰ تا ۱۴:۰۰"
        };

    }


    if (
        className === "اول-1" ||
        className === "اول-2" ||
        className === "اول-3"
    ) {

        return {
            start: 1 * 60,
            end: 14 * 60,
            text: "۱:۰۰ تا ۱۴:۰۰"
        };

    }


    return {
        start: 1 * 60,
        end: 14 * 60,
        text: "۱:۰۰ تا ۱۴:۰۰"
    };

}


/* =====================================================
   IRAN TIME
===================================================== */

function getIranTimeParts() {

    const parts =
    new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    ).formatToParts(
        new Date()
    );


    const hour =
    Number(
        parts.find(
            item =>
            item.type === "hour"
        ).value
    );


    const minute =
    Number(
        parts.find(
            item =>
            item.type === "minute"
        ).value
    );


    const second =
    Number(
        parts.find(
            item =>
            item.type === "second"
        ).value
    );


    return {
        hour,
        minute,
        second,
        totalMinutes:
            hour * 60 + minute
    };

}


/* =====================================================
   IRAN DATE
===================================================== */

function getIranDate() {

    return new Intl.DateTimeFormat(
        "fa-IR-u-nu-latn",
        {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(
        new Date()
    );

}


function getIranTime() {

    const iran =
    getIranTimeParts();


    return String(
        iran.hour
    ).padStart(
        2,
        "0"
    ) +
    ":" +
    String(
        iran.minute
    ).padStart(
        2,
        "0"
    ) +
    ":" +
    String(
        iran.second
    ).padStart(
        2,
        "0"
    );

}


function getPersianDate() {

    return new Intl.DateTimeFormat(
        "fa-IR-u-ca-persian",
        {
            timeZone: "Asia/Tehran",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(
        new Date()
    );

}


/* =====================================================
   DATE / CLOCK
===================================================== */

function updateDateTime() {

    const iran =
    getIranTimeParts();


    currentDate.textContent =
    getPersianDate();


    currentTime.textContent =
    new Intl.NumberFormat(
        "fa-IR"
    ).format(
        iran.hour
    ) +
    ":" +
    new Intl.NumberFormat(
        "fa-IR"
    ).format(
        iran.minute
    ) +
    ":" +
    new Intl.NumberFormat(
        "fa-IR"
    ).format(
        iran.second
    );

}


updateDateTime();


setInterval(
    updateDateTime,
    1000
);


/* =====================================================
   CALL TIME
===================================================== */

function isCallTimeActive() {

    if (
        !currentClassName
    ) {

        return false;

    }


    const schedule =
    getCallSchedule(
        currentClassName
    );


    const iran =
    getIranTimeParts();


    return (
        iran.totalMinutes >=
        schedule.start
        &&
        iran.totalMinutes <
        schedule.end
    );

}


/* =====================================================
   CALL UI
===================================================== */

function updateCallScheduleUI() {

    if (
        !currentClassName
    ) {

        return;

    }


    const schedule =
    getCallSchedule(
        currentClassName
    );


    callActivationTime.textContent =
    "ساعت " +
    schedule.text;


    callDescription.textContent =
    "فراخوانی دانش‌آموز از ساعت " +
    schedule.text +
    " فعال است. برای ارسال فراخوان، ابتدا موقعیت مکانی شما بررسی می‌شود.";


    const active =
    isCallTimeActive();


    if (active) {

        if (
            callButton.dataset.locked !==
            "true"
        ) {

            callButton.disabled =
            false;

            callButton.dataset.timeBlocked =
            "false";

            callButton.textContent =
            "📢 فراخوانی دانش‌آموز";

            callButton.style.background =
            "linear-gradient(135deg, #2563eb, #0284c7)";

            callButton.style.boxShadow =
            "0 15px 30px rgba(37, 99, 235, 0.25)";

        }

    }

    else {

        if (
            callButton.dataset.locked !==
            "true"
        ) {

            callButton.disabled =
            true;

            callButton.dataset.timeBlocked =
            "true";

            callButton.textContent =
            "⏰ خارج از زمان فراخوان";

            callButton.style.background =
            "linear-gradient(135deg, #94a3b8, #64748b)";

            callButton.style.boxShadow =
            "none";

        }

    }

}


setInterval(
    () => {

        if (
            currentStudentName &&
            currentClassName
        ) {

            updateCallScheduleUI();

        }

    },
    1000
);


/* =====================================================
   MAP INITIALIZATION
===================================================== */

function initializeParentMap() {

    if (
        !parentMapElement
    ) {

        return;

    }


    if (
        typeof L === "undefined"
    ) {

        console.error(
            "Leaflet library is not loaded."
        );

        return;

    }


    if (
        parentMap
    ) {

        setTimeout(
            () => {

                parentMap.invalidateSize();

            },
            200
        );

        return;

    }


    parentMap =
    L.map(
        "parentMap",
        {
            zoomControl: true
        }
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
            "&copy; OpenStreetMap contributors"
        }
    ).addTo(
        parentMap
    );


    /*
       نشانگر مدرسه
    */

    const schoolIcon =
    L.divIcon(
        {
            className: "",
            html:
            '<div class="school-marker">🏫</div>',
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -21]
        }
    );


    /*
       نشانگر والد
    */

    const parentIcon =
    L.divIcon(
        {
            className: "",
            html:
            '<div class="parent-marker">👤</div>',
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -21]
        }
    );


    /*
       مدرسه
    */

    schoolMarker =
    L.marker(
        [
            SCHOOL_LAT,
            SCHOOL_LNG
        ],
        {
            icon: schoolIcon
        }
    )
    .addTo(
        parentMap
    );


    schoolMarker.bindPopup(
        `
        <div class="map-popup-title">
        🏫 مدرسه
        </div>

        <div class="map-popup-text">
        محل مدرسه
        </div>
        `
    );


    /*
       دایره ۵۰۰۰ متری
    */

    allowedCircle =
    L.circle(
        [
            SCHOOL_LAT,
            SCHOOL_LNG
        ],
        {
            radius:
            ALLOWED_RADIUS,

            color:
            "#2563eb",

            fillColor:
            "#3b82f6",

            fillOpacity:
            0.12,

            weight:
            2
        }
    )
    .addTo(
        parentMap
    );


    /*
       مرکز نقشه
    */

    parentMap.setView(
        [
            SCHOOL_LAT,
            SCHOOL_LNG
        ],
        14
    );


    /*
       راهنمای نقشه
    */

    L.control.scale(
        {
            imperial: false,
            metric: true
        }
    ).addTo(
        parentMap
    );


    setTimeout(
        () => {

            parentMap.invalidateSize();

        },
        300
    );

}


/* =====================================================
   HAVERSINE DISTANCE
===================================================== */

function calculateDistance(
    latitude,
    longitude
) {

    const lat1 =
    latitude *
    Math.PI /
    180;


    const lat2 =
    SCHOOL_LAT *
    Math.PI /
    180;


    const dLat =
    (
        SCHOOL_LAT -
        latitude
    ) *
    Math.PI /
    180;


    const dLng =
    (
        SCHOOL_LNG -
        longitude
    ) *
    Math.PI /
    180;


    const a =
    Math.sin(
        dLat / 2
    ) ** 2
    +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(
        dLng / 2
    ) ** 2;


    const c =
    2 *
    Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );


    return Math.round(
        EARTH_RADIUS * c
    );

}


/* =====================================================
   UPDATE MAP WITH PARENT LOCATION
===================================================== */

function updateParentMapLocation(
    latitude,
    longitude,
    distance
) {

    if (
        !parentMap
    ) {

        initializeParentMap();

    }


    if (
        !parentMap
    ) {

        return;

    }


    const parentIcon =
    L.divIcon(
        {
            className: "",
            html:
            '<div class="parent-marker">👤</div>',
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -21]
        }
    );


    if (
        !parentMarker
    ) {

        parentMarker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon:
                parentIcon
            }
        )
        .addTo(
            parentMap
        );

    }

    else {

        parentMarker.setLatLng(
            [
                latitude,
                longitude
            ]
        );

    }


    parentMarker.bindPopup(
        `
        <div class="map-popup-title">
        👤 موقعیت والد
        </div>

        <div class="map-popup-text">
        فاصله تا مدرسه: ${formatDistance(distance)}
        </div>
        `
    );


    /*
       خط بین والد و مدرسه
    */

    if (
        distanceLine
    ) {

        distanceLine.setLatLngs(
            [
                [
                    SCHOOL_LAT,
                    SCHOOL_LNG
                ],
                [
                    latitude,
                    longitude
                ]
            ]
        );

    }

    else {

        distanceLine =
        L.polyline(
            [
                [
                    SCHOOL_LAT,
                    SCHOOL_LNG
                ],
                [
                    latitude,
                    longitude
                ]
            ],
            {
                color:
                "#64748b",

                weight:
                3,

                opacity:
                0.65,

                dashArray:
                "8, 8"
            }
        )
        .addTo(
            parentMap
        );

    }


    /*
       نمایش والد و مدرسه در قاب
    */

    const bounds =
    L.latLngBounds(
        [
            [
                SCHOOL_LAT,
                SCHOOL_LNG
            ],
            [
                latitude,
                longitude
            ]
        ]
    );


    /*
       اگر فاصله خیلی کم باشد،
       زوم بیش از حد نشود.
    */

    if (
        distance <= 100
    ) {

        parentMap.setView(
            [
                latitude,
                longitude
            ],
            17
        );

    }

    else {

        parentMap.fitBounds(
            bounds,
            {
                padding:
                [35, 35],

                maxZoom:
                16
            }
        );

    }


    parentLocationText.textContent =
    "موقعیت دریافت شد";


    distanceText.textContent =
    formatDistance(
        distance
    );

}


/* =====================================================
   DISTANCE FORMAT
===================================================== */

function formatDistance(
    distance
) {

    if (
        distance < 1000
    ) {

        return (
            new Intl.NumberFormat(
                "fa-IR"
            ).format(
                distance
            ) +
            " متر"
        );

    }


    const kilometers =
    distance / 1000;


    return (
        new Intl.NumberFormat(
            "fa-IR",
            {
                maximumFractionDigits: 2
            }
        ).format(
            kilometers
        ) +
        " کیلومتر"
    );

}


/* =====================================================
   LOCATION UI
===================================================== */

function setLocationLoadingUI() {

    locationStatus.textContent =
    "در حال دریافت موقعیت...";

    locationStatus.style.color =
    "#2563eb";


    parentLocationText.textContent =
    "در حال دریافت موقعیت...";


    distanceText.textContent =
    "در حال محاسبه...";


    mapResultCard.classList.remove(
        "location-inside",
        "location-outside"
    );

    mapResultCard.classList.add(
        "location-loading"
    );


    mapResultIcon.textContent =
    "📍";


    mapResultText.textContent =
    "در حال بررسی موقعیت";


    if (
        locationRefreshButton
    ) {

        locationRefreshButton.disabled =
        true;

        locationRefreshButton.textContent =
        "📍 در حال دریافت موقعیت...";

    }

}


function setLocationInsideUI(
    distance
) {

    locationStatus.textContent =
    `داخل محدوده مدرسه — ${formatDistance(distance)}`;

    locationStatus.style.color =
    "#16a34a";


    parentLocationText.textContent =
    "داخل محدوده مجاز";


    distanceText.textContent =
    formatDistance(
        distance
    );


    mapResultCard.classList.remove(
        "location-loading",
        "location-outside"
    );

    mapResultCard.classList.add(
        "location-inside"
    );


    mapResultIcon.textContent =
    "🟢";


    mapResultText.textContent =
    "داخل محدوده مجاز";


    if (
        locationRefreshButton
    ) {

        locationRefreshButton.disabled =
        false;

        locationRefreshButton.textContent =
        "📍 بروزرسانی موقعیت";

    }

}


function setLocationOutsideUI(
    distance
) {

    locationStatus.textContent =
    `خارج از محدوده مدرسه — ${formatDistance(distance)}`;

    locationStatus.style.color =
    "#dc2626";


    parentLocationText.textContent =
    "خارج از محدوده مجاز";


    distanceText.textContent =
    formatDistance(
        distance
    );


    mapResultCard.classList.remove(
        "location-loading",
        "location-inside"
    );

    mapResultCard.classList.add(
        "location-outside"
    );


    mapResultIcon.textContent =
    "🔴";


    mapResultText.textContent =
    "خارج از محدوده مجاز";


    if (
        locationRefreshButton
    ) {

        locationRefreshButton.disabled =
        false;

        locationRefreshButton.textContent =
        "📍 بروزرسانی موقعیت";

    }

}


function setLocationErrorUI(
    text
) {

    locationStatus.textContent =
    text;

    locationStatus.style.color =
    "#dc2626";


    parentLocationText.textContent =
    "دریافت نشد";


    distanceText.textContent =
    "---";


    mapResultCard.classList.remove(
        "location-loading",
        "location-inside"
    );

    mapResultCard.classList.add(
        "location-outside"
    );


    mapResultIcon.textContent =
    "⚠️";


    mapResultText.textContent =
    "خطا در دریافت موقعیت";


    if (
        locationRefreshButton
    ) {

        locationRefreshButton.disabled =
        false;

        locationRefreshButton.textContent =
        "📍 تلاش مجدد";

    }

}


/* =====================================================
   MEDIAN LOCATION PERMISSION
===================================================== */

async function requestMedianLocationPermission() {

    /*
       در مرورگر عادی Median وجود ندارد.
       در این حالت مستقیماً سراغ Geolocation می‌رویم.
    */

    if (
        typeof window.median ===
        "undefined"
    ) {

        return true;

    }


    /*
       فقط Android
    */

    const isAndroid =
    navigator.userAgent
    .toLowerCase()
    .includes("medianandroid");


    if (
        !isAndroid
    ) {

        return true;

    }


    try {

        if (
            window.median.android &&
            window.median.android.geoLocation &&
            typeof
            window.median.android.geoLocation
            .promptLocationServices ===
            "function"
        ) {

            window.median.android.geoLocation
            .promptLocationServices();

        }

        return true;

    }

    catch (error) {

        console.error(
            "Median location permission error:",
            error
        );

        return true;

    }

}


/* =====================================================
   GET CURRENT LOCATION
===================================================== */

function getCurrentParentLocation() {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

            /*
               درخواست مجوز Median
            */

            await requestMedianLocationPermission();


            if (
                !navigator.geolocation
            ) {

                reject(
                    {
                        code: 0,
                        message:
                        "Geolocation unavailable"
                    }
                );

                return;

            }


            navigator.geolocation
            .getCurrentPosition(

                position => {

                    resolve(
                        position
                    );

                },

                error => {

                    reject(
                        error
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


/* =====================================================
   CHECK / REFRESH LOCATION
===================================================== */

async function refreshParentLocation(
    showAlert = true
) {

    if (
        locationRequestInProgress
    ) {

        return null;

    }


    locationRequestInProgress =
    true;


    setLocationLoadingUI();


    try {

        const position =
        await getCurrentParentLocation();


        const latitude =
        position.coords.latitude;


        const longitude =
        position.coords.longitude;


        const accuracy =
        position.coords.accuracy;


        const distance =
        calculateDistance(
            latitude,
            longitude
        );


        lastParentPosition =
        {
            latitude,
            longitude,
            accuracy,
            distance
        };


        updateParentMapLocation(
            latitude,
            longitude,
            distance
        );


        if (
            distance <=
            ALLOWED_RADIUS
        ) {

            setLocationInsideUI(
                distance
            );

        }

        else {

            setLocationOutsideUI(
                distance
            );

        }


        return {
            latitude,
            longitude,
            accuracy,
            distance,
            inside:
            distance <=
            ALLOWED_RADIUS
        };

    }

    catch (error) {

        console.error(
            "GPS ERROR:",
            error
        );


        let errorText =
        "خطا در دریافت موقعیت";


        if (
            error &&
            error.code === 1
        ) {

            errorText =
            "دسترسی به موقعیت مکانی داده نشد.";

        }

        else if (
            error &&
            error.code === 2
        ) {

            errorText =
            "موقعیت مکانی شما قابل تشخیص نیست.";

        }

        else if (
            error &&
            error.code === 3
        ) {

            errorText =
            "زمان دریافت موقعیت مکانی تمام شد.";

        }


        setLocationErrorUI(
            errorText
        );


        if (
            showAlert
        ) {

            alert(
                errorText
            );

        }


        return null;

    }

    finally {

        locationRequestInProgress =
        false;

    }

}


/* =====================================================
   LOCATION BUTTON
===================================================== */

if (
    locationRefreshButton
) {

    locationRefreshButton.addEventListener(
        "click",
        async () => {

            await refreshParentLocation(
                true
            );

        }
    );

}
/* =====================================================
   CALL STATUS
===================================================== */

function updateParentCallStatus(
    call
) {

    if (
        !call
    ) {

        return;

    }


    const statusElement =
    document.querySelector(
        ".status"
    );

    const statusDot =
    document.querySelector(
        ".status-dot"
    );


    if (
        !statusElement ||
        !statusDot
    ) {

        return;

    }


    if (
        call.status ===
        "فراخوان شد"
    ) {

        statusElement.lastChild.textContent =
        " فراخوان شد";

        statusDot.style.background =
        "#f59e0b";

    }

    else if (
        call.status ===
        "دریافت فراخوان"
    ) {

        statusElement.lastChild.textContent =
        " دریافت فراخوان";

        statusDot.style.background =
        "#2563eb";

    }

    else if (
        call.status ===
        "ارسال شد"
    ) {

        statusElement.lastChild.textContent =
        " ارسال شد";

        statusDot.style.background =
        "#16a34a";

    }

}


/* =====================================================
   LOAD EXISTING CALL
===================================================== */

async function loadExistingCall() {

    if (
        !currentStudentName ||
        !currentClassName
    ) {

        return;

    }


    const today =
    getIranDate();


    const {
        data,
        error
    } =
    await supabaseClient
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
        today
    )
    .in(
        "status",
        [
            "فراخوان شد",
            "دریافت فراخوان",
            "ارسال شد"
        ]
    )
    .order(
        "id",
        {
            ascending: false
        }
    )
    .limit(1)
    .maybeSingle();


    if (
        error
    ) {

        console.error(
            "خطا در دریافت فراخوان:",
            error
        );

        return;

    }


    if (
        !data
    ) {

        callButton.dataset.locked =
        "false";

        updateCallScheduleUI();

        return;

    }


    updateParentCallStatus(
        data
    );


    callButton.dataset.locked =
    "true";


    if (
        data.status ===
        "فراخوان شد"
    ) {

        callButton.disabled =
        true;

        callButton.textContent =
        "📢 فراخوان ارسال شده";

        callButton.style.background =
        "linear-gradient(135deg, #16a34a, #22c55e)";

    }

    else if (
        data.status ===
        "دریافت فراخوان"
    ) {

        callButton.disabled =
        true;

        callButton.textContent =
        "📢 فراخوان در حال پیگیری";

    }

    else if (
        data.status ===
        "ارسال شد"
    ) {

        callButton.disabled =
        true;

        callButton.textContent =
        "✅ فراخوان ارسال شد";

        callButton.style.background =
        "linear-gradient(135deg, #16a34a, #22c55e)";

    }

}


/* =====================================================
   AUTO REFRESH
===================================================== */

function startParentAutoRefresh() {

    if (
        parentRefreshInterval
    ) {

        clearInterval(
            parentRefreshInterval
        );

    }


    parentRefreshInterval =
    setInterval(
        async () => {

            if (
                !currentStudentName ||
                !currentClassName
            ) {

                return;

            }


            await loadExistingCall();

            updateCallScheduleUI();

        },
        10000
    );

}


/* =====================================================
   REALTIME
===================================================== */

function startParentRealtime() {

    if (
        !currentStudentName ||
        !currentClassName
    ) {

        return;

    }


    if (
        parentCallChannel
    ) {

        supabaseClient.removeChannel(
            parentCallChannel
        );

    }


    parentCallChannel =
    supabaseClient
    .channel(
        "parent-call-" +
        Date.now()
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "calls",
            filter:
            "class_name=eq." +
            currentClassName
        },
        payload => {

            const call =
            payload.new;


            if (
                !call
            ) {

                return;

            }


            if (
                call.student_name !==
                currentStudentName
            ) {

                return;

            }


            if (
                call.called_date !==
                getIranDate()
            ) {

                return;

            }


            updateParentCallStatus(
                call
            );


            callButton.dataset.locked =
            "true";


            if (
                call.status ===
                "فراخوان شد"
            ) {

                callButton.disabled =
                true;

                callButton.textContent =
                "📢 فراخوان ارسال شده";

                callButton.style.background =
                "linear-gradient(135deg, #16a34a, #22c55e)";

            }

            else if (
                call.status ===
                "دریافت فراخوان"
            ) {

                callButton.disabled =
                true;

                callButton.textContent =
                "📢 فراخوان در حال پیگیری";

            }

            else if (
                call.status ===
                "ارسال شد"
            ) {

                callButton.disabled =
                true;

                callButton.textContent =
                "✅ فراخوان ارسال شد";

                callButton.style.background =
                "linear-gradient(135deg, #16a34a, #22c55e)";

            }

        }
    )
    .subscribe(
        status => {

            console.log(
                "Parent Realtime:",
                status
            );

        }
    );

}


/* =====================================================
   LOGIN
===================================================== */

loginButton.addEventListener(
    "click",
    async () => {

        const name =
        studentNameInput.value.trim();

        const code =
        parentCodeInput.value.trim();


        message.textContent =
        "";


        if (
            !name ||
            !code
        ) {

            message.textContent =
            "لطفاً نام دانش‌آموز و کد ورود را وارد کنید.";

            message.style.color =
            "#dc2626";

            return;

        }


        if (
            !/^\d{4}$/.test(code)
        ) {

            message.textContent =
            "کد ورود باید دقیقاً ۴ رقم باشد.";

            message.style.color =
            "#dc2626";

            return;

        }


        loginButton.disabled =
        true;

        loginButton.textContent =
        "در حال بررسی...";


        const {
            data,
            error
        } =
        await supabaseClient
        .from("parent_accounts")
        .select(
            "id, student_name, class_name"
        )
        .eq(
            "student_name",
            name
        )
        .eq(
            "parent_code",
            code
        )
        .maybeSingle();


        if (
            error
        ) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            message.textContent =
            "خطا در ارتباط با سامانه.";

            message.style.color =
            "#dc2626";

        }

        else if (
            !data
        ) {

            message.textContent =
            "نام دانش‌آموز یا کد ورود صحیح نیست.";

            message.style.color =
            "#dc2626";

        }

        else {

            currentStudentName =
            data.student_name;

            currentClassName =
            data.class_name;


            panelStudentName.textContent =
            data.student_name;


            panelClassName.textContent =
            "کلاس " +
            data.class_name;


            updateCallScheduleUI();


            message.textContent =
            "ورود موفق بود ✅";

            message.style.color =
            "#16a34a";


            setTimeout(
                async () => {

                    loginScreen.style.display =
                    "none";

                    parentPanel.style.display =
                    "block";


                    window.scrollTo(
                        {
                            top: 0,
                            behavior: "smooth"
                        }
                    );


                    /*
                       ساخت نقشه بعد از
                       نمایش پنل
                    */

                    initializeParentMap();


                    updateCallScheduleUI();


                    await loadExistingCall();


                    startParentRealtime();


                    startParentAutoRefresh();


                    /*
                       دریافت خودکار موقعیت
                       بعد از ورود
                    */

                    setTimeout(
                        async () => {

                            await refreshParentLocation(
                                false
                            );

                        },
                        700
                    );

                },
                400
            );

        }


        loginButton.disabled =
        false;

        loginButton.textContent =
        "ورود به پنل";

    }
);


/* =====================================================
   ENTER KEY
===================================================== */

studentNameInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            loginButton.click();

        }

    }
);


parentCodeInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            loginButton.click();

        }

    }
);


/* =====================================================
   ONLY 4 DIGITS
===================================================== */

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


/* =====================================================
   CALL BUTTON
===================================================== */

callButton.addEventListener(
    "click",
    async () => {

        if (
            !currentStudentName ||
            !currentClassName
        ) {

            alert(
                "اطلاعات دانش‌آموز یافت نشد."
            );

            return;

        }


        if (
            !isCallTimeActive()
        ) {

            const schedule =
            getCallSchedule(
                currentClassName
            );


            alert(
                "فراخوانی این کلاس فقط از ساعت " +
                schedule.text +
                " فعال است."
            );


            updateCallScheduleUI();

            return;

        }


        if (
            callButton.dataset.locked ===
            "true"
        ) {

            return;

        }


        /*
           ابتدا موقعیت را تازه دریافت می‌کنیم.
           بنابراین موقعیت قدیمی استفاده نمی‌شود.
        */

        callButton.disabled =
        true;

        callButton.textContent =
        "📍 در حال بررسی موقعیت...";


        const locationResult =
        await refreshParentLocation(
            true
        );


        /*
           اگر GPS دریافت نشد
        */

        if (
            !locationResult
        ) {

            callButton.disabled =
            false;

            callButton.textContent =
            "📢 فراخوانی دانش‌آموز";

            return;

        }


        const distance =
        locationResult.distance;


        /*
           بررسی محدوده ۵۰۰۰ متر
        */

        if (
            distance >
            ALLOWED_RADIUS
        ) {

            callButton.disabled =
            false;

            callButton.textContent =
            "📢 فراخوانی دانش‌آموز";


            alert(
                "شما خارج از محدوده مجاز مدرسه هستید.\n" +
                "فاصله شما: " +
                formatDistance(distance) +
                "\n" +
                "محدوده مجاز: ۵۰۰۰ متر"
            );


            return;

        }


        /*
           داخل محدوده هستیم
        */

        callButton.textContent =
        "📢 در حال بررسی فراخوان قبلی...";


        const today =
        getIranDate();


        const {
            data: activeCall,
            error: activeError
        } =
        await supabaseClient
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
            today
        )
        .in(
            "status",
            [
                "فراخوان شد",
                "دریافت فراخوان"
            ]
        )
        .order(
            "id",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


        if (
            activeError
        ) {

            console.error(
                activeError
            );


            callButton.disabled =
            false;

            callButton.textContent =
            "📢 فراخوانی دانش‌آموز";


            alert(
                "خطا در بررسی فراخوان قبلی."
            );


            return;

        }


        if (
            activeCall
        ) {

            updateParentCallStatus(
                activeCall
            );


            callButton.dataset.locked =
            "true";

            callButton.disabled =
            true;


            callButton.textContent =
            "📢 فراخوان قبلاً ارسال شده";


            alert(
                "برای این دانش‌آموز یک فراخوان فعال وجود دارد."
            );


            return;

        }


        /*
           ثبت فراخوان
        */

        callButton.textContent =
        "📢 در حال ارسال فراخوان...";


        const calledDate =
        getIranDate();


        const calledTime =
        getIranTime();


        const {
            data: newCall,
            error: insertError
        } =
        await supabaseClient
        .from("calls")
        .insert(
            [
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
            ]
        )
        .select()
        .single();


        if (
            insertError
        ) {

            console.error(
                "CALL INSERT ERROR:",
                insertError
            );


            callButton.disabled =
            false;

            callButton.textContent =
            "📢 فراخوانی دانش‌آموز";


            alert(
                "ارسال فراخوان انجام نشد.\nلطفاً دوباره تلاش کنید."
            );


            return;

        }


        /*
           موفقیت
        */

        callButton.dataset.locked =
        "true";


        callButton.disabled =
        true;


        callButton.textContent =
        "✅ فراخوان ارسال شد";


        callButton.style.background =
        "linear-gradient(135deg, #16a34a, #22c55e)";


        callButton.style.boxShadow =
        "0 15px 30px rgba(22, 163, 74, 0.25)";


        updateParentCallStatus(
            newCall
        );


        alert(
            "فراخوان با موفقیت ارسال شد.\n" +
            "فاصله شما تا مدرسه: " +
            formatDistance(distance) +
            "\n" +
            "زمان ارسال: " +
            calledTime
        );

    }
);


/* =====================================================
   MEDIAN LIBRARY READY
===================================================== */

/*
   Median این تابع را زمانی که
   JavaScript Bridge آماده شود
   فراخوانی می‌کند.
*/

function median_library_ready() {

    console.log(
        "Median JavaScript Bridge is ready."
    );

}


/*
   اگر Bridge قبل از تعریف تابع
   آماده شده باشد.
*/

if (
    window.median
) {

    median_library_ready();

}


/* =====================================================
   IOS GEOLOCATION READY
===================================================== */

/*
   Median برای iOS می‌تواند این
   callback را هنگام آماده شدن
   سرویس Location صدا بزند.

   در Android و مرورگر عادی
   کاری انجام نمی‌دهیم.
*/

function median_geolocation_ready() {

    console.log(
        "Median geolocation services are ready."
    );

}