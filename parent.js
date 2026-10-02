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
   PERSIAN NAME NORMALIZATION
===================================================== */

function normalizePersianName(value) {

    if (!value) {
        return "";
    }

    let text = String(value);

    // تبدیل حروف عربی به فارسی
    text = text
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ة/g, "ه")
        .replace(/ۀ/g, "ه");

    // حذف اعراب
    text = text.replace(
        /[\u064B-\u065F\u0670]/g,
        ""
    );

    // حذف نیم‌فاصله و فاصله‌های اضافی
    text = text.replace(
        /[\u200c\u200d]/g,
        " "
    );

    // یکسان‌سازی فاصله‌ها
    text = text.replace(
        /\s+/g,
        " "
    );

    // حذف فاصله ابتدا و انتها
    text = text.trim();

    // کوچک کردن حروف انگلیسی در صورت وجود
    text = text.toLowerCase();

    return text;
}


/* =====================================================
   REMOVE SPACES FOR NAME COMPARISON
===================================================== */

function compactName(value) {

    return normalizePersianName(value)
        .replace(/\s+/g, "");

}


/* =====================================================
   LEVENSHTEIN DISTANCE
===================================================== */

function levenshteinDistance(a, b) {

    a = compactName(a);
    b = compactName(b);


    if (a === b) {
        return 0;
    }


    if (!a.length) {
        return b.length;
    }


    if (!b.length) {
        return a.length;
    }


    const matrix = [];


    for (
        let i = 0;
        i <= b.length;
        i++
    ) {

        matrix[i] = [i];

    }


    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        matrix[0][j] = j;

    }


    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            if (
                b.charAt(i - 1) ===
                a.charAt(j - 1)
            ) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] =
                    Math.min(

                        matrix[i - 1][j] + 1,

                        matrix[i][j - 1] + 1,

                        matrix[i - 1][j - 1] + 1

                    );

            }

        }

    }


    return matrix[b.length][a.length];

}


/* =====================================================
   NAME SIMILARITY
===================================================== */

function nameSimilarity(
    enteredName,
    databaseName
) {

    const a =
        compactName(enteredName);

    const b =
        compactName(databaseName);


    if (
        !a ||
        !b
    ) {

        return 0;

    }


    if (
        a === b
    ) {

        return 1;

    }


    const distance =
        levenshteinDistance(
            a,
            b
        );


    const maxLength =
        Math.max(
            a.length,
            b.length
        );


    if (
        maxLength === 0
    ) {

        return 1;

    }


    return (
        1 -
        distance / maxLength
    );

}


/* =====================================================
   CHECK NAME
===================================================== */

function isNameSimilar(
    enteredName,
    databaseName
) {

    const similarity =
        nameSimilarity(
            enteredName,
            databaseName
        );


    /*
       0.90 به بالا:
       تقریباً بدون اشتباه

       0.80 تا 0.90:
       چند اشتباه جزئی

       کمتر از 0.80:
       احتمالاً نام متفاوت است
    */

    return similarity >= 0.80;

}
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

const locationRefreshButton =
    document.getElementById("locationRefreshButton");


/*
   دو کارت جدید
*/

const allowedRadiusValue =
    document.getElementById("allowedRadiusValue");

const liveParentDistance =
    document.getElementById("liveParentDistance");

const liveParentStatus =
    document.getElementById("liveParentStatus");

const parentLocationIcon =
    document.getElementById("parentLocationIcon");

const parentLocationCard =
    document.querySelector(
        ".parent-location-card"
    );


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentStudentName = "";
let currentClassName = "";

let parentCallChannel = null;
let parentRefreshInterval = null;

let lastParentPosition = null;

let locationRequestInProgress = false;

/*
   شناسه watchPosition
*/

let parentLocationWatchId = null;


/* =====================================================
   LOCATION CONFIGURATION
===================================================== */

/*
   مختصات مدرسه
   فقط برای محاسبه فاصله استفاده می‌شود.
   روی صفحه نمایش داده نمی‌شود.
*/

const SCHOOL_LAT =
    35.76494314018861;

const SCHOOL_LNG =
    51.32257158390593;


/*
   محدوده مجاز برحسب متر
*/

const ALLOWED_RADIUS =
    5000;


/*
   شعاع زمین برای محاسبه فاصله
*/

const EARTH_RADIUS =
    6371000;


/* =====================================================
   CALL SCHEDULE
===================================================== */

