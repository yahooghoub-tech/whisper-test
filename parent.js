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

    if (!value) return "";

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


function compactName(value) {

    return normalizePersianName(value)
        .replace(/\s+/g, "");
}


function levenshteinDistance(a, b) {

    const matrix = [];

    const aLength = a.length;
    const bLength = b.length;

    for (let i = 0; i <= bLength; i++) {

        matrix[i] = [i];

    }

    for (let j = 0; j <= aLength; j++) {

        matrix[0][j] = j;

    }

    for (let i = 1; i <= bLength; i++) {

        for (let j = 1; j <= aLength; j++) {

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

    return matrix[bLength][aLength];
}


function nameSimilarity(
    enteredName,
    databaseName
) {

    const a =
        compactName(enteredName);

    const b =
        compactName(databaseName);

    if (!a || !b) return 0;

    if (a === b) return 1;

    const distance =
        levenshteinDistance(a, b);

    const maxLength =
        Math.max(
            a.length,
            b.length
        );

    if (!maxLength) return 1;

    return 1 -
        distance / maxLength;
}


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

const parentIntro =
    document.getElementById(
        "parentIntro"
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

let currentParentAccountId =
    null;


/* =====================================================
   PASSWORD CHANGE ELEMENTS
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
   INTRO → LOGIN
===================================================== */

function startParentIntro() {

    /*
       ابتدا پنل والدین کاملاً مخفی باشد
       و صفحه ورود نیز تا پایان Intro نمایش داده نشود.
    */

    if (parentPanel) {

        parentPanel.style.setProperty(
            "display",
            "none",
            "important"
        );

    }

    if (loginScreen) {

        loginScreen.style.setProperty(
            "display",
            "none",
            "important"
        );

    }


    /*
       اگر Intro وجود نداشت،
       مستقیماً صفحه ورود نمایش داده شود.
    */

    if (!parentIntro) {

        if (loginScreen) {

            loginScreen.style.setProperty(
                "display",
                "block",
                "important"
            );

        }

        return;

    }


    /*
       نمایش Intro
    */

    parentIntro.style.setProperty(
        "display",
        "flex",
        "important"
    );

    parentIntro.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
       پایان Intro
    */

    setTimeout(() => {

        parentIntro.classList.add(
            "intro-finished"
        );


        /*
           اجازه می‌دهیم انیمیشن خروج
           کامل شود.
        */

        setTimeout(() => {

            parentIntro.style.setProperty(
                "display",
                "none",
                "important"
            );

            parentIntro.setAttribute(
                "aria-hidden",
                "true"
            );


            /*
               این همان صفحه ورود است
            */

            if (loginScreen) {

                loginScreen.style.setProperty(
                    "display",
                    "block",
                    "important"
                );

                loginScreen.style.visibility =
                    "visible";

                loginScreen.style.opacity =
                    "1";

            }

        }, 700);

    }, 1800);
}


/*
   اجرای Intro
*/

startParentIntro();


/* =====================================================
   PASSWORD CHANGE
===================================================== */

if (
    changeParentCodeButton &&
    currentParentCodeInput &&
    newParentCodeInput &&
    confirmParentCodeInput
) {

    changeParentCodeButton.addEventListener(
        "click",
        async () => {

            if (!currentParentAccountId) {

                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        "ابتدا وارد پنل والدین شوید.";

                }

                return;

            }


            const currentCode =
                currentParentCodeInput
                    .value
                    .trim();

            const newCode =
                newParentCodeInput
                    .value
                    .trim();

            const confirmCode =
                confirmParentCodeInput
                    .value
                    .trim();


            if (
                !/^\d{4}$/.test(currentCode) ||
                !/^\d{4}$/.test(newCode) ||
                !/^\d{4}$/.test(confirmCode)
            ) {

                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        "هر رمز باید دقیقاً ۴ رقم باشد.";

                }

                return;

            }


            if (newCode !== confirmCode) {

                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        "رمز جدید و تکرار آن یکسان نیست.";

                }

                return;

            }


            if (currentCode === newCode) {

                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        "رمز جدید باید با رمز فعلی متفاوت باشد.";

                }

                return;

            }


            if (changeParentCodeMessage) {

                changeParentCodeMessage.textContent =
                    "در حال بررسی رمز...";

            }


            try {

                const {
                    data: account,
                    error: accountError
                } = await supabaseClient
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
                        accountError
                    );

                    throw new Error(
                        "خطا در دریافت اطلاعات حساب."
                    );

                }


                if (!account) {

                    throw new Error(
                        "حساب والد پیدا نشد."
                    );

                }


                if (
                    String(account.parent_code) !==
                    String(currentCode)
                ) {

                    throw new Error(
                        "رمز فعلی صحیح نیست."
                    );

                }


                const {
                    data: updatedAccount,
                    error: updateError
                } = await supabaseClient
                    .from("parent_accounts")
                    .update({
                        parent_code:
                            newCode
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
                        updateError
                    );

                    throw new Error(
                        "تغییر رمز انجام نشد."
                    );

                }


                if (!updatedAccount) {

                    throw new Error(
                        "اطلاعات رمز جدید ذخیره نشد."
                    );

                }


                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        "رمز والد با موفقیت تغییر کرد.";

                }


                currentParentCodeInput.value =
                    "";

                newParentCodeInput.value =
                    "";

                confirmParentCodeInput.value =
                    "";

            } catch (error) {

                console.error(
                    error
                );

                if (changeParentCodeMessage) {

                    changeParentCodeMessage.textContent =
                        error.message ||
                        "خطایی رخ داد.";

                }

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


/* =====================================================
   SCHOOL LOCATION
===================================================== */

const SCHOOL_LAT =
    35.76494314018861;

const SCHOOL_LNG =
    51.32257158390593;

const ALLOWED_RADIUS =
    150;

const EARTH_RADIUS =
    6371000;


/* =====================================================
   CALL SCHEDULE
===================================================== */

function getCallSchedule(className) {

    const classText =
        String(
            className || ""
        ).trim();


    if (
        classText === "پیش-1" ||
        classText === "پیش-2"
    ) {

        return {
            start: "14:00",
            end: "24:00"
        };

    }


    if (
        classText.startsWith("اول")
    ) {

        return {
            start: "14:30",
            end: "24:00"
        };

    }


    if (
        classText.startsWith("دوم") ||
        classText.startsWith("سوم") ||
        classText.startsWith("چهارم") ||
        classText.startsWith("پنجم") ||
        classText.startsWith("ششم")
    ) {

        return {
            start: "14:40",
            end: "24:00"
        };

    }


    return {
        start: "14:00",
        end: "24:00"
    };
}


/* =====================================================
   IRAN DATE / TIME
===================================================== */

function getIranDateParts() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "Asia/Tehran",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    const parts =
        formatter.formatToParts(
            new Date()
        );

    const result = {};

    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                result[part.type] =
                    part.value;

            }

        }
    );

    return {
        year:
            result.year,

        month:
            result.month,

        day:
            result.day
    };
}


