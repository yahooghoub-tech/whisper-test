/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: ششم-2
   پایگاه داده: MySQL روی berandil.ir
   الگوی مرجع: پنل کلاس ششم-1
   بدون وابستگی به Supabase
===================================================== */

"use strict";

/* =====================================================
   تنظیمات API
===================================================== */

const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "ششم-2";

/* =====================================================
   فهرست دانش‌آموزان کلاس ششم-2
===================================================== */

const students = [
    { name: "فرهاد احمدی نژاد", className: "ششم-2" },
    { name: "روهان حیدری", className: "ششم-2" },
    { name: "دانیال زارع قمشه", className: "ششم-2" },
    { name: "ماهان زند", className: "ششم-2" },
    { name: "آدرین سعیدی", className: "ششم-2" },
    { name: "محمدعلی شهبازی", className: "ششم-2" },
    { name: "متین عباسی", className: "ششم-2" },
    { name: "آرشام عمرانی", className: "ششم-2" },
    { name: "رادین فروغی", className: "ششم-2" },
    { name: "پدرام قربانی", className: "ششم-2" },
    { name: "آرکا کامیار", className: "ششم-2" },
    { name: "رایان کلانتری", className: "ششم-2" },
    { name: "دانا کاظمی", className: "ششم-2" },
    { name: "عماد لرستانی", className: "ششم-2" },
    { name: "عرفان مقدم لو", className: "ششم-2" },
    { name: "ماهان مجیدی", className: "ششم-2" },
    { name: "حسام مظلومی نیا", className: "ششم-2" },
    { name: "آدرین مهدی زاده", className: "ششم-2" },
    { name: "سپنتا محبی", className: "ششم-2" },
    { name: "فراز نعمت طلب", className: "ششم-2" },
    { name: "محمدحسین ناصری", className: "ششم-2" },
    { name: "امیرحسین وقار", className: "ششم-2" }
];

/* =====================================================
   عناصر HTML
===================================================== */

const studentsContainer =
    document.getElementById("studentsContainer");

const callCount =
    document.getElementById("callCount");

/* =====================================================
   وضعیت‌های عمومی پنل
===================================================== */

let notificationAudio = null;
let soundEnabled = false;

let callsLoading = false;
let attendanceLoading = false;
let teacherPanelRefreshRunning = false;

let callsInitialized = false;

let currentTeacherCallDay = getDatabaseToday();

let lastTeacherCallsLoad = 0;
let lastAbsentStudentsLoad = 0;

let popupTimer = null;
let messageTimer = null;

const previousCallStates = new Map();
const studentButtons = new Map();

/* =====================================================
   وضعیت درخواست‌های دانش‌آموزان
===================================================== */

const sendingStudents = new Set();

/* =====================================================
   تاریخ امروز بر اساس منطقه زمانی تهران
   خروجی: YYYY-MM-DD
===================================================== */

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const part = type =>
        parts.find(item => item.type === type)?.value || "";

    return `${part("year")}-${part("month")}-${part("day")}`;
}

/* =====================================================
   ساعت فعلی بر اساس منطقه زمانی تهران
===================================================== */

function getTehranTime() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(new Date());
}

/* =====================================================
   درخواست به API هاست
===================================================== */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
            "Accept": "application/json",
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            `پاسخ API معتبر نیست (HTTP ${response.status})`
        );
    }

    if (!response.ok || !result.success) {
        throw new Error(
            result.message ||
            `خطای API (HTTP ${response.status})`
        );
    }

    return result;
}

/* =====================================================
   ساخت URL با پارامترهای درخواست
===================================================== */

function buildApiUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });

    url.searchParams.set("_", String(Date.now()));

    return url.toString();
}

/* =====================================================
   نمایش پیام به کاربر
===================================================== */

function showMessage(text) {
    const message = document.getElementById("message");

    if (!message) {
        console.log(text);
        return;
    }

    message.textContent = text;
    message.classList.add("show");

    if (messageTimer) {
        clearTimeout(messageTimer);
    }

    messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 3000);
}