function getCallSchedule(
    className
) {

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


    if (currentDate) {

        currentDate.textContent =
            getPersianDate();

    }


    if (currentTime) {

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


    if (callActivationTime) {

        callActivationTime.textContent =
            "ساعت " +
            schedule.text;

    }


    if (callDescription) {

        callDescription.textContent =
            "فراخوانی دانش‌آموز از ساعت " +
            schedule.text +
            " فعال است. برای ارسال فراخوان، ابتدا موقعیت مکانی شما بررسی می‌شود.";

    }


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
                Math.round(distance)
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
   INITIALIZE LOCATION CARDS
===================================================== */

function updateAllowedRadiusUI() {

    if (!allowedRadiusValue) {
        return;
    }


    allowedRadiusValue.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            ALLOWED_RADIUS
        );

}


function setLiveParentLoading() {

    if (parentLocationCard) {

        parentLocationCard.classList.remove(
            "location-inside",
            "location-outside"
        );

        parentLocationCard.classList.add(
            "location-loading"
        );

    }


    if (liveParentDistance) {

        liveParentDistance.textContent =
            "---";

    }


    if (liveParentStatus) {

        liveParentStatus.textContent =
            "در حال دریافت موقعیت...";

    }


    if (parentLocationIcon) {

        parentLocationIcon.textContent =
            "📍";

    }

}


function updateLiveParentDistance(
    distance
) {

    if (liveParentDistance) {

        liveParentDistance.textContent =
            new Intl.NumberFormat(
                "fa-IR"
            ).format(
                Math.round(distance)
            );

    }


    if (!parentLocationCard) {
        return;
    }


    parentLocationCard.classList.remove(
        "location-loading",
        "location-inside",
        "location-outside"
    );


    if (
        distance <=
        ALLOWED_RADIUS
    ) {

        parentLocationCard.classList.add(
            "location-inside"
        );


        if (liveParentStatus) {

            liveParentStatus.textContent =
                "داخل محدوده مجاز";

        }


        if (parentLocationIcon) {

            parentLocationIcon.textContent =
                "🟢";

        }

    }

    else {

        parentLocationCard.classList.add(
            "location-outside"
        );


        if (liveParentStatus) {

            liveParentStatus.textContent =
                "خارج از محدوده مجاز";

        }


        if (parentLocationIcon) {

            parentLocationIcon.textContent =
                "🔴";

        }

    }

}


updateAllowedRadiusUI();
/* =====================================================
   MEDIAN LOCATION PERMISSION
===================================================== */

async function requestMedianLocationPermission() {

    /*
       در مرورگر عادی Median وجود ندارد.
       در این حالت مستقیماً از Geolocation استفاده می‌کنیم.
    */

    if (
        typeof window.median ===
        "undefined"
    ) {

        return true;

    }


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
   برای بررسی دقیق هنگام ارسال فراخوان
===================================================== */

function getCurrentParentLocation() {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

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
   LIVE PARENT LOCATION
   دریافت آنلاین موقعیت والد
===================================================== */

function startLiveParentLocation() {

    if (
        !navigator.geolocation
    ) {

        if (liveParentStatus) {

            liveParentStatus.textContent =
                "مرورگر از موقعیت مکانی پشتیبانی نمی‌کند.";

        }

        return;

    }


    /*
       اگر قبلاً Watch فعال بوده،
       ابتدا آن را متوقف می‌کنیم.
    */

    if (
        parentLocationWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            parentLocationWatchId
        );

        parentLocationWatchId =
            null;

    }


    setLiveParentLoading();


    /*
       دریافت مداوم موقعیت
    */

    parentLocationWatchId =
        navigator.geolocation.watchPosition(

            position => {

                const latitude =
                    position.coords.latitude;


                const longitude =
                    position.coords.longitude;


                const accuracy =
                    position.coords.accuracy;


                /*
                   فاصله جدید تا مدرسه
                */

                const distance =
                    calculateDistance(
                        latitude,
                        longitude
                    );


                /*
                   ذخیره آخرین موقعیت
                */

                lastParentPosition = {

                    latitude,

                    longitude,

                    accuracy,

                    distance

                };


                /*
                   به‌روزرسانی فوری
                   کارت فاصله والد
                */

                updateLiveParentDistance(
                    distance
                );


                /*
                   به‌روزرسانی وضعیت GPS
                */

                if (
                    locationStatus
                ) {

                    if (
                        distance <=
                        ALLOWED_RADIUS
                    ) {

                        locationStatus.textContent =
                            `داخل محدوده مجاز — ${formatDistance(distance)}`;

                        locationStatus.style.color =
                            "#16a34a";

                    }

                    else {

                        locationStatus.textContent =
                            `خارج از محدوده مجاز — ${formatDistance(distance)}`;

                        locationStatus.style.color =
                            "#dc2626";

                    }

                }

            },


            error => {

                console.error(
                    "LIVE GPS ERROR:",
                    error
                );


                if (
                    liveParentStatus
                ) {

                    if (
                        error.code === 1
                    ) {

                        liveParentStatus.textContent =
                            "دسترسی به موقعیت داده نشده است.";

                    }

                    else if (
                        error.code === 2
                    ) {

                        liveParentStatus.textContent =
                            "موقعیت قابل تشخیص نیست.";

                    }

                    else if (
                        error.code === 3
                    ) {

                        liveParentStatus.textContent =
                            "زمان دریافت موقعیت تمام شد.";

                    }

                    else {

                        liveParentStatus.textContent =
                            "خطا در دریافت موقعیت.";

                    }

                }

            },


            {
                enableHighAccuracy:
                    true,

                timeout:
                    10000,

                maximumAge:
                    0
            }

        );

}


/* =====================================================
   STOP LIVE LOCATION
===================================================== */

function stopLiveParentLocation() {

    if (
        parentLocationWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            parentLocationWatchId
        );

        parentLocationWatchId =
            null;

    }

}


/* =====================================================
   MANUAL LOCATION REFRESH
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


    setLiveParentLoading();


    if (
        locationRefreshButton
    ) {

        locationRefreshButton.disabled =
            true;

        locationRefreshButton.textContent =
            "📍 در حال دریافت موقعیت...";

    }


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


        lastParentPosition = {

            latitude,

            longitude,

            accuracy,

            distance

        };


        /*
           بروزرسانی مستقیم کارت
        */

        updateLiveParentDistance(
            distance
        );


        /*
           بروزرسانی وضعیت
        */

        if (
            distance <=
            ALLOWED_RADIUS
        ) {

            if (locationStatus) {

                locationStatus.textContent =
                    `داخل محدوده مجاز — ${formatDistance(distance)}`;

                locationStatus.style.color =
                    "#16a34a";

            }

        }

        else {

            if (locationStatus) {

                locationStatus.textContent =
                    `خارج از محدوده مجاز — ${formatDistance(distance)}`;

                locationStatus.style.color =
                    "#dc2626";

            }

        }


        if (
            locationRefreshButton
        ) {

            locationRefreshButton.disabled =
                false;

            locationRefreshButton.textContent =
                "📍 بروزرسانی موقعیت";

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


        if (
            locationStatus
        ) {

            locationStatus.textContent =
                errorText;

            locationStatus.style.color =
                "#dc2626";

        }


        if (
            liveParentStatus
        ) {

            liveParentStatus.textContent =
                errorText;

        }


        if (
            liveParentDistance
        ) {

            liveParentDistance.textContent =
                "---";

        }


        if (
            parentLocationIcon
        ) {

            parentLocationIcon.textContent =
                "⚠️";

        }


        if (
            locationRefreshButton
        ) {

            locationRefreshButton.disabled =
                false;

            locationRefreshButton.textContent =
                "📍 تلاش مجدد";

        }


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


/* =====================================================
   SEARCH PARENT BY CODE
===================================================== */

const {
    data: accounts,
    error
} =
    await supabaseClient
        .from("parent_accounts")
        .select(
            "id, student_name, class_name"
        )
        .eq(
            "parent_code",
            code
        );


/* =====================================================
   DATABASE ERROR
===================================================== */

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


    loginButton.disabled =
        false;

    loginButton.textContent =
        "ورود به پنل";


    return;

}


/* =====================================================
   FIND SIMILAR NAME
===================================================== */

const enteredName =
    normalizePersianName(
        name
    );


let matchedAccount =
    null;


let bestSimilarity =
    0;


if (
    accounts &&
    accounts.length
) {

    for (
        const account of accounts
    ) {

        const similarity =
            nameSimilarity(
                enteredName,
                account.student_name
            );


        if (
            similarity >
            bestSimilarity
        ) {

            bestSimilarity =
                similarity;

            matchedAccount =
                account;

        }

    }

}


/* =====================================================
   NAME NOT FOUND
===================================================== */

if (
    !matchedAccount ||
    bestSimilarity < 0.80
) {

    message.textContent =
        "نام دانش‌آموز یا کد ورود صحیح نیست.";

    message.style.color =
        "#dc2626";


    loginButton.disabled =
        false;

    loginButton.textContent =
        "ورود به پنل";


    return;

}


/* =====================================================
   LOGIN SUCCESS
===================================================== */

const data =
    matchedAccount;


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
   MEDIAN LIBRARY READY
===================================================== */

function median_library_ready() {

    console.log(
        "Median JavaScript Bridge is ready."
    );

}


if (
    window.median
) {

    median_library_ready();

}


/* =====================================================
   IOS GEOLOCATION READY
===================================================== */

function median_geolocation_ready() {

    console.log(
        "Median geolocation services are ready."
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


        /* =================================================
           VALIDATION
        ================================================= */

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


        /* =================================================
           LOGIN LOADING
        ================================================= */

        loginButton.disabled =
            true;

        loginButton.textContent =
            "در حال بررسی...";


        /* =================================================
           SUPABASE LOGIN
        ================================================= */

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


        /* =================================================
           LOGIN ERROR
        ================================================= */

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


        /* =================================================
           WRONG LOGIN
        ================================================= */

        else if (
            !data
        ) {

            message.textContent =
                "نام دانش‌آموز یا کد ورود صحیح نیست.";

            message.style.color =
                "#dc2626";

        }


        /* =================================================
           LOGIN SUCCESS
        ================================================= */

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


            /*
               بروزرسانی ساعت فراخوان
            */

            updateCallScheduleUI();


            message.textContent =
                "ورود موفق بود ✅";

            message.style.color =
                "#16a34a";


            /* =================================================
               OPEN PARENT PANEL
            ================================================= */

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
                       هیچ نقشه‌ای ساخته نمی‌شود.
                       فقط کارت‌های موقعیت نمایش داده می‌شوند.
                    */


                    updateAllowedRadiusUI();


                    updateCallScheduleUI();


                    /* =================================================
                       LOAD EXISTING CALL
                    ================================================= */

                    await loadExistingCall();


                    /* =================================================
                       REALTIME CALL STATUS
                    ================================================= */

                    startParentRealtime();


                    /* =================================================
                       AUTO REFRESH CALL
                    ================================================= */

                    startParentAutoRefresh();


                    /* =================================================
                       START LIVE GPS
                    ================================================= */

                    /*
                       از اینجا به بعد موقعیت والد
                       به صورت آنلاین دنبال می‌شود.
                    */

                    startLiveParentLocation();


                },
                400
            );

        }


        /* =================================================
           RESET LOGIN BUTTON
        ================================================= */

        loginButton.disabled =
            false;

        loginButton.textContent =
            "ورود به پنل";

    }
);