function getIranDateString() {

    const parts =
        getIranDateParts();

    return (
        parts.year +
        "-" +
        parts.month +
        "-" +
        parts.day
    );
}


function getIranTimeString() {

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    ).format(
        new Date()
    );
}


function getIranHourMinute() {

    const text =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone:
                    "Asia/Tehran",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        ).format(
            new Date()
        );

    const parts =
        text.split(":");

    return {
        hour:
            Number(parts[0]),

        minute:
            Number(parts[1])
    };
}


/* =====================================================
   DATE / TIME UI
===================================================== */

function updateDateTimeUI() {

    const parts =
        getIranDateParts();

    if (currentDate) {

        currentDate.textContent =
            parts.year +
            "/" +
            parts.month +
            "/" +
            parts.day;

    }


    if (currentTime) {

        currentTime.textContent =
            getIranTimeString();

    }

}


updateDateTimeUI();

setInterval(
    updateDateTimeUI,
    1000
);


/* =====================================================
   CALL SCHEDULE UI
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
            schedule.start;

    }


    const {
        hour,
        minute
    } =
        getIranHourMinute();


    const currentMinutes =
        hour * 60 + minute;


    const startParts =
        schedule.start.split(":");

    const endParts =
        schedule.end.split(":");


    const startMinutes =
        Number(startParts[0]) * 60 +
        Number(startParts[1]);


    const endMinutes =
        Number(endParts[0]) * 60 +
        Number(endParts[1]);


    let active = false;


    if (
        schedule.end === "24:00"
    ) {

        active =
            currentMinutes >=
            startMinutes;

    } else {

        active =
            currentMinutes >=
            startMinutes &&
            currentMinutes <=
            endMinutes;

    }


    if (callButton) {

        if (!active) {

            callButton.dataset.locked =
                "true";

            callButton.disabled =
                true;

        } else {

            callButton.dataset.locked =
                "false";

        }

    }


    if (callDescription) {

        if (active) {

            callDescription.textContent =
                "فراخوانی دانش‌آموز فعال است.";

        } else {

            callDescription.textContent =
                "فراخوانی در ساعت " +
                schedule.start +
                " فعال می‌شود.";

        }

    }

}


updateCallScheduleUI();

setInterval(
    updateCallScheduleUI,
    30000
);


/* =====================================================
   DISTANCE
===================================================== */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const dLat =
        (
            lat2 - lat1
        ) *
        Math.PI /
        180;

    const dLon =
        (
            lon2 - lon1
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return EARTH_RADIUS * c;
}


