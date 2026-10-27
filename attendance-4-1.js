
const API_URL = "https://berandil.ir/farakhan-api/attendance.php";
const className = "چهارم-1";

const students = [
    { name: "محمدطاها احمدی", className: "چهارم-1" },
    { name: "رادمهر بشیری", className: "چهارم-1" },
    { name: "مهراد بیاتی", className: "چهارم-1" },
    { name: "آران باروتی", className: "چهارم-1" },
    { name: "پوریا توکلیان", className: "چهارم-1" },
    { name: "رادین حسنی", className: "چهارم-1" },
    { name: "اوتانا درویشی", className: "چهارم-1" },
    { name: "امیرعباس دهقان", className: "چهارم-1" },
    { name: "سام زندمقدم", className: "چهارم-1" },
    { name: "مهراد سفارزاد", className: "چهارم-1" },
    { name: "نویان علیشاهی", className: "چهارم-1" },
    { name: "مهراد عموحسن", className: "چهارم-1" },
    { name: "کوروش قاسمی", className: "چهارم-1" },
    { name: "محمدحسین قرابیگلو", className: "چهارم-1" },
    { name: "محمدحسین کریمی", className: "چهارم-1" },
    { name: "رهام لطفی", className: "چهارم-1" },
    { name: "امیرعلی ناعمی", className: "چهارم-1" },
    { name: "یاشام درگاهی", className: "چهارم-1" },
    { name: "رایان مقدسی", className: "چهارم-1" }
];

const studentsContainer = document.getElementById("studentsContainer");
const totalCount = document.getElementById("totalCount");
const presentCount = document.getElementById("presentCount");
const absentCount = document.getElementById("absentCount");
const todayDate = document.getElementById("todayDate");
const message = document.getElementById("message");

let currentAttendanceDay = getToday();
let isLoadingAttendance = false;
let isRefreshing = false;

const studentButtons = new Map();

// تاریخ جاری ایران
function getToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tehran",
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

// نمایش تاریخ فارسی
function showDate() {
    if (!todayDate) return;

    todayDate.textContent = new Date().toLocaleDateString("fa-IR", {
        timeZone: "Asia/Tehran",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// نمایش پیام
function showMessage(text) {
    if (!message) return;

    message.textContent = text;
    message.classList.add("show");

    clearTimeout(window.messageTimer);

    window.messageTimer = setTimeout(() => {
        message.classList.remove("show");
    }, 2500);
}

// یکسان‌سازی نام فارسی
function normalizeStudentName(name) {
    return String(name ?? "")
        .normalize("NFC")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u200C/g, "")
        .replace(/ي/g, "ی")
        .replace(/ى/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\s+/g, " ")
        .trim();
}

// درخواست به API هاست
async function apiRequest(method = "GET", params = {}, body = null) {
    let url = API_URL;

    if (method === "GET") {
        url += `?${new URLSearchParams(params).toString()}`;
    }

    const options = {
        method,
        cache: "no-store",
        headers: {
            "Accept": "application/json"
        }
    };

    if (method !== "GET") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body || {});
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`خطای سرور: ${response.status}`);
    }

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("پاسخ سرور معتبر نیست.");
    }

    if (!result || typeof result !== "object") {
        throw new Error("ساختار پاسخ سرور معتبر نیست.");
    }

    if (result.success === false) {
        throw new Error(result.message || "درخواست ناموفق بود.");
    }

    return result;
}

// ساخت دکمه‌های دانش‌آموزان
function createStudents() {
    if (!studentsContainer) return;

    studentsContainer.innerHTML = "";
    studentButtons.clear();

    students.forEach(student => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "student-button present";
        button.dataset.name = student.name;

        const nameSpan = document.createElement("span");
        nameSpan.className = "student-name";
        nameSpan.textContent = student.name;

        const statusSpan = document.createElement("span");
        statusSpan.className = "student-status";
        statusSpan.textContent = "حاضر";

        button.append(nameSpan, statusSpan);

        button.addEventListener("click", () => {
            toggleAttendance(student, button);
        });

        studentsContainer.appendChild(button);

        studentButtons.set(
            normalizeStudentName(student.name),
            button
        );
    });

    if (totalCount) {
        totalCount.textContent = students.length;
    }

    updateCounts();
}

// پیدا کردن دکمه دانش‌آموز
function findButton(name) {
    return studentButtons.get(normalizeStudentName(name)) || null;
}

// تنظیم وضعیت غایب
function setButtonAbsent(button) {
    if (!button) return;

    button.classList.remove("present");
    button.classList.add("absent");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "غایب";
    }
}

// تنظیم وضعیت حاضر
function setButtonPresent(button) {
    if (!button) return;

    button.classList.remove("absent");
    button.classList.add("present");

    const status = button.querySelector(".student-status");

    if (status) {
        status.textContent = "حاضر";
    }
}

// انتخاب جدیدترین رکورد هر دانش‌آموز
function getLatestRecords(records) {
    const latestRecords = new Map();

    records.forEach(record => {
        const key = normalizeStudentName(record.student_name);

        if (!key) return;

        const existing = latestRecords.get(key);

        if (!existing) {
            latestRecords.set(key, record);
            return;
        }

        const currentTime = Date.parse(record.updated_at || "") || 0;
        const existingTime = Date.parse(existing.updated_at || "") || 0;

        if (
            currentTime > existingTime ||
            (
                currentTime === existingTime &&
                Number(record.id || 0) > Number(existing.id || 0)
            )
        ) {
            latestRecords.set(key, record);
        }
    });

    return latestRecords;
}

