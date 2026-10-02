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

    /*
       حروف عربی → فارسی
    */

    text = text
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ة/g, "ه")
        .replace(/ۀ/g, "ه");


    /*
       حذف اعراب
    */

    text = text.replace(
        /[\u064B-\u065F\u0670]/g,
        ""
    );


    /*
       نیم‌فاصله و کاراکترهای نامرئی
    */

    text = text.replace(
        /[\u200B-\u200D\uFEFF]/g,
        " "
    );


    /*
       تمام فاصله‌های متوالی → یک فاصله
    */

    text = text.replace(
        /\s+/g,
        " "
    );


    /*
       حذف فاصله ابتدا و انتها
    */

    text = text.trim();


    /*
       حروف انگلیسی
    */

    text = text.toLowerCase();


    return text;

}


/* =====================================================
   COMPACT NAME
===================================================== */

function compactName(value) {

    return normalizePersianName(value)
        .replace(/\s+/g, "");

}


/* =====================================================
   LEVENSHTEIN
===================================================== */

function levenshteinDistance(
    a,
    b
) {

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

            }

            else {

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
        compactName(
            enteredName
        );

    const b =
        compactName(
            databaseName
        );


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
   NAME MATCH
===================================================== */

function isNameSimilar(
    enteredName,
    databaseName
) {

    return (
        nameSimilarity(
            enteredName,
            databaseName
        ) >= 0.85
    );

}


/* =====================================================
   ELEMENTS
===================================================== */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );

const parentPanel =
    document.getElementById(
        "parentPanel"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const studentNameInput =
    document.getElementById(
        "studentName"
    );

const parentCodeInput =
    document.getElementById(
        "parentCode"
    );

const message =
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

const callButton =
    document.getElementById(
        "callButton"
    );

const locationStatus =
    document.getElementById(
        "locationStatus"
    );

const callActivationTime =
    document.getElementById(
        "callActivationTime"
    );

const callDescription =
    document.getElementById(
        "callDescription"
    );

const locationRefreshButton =
    document.getElementById(
        "locationRefreshButton"
    );


/*
   کارت‌های موقعیت
*/

const allowedRadiusValue =
    document.getElementById(
        "allowedRadiusValue"
    );

const liveParentDistance =
    document.getElementById(
        "liveParentDistance"
    );

const liveParentStatus =
    document.getElementById(
        "liveParentStatus"
    );

const parentLocationIcon =
    document.getElementById(
        "parentLocationIcon"
    );

const parentLocationCard =
    document.querySelector(
        ".parent-location-card"
    );


/*
   اعلان فراخوان معلم
*/

const teacherCallNotification =
    document.getElementById(
        "teacherCallNotification"
    );

const teacherCallNotificationText =
    document.getElementById(
        "teacherCallNotificationText"
    );

const teacherCallNotificationTime =
    document.getElementById(
        "teacherCallNotificationTime"
    );

const closeTeacherCallNotification =
    document.getElementById(
        "closeTeacherCallNotification"
    );


/*
   صدای اعلان
*/

const teacherCallNotificationSound =
    document.getElementById(
        "teacherCallNotificationSound"
    );

/* =====================================================
   UNLOCK NOTIFICATION AUDIO
===================================================== */

let notificationAudioUnlocked = false;

async function unlockNotificationAudio() {

    if (
        !teacherCallNotificationSound ||
        notificationAudioUnlocked
    ) {

        return;

    }

    try {

        /*
           صدا را در حالت بی‌صدا پخش می‌کنیم
           تا مرورگر اجازه پخش صوت را بدهد.
        */

        teacherCallNotificationSound.muted = true;

        teacherCallNotificationSound.volume = 0;

        teacherCallNotificationSound.currentTime = 0;

        const playPromise =
            teacherCallNotificationSound.play();


        if (
            playPromise !== undefined
        ) {

            await playPromise;

        }


        /*
           بعد از فعال شدن Audio،
           پخش را متوقف می‌کنیم.
        */

        teacherCallNotificationSound.pause();

        teacherCallNotificationSound.currentTime = 0;

        teacherCallNotificationSound.muted = false;

        teacherCallNotificationSound.volume = 1;


        notificationAudioUnlocked = true;


        console.log(
            "Notification audio unlocked successfully."
        );

    }

    catch (error) {

        console.warn(
            "Notification audio unlock failed:",
            error
        );

        teacherCallNotificationSound.muted = false;

        teacherCallNotificationSound.volume = 1;

    }

}
/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let currentStudentName = "";
let currentClassName = "";

let parentCallChannel = null;
let parentRefreshInterval = null;

let lastParentPosition = null;

let locationRequestInProgress = false;

let parentLocationWatchId = null;


/*
   جلوگیری از پخش دوباره اعلان
   برای یک فراخوان
*/

let lastNotifiedCallId = null;


/* =====================================================
   SCHOOL LOCATION
===================================================== */

const SCHOOL_LAT =
    35.76494314018861;

const SCHOOL_LNG =
    51.32257158390593;


/*
   حداکثر فاصله مجاز:
   ۵۰ متر
*/

const ALLOWED_RADIUS =
    5000;


const EARTH_RADIUS =
    6371000;


/* =====================================================
   CALL SCHEDULE
===================================================== */

function getCallSchedule(
    className
) {

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


    return (
        String(
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
        )
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

        const formatter =
            new Intl.NumberFormat(
                "fa-IR"
            );


        currentTime.textContent =
            formatter.format(
                iran.hour
            ) +
            ":" +
            formatter.format(
                iran.minute
            ) +
            ":" +
            formatter.format(
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
            " فعال است.";

    }


    const active =
        isCallTimeActive();


    if (
        callButton.dataset.locked ===
        "true"
    ) {

        return;

    }


    if (active) {

        callButton.disabled =
            false;

        callButton.dataset.timeBlocked =
            "false";

        callButton.textContent =
            "📢 فراخوانی دانش‌آموز";

    }

    else {

        callButton.disabled =
            true;

        callButton.dataset.timeBlocked =
            "true";

        callButton.textContent =
            "⏰ خارج از زمان فراخوان";

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
   HAVERSINE
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
                Math.round(
                    distance
                )
            ) +
            " متر"
        );

    }


    return (
        new Intl.NumberFormat(
            "fa-IR",
            {
                maximumFractionDigits: 2
            }
        ).format(
            distance / 1000
        ) +
        " کیلومتر"
    );

}