/* =====================================================
   فعال‌سازی صدای فراخوان
===================================================== */

function setupSound() {
    const button =
        document.getElementById("enableSoundButton");

    if (!button) {
        console.warn(
            "دکمه enableSoundButton در HTML وجود ندارد."
        );
        return;
    }

    if (button.dataset.soundInitialized === "true") {
        return;
    }

    button.dataset.soundInitialized = "true";

    button.addEventListener("click", async () => {
        try {
            if (!soundEnabled) {
                if (!notificationAudio) {
                    notificationAudio =
                        new Audio("notification.mp3");

                    notificationAudio.preload = "auto";
                    notificationAudio.volume = 1;
                }

                await notificationAudio.play();

                notificationAudio.pause();
                notificationAudio.currentTime = 0;

                soundEnabled = true;

                button.innerText =
                    "🔊 صدای فراخوان فعال است";

                button.style.background = "#22c55e";

                showMessage("صدای فراخوان فعال شد.");

            } else {
                soundEnabled = false;

                if (notificationAudio) {
                    notificationAudio.pause();
                    notificationAudio.currentTime = 0;
                }

                button.innerText =
                    "🔇 صدای فراخوان غیرفعال است";

                button.style.background = "#ef4444";

                showMessage("صدای فراخوان غیرفعال شد.");
            }

        } catch (error) {
            console.error(
                "خطا در تغییر وضعیت صدای فراخوان:",
                error
            );

            alert(
                "پخش صدا ناموفق بود: " + error.message
            );
        }
    });
}

/* =====================================================
   پخش صدای اعلان
===================================================== */

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) {
        return;
    }

    try {
        notificationAudio.currentTime = 0;

        notificationAudio.play().catch(error => {
            console.error(
                "خطا در پخش صدای فراخوان:",
                error
            );
        });

    } catch (error) {
        console.error(
            "خطای پخش صدای فراخوان:",
            error
        );
    }
}

/* =====================================================
   پنجره اطلاع‌رسانی فراخوان
===================================================== */

function showCallPopup(studentName) {
    const popup =
        document.getElementById("callPopup");

    const student =
        document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn(
            "عناصر پنجره فراخوان در HTML پیدا نشدند."
        );

        playNotificationSound();
        return;
    }

    student.textContent = studentName + " فراخوان شد";

    popup.classList.add("show");

    if (popupTimer) {
        clearTimeout(popupTimer);
    }

    popupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);

    playNotificationSound();
}

/* =====================================================
   پنجره اطلاع‌رسانی ارسال دانش‌آموز
===================================================== */

function showSendNotification(studentName) {
    const popup =
        document.getElementById("callPopup");

    const student =
        document.getElementById("callPopupStudent");

    if (!popup || !student) {
        console.warn(
            "عناصر پنجره اطلاع‌رسانی در HTML پیدا نشدند."
        );

        playNotificationSound();
        return;
    }

    student.textContent =
        "📤 " + studentName + " ارسال شد";

    popup.classList.add("show");

    if (popupTimer) {
        clearTimeout(popupTimer);
    }

    popupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 5000);

    playNotificationSound();
}

/* =====================================================
   یکسان‌سازی نام دانش‌آموزان
===================================================== */

