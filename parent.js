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

    text = text
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ة/g, "ه")
        .replace(/ۀ/g, "ه");

    text = text.replace(
        /[\u064B-\u065F\u0670]/g,
        ""
    );

    text = text.replace(
        /[\u200B-\u200D\uFEFF]/g,
        " "
    );

    text = text.replace(
        /\s+/g,
        " "
    );

    text = text.trim();

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

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

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
        compactName(enteredName);

    const b =
        compactName(databaseName);

    if (!a || !b) {
        return 0;
    }

    if (a === b) {
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

    if (maxLength === 0) {
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


let currentParentAccountId = null;


/* =====================================================
   CHANGE PARENT PASSWORD ELEMENTS
===================================================== */

const currentParentCodeInput =
    document.getElementById(
        "currentParentCode"
    );

const newParentCodeInput =
    document.getElementById(
        "newParentCode"
    );

const confirmParentCodeInput =
    document.getElementById(
        "confirmParentCode"
    );

const changeParentCodeButton =
    document.getElementById(
        "changeParentCodeButton"
    );

const changeParentCodeMessage =
    document.getElementById(
        "changeParentCodeMessage"
    );


/* =====================================================
   PARENT PASSWORD - ONLY 4 DIGITS
===================================================== */

[
    currentParentCodeInput,
    newParentCodeInput,
    confirmParentCodeInput
].forEach(
    input => {

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            () => {

                input.value =
                    input.value
                        .replace(/\D/g, "")
                        .slice(0, 4);

            }
        );

    }
);


/* =====================================================
   CHANGE PASSWORD MESSAGE
===================================================== */

function showChangeParentCodeMessage(
    text,
    color = "#dc2626"
) {

    if (!changeParentCodeMessage) {
        return;
    }

    changeParentCodeMessage.textContent =
        text;

    changeParentCodeMessage.style.color =
        color;

}


/* =====================================================
   CHANGE PASSWORD BUTTON
===================================================== */

if (changeParentCodeButton) {

    changeParentCodeButton.addEventListener(
        "click",
        async () => {

            const currentCode =
                currentParentCodeInput.value.trim();

            const newCode =
                newParentCodeInput.value.trim();

            const confirmCode =
                confirmParentCodeInput.value.trim();

            showChangeParentCodeMessage("");

            if (
                !currentCode ||
                !newCode ||
                !confirmCode
            ) {

                showChangeParentCodeMessage(
                    "لطفاً هر سه کادر را کامل کنید."
                );

                return;
            }

            if (!/^\d{4}$/.test(currentCode)) {

                showChangeParentCodeMessage(
                    "رمز فعلی باید دقیقاً ۴ رقم باشد."
                );

                return;
            }

            if (!/^\d{4}$/.test(newCode)) {

                showChangeParentCodeMessage(
                    "رمز جدید باید دقیقاً ۴ رقم باشد."
                );

                return;
            }

            if (!/^\d{4}$/.test(confirmCode)) {

                showChangeParentCodeMessage(
                    "تکرار رمز جدید باید دقیقاً ۴ رقم باشد."
                );

                return;
            }

            if (newCode !== confirmCode) {

                showChangeParentCodeMessage(
                    "رمز جدید و تکرار آن یکسان نیستند."
                );

                return;
            }

            if (currentCode === newCode) {

                showChangeParentCodeMessage(
                    "رمز جدید باید با رمز فعلی متفاوت باشد."
                );

                return;
            }

            if (!currentParentAccountId) {

                showChangeParentCodeMessage(
                    "اطلاعات حساب والد پیدا نشد."
                );

                return;
            }

            showChangeParentCodeMessage(
                "در حال بررسی...",
                "#2563eb"
            );

            try {

                const {
                    data: accountData,
                    error: accountError
                } =
                    await supabaseClient
                        .from("parent_accounts")
                        .select(
                            "id, student_name, class_name, parent_code"
                        )
                        .eq(
                            "id",
                            currentParentAccountId
                        )
                        .maybeSingle();

                if (accountError) {

                    console.error(
                        "CHECK PARENT ACCOUNT ERROR:",
                        accountError
                    );

                    showChangeParentCodeMessage(
                        "خطا در بررسی حساب والد."
                    );

                    return;
                }

                if (!accountData) {

                    showChangeParentCodeMessage(
                        "حساب والد پیدا نشد."
                    );

                    return;
                }

                if (
                    String(accountData.parent_code).trim() !==
                    String(currentCode).trim()
                ) {

                    showChangeParentCodeMessage(
                        "رمز فعلی صحیح نیست."
                    );

                    return;
                }

                showChangeParentCodeMessage(
                    "رمز فعلی صحیح است. در حال تغییر رمز...",
                    "#2563eb"
                );

                const {
                    data: updatedAccount,
                    error: updateError
                } =
                    await supabaseClient
                        .from("parent_accounts")
                        .update({
                            parent_code: newCode
                        })
                        .eq(
                            "id",
                            currentParentAccountId
                        )
                        .select(
                            "id, parent_code"
                        )
                        .maybeSingle();

                if (updateError) {

                    console.error(
                        "CHANGE PASSWORD ERROR:",
                        updateError
                    );

                    showChangeParentCodeMessage(
                        "خطا در تغییر رمز."
                    );

                    return;
                }

                if (!updatedAccount) {

                    showChangeParentCodeMessage(
                        "رمز در پایگاه داده تغییر نکرد."
                    );

                    return;
                }

                if (
                    String(updatedAccount.parent_code).trim() !==
                    String(newCode).trim()
                ) {

                    showChangeParentCodeMessage(
                        "تأیید تغییر رمز ناموفق بود."
                    );

                    return;
                }

                showChangeParentCodeMessage(
                    "رمز ورود با موفقیت تغییر کرد. ✅",
                    "#16a34a"
                );

                currentParentCodeInput.value = "";
                newParentCodeInput.value = "";
                confirmParentCodeInput.value = "";

            }

            catch (error) {

                console.error(
                    "CHANGE PASSWORD EXCEPTION:",
                    error
                );

                showChangeParentCodeMessage(
                    "خطایی هنگام تغییر رمز رخ داد."
                );

            }

        }
    );

}


/* =====================================================
   LOCATION CARDS
===================================================== */

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

let callRequestInProgress = false;


/* =====================================================
   SCHOOL LOCATION
===================================================== */

const SCHOOL_LAT =
    35.76494314018861;

const SCHOOL_LNG =
    51.32257158390593;

const ALLOWED_RADIUS =
    5000;

const EARTH_RADIUS =
    6371000;


/* =====================================================
   GPS CONFIGURATION
===================================================== */

const GPS_CONFIG = {

    enableHighAccuracy: true,

    timeout: 20000,

    maximumAge: 5000,

    fallbackTimeout: 25000,

    fallbackMaximumAge: 10000,

    warningAccuracy: 150,

    maxAttempts: 2

};


/* =====================================================
   CALL SCHEDULE
===================================================== */

function getCallSchedule(className) {

    const normalizedClass =
        normalizePersianName(
            className
        );

    if (
        normalizedClass.startsWith("پیش")
    ) {

        return {
            start: 14 * 60,
            end: 24 * 60,
            text: "14:00 تا 24:00"
        };

    }

    if (
        normalizedClass.startsWith("اول")
    ) {

        return {
            start: 14 * 60 + 30,
            end: 24 * 60,
            text: "14:30 تا 24:00"
        };

    }

    if (
        normalizedClass.startsWith("دوم") ||
        normalizedClass.startsWith("سوم") ||
        normalizedClass.startsWith("چهارم") ||
        normalizedClass.startsWith("پنجم") ||
        normalizedClass.startsWith("ششم")
    ) {

        return {
            start: 14 * 60 + 40,
            end: 24 * 60,
            text: "14:40 تا 24:00"
        };

    }

    return {
        start: 14 * 60,
        end: 24 * 60,
        text: "14:00 تا 24:00"
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

    const getPart = type => {

        const item =
            parts.find(
                part =>
                    part.type === type
            );

        return item
            ? Number(item.value)
            : 0;

    };

    let hour =
        getPart("hour");

    /*
       بعضی مرورگرها نیمه‌شب را 24 نمایش می‌دهند.
    */

    if (hour === 24) {
        hour = 0;
    }

    const minute = getPart("minute");
    const second = getPart("second");

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
        String(iran.hour).padStart(2, "0") +
        ":" +
        String(iran.minute).padStart(2, "0") +
        ":" +
        String(iran.second).padStart(2, "0")
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
            formatter.format(iran.hour) +
            ":" +
            formatter.format(iran.minute) +
            ":" +
            formatter.format(iran.second);

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

    if (!currentClassName) {
        return false;
    }

    const schedule =
        getCallSchedule(
            currentClassName
        );

    const iran =
        getIranTimeParts();

    return (
        iran.totalMinutes >= schedule.start &&
        iran.totalMinutes < schedule.end
    );

}


/* =====================================================
   CALL UI
===================================================== */

function updateCallScheduleUI() {

    if (!currentClassName) {
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

    if (
        callButton &&
        callButton.dataset.locked === "true"
    ) {

        return;
    }

    const active =
        isCallTimeActive();

    if (!callButton) {
        return;
    }

    if (active) {

        callButton.disabled = false;

        callButton.dataset.timeBlocked =
            "false";

        callButton.textContent =
            "فراخوانی دانش‌آموز";

        callButton.style.background =
            "linear-gradient(135deg, #2563eb, #3b82f6)";

        callButton.style.boxShadow =
            "0 15px 30px rgba(37, 99, 235, 0.25)";

    }

    else {

        callButton.disabled = true;

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
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) ** 2;

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

function formatDistance(distance) {

    if (distance < 1000) {

        return (
            new Intl.NumberFormat(
                "fa-IR"
            ).format(
                Math.round(distance)
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
   LOCATION UI
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
   GPS SUPPORT
===================================================== */

function isGeolocationSupported() {

    return (
        typeof navigator !== "undefined" &&
        navigator.geolocation &&
        typeof navigator.geolocation.getCurrentPosition ===
            "function"
    );

}


/* =====================================================
   SECURE GPS CONTEXT
===================================================== */

function isGPSAllowedContext() {

    if (
        typeof window === "undefined"
    ) {

        return false;

    }

    /*
       Chrome / Safari / Opera:
       GPS روی HTTPS قابل استفاده است.
       localhost نیز مجاز است.
    */

    if (
        window.isSecureContext === true
    ) {

        return true;

    }

    const protocol =
        window.location &&
        window.location.protocol;

    const hostname =
        window.location &&
        window.location.hostname;

    return (
        protocol === "https:" ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1"
    );

}


/* =====================================================
   GPS PERMISSION
===================================================== */

async function checkGPSPermission() {

    if (!isGeolocationSupported()) {

        return "unsupported";

    }

    /*
       Safari و بعضی مرورگرها ممکن است
       Permissions API را نداشته باشند.
    */

    if (
        navigator.permissions &&
        typeof navigator.permissions.query ===
            "function"
    ) {

        try {

            const permission =
                await navigator.permissions.query({
                    name: "geolocation"
                });

            return permission.state;

        }

        catch (error) {

            console.log(
                "GPS permission API unavailable:",
                error
            );

        }

    }

    return "unknown";

}


/* =====================================================
   MEDIAN GPS PERMISSION
===================================================== */

async function requestMedianLocationPermission() {

    if (
        typeof window === "undefined" ||
        typeof window.median === "undefined"
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

    }

    catch (error) {

        console.warn(
            "Median GPS permission error:",
            error
        );

    }

    return true;

}


/* =====================================================
   GPS ERROR MESSAGE
===================================================== */

function getGPSUserMessage(error) {

    if (!error) {

        return (
            "خطا در دریافت موقعیت مکانی."
        );

    }

    if (
        error.code === 0 &&
        error.message
    ) {

        return error.message;

    }

    switch (error.code) {

        case 1:

            return (
                "دسترسی به موقعیت مکانی داده نشده است.\n\n" +
                "لطفاً در تنظیمات Chrome یا مرورگر، " +
                "Location این سایت را روی Allow قرار دهید."
            );

        case 2:

            return (
                "موقعیت مکانی قابل تشخیص نیست.\n\n" +
                "لطفاً GPS دستگاه را روشن کنید و چند لحظه " +
                "در همان صفحه بمانید، سپس دوباره تلاش کنید."
            );

        case 3:

            return (
                "دریافت موقعیت مکانی بیش از حد طول کشید.\n\n" +
                "در حال حاضر دوباره تلاش کنید. در صورت نیاز " +
                "GPS گوشی را خاموش و روشن کنید."
            );

        default:

            return (
                error.message ||
                "خطا در دریافت موقعیت مکانی.\n\n" +
                "لطفاً دوباره تلاش کنید."
            );

    }

}


/* =====================================================
   GPS POSITION VALIDATION
===================================================== */

function validateGPSPosition(position) {

    if (!position) {

        return {
            valid: false,
            reason: "position_missing"
        };

    }

    const coords =
        position.coords;

    if (!coords) {

        return {
            valid: false,
            reason: "coordinates_missing"
        };

    }

    const latitude =
        Number(
            coords.latitude
        );

    const longitude =
        Number(
            coords.longitude
        );

    const accuracy =
        Number(
            coords.accuracy
        );

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return {
            valid: false,
            reason: "invalid_coordinates"
        };

    }

    if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {

        return {
            valid: false,
            reason: "coordinates_out_of_range"
        };

    }

    return {

        valid: true,

        latitude,

        longitude,

        accuracy:
            Number.isFinite(accuracy)
                ? accuracy
                : Infinity

    };

}


/* =====================================================
   CURRENT LOCATION
   HIGH ACCURACY + FALLBACK
===================================================== */

function getCurrentParentLocation(
    options = {}
) {

    return new Promise(
        async (
            resolve,
            reject
        ) => {

            await requestMedianLocationPermission();

            if (!isGeolocationSupported()) {

                reject({
                    code: 0,
                    message:
                        "این مرورگر از موقعیت مکانی پشتیبانی نمی‌کند."
                });

                return;

            }


            if (!isGPSAllowedContext()) {

                reject({
                    code: 0,
                    message:
                        "برای استفاده از GPS، سایت باید با HTTPS باز شود."
                });

                return;

            }


            const gpsOptions = {

                enableHighAccuracy:
                    options.highAccuracy !== undefined
                        ? options.highAccuracy
                        : GPS_CONFIG.enableHighAccuracy,

                timeout:
                    options.timeout !== undefined
                        ? options.timeout
                        : GPS_CONFIG.timeout,

                maximumAge:
                    options.maximumAge !== undefined
                        ? options.maximumAge
                        : GPS_CONFIG.maximumAge

            };


            let finished = false;


            function success(position) {

                if (finished) {
                    return;
                }

                const validation =
                    validateGPSPosition(
                        position
                    );

                if (!validation.valid) {

                    finished = true;

                    reject({
                        code: 2,
                        message:
                            "مختصات GPS معتبر دریافت نشد."
                    });

                    return;

                }

                finished = true;

                resolve(
                    position
                );

            }


            function finalError(error) {

                if (finished) {
                    return;
                }

                finished = true;

                reject(
                    error
                );

            }


            function firstError(error) {

                if (finished) {
                    return;
                }


                /*
                   اگر کاربر دسترسی را رد کرده،
                   دوباره درخواست بی‌فایده است.
                */

                if (
                    error &&
                    error.code === 1
                ) {

                    finalError(
                        error
                    );

                    return;

                }


                /*
                   Chrome گاهی با enableHighAccuracy
                   timeout می‌دهد.
                   در این حالت با GPS معمولی دوباره
                   امتحان می‌کنیم.
                */

                console.warn(
                    "High accuracy GPS failed. Trying fallback:",
                    error
                );


                try {

                    navigator.geolocation.getCurrentPosition(

                        success,

                        finalError,

                        {
                            enableHighAccuracy: false,
                            timeout:
                                GPS_CONFIG.fallbackTimeout,
                            maximumAge:
                                GPS_CONFIG.fallbackMaximumAge
                        }

                    );

                }

                catch (fallbackError) {

                    finalError(
                        fallbackError
                    );

                }

            }


            try {

                navigator.geolocation.getCurrentPosition(

                    success,

                    firstError,

                    gpsOptions

                );

            }

            catch (error) {

                finalError({
                    code: 0,
                    message:
                        error.message ||
                        "خطا در اجرای سرویس GPS."
                });

            }

        }
    );

}


/* =====================================================
   ACCURATE GPS
===================================================== */

async function getAccurateParentLocation() {

    let lastPosition =
        null;


    /*
       تلاش اول:
       GPS دقیق
    */

    try {

        const position =
            await getCurrentParentLocation({

                highAccuracy: true,

                timeout: 15000,

                maximumAge: 5000

            });

        const validation =
            validateGPSPosition(
                position
            );

        if (validation.valid) {

            lastPosition =
                position;

            /*
               اگر دقت مناسب باشد،
               همان موقعیت را برمی‌گردانیم.
            */

            if (
                validation.accuracy <=
                GPS_CONFIG.warningAccuracy
            ) {

                return position;

            }

        }

    }

    catch (error) {

        /*
           اگر Permission Denied باشد،
           دیگر تلاش مجدد انجام نمی‌دهیم.
        */

        if (
            error &&
            error.code === 1
        ) {

            throw error;

        }

        console.warn(
            "High accuracy attempt failed:",
            error
        );

    }


    /*
       تلاش دوم:
       حالت معمولی برای Chrome
    */

    try {

        const fallbackPosition =
            await getCurrentParentLocation({

                highAccuracy: false,

                timeout:
                    GPS_CONFIG.fallbackTimeout,

                maximumAge:
                    GPS_CONFIG.fallbackMaximumAge

            });

        const validation =
            validateGPSPosition(
                fallbackPosition
            );

        if (validation.valid) {

            lastPosition =
                fallbackPosition;

        }

    }

    catch (error) {

        if (
            error &&
            error.code === 1
        ) {

            throw error;

        }

        console.warn(
            "Normal accuracy GPS failed:",
            error
        );

    }


    /*
       اگر موقعیت قبلی معتبر داشتیم،
       همان را برمی‌گردانیم.
    */

    if (lastPosition) {

        return lastPosition;

    }


    throw {
        code: 2,
        message:
            "موقعیت مکانی دستگاه قابل دریافت نیست."
    };

}


/* =====================================================
   APPLY GPS POSITION
===================================================== */

function applyParentLocation(
    position
) {

    const validation =
        validateGPSPosition(
            position
        );

    if (!validation.valid) {

        throw new Error(
            "موقعیت GPS معتبر نیست."
        );

    }

    const {
        latitude,
        longitude,
        accuracy
    } =
        validation;

    const distance =
        calculateDistance(
            latitude,
            longitude
        );


    lastParentPosition = {

        latitude,

        longitude,

        accuracy,

        distance,

        timestamp:
            Date.now(),

        inside:
            distance <=
            ALLOWED_RADIUS

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


    console.log(
        "GPS POSITION:",
        {
            latitude,
            longitude,
            accuracy,
            distance
        }
    );


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


/* =====================================================
   LIVE GPS
===================================================== */

function startLiveParentLocation() {

    if (!isGeolocationSupported()) {

        if (liveParentStatus) {

            liveParentStatus.textContent =
                "این مرورگر از موقعیت مکانی پشتیبانی نمی‌کند.";

        }

        return;

    }


    if (!isGPSAllowedContext()) {

        if (liveParentStatus) {

            liveParentStatus.textContent =
                "برای GPS باید سایت با HTTPS باز شود.";

        }

        return;

    }


    /*
       جلوگیری از watchPosition تکراری
    */

    stopLiveParentLocation();


    setLiveParentLoading();


    try {

        parentLocationWatchId =
            navigator.geolocation.watchPosition(

                position => {

                    try {

                        const result =
                            applyParentLocation(
                                position
                            );


                        if (
                            Number.isFinite(
                                result.accuracy
                            ) &&
                            result.accuracy >
                            GPS_CONFIG.warningAccuracy
                        ) {

                            if (liveParentStatus) {

                                liveParentStatus.textContent =
                                    "موقعیت دریافت شد؛ دقت GPS پایین است.";

                            }

                        }

                    }

                    catch (error) {

                        console.error(
                            "GPS POSITION ERROR:",
                            error
                        );

                    }

                },


                error => {

                    console.error(
                        "LIVE GPS ERROR:",
                        error
                    );


                    /*
                       خطای Permission
                    */

                    if (
                        error &&
                        error.code === 1
                    ) {

                        if (liveParentStatus) {

                            liveParentStatus.textContent =
                                "دسترسی GPS توسط مرورگر مسدود است.";

                        }

                        if (locationStatus) {

                            locationStatus.textContent =
                                "دسترسی GPS توسط مرورگر مسدود است.";

                            locationStatus.style.color =
                                "#dc2626";

                        }

                        if (parentLocationIcon) {

                            parentLocationIcon.textContent =
                                "⚠️";

                        }

                        return;

                    }


                    if (liveParentStatus) {

                        liveParentStatus.textContent =
                            "در حال تلاش برای دریافت موقعیت...";

                    }

                },


                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000
                }

            );

    }

    catch (error) {

        console.error(
            "watchPosition ERROR:",
            error
        );

    }

}


/* =====================================================
   STOP GPS
===================================================== */

function stopLiveParentLocation() {

    if (
        parentLocationWatchId !== null &&
        isGeolocationSupported()
    ) {

        try {

            navigator.geolocation.clearWatch(
                parentLocationWatchId
            );

        }

        catch (error) {

            console.warn(
                "clearWatch error:",
                error
            );

        }

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

    /*
       جلوگیری از چند کلیک همزمان
    */

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

        if (!isGeolocationSupported()) {

            throw {
                code: 0,
                message:
                    "این مرورگر از موقعیت مکانی پشتیبانی نمی‌کند."
            };

        }


        if (!isGPSAllowedContext()) {

            throw {
                code: 0,
                message:
                    "برای استفاده از GPS باید سایت با HTTPS باز شود."
            };

        }


        const permission =
            await checkGPSPermission();


        if (
            permission ===
            "denied"
        ) {

            throw {
                code: 1,
                message:
                    "دسترسی موقعیت مکانی توسط مرورگر مسدود شده است."
            };

        }


        /*
           اجازه Median در صورت وجود
        */

        await requestMedianLocationPermission();


        /*
           دریافت موقعیت:
           ابتدا High Accuracy
           سپس Fallback
        */

        const position =
            await getAccurateParentLocation();


        const result =
            applyParentLocation(
                position
            );


        if (
            Number.isFinite(
                result.accuracy
            ) &&
            result.accuracy >
            GPS_CONFIG.warningAccuracy
        ) {

            if (liveParentStatus) {

                liveParentStatus.textContent =
                    "موقعیت دریافت شد، اما دقت GPS پایین است.";

            }

        }


        /*
           بعد از موفقیت، Live GPS را فعال می‌کنیم.
        */

        startLiveParentLocation();


        if (locationRefreshButton) {

            locationRefreshButton.disabled =
                false;

            locationRefreshButton.textContent =
                "📍 بروزرسانی موقعیت";

        }


        return result;

    }

    catch (error) {

        console.error(
            "GPS ERROR:",
            error
        );


        const errorText =
            getGPSUserMessage(
                error
            );


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
   ONLY ONE LISTENER
===================================================== */

if (locationRefreshButton) {

    locationRefreshButton.addEventListener(
        "click",
        async () => {

            /*
               این کلیک مستقیم کاربر است.
               برای Chrome بهترین حالت درخواست GPS است.
            */

            if (
                locationRequestInProgress
            ) {

                return;

            }

            await refreshParentLocation(
                true
            );

        }
    );

}


/* =====================================================
   PAGE VISIBILITY - GPS
===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                currentStudentName &&
                currentClassName
            ) {

                /*
                   اگر کاربر از Chrome به صفحه
                   برگشت، Live GPS دوباره فعال می‌شود.
                */

                startLiveParentLocation();

            }

        }

        else {

            stopLiveParentLocation();

        }

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
   PAGE HIDE / SHOW
===================================================== */

window.addEventListener(
    "pagehide",
    () => {

        stopLiveParentLocation();

    }
);


/* =====================================================
   PAGE SHOW - GPS
===================================================== */

window.addEventListener(
    "pageshow",
    () => {

        /*
           فقط اگر قبلاً موقعیت موفق داشته‌ایم
           GPS زنده دوباره شروع می‌شود.
        */

        if (
            currentStudentName &&
            currentClassName &&
            lastParentPosition
        ) {

            startLiveParentLocation();

        }

    }
);
/* =====================================================
   PARENT NOTIFICATION
===================================================== */

function showParentCallNotification() {

    const existingNotification =
        document.getElementById(
            "parentCallNotification"
        );

    if (existingNotification) {

        existingNotification.remove();

    }

    const notification =
        document.createElement("div");

    notification.id =
        "parentCallNotification";

    notification.innerHTML = `
        <div class="parent-call-notification-icon">
            📢
        </div>

        <div class="parent-call-notification-content">
            <div class="parent-call-notification-title">
                دانش‌آموز در حال آمدن است
            </div>

            <div class="parent-call-notification-text">
                دانش‌آموز در حال آمدن به سمت شماست.
            </div>
        </div>

        <button
            class="parent-call-notification-close"
            type="button"
            aria-label="بستن"
        >
            ×
        </button>
    `;

    document.body.appendChild(
        notification
    );

    requestAnimationFrame(
        () => {

            notification.classList.add(
                "show"
            );

        }
    );

    const closeButton =
        notification.querySelector(
            ".parent-call-notification-close"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                notification.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        if (
                            notification &&
                            notification.parentNode
                        ) {

                            notification.remove();

                        }

                    },
                    350
                );

            }
        );

    }

    setTimeout(
        () => {

            if (
                notification &&
                notification.parentNode
            ) {

                notification.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        if (
                            notification &&
                            notification.parentNode
                        ) {

                            notification.remove();

                        }

                    },
                    350
                );

            }

        },
        7000
    );

}


/* =====================================================
   CALL STATUS
===================================================== */

function updateParentCallStatus(call) {

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
   UPDATE PARENT CALL BUTTON
===================================================== */

function updateParentCallButton(call) {

    if (
        !callButton ||
        !call
    ) {

        return;

    }

    callButton.dataset.locked =
        "true";

    callButton.disabled =
        true;

    if (
        call.status ===
        "فراخوان شد"
    ) {

        const callTime =
            call.called_time
                ? call.called_time.slice(0, 5)
                : "---";

        callButton.textContent =
            "📢 فراخوان برای معلم ارسال شد — " +
            callTime;

        callButton.style.background =
            "linear-gradient(135deg, #f97316, #fb923c)";

        callButton.style.boxShadow =
            "0 15px 30px rgba(249, 115, 22, 0.25)";

    }

    else if (
        call.status ===
        "دریافت فراخوان"
    ) {

        const callTime =
            call.called_time
                ? call.called_time.slice(0, 5)
                : "---";

        callButton.textContent =
            "📢 فراخوان دریافت شد — " +
            callTime;

        callButton.style.background =
            "linear-gradient(135deg, #2563eb, #3b82f6)";

        callButton.style.boxShadow =
            "0 15px 30px rgba(37, 99, 235, 0.25)";

    }

    else if (
        call.status ===
        "ارسال شد"
    ) {

        const callTime =
            call.called_time
                ? call.called_time.slice(0, 5)
                : "---";

        const sentTime =
            call.sent_time
                ? call.sent_time.slice(0, 5)
                : "---";

        callButton.innerHTML =
            "🕐 فراخوان: " +
            callTime +
            "<br>" +
            "📤 ارسال دانش‌آموز: " +
            sentTime;

        callButton.style.background =
            "linear-gradient(135deg, #7c3aed, #a855f7)";

        callButton.style.boxShadow =
            "0 15px 30px rgba(124, 58, 237, 0.25)";

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

        if (callButton) {

            callButton.dataset.locked =
                "false";

        }

        updateCallScheduleUI();

        return;

    }

    updateParentCallStatus(
        data
    );

    updateParentCallButton(
        data
    );

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

        parentCallChannel =
            null;

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

                    const oldCall =
                        payload.old;

                    if (!call) {
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

                    updateParentCallButton(
                        call
                    );

                    if (
                        oldCall &&
                        oldCall.status !== "ارسال شد" &&
                        call.status === "ارسال شد"
                    ) {

                        showParentCallNotification();

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
   CALL BUTTON
   ONLY ONE EVENT LISTENER
===================================================== */

if (callButton) {

    callButton.addEventListener(
        "click",
        async () => {

            /*
               جلوگیری از دوبار کلیک
            */

            if (callRequestInProgress) {

                return;

            }

            if (
                !currentStudentName ||
                !currentClassName
            ) {

                alert(
                    "اطلاعات دانش‌آموز یافت نشد."
                );

                return;

            }

            if (!isCallTimeActive()) {

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

            callRequestInProgress =
                true;

            callButton.disabled =
                true;

            callButton.textContent =
                "📍 در حال بررسی موقعیت...";


            try {

                /* =================================================
                   GPS
                ================================================= */
                let locationResult = null;

                const gpsIsFresh =
                    lastParentPosition &&
                    Date.now() - lastParentPosition.timestamp < 60000;
                
                if (gpsIsFresh) {
                
                    console.log("استفاده از GPS به‌روز موجود");
                
                    locationResult = lastParentPosition;
                
                } else {
                
                    console.log("GPS قدیمی است؛ دریافت موقعیت جدید...");
                
                    callButton.textContent =
                        "📍 در حال به‌روزرسانی موقعیت...";
                
                    locationResult =
                        await refreshParentLocation(true);
                
                    if (!locationResult) {
                        updateCallScheduleUI();
                        return;
                    }
                }
                
                const distance =
                    locationResult.distance;


                /* =================================================
                   CHECK DISTANCE
                ================================================= */

                if (
                    distance >
                    ALLOWED_RADIUS
                ) {

                    updateCallScheduleUI();

                    alert(
                        "شما خارج از محدوده مجاز مدرسه هستید.\n\n" +
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

                if (activeError) {

                    console.error(
                        "ACTIVE CALL ERROR:",
                        activeError
                    );

                    alert(
                        "خطا در بررسی فراخوان قبلی."
                    );

                    return;

                }

                if (activeCall) {

                    updateParentCallStatus(
                        activeCall
                    );

                    updateParentCallButton(
                        activeCall
                    );

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
                    "linear-gradient(135deg, #f97316, #fb923c)";

                callButton.style.boxShadow =
                    "0 15px 30px rgba(249, 115, 22, 0.30)";

                updateParentCallStatus(
                    newCall
                );

                alert(
                    "فراخوان با موفقیت ارسال شد.\n\n" +
                    "فاصله شما تا مدرسه: " +
                    formatDistance(distance) +
                    "\n" +
                    "زمان ارسال: " +
                    calledTime
                );

            }

            catch (error) {

                console.error(
                    "CALL ERROR:",
                    error
                );

                alert(
                    "خطایی هنگام ارسال فراخوان رخ داد.\nلطفاً دوباره تلاش کنید."
                );

                updateCallScheduleUI();

            }

            finally {

                if (
                    callButton.dataset.locked !==
                    "true"
                ) {

                    callRequestInProgress =
                        false;

                    updateCallScheduleUI();

                }

                else {

                    callRequestInProgress =
                        false;

                }

            }

        }
    );

}


/* =====================================================
   REMEMBER LOGIN
===================================================== */

const SAVED_LOGIN_KEY =
    "student_panel_login";


function saveLoginCredentials(
    name,
    code
) {

    try {

        localStorage.setItem(
            SAVED_LOGIN_KEY,
            JSON.stringify({
                name: name,
                code: code
            })
        );

    }

    catch (error) {

        console.error(
            "SAVE LOGIN ERROR:",
            error
        );

    }

}


function loadSavedLoginCredentials() {

    try {

        const saved =
            localStorage.getItem(
                SAVED_LOGIN_KEY
            );

        if (!saved) {
            return;
        }

        const credentials =
            JSON.parse(saved);

        if (
            credentials &&
            credentials.name &&
            /^\d{4}$/.test(
                credentials.code
            )
        ) {

            if (studentNameInput) {

                studentNameInput.value =
                    credentials.name;

            }

            if (parentCodeInput) {

                parentCodeInput.value =
                    credentials.code;

            }

        }

    }

    catch (error) {

        console.error(
            "LOAD LOGIN ERROR:",
            error
        );

    }

}


loadSavedLoginCredentials();
/* =====================================================
   LOGIN
===================================================== */

if (loginButton) {

    loginButton.addEventListener(
        "click",
        async () => {

            const name =
                studentNameInput.value.trim();

            const code =
                parentCodeInput.value.trim();

            message.textContent =
                "";

            if (!name || !code) {

                message.textContent =
                    "لطفاً نام دانش‌آموز و کد ورود را وارد کنید.";

                message.style.color =
                    "#dc2626";

                return;

            }

            if (!/^\d{4}$/.test(code)) {

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

                const {
                    data: accounts,
                    error
                } =
                    await supabaseClient
                        .from("parent_accounts")
                        .select(
                            "id, student_name, class_name, parent_code"
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

                currentParentAccountId =
                    matchedAccount.id;

                currentClassName =
                    matchedAccount.class_name;


                saveLoginCredentials(
                    matchedAccount.student_name,
                    code
                );


                if (panelStudentName) {

                    panelStudentName.textContent =
                        matchedAccount.student_name;

                }

                if (panelClassName) {

                    panelClassName.textContent =
                        "کلاس " +
                        matchedAccount.class_name;

                }

                message.textContent =
                    "ورود موفق بود ✅";

                message.style.color =
                    "#16a34a";

                updateAllowedRadiusUI();

                updateCallScheduleUI();


                setTimeout(
                    async () => {

                        if (loginScreen) {

                            loginScreen.style.display =
                                "none";

                        }

                        if (parentPanel) {

                            parentPanel.style.display =
                                "block";

                        }

                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        });


                        await loadExistingCall();

startParentRealtime();

startParentAutoRefresh();


/* =====================================================
   START GPS IMMEDIATELY AFTER LOGIN
===================================================== */

setLiveParentLoading();

try {

    await refreshParentLocation(false);

    console.log(
        "GPS بعد از ورود با موفقیت فعال شد."
    );

}
catch (gpsError) {

    console.warn(
        "GPS بعد از ورود فعال نشد:",
        gpsError
    );

}

                       

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

}


/* =====================================================
   ENTER KEY
===================================================== */

if (studentNameInput) {

    studentNameInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                if (loginButton) {

                    loginButton.click();

                }

            }

        }
    );

}


if (parentCodeInput) {

    parentCodeInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                if (loginButton) {

                    loginButton.click();

                }

            }

        }
    );

}


/* =====================================================
   PARENT CODE - ONLY 4 DIGITS
===================================================== */

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


/* =====================================================
   INITIAL UI
===================================================== */

if (callButton) {

    callButton.dataset.locked =
        "false";

    callButton.dataset.timeBlocked =
        "true";

}


/* =====================================================
   RESET PARENT SESSION
===================================================== */

function resetParentSession() {

    currentStudentName =
        "";

    currentClassName =
        "";

    currentParentAccountId =
        null;

    lastParentPosition =
        null;

    callRequestInProgress =
        false;

    locationRequestInProgress =
        false;


    if (parentCallChannel) {

        supabaseClient.removeChannel(
            parentCallChannel
        );

        parentCallChannel =
            null;

    }


    if (parentRefreshInterval) {

        clearInterval(
            parentRefreshInterval
        );

        parentRefreshInterval =
            null;

    }


    stopLiveParentLocation();


    if (callButton) {

        callButton.dataset.locked =
            "false";

        callButton.dataset.timeBlocked =
            "true";

    }

}


/* =====================================================
   REALTIME CONNECTION WATCH
===================================================== */

function getParentRealtimeStatus() {

    if (!parentCallChannel) {

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


    getGPSPermission: async () => {

        return await checkGPSPermission();

    },


    refreshGPS: async () => {

        return await refreshParentLocation(
            false
        );

    }

};


/* =====================================================
   PAGE VISIBILITY - CALL DATA
===================================================== */

/* =====================================================
   PAGE VISIBILITY - GPS
   GPS فقط بعد از اولین دریافت موفق فعال می‌شود
===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            /*
               اگر قبلاً موقعیت موفق دریافت شده باشد،
               GPS زنده دوباره فعال می‌شود.
            */

            if (
                currentStudentName &&
                currentClassName &&
                lastParentPosition
            ) {

                startLiveParentLocation();

            }

        }

        else {

            stopLiveParentLocation();

        }

    }
);


/* =====================================================
   CINEMATIC INTRO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const cinematicIntro =
            document.getElementById(
                "cinematicIntro"
            );

        if (!cinematicIntro) {
            return;
        }

        setTimeout(
            function () {

                cinematicIntro.classList.add(
                    "intro-hidden"
                );

            },
            4800
        );

        setTimeout(
            function () {

                cinematicIntro.remove();

            },
            6500
        );

    }
);


/* =====================================================
   READY
===================================================== */

console.log(
    "Parent panel initialized successfully."
);