/* =====================================================
   ENTER KEY - STUDENT NAME
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


/* =====================================================
   ENTER KEY - PARENT CODE
===================================================== */

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

        /* =================================================
           CHECK STUDENT
        ================================================= */

        if (
            !currentStudentName ||
            !currentClassName
        ) {

            alert(
                "اطلاعات دانش‌آموز یافت نشد."
            );

            return;

        }


        /* =================================================
           CHECK CALL TIME
        ================================================= */

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


        /* =================================================
           CHECK LOCK
        ================================================= */

        if (
            callButton.dataset.locked ===
            "true"
        ) {

            return;

        }


        /* =================================================
           GET FRESH GPS
        ================================================= */

        /*
           حتی اگر کارت موقعیت آنلاین باشد،
           هنگام ارسال فراخوان دوباره GPS گرفته می‌شود
           تا موقعیت همان لحظه بررسی شود.
        */

        callButton.disabled =
            true;

        callButton.textContent =
            "📍 در حال بررسی موقعیت...";


        const locationResult =
            await refreshParentLocation(
                true
            );


        /* =================================================
           GPS FAILED
        ================================================= */

        if (
            !locationResult
        ) {

            callButton.disabled =
                false;

            callButton.textContent =
                "📢 فراخوانی دانش‌آموز";

            return;

        }


        /* =================================================
           DISTANCE
        ================================================= */

        const distance =
            locationResult.distance;


        /* =================================================
           CHECK ALLOWED AREA
        ================================================= */

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
                "محدوده مجاز: " +
                formatDistance(ALLOWED_RADIUS)
            );


            return;

        }


        /* =================================================
           CHECK PREVIOUS CALL
        ================================================= */

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


        /* =================================================
           PREVIOUS CALL ERROR
        ================================================= */

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


        /* =================================================
           ALREADY CALLED
        ================================================= */

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


        /* =================================================
           INSERT NEW CALL
        ================================================= */

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


        /* =================================================
           INSERT ERROR
        ================================================= */

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


        /* =================================================
           SUCCESS
        ================================================= */

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