/* =====================================================
   LOCATION CARDS
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
                Math.round(
                    distance
                )
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
   TEACHER CALL NOTIFICATION
===================================================== */

function showTeacherCallNotification(
    call
) {

    if (!teacherCallNotification) {
        return;
    }


    /*
       نمایش نام دانش‌آموز
    */

    if (
        teacherCallNotificationText
    ) {

        teacherCallNotificationText.textContent =
            "دانش‌آموز " +
            call.student_name +
            " توسط معلم فراخوان شده است.";

    }


    /*
       نمایش زمان فراخوان
    */

    if (
        teacherCallNotificationTime
    ) {

        teacherCallNotificationTime.textContent =
            "زمان فراخوان: " +
            (
                call.called_time ||
                getIranTime()
            );

    }


    /*
       نمایش اعلان
    */

    teacherCallNotification.classList.add(
        "show"
    );


    /*
       پخش notification.mp3
    */

    if (
        teacherCallNotificationSound
    ) {

        try {

            teacherCallNotificationSound.pause();

            teacherCallNotificationSound.currentTime =
                0;


            const playPromise =
                teacherCallNotificationSound.play();


            if (
                playPromise !== undefined
            ) {

                playPromise.catch(
                    error => {

                        console.warn(
                            "پخش صدای اعلان توسط مرورگر مسدود شد:",
                            error
                        );

                    }
                );

            }

        }

        catch (error) {

            console.error(
                "NOTIFICATION SOUND ERROR:",
                error
            );

        }

    }


    /*
       لرزش در دستگاه‌هایی که پشتیبانی می‌کنند
    */

    if (
        navigator.vibrate
    ) {

        try {

            navigator.vibrate(
                [
                    200,
                    100,
                    200
                ]
            );

        }

        catch (error) {

            console.warn(
                "Vibration error:",
                error
            );

        }

    }

}


/* =====================================================
   CLOSE TEACHER NOTIFICATION
===================================================== */

if (
    closeTeacherCallNotification
) {

    closeTeacherCallNotification.addEventListener(
        "click",
        () => {

            teacherCallNotification.classList.remove(
                "show"
            );

        }
    );

}


/* =====================================================
   LOCATION PERMISSION
===================================================== */

async function requestMedianLocationPermission() {

    if (
        typeof window.median ===
        "undefined"
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
            "Median location error:",
            error
        );

        return true;

    }

}