// دریافت وضعیت حضور و غیاب روز جاری
async function loadTodayAttendance(options = {}) {
    if (isLoadingAttendance) return;

    isLoadingAttendance = true;

    try {
        const today = getToday();

        const result = await apiRequest("GET", {
            class_name: className,
            date: today
        });

        // جلوگیری از اعمال پاسخ روز قبل
        if (today !== getToday()) return;

        const records = Array.isArray(result.data) ? result.data : [];
        const latestRecords = getLatestRecords(records);

        students.forEach(student => {
            const button = findButton(student.name);

            // هنگام ثبت وضعیت، دکمه را تغییر نده
            if (!button || button.dataset.processing === "true") {
                return;
            }

            // وضعیت پیش‌فرض
            setButtonPresent(button);

            const record = latestRecords.get(
                normalizeStudentName(student.name)
            );

            if (!record) return;

            if (record.status === "غایب") {
                setButtonAbsent(button);
            } else if (record.status === "حاضر") {
                setButtonPresent(button);
            }
        });

        updateCounts();

        if (options.showSuccess) {
            showMessage("اطلاعات حضور و غیاب به‌روز شد.");
        }
    } catch (error) {
        console.error(
            "خطا در دریافت حضور و غیاب چهارم-1:",
            error
        );

        if (options.showError) {
            showMessage("❌ دریافت اطلاعات از سرور ناموفق بود.");
        }
    } finally {
        isLoadingAttendance = false;
    }
}

// ثبت وضعیت دانش‌آموز در سرور
async function toggleAttendance(student, button) {
    if (
        !button ||
        button.disabled ||
        button.dataset.processing === "true"
    ) {
        return;
    }

    const previousStatus = button.classList.contains("absent")
        ? "غایب"
        : "حاضر";

    const newStatus = previousStatus === "غایب"
        ? "حاضر"
        : "غایب";

    const today = getToday();

    button.dataset.processing = "true";
    button.disabled = true;

    try {
        await apiRequest("POST", {}, {
            student_name: student.name,
            class_name: className,
            status: newStatus,
            attendance_date: today
        });

        // جلوگیری از نمایش وضعیت روز قبل در روز جدید
        if (today !== getToday()) {
            showMessage(
                "تاریخ تغییر کرده است؛ وضعیت روز جدید بررسی می‌شود."
            );
            return;
        }

        if (newStatus === "غایب") {
            setButtonAbsent(button);
            showMessage(`⚫ ${student.name} غایب شد`);
        } else {
            setButtonPresent(button);
            showMessage(`🟢 ${student.name} حاضر شد`);
        }
    } catch (error) {
        console.error(
            "خطا در ثبت حضور و غیاب چهارم-1:",
            error
        );

        // حفظ وضعیت قبلی هنگام خطای ثبت
        if (previousStatus === "غایب") {
            setButtonAbsent(button);
        } else {
            setButtonPresent(button);
        }

        showMessage(
            "❌ ثبت وضعیت انجام نشد؛ اتصال سرور را بررسی کنید."
        );
    } finally {
        delete button.dataset.processing;
        button.disabled = false;

        updateCounts();

        if (today !== getToday()) {
            checkAttendanceDayChange();
        } else {
            // همگام‌سازی مجدد با سرور
            loadTodayAttendance();
        }
    }
}

// محاسبه آمار
function updateCounts() {
    let absent = 0;

    students.forEach(student => {
        const button = findButton(student.name);

        if (button && button.classList.contains("absent")) {
            absent++;
        }
    });

    const present = students.length - absent;

    if (totalCount) totalCount.textContent = students.length;
    if (presentCount) presentCount.textContent = present;
    if (absentCount) absentCount.textContent = absent;
}

// بررسی تغییر روز بر اساس ساعت ایران
function checkAttendanceDayChange() {
    const newDay = getToday();

    if (newDay === currentAttendanceDay) return;

    console.log(
        "روز جدید حضور و غیاب چهارم-1:",
        currentAttendanceDay,
        "→",
        newDay
    );

    currentAttendanceDay = newDay;

    showDate();
    createStudents();

    loadTodayAttendance({
        showError: true
    });
}

// همگام‌سازی دوره‌ای و مدیریت اجرای هم‌زمان
async function refreshAttendance() {
    if (isRefreshing || document.hidden) return;

    isRefreshing = true;

    try {
        checkAttendanceDayChange();
        await loadTodayAttendance();
    } finally {
        isRefreshing = false;
    }
}

// راه‌اندازی اولیه
showDate();
createStudents();

loadTodayAttendance({
    showError: true
});

// همگام‌سازی خودکار هر ۵ ثانیه
setInterval(refreshAttendance, 5000);

// بررسی تغییر روز هر ۳۰ ثانیه
setInterval(checkAttendanceDayChange, 30000);

// همگام‌سازی هنگام بازگشت به صفحه
window.addEventListener("focus", () => {
    checkAttendanceDayChange();
    showDate();

    refreshAttendance();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkAttendanceDayChange();
        showDate();

        refreshAttendance();
    }
});
