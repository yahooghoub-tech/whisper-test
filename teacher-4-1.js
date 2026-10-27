const API_BASE = "https://berandil.ir/farakhan-api";

const CALLS_API = `${API_BASE}/teacher-calls.php`;
const UPDATE_CALL_API = `${API_BASE}/update-call-status.php`;
const ATTENDANCE_API = `${API_BASE}/attendance.php`;

const className = "چهارم-1";

let notificationAudio = null;
let soundEnabled = false;

let teacherCallsLoading = false;
let absentStudentsLoading = false;
let teacherPanelRefreshRunning = false;

let currentTeacherCallDay = getDatabaseToday();
let previousCallStates = new Map();
let callsLoadedOnce = false;

let teacherMessageTimer = null;
let teacherCallPopupTimer = null;

const studentButtons = new Map();

const students = [
    { name: "محمدطاها احمدی", className },
    { name: "رادمهر بشیری", className },
    { name: "مهراد بیاتی", className },
    { name: "آران باروتی", className },
    { name: "پوریا توکلیان", className },
    { name: "رادین حسنی", className },
    { name: "اوتانا درویشی", className },
    { name: "امیرعباس دهقان", className },
    { name: "سام زندمقدم", className },
    { name: "مهراد سفارزاد", className },
    { name: "نویان علیشاهی", className },
    { name: "مهراد عموحسن", className },
    { name: "کوروش قاسمی", className },
    { name: "محمدحسین قرابیگلو", className },
    { name: "محمدحسین کریمی", className },
    { name: "رهام لطفی", className },
    { name: "امیرعلی ناعمی", className },
    { name: "رایان مقدسی", className },
    { name: "یاشام درگاهی", className }
];

const studentsContainer = document.getElementById("studentsContainer");
const callCount = document.getElementById("callCount");

/* =========================================
   تاریخ امروز بر اساس منطقه زمانی تهران
========================================= */

function getDatabaseToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tehran",
        calendar: "gregory",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function getToday() {
    return getDatabaseToday();
}

function getTehranTime() {
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(new Date());
}

/* =========================================
   درخواست به API
========================================= */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
            "Accept": "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    let result;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("پاسخ API معتبر نیست یا JSON دریافت نشد.");
    }

    if (!response.ok || result?.success === false) {
        throw new Error(
            result?.message || `خطای API: ${response.status}`
        );
    }

    return result?.data ?? result;
}

function getArrayResult(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.calls)) return result.calls;
    if (Array.isArray(result?.records)) return result.records;
    return [];
}

/* =========================================
   پیام‌های کوتاه پنل
========================================= */

function showMessage(message) {
    const element = document.getElementById("message");

    if (!element) return;

    element.innerText = message;
    element.classList.add("show");

    clearTimeout(teacherMessageTimer);

    teacherMessageTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}

/* =========================================
   فعال‌سازی و پخش صدا
========================================= */

function setupSound() {
    const button = document.getElementById("enableSoundButton");

    if (!button) {
        console.error("دکمه enableSoundButton در HTML پیدا نشد.");
        return;
    }

    button.addEventListener("click", async () => {
        try {
            if (!soundEnabled) {
                if (!notificationAudio) {
                    notificationAudio = new Audio("notification.mp3");
                    notificationAudio.preload = "auto";
                    notificationAudio.volume = 1;
                }

                notificationAudio.currentTime = 0;
                await notificationAudio.play();

                notificationAudio.pause();
                notificationAudio.currentTime = 0;

                soundEnabled = true;
                button.innerText = "🔊 صدای فراخوان فعال است";
                button.style.background = "#22c55e";

                showMessage("صدای اعلان فعال شد.");
            } else {
                soundEnabled = false;

                if (notificationAudio) {
                    notificationAudio.pause();
                    notificationAudio.currentTime = 0;
                }

                button.innerText = "🔇 فعال‌سازی صدای فراخوان";
                button.style.background = "#ef4444";

                showMessage("صدای اعلان غیرفعال شد.");
            }
        } catch (error) {
            console.error("خطا در فعال‌سازی صدا:", error);

            showMessage(
                "فعال‌سازی صدا ناموفق بود؛ فایل notification.mp3 را بررسی کنید."
            );
        }
    });
}

function playNotificationSound() {
    if (!soundEnabled || !notificationAudio) return;

    notificationAudio.currentTime = 0;

    notificationAudio.play().catch(error => {
        console.error("خطا در پخش صدای اعلان:", error);
    });
}