function normalizeStudentName(name) {
    return String(name ?? "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF\u200C]/g, "")
        .replace(/\s+/g, "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک");
}

/* =====================================================
   پیدا کردن دکمه دانش‌آموز
===================================================== */

function findButton(name) {
    const exact = studentButtons.get(name);

    if (exact) {
        return exact;
    }

    const target = normalizeStudentName(name);

    for (const [studentName, button] of studentButtons) {
        if (
            normalizeStudentName(studentName) === target
        ) {
            return button;
        }
    }

    return null;
}

/* =====================================================
   ساخت دکمه‌های دانش‌آموزان
===================================================== */

function createStudents() {
    if (!studentsContainer) {
        console.error(
            "عنصر studentsContainer در HTML پیدا نشد."
        );
        return;
    }

    studentsContainer.innerHTML = "";

    studentButtons.clear();

    students.forEach(student => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "student-button pending";
        button.dataset.name = student.name;

        const nameDiv = document.createElement("div");
        nameDiv.className = "student-name";
        nameDiv.textContent = student.name;

        const statusDiv = document.createElement("div");
        statusDiv.className = "student-status";

        const timeDiv = document.createElement("div");
        timeDiv.className = "student-time";

        button.append(
            nameDiv,
            statusDiv,
            timeDiv
        );

        button.addEventListener("click", () => {
            sendStudent(student);
        });

        studentsContainer.appendChild(button);

        studentButtons.set(student.name, button);
    });

    updateCount([]);
}

/* =====================================================
   پاک‌سازی اطلاعات نمایشی یک دکمه
===================================================== */

function clearStudentButton(button) {
    if (!button) return;

    button.classList.remove(
        "called",
        "sent",
        "received",
        "absent"
    );

    button.classList.add("pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");
    const name = button.querySelector(".student-name");

    if (status) {
        status.textContent = "";
    }

    if (time) {
        time.textContent = "";
    }

    if (name) {
        name.textContent = button.dataset.name || "";
    }

    button.disabled =
        sendingStudents.has(button.dataset.name);
}

/* =====================================================
   بازگرداندن یک دانش‌آموز به حالت اولیه
===================================================== */

function resetStudentButton(call) {
    if (!call || !call.student_name) return;

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) {
        return;
    }

    clearStudentButton(button);
}

/* =====================================================
   بازنشانی نمایشی پنل
   وضعیت غایبان حفظ می‌شود.
===================================================== */

function resetTeacherPanel() {
    studentButtons.forEach(button => {
        if (button.classList.contains("absent")) {
            return;
        }

        clearStudentButton(button);
    });

    if (callCount) {
        callCount.textContent = "0 فراخوان";
    }
}

/* =====================================================
   بازنشانی ظاهری بدون پاک‌کردن وضعیت‌های قبلی
===================================================== */

function resetTeacherPanelVisualOnly() {
    studentButtons.forEach(button => {
        if (button.classList.contains("absent")) {
            return;
        }

        clearStudentButton(button);
    });
}

/* =====================================================
   به‌روزرسانی وضعیت یک دانش‌آموز
===================================================== */

function updateButton(call) {
    if (!call || !call.student_name) {
        return;
    }

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) {
        return;
    }

    const statusElement =
        button.querySelector(".student-status");

    const timeElement =
        button.querySelector(".student-time");

    if (!statusElement || !timeElement) {
        return;
    }

    button.classList.remove(
        "called",
        "sent",
        "received",
        "pending"
    );

    if (call.status === "لغو شد") {
        clearStudentButton(button);
        return;
    }

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        statusElement.textContent = "🔴 فراخوان";

    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        statusElement.textContent = "🟠 دریافت شد";

    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        statusElement.textContent = "🟢 ارسال شد";

    } else {
        button.classList.add("pending");
        statusElement.textContent = "";
    }

    const timeLines = [];

    if (call.called_time) {
        timeLines.push(
            "🕐 فراخوان: " + call.called_time
        );
    }

    if (
        call.sent_time &&
        call.status === "ارسال شد"
    ) {
        timeLines.push(
            "📤 ارسال: " + call.sent_time
        );
    }

    timeElement.replaceChildren();

    timeLines.forEach((line, index) => {
        if (index > 0) {
            timeElement.appendChild(
                document.createElement("br")
            );
        }

        timeElement.appendChild(
            document.createTextNode(line)
        );
    });

    button.disabled =
        sendingStudents.has(button.dataset.name);
}

/* =====================================================
   شمارش فراخوان‌های فعال
===================================================== */