function formatDistance(
    distance
) {

    if (
        distance === null ||
        distance === undefined ||
        isNaN(distance)
    ) {

        return "نامشخص";

    }


    if (distance < 1000) {

        return (
            Math.round(distance) +
            " متر"
        );

    }


    return (
        (distance / 1000)
            .toFixed(2) +
        " کیلومتر"
    );

}


/* =====================================================
   LOCATION UI
===================================================== */

function updateLocationUI(
    distance
) {

    if (allowedRadiusValue) {

        allowedRadiusValue.textContent =
            ALLOWED_RADIUS +
            " متر";

    }


    if (liveParentDistance) {

        liveParentDistance.textContent =
            formatDistance(
                distance
            );

    }


    if (
        distance !== null &&
        distance <= ALLOWED_RADIUS
    ) {

        if (liveParentStatus) {

            liveParentStatus.textContent =
                "داخل محدوده مجاز";

        }


        if (parentLocationIcon) {

            parentLocationIcon.textContent =
                "✓";

        }


        if (parentLocationCard) {

            parentLocationCard.classList.add(
                "location-ok"
            );

        }

    } else {

        if (liveParentStatus) {

            liveParentStatus.textContent =
                "خارج از محدوده مجاز";

        }


        if (parentLocationIcon) {

            parentLocationIcon.textContent =
                "⚠";

        }


        if (parentLocationCard) {

            parentLocationCard.classList.remove(
                "location-ok"
            );

        }

    }

}


/* =====================================================
   LOCATION PERMISSION
===================================================== */

function checkLocationPermission() {

    if (
        !navigator.geolocation
    ) {

        if (locationStatus) {

            locationStatus.textContent =
                "مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.";

        }

        return false;

    }

    return true;
}


/* =====================================================
   GET CURRENT LOCATION
===================================================== */