/* =====================================================
   CURRENT LOCATION
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

                reject({
                    code: 0,
                    message:
                        "Geolocation unavailable"
                });

                return;

            }


            navigator.geolocation.getCurrentPosition(

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
   LIVE GPS
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


    if (
        parentLocationWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            parentLocationWatchId
        );

    }


    setLiveParentLoading();


    parentLocationWatchId =
        navigator.geolocation.watchPosition(

            position => {

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


                updateLiveParentDistance(
                    distance
                );


                if (locationStatus) {

                    if (
                        distance <=
                        ALLOWED_RADIUS
                    ) {

                        locationStatus.textContent =
                            "داخل محدوده مجاز — " +
                            formatDistance(
                                distance
                            );

                        locationStatus.style.color =
                            "#16a34a";

                    }

                    else {

                        locationStatus.textContent =
                            "خارج از محدوده مجاز — " +
                            formatDistance(
                                distance
                            );

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


                if (liveParentStatus) {

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
   STOP GPS
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
   MANUAL GPS
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


    if (locationRefreshButton) {

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


        updateLiveParentDistance(
            distance
        );


        if (locationStatus) {

            locationStatus.textContent =
                (
                    distance <=
                    ALLOWED_RADIUS
                )
                    ? "داخل محدوده مجاز — " +
                      formatDistance(distance)
                    : "خارج از محدوده مجاز — " +
                      formatDistance(distance);


            locationStatus.style.color =
                (
                    distance <=
                    ALLOWED_RADIUS
                )
                    ? "#16a34a"
                    : "#dc2626";

        }


        if (locationRefreshButton) {

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
                "موقعیت مکانی قابل تشخیص نیست.";

        }

        else if (
            error &&
            error.code === 3
        ) {

            errorText =
                "زمان دریافت موقعیت تمام شد.";

        }


        if (locationStatus) {

            locationStatus.textContent =
                errorText;

            locationStatus.style.color =
                "#dc2626";

        }


        if (liveParentStatus) {

            liveParentStatus.textContent =
                errorText;

        }


        if (liveParentDistance) {

            liveParentDistance.textContent =
                "---";

        }


        if (parentLocationIcon) {

            parentLocationIcon.textContent =
                "⚠️";

        }


        if (locationRefreshButton) {

            locationRefreshButton.disabled =
                false;

            locationRefreshButton.textContent =
                "📍 تلاش مجدد";

        }


        if (showAlert) {

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
        () => {

            refreshParentLocation(
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

    if (!call) {
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


    if (error) {

        console.error(
            "خطا در دریافت فراخوان:",
            error
        );

        return;

    }


    if (!data) {

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


    callButton.disabled =
        true;


    if (
        data.status ===
        "فراخوان شد"
    ) {

        callButton.textContent =
            "📢 فراخوان ارسال شده";

    }

    else if (
        data.status ===
        "دریافت فراخوان"
    ) {

        callButton.textContent =
            "📢 فراخوان در حال پیگیری";

    }

    else if (
        data.status ===
        "ارسال شد"
    ) {

        callButton.textContent =
            "✅ فراخوان ارسال شد";

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


                    if (!call) {
                        return;
                    }


                    /*
                       فقط مربوط به همین دانش‌آموز
                    */

                    if (
                        call.student_name !==
                        currentStudentName
                    ) {

                        return;

                    }


                    /*
                       فقط مربوط به امروز
                    */

                    if (
                        call.called_date !==
                        getIranDate()
                    ) {

                        return;

                    }


                    /*
                       =====================================
                       اعلان جدید معلم
                       =====================================

                       فقط در زمان INSERT اجرا می‌شود.

                       بنابراین Auto Refresh و
                       UPDATE باعث پخش مجدد صدا نمی‌شوند.
                    */

                    if (
                        payload.eventType ===
                        "INSERT"
                        &&
                        call.status ===
                        "فراخوان شد"
                    ) {

                        /*
                           جلوگیری از اعلان تکراری
                        */

                        if (
                            lastNotifiedCallId !==
                            call.id
                        ) {

                            lastNotifiedCallId =
                                call.id;


                            showTeacherCallNotification(
                                call
                            );

                        }

                    }


                    /*
                       بروزرسانی وضعیت فراخوان
                    */

                    updateParentCallStatus(
                        call
                    );


                    callButton.dataset.locked =
                        "true";


                    callButton.disabled =
                        true;


                    if (
                        call.status ===
                        "فراخوان شد"
                    ) {

                        callButton.textContent =
                            "📢 فراخوان ارسال شده";

                    }

                    else if (
                        call.status ===
                        "دریافت فراخوان"
                    ) {

                        callButton.textContent =
                            "📢 فراخوان در حال پیگیری";

                    }

                    else if (
                        call.status ===
                        "ارسال شد"
                    ) {

                        callButton.textContent =
                            "✅ فراخوان ارسال شد";

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


        loginButton.disabled =
            true;

        loginButton.textContent =
            "در حال بررسی...";


        try {

            /*
               ابتدا تمام حساب‌هایی که همین کد را دارند
               دریافت می‌کنیم.

               سپس نام را با تطبیق تقریبی بررسی می‌کنیم.
            */

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


            if (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                message.textContent =
                    "خطا در ارتباط با سامانه.";

                message.style.color =
                    "#dc2626";

                return;

            }


            let matchedAccount =
                null;

            let bestSimilarity =
                0;


            /*
               پیدا کردن نزدیک‌ترین نام
            */

            for (
                const account of
                accounts || []
            ) {

                const similarity =
                    nameSimilarity(
                        name,
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


            /*
               حداقل شباهت ۸۵٪
            */

            if (
                !matchedAccount ||
                bestSimilarity < 0.85
            ) {

                message.textContent =
                    "نام دانش‌آموز یا کد ورود صحیح نیست.";

                message.style.color =
                    "#dc2626";

                return;

            }


            /* =================================================
               LOGIN SUCCESS
            ================================================= */

            currentStudentName =
                matchedAccount.student_name;

            currentClassName =
                matchedAccount.class_name;


            panelStudentName.textContent =
                matchedAccount.student_name;


            panelClassName.textContent =
                "کلاس " +
                matchedAccount.class_name;


            message.textContent =
                "ورود موفق بود ✅";


            message.style.color =
                "#16a34a";


            updateAllowedRadiusUI();

            updateCallScheduleUI();


            /*
               باز کردن پنل
            */

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
                       فعال کردن Audio Context
                       با تعامل کاربر در زمان ورود.

                       این کار احتمال موفقیت پخش
                       notification.mp3 را بیشتر می‌کند.
                    */

                    if (
                        teacherCallNotificationSound
                    ) {

                        try {

                            teacherCallNotificationSound
                                .load();

                        }

                        catch (error) {

                            console.warn(
                                "Audio preload error:",
                                error
                            );

                        }

                    }


                    await loadExistingCall();


                    startParentRealtime();


                    startParentAutoRefresh();


                    startLiveParentLocation();

                },
                400
            );

        }


        catch (error) {

            console.error(
                "LOGIN EXCEPTION:",
                error
            );


            message.textContent =
                "خطایی هنگام ورود رخ داد.";

            message.style.color =
                "#dc2626";

        }


        finally {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "ورود به پنل";

        }

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
   PARENT CODE - ONLY 4 DIGITS
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


        callButton.disabled =
            true;

        callButton.textContent =
            "📍 در حال بررسی موقعیت...";


        const locationResult =
            await refreshParentLocation(
                true
            );


        if (!locationResult) {

            updateCallScheduleUI();

            return;

        }


        const distance =
            locationResult.distance;


        /*
           بررسی محدوده ۵۰ متری
        */

        if (
            distance >
            ALLOWED_RADIUS
        ) {

            updateCallScheduleUI();


            alert(
                "شما خارج از محدوده مجاز مدرسه هستید.\n\n" +
                "فاصله شما: " +
                formatDistance(
                    distance
                ) +
                "\n" +
                "محدوده مجاز: " +
                formatDistance(
                    ALLOWED_RADIUS
                )
            );


            return;

        }


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


        if (activeError) {

            console.error(
                activeError
            );


            updateCallScheduleUI();


            alert(
                "خطا در بررسی فراخوان قبلی."
            );


            return;

        }


        if (activeCall) {

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
           INSERT CALL
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
                ])
                .select()
                .single();


        if (insertError) {

            console.error(
                "CALL INSERT ERROR:",
                insertError
            );


            updateCallScheduleUI();


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
            "فراخوان با موفقیت ارسال شد.\n\n" +
            "فاصله شما تا مدرسه: " +
            formatDistance(
                distance
            ) +
            "\n" +
            "زمان ارسال: " +
            calledTime
        );

    }
);