function updateCount(data) {
    if (!Array.isArray(data)) {
        console.error(
            "اطلاعات فراخوان آرایه نیست:",
            data
        );
        return;
    }

    const activeCalls = data.filter(call =>
        call.status !== "ارسال شد" &&
        call.status !== "لغو شد"
    );

    if (callCount) {
        callCount.textContent =
            activeCalls.length + " فراخوان";
    }
}

/* =====================================================
   دریافت فراخوان‌های امروز
===================================================== */

async function loadCalls() {
    if (callsLoading || !navigator.onLine) {
        return;
    }

    callsLoading = true;

    try {
        const today = getDatabaseToday();

        const url = buildApiUrl(CALLS_API, {
            class_name: className,
            date: today
        });

        const result = await apiRequest(url);

        /* جلوگیری از اعمال اطلاعات روز قبلی */

        if (today !== getDatabaseToday()) {
            return;
        }

        const responseData = Array.isArray(result.data)
            ? result.data
            : [];

        /* فقط اطلاعات کلاس و تاریخ جاری */

        const todayCalls = responseData.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const currentStates = new Map();

        todayCalls.forEach(call => {
            const key = String(
                call.id ??
                `${normalizeStudentName(call.student_name)}-${call.called_date}-${call.called_time ?? ""}`
            );

            currentStates.set(key, call);

            if (!callsInitialized) {
                return;
            }

            const previous = previousCallStates.get(key);

            /* فراخوان جدید */

            if (
                !previous &&
                call.status === "فراخوان شد"
            ) {
                const button = findButton(
                    call.student_name
                );

                if (
                    !button ||
                    !button.classList.contains("absent")
                ) {
                    showCallPopup(call.student_name);
                }
            }

            /* تغییر وضعیت به ارسال شد */

            else if (
                previous &&
                previous.status !== "ارسال شد" &&
                call.status === "ارسال شد"
            ) {
                showSendNotification(call.student_name);
            }
        });

        resetTeacherPanelVisualOnly();

        todayCalls.forEach(updateButton);

        updateCount(todayCalls);

        previousCallStates.clear();

        currentStates.forEach((call, key) => {
            previousCallStates.set(key, call);
        });

        callsInitialized = true;
        lastTeacherCallsLoad = Date.now();

    } catch (error) {
        console.error(
            "خطا در دریافت فراخوان‌های امروز:",
            error
        );

    } finally {
        callsLoading = false;
    }
}

/* =====================================================
   دریافت غایبان امروز
===================================================== */

async function loadAbsentStudents() {
    if (attendanceLoading || !navigator.onLine) {
        return;
    }

    attendanceLoading = true;

    try {
        const today = getDatabaseToday();

        const url = buildApiUrl(ATTENDANCE_API, {
            class_name: className,
            date: today
        });

        const result = await apiRequest(url);

        /* اطلاعات روز جدید را با روز قبلی مخلوط نکن */

        if (today !== getDatabaseToday()) {
            return;
        }

        const records = Array.isArray(result.data)
            ? result.data
            : [];

        /* حذف غیبت‌های قبلی و بازگردانی نام‌ها */

        studentButtons.forEach(button => {
            button.classList.remove("absent");

            const nameDiv =
                button.querySelector(".student-name");

            if (nameDiv) {
                nameDiv.textContent =
                    button.dataset.name;
            }

            button.disabled =
                sendingStudents.has(button.dataset.name);
        });

        /* اعمال غیبت‌های ثبت‌شده برای همین روز */

        records.forEach(record => {
            if (
                record.class_name !== className ||
                record.attendance_date !== today ||
                record.status !== "غایب"
            ) {
                return;
            }

            const button = findButton(
                record.student_name
            );

            if (!button) {
                return;
            }

            button.classList.remove(
                "called",
                "sent",
                "received",
                "pending"
            );

            button.classList.add("absent");
            button.disabled = true;

            const nameDiv =
                button.querySelector(".student-name");

            const status =
                button.querySelector(".student-status");

            const time =
                button.querySelector(".student-time");

            if (nameDiv) {
                nameDiv.textContent =
                    button.dataset.name + " (غایب)";
            }

            if (status) {
                status.textContent = "";
            }

            if (time) {
                time.textContent = "";
            }
        });

        lastAbsentStudentsLoad = Date.now();

    } catch (error) {
        console.error(
            "خطا در دریافت غایبان امروز:",
            error
        );

    } finally {
        attendanceLoading = false;
    }
}