function getCurrentParentLocation() {

    if (
        !checkLocationPermission()
    ) {

        return;

    }


    if (
        locationRequestInProgress
    ) {

        return;

    }


    locationRequestInProgress =
        true;


    if (locationStatus) {

        locationStatus.textContent =
            "در حال دریافت موقعیت مکانی...";

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            locationRequestInProgress =
                false;


            lastParentPosition =
                position;


            const distance =
                calculateDistance(

                    position.coords.latitude,

                    position.coords.longitude,

                    SCHOOL_LAT,

                    SCHOOL_LNG

                );


            updateLocationUI(
                distance
            );


            if (locationStatus) {

                if (
                    distance <=
                    ALLOWED_RADIUS
                ) {

                    locationStatus.textContent =
                        "موقعیت شما در محدوده مجاز مدرسه است.";

                } else {

                    locationStatus.textContent =
                        "موقعیت شما خارج از محدوده مجاز مدرسه است.";

                }

            }

        },

        error => {

            locationRequestInProgress =
                false;


            console.error(
                "Geolocation error:",
                error
            );


            if (locationStatus) {

                if (
                    error.code === 1
                ) {

                    locationStatus.textContent =
                        "دسترسی به موقعیت مکانی داده نشده است.";

                } else {

                    locationStatus.textContent =
                        "دریافت موقعیت مکانی ناموفق بود.";

                }

            }

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


/* =====================================================
   LIVE LOCATION
===================================================== */

function startLiveParentLocation() {

    if (
        !navigator.geolocation
    ) {

        return;

    }


    if (
        parentLocationWatchId !== null
    ) {

        navigator.geolocation.clearWatch(
            parentLocationWatchId
        );

    }


    parentLocationWatchId =
        navigator.geolocation.watchPosition(

            position => {

                lastParentPosition =
                    position;


                const distance =
                    calculateDistance(

                        position.coords.latitude,

                        position.coords.longitude,

                        SCHOOL_LAT,

                        SCHOOL_LNG

                    );


                updateLocationUI(
                    distance
                );


                if (locationStatus) {

                    if (
                        distance <=
                        ALLOWED_RADIUS
                    ) {

                        locationStatus.textContent =
                            "موقعیت شما در محدوده مجاز مدرسه است.";

                    } else {

                        locationStatus.textContent =
                            "موقعیت شما خارج از محدوده مجاز مدرسه است.";

                    }

                }

            },

            error => {

                console.warn(
                    "Location watch:",
                    error
                );

            },

            {
                enableHighAccuracy:
                    true,

                maximumAge:
                    5000,

                timeout:
                    15000

            }

        );

}


/* =====================================================
   MANUAL LOCATION REFRESH
===================================================== */

if (
    locationRefreshButton
) {

    locationRefreshButton.addEventListener(
        "click",
        () => {

            getCurrentParentLocation();

        }
    );

}
/* =====================================================
   NOTIFICATION
===================================================== */

function showParentNotification(
    title,
    body
) {

    try {

        if (
            "Notification" in window
        ) {

            if (
                Notification.permission ===
                "granted"
            ) {

                new Notification(
                    title,
                    {
                        body:
                            body,

                        icon:
                            "icon-192.png"
                    }
                );

            } else if (
                Notification.permission ===
                "default"
            ) {

                Notification.requestPermission();

            }

        }

    } catch (error) {

        console.warn(
            "Notification error:",
            error
        );

    }

}


/* =====================================================
   CALL STATUS UI
===================================================== */

function updateParentCallUI(
    callData
) {

    if (!callData) {

        if (callButton) {

            callButton.disabled =
                false;

            callButton.dataset.locked =
                "false";

            callButton.textContent =
                "فراخوانی دانش‌آموز";

        }

        return;

    }


    const status =
        callData.status || "";


    if (
        status === "ارسال شد"
    ) {

        if (callButton) {

            callButton.textContent =
                "دانش‌آموز در حال آمدن به سمت شماست";

            callButton.classList.add(
                "sent"
            );

            callButton.disabled =
                true;

        }


        if (callDescription) {

            callDescription.textContent =
                "فراخوان توسط معلم دریافت و ارسال شده است.";

        }

    } else {

        if (callButton) {

            callButton.textContent =
                "فراخوانی دانش‌آموز";

            callButton.classList.remove(
                "sent"
            );

        }


        if (callDescription) {

            callDescription.textContent =
                "برای فراخوانی دانش‌آموز دکمه زیر را بزنید.";

        }

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


    try {

        const today =
            getIranDateString();


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

                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )

                .limit(1);


        if (error) {

            console.error(
                "Load call error:",
                error
            );

            return;

        }


        if (
            data &&
            data.length > 0
        ) {

            updateParentCallUI(
                data[0]
            );

        } else {

            updateParentCallUI(
                null
            );

        }

    } catch (error) {

        console.error(
            error
        );

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
                    currentStudentName &&
                    currentClassName
                ) {

                    await loadExistingCall();

                }

            },
            10000
        );

}


/* =====================================================
   REALTIME
===================================================== */

