/* =====================================================
   پنل فراخوان معلم - دبستان علوی
   کلاس: چهارم-1
   پایگاه داده: MySQL روی berandil.ir
   الگوی مرجع: پنل کلاس ششم-2
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

const className = "چهارم-1";

/* =====================================================
   فهرست دانش‌آموزان کلاس چهارم-1
===================================================== */

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

let teacherMessageTimer = null;
let teacherCallPopupTimer = null;

const previousCallStates = new Map();
const studentButtons = new Map();

/* جلوگیری از ارسال تکراری برای یک دانش‌آموز */

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

/* سازگاری با توابع قبلی */

function getToday() {
    return getDatabaseToday();
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
            `پاسخ API معتبر نیست یا JSON دریافت نشد (HTTP ${response.status})`
        );
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            `خطای HTTP ${response.status}`
        );
    }

    if (
        result &&
        typeof result === "object" &&
        result.success === false
    ) {
        throw new Error(
            result.message || "درخواست توسط API ناموفق اعلام شد."
        );
    }

    /*
       نتیجه اصلی حفظ می‌شود تا بتوانیم پاسخ‌های
       دارای data، calls یا records را مدیریت کنیم.
    */

    return result;
}

/* =====================================================
   استخراج آرایه از پاسخ API
===================================================== */

function getArrayResult(result) {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.calls)) {
        return result.calls;
    }

    if (Array.isArray(result?.records)) {
        return result.records;
    }

    return [];
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