/* =========================================
   پنجره اعلان فراخوان
========================================= */

function showSendNotification(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) return;

    student.innerText = `📤 ${studentName} ارسال شد`;
    popup.classList.add("show");

    playNotificationSound();

    clearTimeout(teacherCallPopupTimer);

    teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 5000);
}

function showCallPopup(studentName) {
    const popup = document.getElementById("callPopup");
    const student = document.getElementById("callPopupStudent");

    if (!popup || !student) return;

    student.innerText = `${studentName} فراخوان شد`;
    popup.classList.add("show");

    playNotificationSound();

    clearTimeout(teacherCallPopupTimer);

    teacherCallPopupTimer = setTimeout(() => {
        popup.classList.remove("show");
    }, 7000);
}

/* =========================================
   یکسان‌سازی نام دانش‌آموزان
========================================= */

function normalizeStudentName(name) {
    return String(name || "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ")
        .trim();
}

/* =========================================
   ساخت دکمه‌های دانش‌آموزان
========================================= */

function createStudents() {
    if (!studentsContainer) {
        console.error("عنصر studentsContainer در HTML پیدا نشد.");
        return;
    }

    studentsContainer.innerHTML = "";
    studentButtons.clear();

    students.forEach(student => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "student-button pending";
        button.dataset.name = student.name;

        const name = document.createElement("div");
        name.className = "student-name";
        name.innerText = student.name;

        const status = document.createElement("div");
        status.className = "student-status";

        const time = document.createElement("div");
        time.className = "student-time";

        button.append(name, status, time);

        button.addEventListener("click", () => {
            sendStudent(student);
        });

        studentsContainer.appendChild(button);

        studentButtons.set(
            normalizeStudentName(student.name),
            button
        );
    });
}

function findButton(name) {
    const normalizedName = normalizeStudentName(name);

    if (studentButtons.has(normalizedName)) {
        return studentButtons.get(normalizedName);
    }

    for (const [studentName, button] of studentButtons.entries()) {
        if (studentName === normalizedName) {
            return button;
        }
    }

    return null;
}

/* =========================================
   به‌روزرسانی وضعیت دکمه دانش‌آموز
========================================= */

function getCallKey(call) {
    if (call.id !== undefined && call.id !== null) {
        return String(call.id);
    }

    return [
        normalizeStudentName(call.student_name),
        call.called_date || "",
        call.called_time || ""
    ].join("_");
}

function updateButton(call) {
    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    const statusElement = button.querySelector(".student-status");
    const timeElement = button.querySelector(".student-time");

    if (!statusElement || !timeElement) return;

    button.classList.remove(
        "called",
        "sent",
        "received",
        "pending"
    );

    if (call.status === "فراخوان شد") {
        button.classList.add("called");
        statusElement.innerText = "🔴 فراخوان";
    } else if (call.status === "دریافت فراخوان") {
        button.classList.add("received");
        statusElement.innerText = "🟠 دریافت شد";
    } else if (call.status === "ارسال شد") {
        button.classList.add("sent");
        statusElement.innerText = "🟢 ارسال شد";
    } else if (call.status === "لغو شد") {
        button.classList.add("pending");
        statusElement.innerText = "لغو شد";
    } else {
        button.classList.add("pending");
        statusElement.innerText = call.status || "";
    }

    const timeLines = [];

    if (call.called_time) {
        timeLines.push(`🕐 فراخوان: ${call.called_time}`);
    }

    if (call.sent_time) {
        timeLines.push(`📤 ارسال: ${call.sent_time}`);
    }

    timeElement.innerText = timeLines.join("\n");
}

function resetStudentButton(call) {
    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) return;

    button.classList.remove("called", "sent", "received");
    button.classList.add("pending");

    const status = button.querySelector(".student-status");
    const time = button.querySelector(".student-time");

    if (status) status.innerText = "";
    if (time) time.innerText = "";
}

function resetTeacherPanel() {
    studentButtons.forEach(button => {
        if (button.classList.contains("absent")) return;

        button.classList.remove("called", "sent", "received");
        button.classList.add("pending");

        const status = button.querySelector(".student-status");
        const time = button.querySelector(".student-time");

        if (status) status.innerText = "";
        if (time) time.innerText = "";
    });

    if (callCount) {
        callCount.innerText = "0 فراخوان";
    }
}