function startParentRealtime() {

    if (
        parentCallChannel
    ) {

        try {

            supabaseClient.removeChannel(
                parentCallChannel
            );

        } catch (error) {

            console.warn(
                error
            );

        }

        parentCallChannel =
            null;

    }


    if (
        !currentClassName ||
        !currentStudentName
    ) {

        return;

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

                async payload => {

                    const row =
                        payload.new ||
                        payload.old;


                    if (!row) {

                        return;

                    }


                    if (
                        row.student_name !==
                        currentStudentName
                    ) {

                        return;

                    }


                    const today =
                        getIranDateString();


                    if (
                        row.called_date &&
                        row.called_date !==
                        today
                    ) {

                        return;

                    }


                    const oldStatus =
                        payload.old &&
                        payload.old.status
                            ? payload.old.status
                            : "";


                    const newStatus =
                        row.status || "";


                    updateParentCallUI(
                        row
                    );


                    if (
                        newStatus ===
                            "ارسال شد" &&
                        oldStatus !==
                            "ارسال شد"
                    ) {

                        showParentNotification(

                            "فراخوان مدرسه",

                            "دانش‌آموز در حال آمدن به سمت شماست."

                        );

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

if (
    loginButton &&
    studentNameInput &&
    parentCodeInput
) {

    loginButton.addEventListener(
        "click",
        async () => {

            const name =
                studentNameInput
                    .value
                    .trim();

            const code =
                parentCodeInput
                    .value
                    .trim();


            if (!name) {

                if (message) {

                    message.textContent =
                        "لطفاً نام دانش‌آموز را وارد کنید.";

                }

                return;

            }


            if (
                !/^\d{4}$/.test(code)
            ) {

                if (message) {

                    message.textContent =
                        "کد والد باید ۴ رقمی باشد.";

                }

                return;

            }


            if (message) {

                message.textContent =
                    "در حال بررسی اطلاعات...";

            }


            try {

                const {
                    data: accounts,
                    error
                } =
                    await supabaseClient

                        .from(
                            "parent_accounts"
                        )

                        .select(
                            "id, student_name, class_name, parent_code"
                        )

                        .eq(
                            "parent_code",
                            code
                        );


                if (error) {

                    console.error(
                        error
                    );

                    if (message) {

                        message.textContent =
                            "خطا در ارتباط با سامانه.";

                    }

                    return;

                }


                if (
                    !accounts ||
                    accounts.length === 0
                ) {

                    if (message) {

                        message.textContent =
                            "کد والد صحیح نیست.";

                    }

                    return;

                }


                const matchedAccount =
                    accounts.find(
                        account =>
                            isNameSimilar(
                                name,
                                account.student_name
                            )
                    );


                if (!matchedAccount) {

                    if (message) {

                        message.textContent =
                            "نام دانش‌آموز با این کد مطابقت ندارد.";

                    }

                    return;

                }


                currentStudentName =
                    matchedAccount.student_name;


                currentParentAccountId =
                    matchedAccount.id;


                currentClassName =
                    matchedAccount.class_name;


                if (panelStudentName) {

                    panelStudentName.textContent =
                        matchedAccount.student_name;

                }


                if (panelClassName) {

                    panelClassName.textContent =
                        "کلاس " +
                        matchedAccount.class_name;

                }


                if (message) {

                    message.textContent =
                        "";

                }


                updateCallScheduleUI();


                setTimeout(
                    async () => {

                        if (loginScreen) {

                            loginScreen.style.setProperty(
                                "display",
                                "none",
                                "important"
                            );

                        }


                        if (parentPanel) {

                            parentPanel.style.setProperty(
                                "display",
                                "block",
                                "important"
                            );

                        }


                        window.scrollTo(
                            {
                                top: 0,

                                behavior:
                                    "smooth"
                            }
                        );


                        await loadExistingCall();


                        startParentRealtime();

                        startParentAutoRefresh();

                        startLiveParentLocation();

                        getCurrentParentLocation();

                    },
                    400
                );

            } catch (error) {

                console.error(
                    error
                );

                if (message) {

                    message.textContent =
                        "خطایی رخ داد. دوباره تلاش کنید.";

                }

            }

        }
    );

}


/* =====================================================
   ENTER KEY
===================================================== */

if (
    studentNameInput &&
    parentCodeInput
) {

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
   PARENT CODE INPUT
===================================================== */

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


/* =====================================================
   CALL BUTTON
===================================================== */

if (
    callButton
) {

    callButton.addEventListener(
        "click",
        async () => {

            if (
                callButton.dataset.locked ===
                "true"
            ) {

                return;

            }


            if (
                !currentStudentName ||
                !currentClassName
            ) {

                return;

            }


            updateCallScheduleUI();


            if (
                callButton.disabled
            ) {

                return;

            }


            if (
                !lastParentPosition
            ) {

                getCurrentParentLocation();

                if (locationStatus) {

                    locationStatus.textContent =
                        "ابتدا موقعیت مکانی شما در حال بررسی است.";

                }

                return;

            }


            const distance =
                calculateDistance(

                    lastParentPosition.coords.latitude,

                    lastParentPosition.coords.longitude,

                    SCHOOL_LAT,

                    SCHOOL_LNG

                );


            if (
                distance >
                ALLOWED_RADIUS
            ) {

                if (locationStatus) {

                    locationStatus.textContent =
                        "برای فراخوانی باید داخل محدوده مجاز مدرسه باشید.";

                }

                return;

            }


            callButton.disabled =
                true;


            if (callDescription) {

                callDescription.textContent =
                    "در حال ارسال فراخوان...";

            }


            try {

                const today =
                    getIranDateString();


                const now =
                    getIranTimeString();


                const {
                    data: existingCalls,
                    error: existingError
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

                        .limit(1);


                if (existingError) {

                    throw existingError;

                }


                if (
                    existingCalls &&
                    existingCalls.length > 0
                ) {

                    updateParentCallUI(
                        existingCalls[0]
                    );

                    return;

                }


                const {
                    data,
                    error
                } =
                    await supabaseClient

                        .from("calls")

                        .insert({

                            student_name:
                                currentStudentName,

                            class_name:
                                currentClassName,

                            status:
                                "فراخوانی شد",

                            called_date:
                                today,

                            called_time:
                                now,

                            created_at:
                                new Date().toISOString()

                        })

                        .select("*")

                        .single();


                if (error) {

                    console.error(
                        error
                    );

                    if (
                        error.code ===
                        "23505"
                    ) {

                        await loadExistingCall();

                        return;

                    }

                    throw error;

                }


                updateParentCallUI(
                    data
                );


            } catch (error) {

                console.error(
                    "Call error:",
                    error
                );


                callButton.disabled =
                    false;


                if (callDescription) {

                    callDescription.textContent =
                        "ارسال فراخوان ناموفق بود. دوباره تلاش کنید.";

                }

            }

        }
    );

}
/* =====================================================
   BEFORE UNLOAD
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            parentRefreshInterval
        ) {

            clearInterval(
                parentRefreshInterval
            );

            parentRefreshInterval =
                null;

        }


        if (
            parentLocationWatchId !== null
        ) {

            try {

                navigator.geolocation.clearWatch(
                    parentLocationWatchId
                );

            } catch (error) {

                console.warn(
                    error
                );

            }

            parentLocationWatchId =
                null;

        }


        if (
            parentCallChannel
        ) {

            try {

                supabaseClient.removeChannel(
                    parentCallChannel
                );

            } catch (error) {

                console.warn(
                    error
                );

            }

            parentCallChannel =
                null;

        }

    }
);


/* =====================================================
   VISIBILITY CHANGE
===================================================== */

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

                startParentRealtime();

            }

        }

    }
);


/* =====================================================
   INITIAL UI
===================================================== */

/*
   این قسمت مهم است:
   تا زمانی که کاربر وارد نشده،
   پنل والدین نباید دیده شود.
*/

if (parentPanel) {

    parentPanel.style.setProperty(
        "display",
        "none",
        "important"
    );

}


/*
   صفحه ورود توسط Intro مدیریت می‌شود.
   اگر Intro وجود نداشته باشد،
   مستقیماً صفحه ورود باز می‌شود.
*/

if (!parentIntro) {

    if (loginScreen) {

        loginScreen.style.setProperty(
            "display",
            "block",
            "important"
        );

    }

}


/* =====================================================
   RESET SESSION
===================================================== */

function resetParentSession() {

    currentStudentName =
        "";

    currentClassName =
        "";

    currentParentAccountId =
        null;


    if (
        parentRefreshInterval
    ) {

        clearInterval(
            parentRefreshInterval
        );

        parentRefreshInterval =
            null;

    }


    if (
        parentLocationWatchId !== null
    ) {

        try {

            navigator.geolocation.clearWatch(
                parentLocationWatchId
            );

        } catch (error) {

            console.warn(
                error
            );

        }

        parentLocationWatchId =
            null;

    }


    if (
        parentCallChannel
    ) {

        try {

            supabaseClient.removeChannel(
                parentCallChannel
            );

        } catch (error) {

            console.warn(
                error
            );

        }

        parentCallChannel =
            null;

    }


    lastParentPosition =
        null;


    if (parentPanel) {

        parentPanel.style.setProperty(
            "display",
            "none",
            "important"
        );

    }


    if (loginScreen) {

        loginScreen.style.setProperty(
            "display",
            "block",
            "important"
        );

    }

}


/* =====================================================
   DEBUG
===================================================== */

console.log(
    "Parent panel loaded successfully."
);

console.log(
    "Parent Intro:",
    !!parentIntro
);

console.log(
    "Login Screen:",
    !!loginScreen
);

console.log(
    "Parent Panel:",
    !!parentPanel
);

console.log(
    "Supabase:",
    !!supabaseClient
);


/* =====================================================
   READY
===================================================== */

console.log(
    "Alavi Parent Panel Ready."
);