/* =====================================================
   BEFORE UNLOAD
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopLiveParentLocation();

    }
);


/* =====================================================
   PAGE VISIBILITY
===================================================== */

/*
   وقتی والد دوباره به صفحه برمی‌گردد،
   وضعیت فراخوان را بررسی می‌کنیم.

   نکته:
   این قسمت عمداً صدای اعلان را پخش نمی‌کند،
   چون صدای اعلان باید فقط برای INSERT جدید
   پخش شود.
*/

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                currentStudentName &&
                currentClassName
            ) {

                await loadExistingCall();

                updateCallScheduleUI();

            }

        }

    }
);


/* =====================================================
   INITIAL UI
===================================================== */

if (
    callButton
) {

    callButton.dataset.locked =
        "false";

    callButton.dataset.timeBlocked =
        "true";

}


/* =====================================================
   AUDIO ERROR HANDLING
===================================================== */

if (
    teacherCallNotificationSound
) {

    teacherCallNotificationSound.addEventListener(
        "error",
        event => {

            console.error(
                "notification.mp3 قابل بارگذاری نیست.",
                event
            );

        }
    );

}


/* =====================================================
   AUDIO ENDED
===================================================== */

if (
    teacherCallNotificationSound
) {

    teacherCallNotificationSound.addEventListener(
        "ended",
        () => {

            /*
               صدا تمام شد.
               هیچ عملیات دیگری لازم نیست.
            */

        }
    );

}