function updateCount(data) {
    if (!Array.isArray(data)) return;

    const activeCalls = data.filter(call =>
        call.status !== "ارسال شد" &&
        call.status !== "لغو شد"
    );

    if (callCount) {
        callCount.innerText = `${activeCalls.length} فراخوان`;
    }
}
/* =========================================
   دریافت و به‌روزرسانی فراخوان‌ها
========================================= */

async function loadCalls() {
    if (teacherCallsLoading || !navigator.onLine) return;

    teacherCallsLoading = true;

    try {
        const today = getToday();

        const params = new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${CALLS_API}?${params.toString()}`
        );

        const data = getArrayResult(result).filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const currentStates = new Map();

        data.forEach(call => {
            const key = getCallKey(call);

            const state = [
                call.status || "",
                call.sent_time || "",
                call.called_time || ""
            ].join("_");

            currentStates.set(key, state);

            const previousState = previousCallStates.get(key);
            const button = findButton(call.student_name);
            const isAbsent = button?.classList.contains("absent");

            if (callsLoadedOnce && !isAbsent) {
                if (
                    previousState === undefined &&
                    call.status === "فراخوان شد"
                ) {
                    showCallPopup(call.student_name);
                } else if (previousState !== undefined && previousState !== state) {
                    const previousStatus = previousState.split("_")[0];

                    if (
                        previousStatus !== "ارسال شد" &&
                        call.status === "ارسال شد"
                    ) {
                        showSendNotification(call.student_name);
                    } else if (
                        previousStatus !== "فراخوان شد" &&
                        call.status === "فراخوان شد"
                    ) {
                        showCallPopup(call.student_name);
                    }
                }
            }

            updateButton(call);
        });

        previousCallStates = currentStates;
        callsLoadedOnce = true;

        updateCount(data);

        // غیبت‌ها نیز در هر بار بارگذاری مجدداً بررسی می‌شوند.
        await loadAbsentStudents();

    } catch (error) {
        console.error("خطا در دریافت فراخوان‌ها:", error);
    } finally {
        teacherCallsLoading = false;
    }
}

/* =========================================
   دریافت فهرست غایبان
========================================= */

async function loadAbsentStudents() {
    if (absentStudentsLoading || !navigator.onLine) return;

    absentStudentsLoading = true;

    try {
        const today = getToday();

        const params = new URLSearchParams({
            class_name: className,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${ATTENDANCE_API}?${params.toString()}`
        );

        const data = getArrayResult(result).filter(record =>
            record.class_name === className &&
            record.attendance_date === today
        );

        const absentNames = new Set(
            data
                .filter(record => record.status === "غایب")
                .map(record => normalizeStudentName(record.student_name))
        );

        studentButtons.forEach((button, normalizedName) => {
            const isAbsent = absentNames.has(normalizedName);
            const nameElement = button.querySelector(".student-name");
            const statusElement = button.querySelector(".student-status");
            const timeElement = button.querySelector(".student-time");

            if (isAbsent) {
                button.classList.remove(
                    "called",
                    "sent",
                    "received",
                    "pending"
                );

                button.classList.add("absent");
                button.disabled = true;

                if (nameElement) {
                    const originalName = button.dataset.name;
                    nameElement.innerText = `${originalName} (غایب)`;
                }

                if (statusElement) statusElement.innerText = "";
                if (timeElement) timeElement.innerText = "";

            } else {
                button.classList.remove("absent");

                if (nameElement) {
                    nameElement.innerText = button.dataset.name;
                }

                // هنگام ارسال، دکمه تا پایان عملیات غیرفعال بماند.
                if (button.dataset.sending !== "true") {
                    button.disabled = false;
                }
            }
        });

        console.log("غایبان کلاس بارگذاری شدند:", absentNames.size);

    } catch (error) {
        console.error("خطا در دریافت غایبان:", error);
    } finally {
        absentStudentsLoading = false;
    }
}

/* =========================================
   ارسال دانش‌آموز
========================================= */