/* =====================================================
   ارسال فراخوان دانش‌آموز
===================================================== */

async function sendStudent(student) {
    const button = findButton(student.name);

    if (!button) {
        console.error(
            "دکمه دانش‌آموز پیدا نشد:",
            student.name
        );
        return;
    }

    if (button.classList.contains("absent")) {
        alert(
            "این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد."
        );
        return;
    }

    if (sendingStudents.has(student.name)) {
        return;
    }

    if (!navigator.onLine) {
        showMessage(
            "اتصال اینترنت برقرار نیست. دوباره تلاش کنید."
        );
        return;
    }

    /* جلوگیری از کلیک تکراری */

    sendingStudents.add(student.name);

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        const today = getDatabaseToday();

        /* دریافت فراخوان‌های روز جاری */

        const callsUrl = buildApiUrl(CALLS_API, {
            class_name: className,
            date: today
        });

        const result = await apiRequest(callsUrl);

        if (today !== getDatabaseToday()) {
            showMessage(
                "تاریخ روز تغییر کرده است؛ دوباره تلاش کنید."
            );
            return;
        }

        /*
           غیبت را دوباره از سرور بررسی می‌کنیم.
           اگر درخواست حضور و غیاب دیگری در حال اجرا باشد،
           ابتدا منتظر پایان آن می‌مانیم.
        */

        while (attendanceLoading) {
            await new Promise(resolve =>
                setTimeout(resolve, 100)
            );
        }

        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            alert(
                "این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد."
            );
            return;
        }

        const calls = Array.isArray(result.data)
            ? result.data
            : [];

        /* یافتن آخرین فراخوان فعال همین دانش‌آموز */

        const activeCall = calls
            .filter(call =>
                normalizeStudentName(call.student_name) ===
                    normalizeStudentName(student.name) &&
                call.class_name === className &&
                call.called_date === today &&
                call.status !== "ارسال شد" &&
                call.status !== "لغو شد"
            )
            .sort((a, b) =>
                Number(b.id) - Number(a.id)
            )[0];

        if (!activeCall) {
            alert(
                "برای این دانش‌آموز فراخوان فعالی پیدا نشد."
            );
            return;
        }

        /* بررسی دوباره تاریخ قبل از ثبت نهایی */

        if (today !== getDatabaseToday()) {
            showMessage(
                "تاریخ روز تغییر کرده است؛ ارسال انجام نشد."
            );
            return;
        }

        /* ثبت ارسال در پایگاه داده */

        const updateResult = await apiRequest(
            UPDATE_CALL_API,
            {
                method: "POST",
                body: JSON.stringify({
                    id: activeCall.id,
                    status: "ارسال شد",
                    sent_time: getTehranTime()
                })
            }
        );

        console.log(
            "وضعیت فراخوان به‌روزرسانی شد:",
            updateResult
        );

        showMessage(
            "📤 فراخوان " + student.name + " ارسال شد."
        );

        /* تازه‌سازی اطلاعات پنل */

        await refreshTeacherPanel();

    } catch (error) {
        console.error(
            "خطا در ارسال فراخوان:",
            error
        );

        alert(
            "ارسال فراخوان ناموفق بود. اتصال هاست و پاسخ API را بررسی کنید.\n" +
            error.message
        );

    } finally {
        sendingStudents.delete(student.name);

        delete button.dataset.sending;

        /*
           در صورت قطع اینترنت، وضعیت دکمه تا دریافت
           اطلاعات بعدی سرور به‌صورت محلی تغییر نمی‌کند.
        */

        if (button.classList.contains("absent")) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }

        /*
           بعد از آزادشدن قفل، اطلاعات سرور مجدداً بررسی می‌شود.
        */

        if (navigator.onLine) {
            refreshTeacherPanel();
        }
    }
}