/* =====================================================
   NOTIFICATION STATE
===================================================== */

/*
   اگر پنل والدین برای مدت طولانی باز باشد،
   این تابع اجازه نمی‌دهد یک فراخوان با همان ID
   چند بار اعلان صوتی ایجاد کند.
*/

function resetNotificationState() {

    lastNotifiedCallId =
        null;

}


/* =====================================================
   LOGOUT / RESET
===================================================== */

/*
   اگر در آینده دکمه خروج اضافه کردی،
   می‌توانی این تابع را هنگام خروج صدا بزنی.
*/

function resetParentSession() {

    currentStudentName =
        "";

    currentClassName =
        "";

    lastParentPosition =
        null;

    lastNotifiedCallId =
        null;


    if (
        parentCallChannel
    ) {

        supabaseClient.removeChannel(
            parentCallChannel
        );

        parentCallChannel =
            null;

    }


    if (
        parentRefreshInterval
    ) {

        clearInterval(
            parentRefreshInterval
        );

        parentRefreshInterval =
            null;

    }


    stopLiveParentLocation();


    if (
        teacherCallNotification
    ) {

        teacherCallNotification.classList.remove(
            "show"
        );

    }


    if (
        teacherCallNotificationSound
    ) {

        try {

            teacherCallNotificationSound.pause();

            teacherCallNotificationSound.currentTime =
                0;

        }

        catch (error) {

            console.warn(
                "Audio reset error:",
                error
            );

        }

    }

}


/* =====================================================
   REALTIME CONNECTION WATCH
===================================================== */

/*
   برای بررسی وضعیت اتصال Realtime
*/

function getParentRealtimeStatus() {

    if (
        !parentCallChannel
    ) {

        return "DISCONNECTED";

    }

    return "CONNECTED";

}


/* =====================================================
   DEBUG
===================================================== */

window.parentPanelDebug = {

    getStudentName: () => {

        return currentStudentName;

    },

    getClassName: () => {

        return currentClassName;

    },

    getRealtimeStatus: () => {

        return getParentRealtimeStatus();

    },

    getLastPosition: () => {

        return lastParentPosition;

    },

    getLastNotifiedCallId: () => {

        return lastNotifiedCallId;

    },

    resetNotification: () => {

        resetNotificationState();

    }

};


/* =====================================================
   OPTIONAL TEST NOTIFICATION
===================================================== */

/*
   این تابع فقط برای تست دستی است.

   در حالت عادی نیازی به اجرای آن نیست.

   مثال در Console:

   testTeacherCallNotification();

*/

function testTeacherCallNotification() {

    const testCall = {

        id:
            "test-" +
            Date.now(),

        student_name:
            currentStudentName ||
            "دانش‌آموز تست",

        class_name:
            currentClassName ||
            "تست",

        status:
            "فراخوان شد",

        called_date:
            getIranDate(),

        called_time:
            getIranTime()

    };


    showTeacherCallNotification(
        testCall
    );

}


/* =====================================================
   EXPORT FOR DEBUG
===================================================== */

window.testTeacherCallNotification =
    testTeacherCallNotification;


/* =====================================================
   READY
===================================================== */

console.log(
    "Parent panel initialized successfully."
);

console.log(
    "Teacher notification system initialized."
);

console.log(
    "Notification sound:",
    teacherCallNotificationSound
        ? "READY"
        : "NOT FOUND"
);