async function sendStudent(student) {
    const button = findButton(student.name);

    if (!button) {
        console.error("دکمه دانش‌آموز پیدا نشد:", student.name);
        return;
    }

    if (button.classList.contains("absent")) {
        showMessage("ارسال برای دانش‌آموز غایب مجاز نیست.");
        return;
    }

    if (button.dataset.sending === "true") {
        return;
    }

    if (!navigator.onLine) {
        showMessage("اتصال اینترنت برقرار نیست.");
        return;
    }

    button.dataset.sending = "true";
    button.disabled = true;

    try {
        // بررسی مجدد غیبت پیش از ارسال
        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            showMessage("این دانش‌آموز غایب است و قابل ارسال نیست.");
            return;
        }

        const today = getToday();

        const params = new URLSearchParams({
            class_name: className,
            student_name: student.name,
            date: today,
            _: String(Date.now())
        });

        const result = await apiRequest(
            `${CALLS_API}?${params.toString()}`
        );

        const records = getArrayResult(result);

        const activeCalls = records.filter(call =>
            call.class_name === className &&
            call.called_date === today &&
            normalizeStudentName(call.student_name) ===
                normalizeStudentName(student.name) &&
            call.status !== "ارسال شد" &&
            call.status !== "لغو شد"
        );

        activeCalls.sort((a, b) => Number(b.id) - Number(a.id));

        const activeCall = activeCalls[0];

        if (!activeCall) {
            showMessage("برای این دانش‌آموز فراخوان فعالی ثبت نشده است.");
            return;
        }

        await apiRequest(UPDATE_CALL_API, {
            method: "POST",
            body: JSON.stringify({
                id: activeCall.id,
                status: "ارسال شد",
                sent_time: getTehranTime()
            })
        });

        showMessage(`فراخوان ${student.name} با موفقیت ارسال شد.`);

        // وضعیت جدید از سرور دریافت می‌شود.
        await loadCalls();

    } catch (error) {
        console.error("خطا در ارسال دانش‌آموز:", error);

        showMessage(
            "ارسال ناموفق بود؛ اتصال اینترنت و تنظیمات API را بررسی کنید."
        );
    } finally {
        delete button.dataset.sending;

        // وضعیت غیبت پس از پایان ارسال دوباره بررسی شود.
        if (navigator.onLine) {
            await loadAbsentStudents();
        }

        if (!button.classList.contains("absent")) {
            button.disabled = false;
        }
    }
}

/* =========================================
   تشخیص تغییر روز تهران
========================================= */

function checkTeacherCallDayChange() {
    const newDay = getDatabaseToday();

    if (newDay === currentTeacherCallDay) return false;

    console.log(
        "تغییر روز پنل:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    previousCallStates.clear();
    callsLoadedOnce = false;

    resetTeacherPanel();

    return true;
}

/* =========================================
   تازه‌سازی پنل
========================================= */

async function refreshTeacherPanel() {
    if (teacherPanelRefreshRunning || !navigator.onLine) return;

    if (document.visibilityState === "hidden") return;

    teacherPanelRefreshRunning = true;

    try {
        checkTeacherCallDayChange();

        await Promise.all([
            loadCalls(),
            loadAbsentStudents()
        ]);
    } catch (error) {
        console.error("خطا در تازه‌سازی پنل:", error);
    } finally {
        teacherPanelRefreshRunning = false;
    }
}

/* =========================================
   شروع پنل
========================================= */

function startTeacherPanel() {
    createStudents();
    setupSound();

    refreshTeacherPanel();

    // بررسی وضعیت فراخوان‌ها هر ۵ ثانیه
    setInterval(() => {
        if (!navigator.onLine) return;

        checkTeacherCallDayChange();
        refreshTeacherPanel();
    }, 5000);

    // بررسی وضعیت حضور و غیاب هر ۵ ثانیه
    setInterval(() => {
        if (
            navigator.onLine &&
            document.visibilityState !== "hidden"
        ) {
            loadAbsentStudents();
        }
    }, 5000);

    // بازگشت به پنل پس از تغییر تب یا بازگشت به صفحه
    window.addEventListener("focus", () => {
        refreshTeacherPanel();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            refreshTeacherPanel();
        }
    });

    // بازیابی اتصال اینترنت
    window.addEventListener("online", () => {
        showMessage("اتصال اینترنت برقرار شد؛ پنل در حال به‌روزرسانی است.");

        checkTeacherCallDayChange();
        refreshTeacherPanel();
    });

    window.addEventListener("offline", () => {
        showMessage("اتصال اینترنت قطع شده است.");
    });
}

/* =========================================
   اجرای اولیه
========================================= */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startTeacherPanel,
        { once: true }
    );
} else {
    startTeacherPanel();
}