function showMessage(messageText) {
    const message = document.getElementById("message");

    if (!message) {
        console.log(messageText);
        return;
    }

    message.textContent = messageText;
    message.classList.add("show");

    if (teacherMessageTimer) {
        clearTimeout(teacherMessageTimer);
    }

    teacherMessageTimer = setTimeout(() => {
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

    /* جلوگیری از ثبت چندباره رویداد */

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

                notificationAudio.currentTime = 0;

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
                    "🔇 فعال‌سازی صدای فراخوان";

                button.style.background = "#ef4444";

                showMessage("صدای فراخوان غیرفعال شد.");
            }

        } catch (error) {
            console.error(
                "خطا در فعال‌سازی یا تغییر وضعیت صدا:",
                error
            );

            showMessage(
                "فعال‌سازی صدا ناموفق بود؛ فایل notification.mp3 را بررسی کنید."
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
                "خطا در پخش صدای اعلان:",
                error
            );
        });

    } catch (error) {
        console.error(
            "خطای پخش صدای اعلان:",
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

    student.textContent =
        studentName + " فراخوان شد";

    popup.classList.add("show");

    if (teacherCallPopupTimer) {
        clearTimeout(teacherCallPopupTimer);
    }

    teacherCallPopupTimer = setTimeout(() => {
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

    if (teacherCallPopupTimer) {
        clearTimeout(teacherCallPopupTimer);
    }

    teacherCallPopupTimer = setTimeout(() => {
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
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, "")
        .trim();
}

/* =====================================================
   پیدا کردن دکمه دانش‌آموز
===================================================== */

function findButton(name) {
    const normalizedName = normalizeStudentName(name);

    return studentButtons.get(normalizedName) || null;
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

        studentButtons.set(
            normalizeStudentName(student.name),
            button
        );
    });

    updateCount([]);
}

/* =====================================================
   پاک‌سازی اطلاعات نمایشی دکمه
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

    const status =
        button.querySelector(".student-status");

    const time =
        button.querySelector(".student-time");

    const name =
        button.querySelector(".student-name");

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
   بازنشانی وضعیت نمایشی پنل
===================================================== */

function resetStudentButton(call) {
    if (!call || !call.student_name) {
        return;
    }

    const button = findButton(call.student_name);

    if (!button || button.classList.contains("absent")) {
        return;
    }

    clearStudentButton(button);
}

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
   پایان بخش اول
   بخش دوم را بلافاصله پس از این قسمت قرار دهید.
===================================================== */
/* =====================================================
   کلید یکتای فراخوان
===================================================== */

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

    if (call.status === "لغو شد") {
        clearStudentButton(button);
        return;
    }

    button.classList.remove(
        "called",
        "sent",
        "received",
        "pending"
    );

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
        statusElement.textContent = call.status || "";
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
    if (
        callsLoading ||
        !navigator.onLine
    ) {
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

        /* جلوگیری از اعمال پاسخ مربوط به روز قبلی */

        if (today !== getDatabaseToday()) {
            return;
        }

        const responseData = getArrayResult(result);

        const todayCalls = responseData.filter(call =>
            call.class_name === className &&
            call.called_date === today
        );

        const currentStates = new Map();

        todayCalls.forEach(call => {
            const key = getCallKey(call);

            const state = JSON.stringify({
                status: call.status || "",
                sent_time: call.sent_time || "",
                called_time: call.called_time || ""
            });

            currentStates.set(key, {
                state,
                call
            });

            const previous = previousCallStates.get(key);

            const button = findButton(call.student_name);

            const isAbsent =
                button?.classList.contains("absent");

            /*
               در اولین بارگذاری اعلان تولید نمی‌شود.
               فقط تغییرات جدید پس از بارگذاری اولیه
               به‌صورت اعلان نمایش داده می‌شوند.
            */

            if (callsInitialized && !isAbsent) {

                /* فراخوان جدید */

                if (
                    !previous &&
                    call.status === "فراخوان شد"
                ) {
                    showCallPopup(call.student_name);
                }

                /* تغییر وضعیت فراخوان */

                else if (
                    previous &&
                    previous.call.status !== call.status
                ) {
                    if (
                        previous.call.status !== "ارسال شد" &&
                        call.status === "ارسال شد"
                    ) {
                        showSendNotification(
                            call.student_name
                        );

                    } else if (
                        previous.call.status !== "فراخوان شد" &&
                        call.status === "فراخوان شد"
                    ) {
                        showCallPopup(
                            call.student_name
                        );
                    }
                }
            }
        });

        /*
           ابتدا وضعیت‌های قبلی را جایگزین می‌کنیم.
           سپس رابط کاربری را بازسازی می‌کنیم.
        */

        previousCallStates.clear();

        currentStates.forEach((item, key) => {
            previousCallStates.set(key, item);
        });

        resetTeacherPanelVisualOnly();

        todayCalls.forEach(updateButton);

        updateCount(todayCalls);

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
   دریافت غایبان امروز
===================================================== */

async function loadAbsentStudents() {
    if (
        attendanceLoading ||
        !navigator.onLine
    ) {
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

        /* اطلاعات روز جدید نباید با روز قبلی مخلوط شود */

        if (today !== getDatabaseToday()) {
            return;
        }

        const records = getArrayResult(result);

        const absentNames = new Set(
            records
                .filter(record =>
                    record.class_name === className &&
                    record.attendance_date === today &&
                    record.status === "غایب"
                )
                .map(record =>
                    normalizeStudentName(record.student_name)
                )
        );

        studentButtons.forEach((button, normalizedName) => {
            const isAbsent =
                absentNames.has(normalizedName);

            const nameElement =
                button.querySelector(".student-name");

            const statusElement =
                button.querySelector(".student-status");

            const timeElement =
                button.querySelector(".student-time");

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
                    nameElement.textContent =
                        button.dataset.name + " (غایب)";
                }

                if (statusElement) {
                    statusElement.textContent = "";
                }

                if (timeElement) {
                    timeElement.textContent = "";
                }

            } else {
                button.classList.remove("absent");

                if (nameElement) {
                    nameElement.textContent =
                        button.dataset.name;
                }

                button.disabled =
                    sendingStudents.has(button.dataset.name);
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
   انتظار برای پایان درخواست حضور و غیاب
===================================================== */

async function waitForAttendanceLoad() {
    while (attendanceLoading) {
        await new Promise(resolve =>
            setTimeout(resolve, 100)
        );
    }
}

/* =====================================================
   ارسال دانش‌آموز
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
        showMessage(
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

        /*
           ابتدا اطلاعات فراخوان‌های روز جاری دریافت می‌شود.
        */

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
           منتظر می‌مانیم تا درخواست حضور و غیاب قبلی
           تمام شود و سپس وضعیت غیبت را مجدداً می‌خوانیم.
        */

        await waitForAttendanceLoad();

        await loadAbsentStudents();

        if (button.classList.contains("absent")) {
            showMessage(
                "این دانش‌آموز غایب است و امکان ارسال فراخوان ندارد."
            );
            return;
        }

        const calls = getArrayResult(result);

        /*
           پیدا کردن آخرین فراخوان فعال دانش‌آموز
           با درنظرگرفتن کلاس، تاریخ و نام نرمال‌شده.
        */

        const activeCall = calls
            .filter(call =>
                call.class_name === className &&
                call.called_date === today &&
                normalizeStudentName(call.student_name) ===
                    normalizeStudentName(student.name) &&
                call.status !== "ارسال شد" &&
                call.status !== "لغو شد"
            )
            .sort((a, b) =>
                Number(b.id) - Number(a.id)
            )[0];

        if (!activeCall) {
            showMessage(
                "برای این دانش‌آموز فراخوان فعالی پیدا نشد."
            );
            return;
        }

        if (today !== getDatabaseToday()) {
            showMessage(
                "تاریخ روز تغییر کرده است؛ ارسال انجام نشد."
            );
            return;
        }

        /*
           ثبت وضعیت ارسال در MySQL از طریق API هاست.
        */

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

        /*
           تازه‌سازی وضعیت از روی اطلاعات سرور.
        */

        await refreshTeacherPanel();

    } catch (error) {
        console.error(
            "خطا در ارسال فراخوان:",
            error
        );

        showMessage(
            "ارسال ناموفق بود؛ اتصال هاست و پاسخ API را بررسی کنید."
        );

    } finally {
        sendingStudents.delete(student.name);

        delete button.dataset.sending;

        /*
           وضعیت غیبت پس از آزادشدن قفل مجدداً بررسی می‌شود.
        */

        if (navigator.onLine) {
            await loadAbsentStudents();
        }

        if (button.classList.contains("absent")) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }

        /*
           پس از پایان ارسال، وضعیت واقعی سرور مجدداً
           دریافت می‌شود تا پنل با پایگاه داده هماهنگ بماند.
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
        "روز پنل تغییر کرد:",
        currentTeacherCallDay,
        "→",
        newDay
    );

    currentTeacherCallDay = newDay;

    previousCallStates.clear();

    callsInitialized = false;

    lastTeacherCallsLoad = 0;
    lastAbsentStudentsLoad = 0;

    resetTeacherPanel();

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
           ابتدا حضور و غیاب دریافت می‌شود تا هنگام
           بازسازی وضعیت فراخوان‌ها، غایبان مشخص باشند.
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
   بررسی سلامت پنل - Watchdog
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
        "پنل فراخوان معلم کلاس چهارم-1 آماده است."
    );
}

/* =====================================================
   جلوگیری از راه‌اندازی چندباره
===================================================== */

if (!window.teacherPanelClass41Initialized) {
    window.teacherPanelClass41Initialized = true;

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
    checkTeacherCallDayChange();
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
    if (document.visibilityState === "visible") {
        checkTeacherCallDayChange();
        refreshTeacherPanel();
    }
});

/* =====================================================
   مدیریت اتصال مجدد اینترنت
===================================================== */

window.addEventListener("online", () => {
    console.log("اتصال اینترنت برقرار شد.");

    showMessage(
        "اتصال اینترنت برقرار شد؛ اطلاعات در حال به‌روزرسانی است."
    );

    checkTeacherCallDayChange();
    refreshTeacherPanel();
});

window.addEventListener("offline", () => {
    console.warn("اتصال اینترنت قطع شد.");

    showMessage(
        "اتصال اینترنت قطع شده است."
    );
});