/* =====================================================
   تشخیص تغییر روز تهران
===================================================== */

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) {
        return false;
    }

    console.log(
        "روز فراخوان تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    resetTeacherPanel();

    previousCallStates.clear();

    callsInitialized = false;

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    return true;
}

/* =====================================================
   تازه‌سازی اطلاعات پنل
===================================================== */

async function refreshTeacherPanel() {
    if (
        teacherPanelRefreshRunning ||
        document.visibilityState !== "visible" ||
        !navigator.onLine
    ) {
        return;
    }

    teacherPanelRefreshRunning = true;

    try {
        checkTeacherCallDayChange();

        /*
           ابتدا حضور و غیاب دریافت می‌شود تا در زمان
           بازسازی وضعیت فراخوان، غیبت‌ها حفظ شوند.
        */

        await loadAbsentStudents();

        await loadCalls();

    } catch (error) {
        console.error(
            "خطا در به‌روزرسانی پنل معلم:",
            error
        );

    } finally {
        teacherPanelRefreshRunning = false;
    }
}

/* =====================================================
   بررسی سلامت به‌روزرسانی پنل
===================================================== */

function checkPanelWatchdog() {
    if (
        document.visibilityState !== "visible" ||
        !navigator.onLine
    ) {
        return;
    }

    const now = Date.now();

    const callsStale =
        !lastTeacherCallsLoad ||
        now - lastTeacherCallsLoad > 15000;

    const attendanceStale =
        !lastAbsentStudentsLoad ||
        now - lastAbsentStudentsLoad > 15000;

    if (
        !teacherPanelRefreshRunning &&
        !callsLoading &&
        !attendanceLoading &&
        (callsStale || attendanceStale)
    ) {
        console.warn(
            "Watchdog: اطلاعات پنل به‌موقع به‌روزرسانی نشده‌اند."
        );

        refreshTeacherPanel();
    }
}

/* =====================================================
   راه‌اندازی اولیه پنل
===================================================== */

function initializeTeacherPanel() {
    createStudents();

    setupSound();

    refreshTeacherPanel();

    console.log(
        "پنل فراخوان معلم کلاس ششم-2 آماده است."
    );
}

/* =====================================================
   اطمینان از اجرای یک‌باره راه‌اندازی
===================================================== */

if (!window.teacherPanelClass62Initialized) {
    window.teacherPanelClass62Initialized = true;

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeTeacherPanel,
            { once: true }
        );
    } else {
        initializeTeacherPanel();
    }
}

/* =====================================================
   به‌روزرسانی خودکار هر 5 ثانیه
===================================================== */

setInterval(() => {
    refreshTeacherPanel();
}, 5000);

/* =====================================================
   بررسی سلامت ارتباط هر 10 ثانیه
===================================================== */

setInterval(() => {
    checkPanelWatchdog();
}, 10000);

/* =====================================================
   تشخیص بازگشت به پنل
===================================================== */

window.addEventListener("focus", () => {
    refreshTeacherPanel();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        refreshTeacherPanel();
    }
});

/* =====================================================
   مدیریت اتصال مجدد اینترنت
===================================================== */

window.addEventListener("online", () => {
    console.log(
        "اتصال اینترنت برقرار شد."
    );

    showMessage(
        "اتصال اینترنت برقرار شد؛ اطلاعات در حال به‌روزرسانی است."
    );

    refreshTeacherPanel();
});

window.addEventListener("offline", () => {
    console.warn(
        "اتصال اینترنت قطع شد."
    );

    showMessage(
        "اتصال اینترنت قطع شده است."
    );
});